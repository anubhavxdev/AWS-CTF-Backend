const express = require('express');
const { requireAuth, requireRoles } = require('../middleware/auth');
const User = require('../models/User');
const Team = require('../models/Team');
const Payment = require('../models/Payment');
const JoinRequest = require('../models/JoinRequest');
const router = express.Router();

// Get all teams
router.get('/teams', requireAuth, requireRoles('organizer'), async (req, res) => {
  const teams = await Team.find().populate('leader members payment');
  res.json({ teams });
});

// Get all solo participants
router.get('/solos', requireAuth, requireRoles('organizer'), async (req, res) => {
  const solos = await User.find({ role: 'solo' });
  res.json({ solos });
});

// Get all payments
router.get('/payments', requireAuth, requireRoles('organizer'), async (req, res) => {
  const payments = await Payment.find().populate('payer');
  res.json({ payments });
});

// Remove or disqualify a team
router.delete('/team/:id', requireAuth, requireRoles('organizer'), async (req, res) => {
  await Team.findByIdAndDelete(req.params.id);
  res.json({ message: 'Team removed' });
});

// Remove or disqualify a participant
router.delete('/user/:id', requireAuth, requireRoles('organizer'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User removed' });
});

// Approve/reject solo join requests
router.post('/join-request/:id/act', requireAuth, requireRoles('organizer'), async (req, res) => {
  const { action } = req.body; // 'accept' or 'reject'
  const jr = await JoinRequest.findById(req.params.id);
  if (!jr || jr.status !== 'pending') return res.status(400).json({ message: 'Invalid request' });
  if (action === 'accept') {
    jr.status = 'accepted';
  } else {
    jr.status = 'rejected';
  }
  await jr.save();
  res.json({ status: jr.status });
});

// Export participants (CSV)
router.get('/export/participants', requireAuth, requireRoles('organizer'), async (req, res) => {
  const users = await User.find();
  const fields = ['name','registrationNumber','yearOfStudy','phoneNumber','email','residenceType','role'];
  const csv = [fields.join(',')].concat(users.map(u => fields.map(f => u[f]).join(','))).join('\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('participants.csv');
  res.send(csv);
});

// Export teams (CSV)
router.get('/export/teams', requireAuth, requireRoles('organizer'), async (req, res) => {
  const teams = await Team.find().populate('leader members');
  const fields = ['teamName','leader','members'];
  const csv = [fields.join(',')].concat(teams.map(t => [t.teamName, t.leader?.name, t.members.map(m => m.name).join('|')].join(','))).join('\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('teams.csv');
  res.send(csv);
});

// Registration open/close
let registrationOpen = true;
router.post('/registration-status', requireAuth, requireRoles('organizer'), (req, res) => {
  registrationOpen = !!req.body.open;
  res.json({ registrationOpen });
});
router.get('/registration-status', (req, res) => {
  res.json({ registrationOpen });
});

module.exports = router;
