const express = require('express');
const { requireAuth, requireRoles } = require('../middleware/auth');
const JoinRequest = require('../models/JoinRequest');
const Team = require('../models/Team');
const User = require('../models/User');

const router = express.Router();

// Solo sends request to team
router.post('/request', requireAuth, requireRoles('solo'), async (req, res) => {
	const { teamId } = req.body;
	const team = await Team.findById(teamId);
	if (!team) return res.status(404).json({ message: 'Team not found' });
	const existing = await JoinRequest.findOne({ team: teamId, soloParticipant: req.user.id, status: 'pending' });
	if (existing) return res.json({ requestId: existing._id });
	const jr = await JoinRequest.create({ team: teamId, soloParticipant: req.user.id });
	return res.status(201).json({ requestId: jr._id });
});

// Leader lists requests to their team
router.get('/leader', requireAuth, requireRoles('leader'), async (req, res) => {
	const team = await Team.findOne({ leader: req.user.id });
	if (!team) return res.json({ requests: [] });
	const requests = await JoinRequest.find({ team: team._id, status: 'pending' }).populate('soloParticipant');
	return res.json({ requests });
});

// Leader accepts/rejects
router.post('/leader/act', requireAuth, requireRoles('leader'), async (req, res) => {
	const { requestId, action } = req.body; // action: 'accept' | 'reject'
	const jr = await JoinRequest.findById(requestId).populate('soloParticipant team');
	if (!jr || jr.status !== 'pending') return res.status(400).json({ message: 'Invalid request' });
	const team = await Team.findOne({ _id: jr.team._id, leader: req.user.id });
	if (!team) return res.status(403).json({ message: 'Forbidden' });
	if (action === 'accept') {
		if (team.members.length >= (team.maxSize - 1)) return res.status(400).json({ message: 'Team full' });
		team.members.push(jr.soloParticipant._id);
		await team.save();
		await User.findByIdAndUpdate(jr.soloParticipant._id, { role: 'member', team: team._id });
		jr.status = 'accepted';
		await jr.save();
		return res.json({ status: 'accepted' });
	} else {
		jr.status = 'rejected';
		await jr.save();
		return res.json({ status: 'rejected' });
	}
});

module.exports = router;


