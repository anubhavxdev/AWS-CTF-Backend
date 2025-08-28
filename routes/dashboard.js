const express = require('express');
const { requireAuth, requireRoles } = require('../middleware/auth');
const Team = require('../models/Team');
const User = require('../models/User');
const JoinRequest = require('../models/JoinRequest');
const Payment = require('../models/Payment');

const router = express.Router();

// Leader dashboard
router.get('/leader', requireAuth, requireRoles('leader'), async (req, res) => {
	const team = await Team.findOne({ leader: req.user.id }).populate('leader members payment');
	return res.json({ team });
});

// Member dashboard
router.get('/member', requireAuth, requireRoles('member'), async (req, res) => {
	const user = await User.findById(req.user.id).populate({ path: 'team', populate: ['leader', 'members', 'payment'] });
	return res.json({ team: user.team });
});

// Solo dashboard
router.get('/solo', requireAuth, requireRoles('solo'), async (req, res) => {
	const teams = await Team.find({}, 'teamName').populate('leader');
	return res.json({ teams });
});

// Organizer dashboard
router.get('/organizer', requireAuth, requireRoles('organizer'), async (req, res) => {
	const [teams, solos, payments] = await Promise.all([
		Team.find().populate('leader members payment'),
		User.find({ role: 'solo' }),
		Payment.find()
	]);
	return res.json({ teams, solos, paymentsSummary: { total: payments.length, success: payments.filter(p => p.status === 'success').length } });
});

module.exports = router;


