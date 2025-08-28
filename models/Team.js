const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
	{
		teamName: { type: String, required: true, trim: true, index: true },
		leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
		members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		maxSize: { type: Number, default: 4 },
		payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
		isLocked: { type: Boolean, default: false }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Team', TeamSchema);


