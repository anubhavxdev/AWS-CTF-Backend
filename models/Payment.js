const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
	{
		amountInPaise: { type: Number, required: true },
		currency: { type: String, default: 'INR' },
		status: { type: String, enum: ['created', 'success', 'failed', 'pending'], default: 'created' },
		mode: { type: String, enum: ['team', 'individual'], required: true },
		cashfreeOrderId: { type: String },
		cashfreePaymentId: { type: String },
		referenceId: { type: String },
		payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);


