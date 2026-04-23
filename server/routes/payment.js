const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
} else {
    console.warn('[Razorpay] ⚠️ RAZORPAY_KEY_ID or SECRET missing. Payment routes will fail.');
}

// ── POST /api/payment/razorpay/create-order ──
router.post('/razorpay/create-order', async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(500).json({ error: 'Razorpay is not configured on the server' });
        }
        const { planName, planPrice, currency, userId } = req.body;

        if (!planName || !planPrice) {
            return res.status(400).json({ error: 'Plan name and price are required' });
        }

        const options = {
            amount: parseInt(planPrice) * 100, // Amount in paise/cents
            currency: currency === 'usd' ? 'USD' : 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: userId || 'anonymous',
                planName: planName,
            }
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('[Razorpay Order Error]:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── POST /api/payment/razorpay/verify ──
router.post('/razorpay/verify', async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            userId,
            planName
        } = req.body;

        console.log(`[Razorpay Verify] Checking signature for Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(body.toString())
            .digest('hex');

        console.log(`[Razorpay Verify] Expected: ${expectedSignature.substring(0, 10)}..., Received: ${razorpay_signature?.substring(0, 10)}...`);

        if (expectedSignature === razorpay_signature) {
            // Upgrade User
            if (userId && userId !== 'anonymous') {
                const updated = await User.findOneAndUpdate(
                    { clerkId: userId },
                    { 
                        $set: { 
                            'subscription.tier': 'pro', 
                            'subscription.status': 'active',
                            'subscription.razorpayPaymentId': razorpay_payment_id
                        } 
                    },
                    { returnDocument: 'after' }
                );
                console.log(`✅ User ${userId} upgraded to Pro via Razorpay. Tier now: ${updated?.subscription?.tier}`);
            }
            res.json({ success: true, message: "Payment verified successfully" });
        } else {
            console.error('❌ Razorpay Signature Mismatch!');
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error('[Razorpay Verify Error]:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── POST /api/payment/razorpay/webhook ──
router.post('/razorpay/webhook', express.json(), async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        const isValid = Razorpay.validateWebhookSignature(
            JSON.stringify(req.body),
            signature,
            secret
        );

        if (!isValid) {
            console.error('❌ Razorpay Webhook: Invalid Signature');
            return res.status(400).send('Invalid signature');
        }

        const event = req.body.event;
        console.log(`✅ Razorpay Webhook received: ${event}`);

        if (event === 'payment.captured') {
            const payment = req.body.payload.payment.entity;
            const userId = payment.notes.userId;
            
            if (userId && userId !== 'anonymous') {
                await User.findOneAndUpdate(
                    { clerkId: userId },
                    { 
                        $set: { 
                            'subscription.tier': 'pro', 
                            'subscription.status': 'active',
                            'subscription.razorpayPaymentId': payment.id
                        } 
                    },
                    { upsert: true }
                );
                console.log(`✅ User ${userId} upgraded via Webhook`);
            }
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Razorpay Webhook Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
