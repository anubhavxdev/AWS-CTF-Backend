const mongoose = require('mongoose');

const JoinRequestSchema = new mongoose.Schema(
	{
		team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
		soloParticipant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('JoinRequest', JoinRequestSchema);


