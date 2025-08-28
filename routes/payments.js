const express = require('express');
const Cashfree = require('cashfree-pg');
const { requireAuth } = require('../middleware/auth');
const Payment = require('../models/Payment');

const router = express.Router();

function ensureCashfreeConfigured() {
	try {
		Cashfree.XClientId = process.env.CASHFREE_APP_ID || '';
		Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY || '';
		const env = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();
		if (Cashfree && Cashfree.Environment) {
			const sandbox = Cashfree.Environment.SANDBOX || Cashfree.Environment.Sandbox;
			const production = Cashfree.Environment.PRODUCTION || Cashfree.Environment.Production;
			Cashfree.XEnvironment = env === 'production' ? production : sandbox;
		}
	} catch (_) {
		// ignore; will use SDK defaults if any
	}
}

// Create order for a payment record
router.post('/create-order', requireAuth, async (req, res) => {
	ensureCashfreeConfigured();
	const { paymentId } = req.body;
	const payment = await Payment.findById(paymentId);
	if (!payment) return res.status(404).json({ message: 'Payment not found' });
	const amount = payment.amountInPaise / 100;
	const orderId = `ORD_${payment._id}`;
	try {
		const response = await Cashfree.PGCreateOrder({
			order_amount: amount,
			order_currency: 'INR',
			order_id: orderId,
			customer_details: { customer_id: String(payment.payer), customer_email: 'na@example.com', customer_phone: '0000000000' }
		});
		payment.cashfreeOrderId = response?.data?.order_id || orderId;
		await payment.save();
		return res.json({ order: response.data });
	} catch (err) {
		return res.status(500).json({ message: 'Failed to create order', error: err?.response?.data || err.message });
	}
});

// Webhook to handle payment status
router.post('/webhook', express.json({ type: '*/*' }), async (req, res) => {
	try {
		const data = req.body;
		const orderId = data?.order?.order_id || data?.order_id || '';
		const payment = await Payment.findOne({ cashfreeOrderId: orderId });
		if (!payment) return res.status(200).send('ok');
		const status = (data?.payment?.payment_status || data?.order_status || 'pending').toLowerCase();
		if (status === 'success' || status === 'paid') payment.status = 'success';
		else if (status === 'failed') payment.status = 'failed';
		else payment.status = 'pending';
		payment.cashfreePaymentId = data?.payment?.payment_id || payment.cashfreePaymentId;
		payment.referenceId = data?.payment?.cf_payment_id || payment.referenceId;
		await payment.save();
		return res.status(200).send('ok');
	} catch (e) {
		return res.status(200).send('ok');
	}
});

module.exports = router;


