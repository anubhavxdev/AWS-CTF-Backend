const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Payment = require('../models/Payment');

const { Cashfree, CFEnvironment } = require("cashfree-pg");

const router = express.Router();

const { CASHFREE_ENVIRONMENT } = process.env;

const cashfree = new Cashfree(
	CFEnvironment[CASHFREE_ENVIRONMENT] || CFEnvironment.SANDBOX,
	process.env.CASHFREE_APP_ID || '',
	process.env.CASHFREE_SECRET_KEY || ''
);

function ensureCashfreeConfigured() {
	if (!cashfree.XClientId || !cashfree.XClientSecret) {
		throw new Error('Cashfree SDK not configured properly');
	}
}

function createOrder(body) {
	var request = {
		order_amount: body.amount,
		order_currency: "INR",
		customer_details: {
			customer_email: req.user.email,
			customer_phone: req.user.phone,
			customer_name: req.user.name,
			customer_regid: req.user.regid
		},
		order_meta: {
			return_url: `${process.env.FRONTEND_URL}/payment/success`
		}
	};

	cashfree.PGCreateOrder(request)
	.then((response) => {
		var a = response.data;
		console.log(a);
		return a;
		//After successfully creating an order, you will receive a unique `order_id` and `payment_session_id` that you need for subsequent steps.
	})
	.catch((error) => {
		console.error(error);
	})
}

router.post('/create-order', requireAuth, async (req, res) => {
	ensureCashfreeConfigured();
	const createOrderData = createOrder(req.body);
	return createOrderData;
});

router.post('/verify-order', requireAuth, async (req, res) => {
	ensureCashfreeConfigured();
	const { orderId } = req.body;
	cashfree.PGFetchOrder({ orderId })
		.then((response) => {
			const a = response.data;
			console.log(a);
			const orderStatus = a?.order?.order_status || 'unknown';
			console.log(`Order Status: ${orderStatus}`);
			if (orderStatus === 'ACTIVE') {
				return { status: "pending" };
			} else if (orderStatus === 'PAID') {
				return { status: "success" };
			} else if (orderStatus === 'EXPIRED') {
				return { status: "failed" };
			} else if (orderStatus === 'TERMINATED') {
				return { status: "failed" };
			}
		})
		.catch((error) => {
			console.error(error);
		});
});

module.exports = router;


