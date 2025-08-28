const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Team = require('../models/Team');
const Payment = require('../models/Payment');

const router = express.Router();

// Team Registration (leader creates team + members, pays 500)
router.post(
	'/team',
	requireAuth,
	[
		body('teamName').notEmpty(),
		body('leader').isObject(),
		body('members').isArray().custom((arr) => arr.length <= 3)
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		const { teamName, leader, members } = req.body;
		if (members.length > 3) return res.status(400).json({ message: 'Max 3 members allowed' });
		const leaderUser = await User.findById(req.user.id);
		if (!leaderUser) return res.status(404).json({ message: 'Leader not found' });
		leaderUser.name = leader.name;
		leaderUser.registrationNumber = leader.registrationNumber;
		leaderUser.yearOfStudy = leader.yearOfStudy;
		leaderUser.phoneNumber = leader.phoneNumber;
		leaderUser.email = leader.email;
		leaderUser.residenceType = leader.residenceType;
		leaderUser.role = 'leader';
		await leaderUser.save();

		const memberDocs = [];
		for (const m of members) {
			const user = await User.create({ ...m, role: 'member' });
			memberDocs.push(user);
		}

		const team = await Team.create({ teamName, leader: leaderUser._id, members: memberDocs.map((u) => u._id) });
		await User.updateMany({ _id: { $in: memberDocs.map((u) => u._id) } }, { $set: { team: team._id } });
		leaderUser.team = team._id;
		await leaderUser.save();

		const payment = await Payment.create({ amountInPaise: 50000, mode: 'team', payer: leaderUser._id, status: 'created' });
		team.payment = payment._id;
		await team.save();

		return res.status(201).json({ teamId: team._id, paymentId: payment._id, amount: 500 });
	}
);

// Individual Registration (solo), pays 150
router.post(
	'/solo',
	requireAuth,
	[
		body('profile').isObject()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
		const { profile } = req.body;
		const user = await User.findById(req.user.id);
		if (!user) return res.status(404).json({ message: 'User not found' });
		Object.assign(user, profile);
		user.role = 'solo';
		await user.save();
		const payment = await Payment.create({ amountInPaise: 15000, mode: 'individual', payer: user._id, status: 'created' });
		return res.status(201).json({ paymentId: payment._id, amount: 150 });
	}
);

module.exports = router;


