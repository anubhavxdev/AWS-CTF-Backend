const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		registrationNumber: { type: String, required: true, trim: true, index: true },
		yearOfStudy: { type: String, required: true, enum: ['1', '2', '3', '4', '5'] },
		phoneNumber: { type: String, required: true },
		email: { type: String, required: true, lowercase: true, trim: true, index: true },
		residenceType: { type: String, required: true, enum: ['Hosteller', 'Day Scholar'] },
		role: { type: String, required: true, enum: ['organizer', 'leader', 'member', 'solo'], default: 'solo' },
		team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
		passwordHash: { type: String },
		isEmailVerified: { type: Boolean, default: false }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);


