const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

router.post(
	'/register',
	[
		body('name').notEmpty(),
		body('registrationNumber').notEmpty(),
		body('yearOfStudy').isIn(['1', '2', '3', '4', '5']),
		body('phoneNumber').notEmpty(),
		body('email').isEmail(),
		body('residenceType').isIn(['Hosteller', 'Day Scholar']),
		body('password').isLength({ min: 6 }),
		body('role').optional().isIn(['organizer', 'leader', 'member', 'solo'])
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		const { password, ...rest } = req.body;
		const existing = await User.findOne({ email: rest.email });
		if (existing) return res.status(409).json({ message: 'Email already registered' });
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ ...rest, passwordHash });
		return res.status(201).json({ id: user._id });
	}
);

router.post(
	'/login',
	[body('email').isEmail(), body('password').isString()],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ message: 'Invalid credentials' });
		const ok = await bcrypt.compare(password, user.passwordHash || '');
		if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
		const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
		return res.json({ token });
	}
);

module.exports = router;


