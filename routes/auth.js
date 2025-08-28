const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult, sanitizeBody } = require('express-validator');
const User = require('../models/User');

const router = express.Router();


const crypto = require('crypto');
router.post(
	'/register',
	[
		body('name').notEmpty().trim().escape(),
		body('registrationNumber').notEmpty().trim().escape(),
		body('yearOfStudy').isIn(['1', '2', '3', '4', '5']),
		body('phoneNumber').notEmpty().trim().escape(),
		body('email').isEmail().normalizeEmail(),
		body('residenceType').isIn(['Hosteller', 'Day Scholar']),
		body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[a-z]/).matches(/[0-9]/).matches(/[^A-Za-z0-9]/),
		body('role').optional().isIn(['organizer', 'leader', 'member', 'solo'])
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		const { password, ...rest } = req.body;
		const existing = await User.findOne({ email: rest.email });
		if (existing) return res.status(409).json({ message: 'Email already registered' });
		const passwordHash = await bcrypt.hash(password, 10);
		const emailVerificationToken = crypto.randomBytes(32).toString('hex');
		const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
		const user = await User.create({ ...rest, passwordHash, emailVerificationToken, emailVerificationExpires, failedLoginAttempts: 0, lockUntil: null });
		await User.sendEmail(
			user.email,
			'Verify your email',
			`Click to verify: https://awslpu.xyz/verify/email?token=${emailVerificationToken}`
		);
		return res.status(201).json({ id: user._id, message: 'Registration successful. Please verify your email.' });
	}
);

// Email verification endpoint
router.get('/verify-email', async (req, res) => {
	const { token } = req.query;
	const user = await User.findOne({ emailVerificationToken: token, emailVerificationExpires: { $gt: new Date() } });
	if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
	user.isEmailVerified = true;
	user.emailVerificationToken = undefined;
	user.emailVerificationExpires = undefined;
	await user.save();
	res.json({ message: 'Email verified successfully' });
});

// Account lockout after 5 failed attempts for 15 minutes
router.post(
	'/login',
	[body('email').isEmail().normalizeEmail(), body('password').isString()],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ message: 'Invalid credentials' });
		if (user.lockUntil && user.lockUntil > Date.now()) {
			return res.status(403).json({ message: 'Account locked. Try again later.' });
		}
		const ok = await bcrypt.compare(password, user.passwordHash || '');
		if (!ok) {
			user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
			if (user.failedLoginAttempts >= 5) {
				user.lockUntil = Date.now() + 15 * 60 * 1000;
			}
			await user.save();
			return res.status(401).json({ message: 'Invalid credentials' });
		}
		user.failedLoginAttempts = 0;
		user.lockUntil = null;
		await user.save();
		const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		return res.json({ token });
	}
);


// Utility: Create organizer (admin) account (should be removed or protected after first use)
router.post('/create-organizer', async (req, res) => {
	const { name, email, password, secret } = req.body;
	if (secret !== process.env.ORGANIZER_SECRET) return res.status(403).json({ message: 'Forbidden' });
	const existing = await User.findOne({ email });
	if (existing) return res.status(409).json({ message: 'Email already registered' });
	const passwordHash = await require('bcryptjs').hash(password, 10);
	const user = await User.create({ name, email, passwordHash, role: 'organizer', registrationNumber: 'ADMIN', yearOfStudy: '1', phoneNumber: '0000000000', residenceType: 'Day Scholar', isEmailVerified: true });
	return res.status(201).json({ id: user._id });
});

module.exports = router;


