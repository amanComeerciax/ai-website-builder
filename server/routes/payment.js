const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ── POST /api/payment/create-checkout-session ──
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { planName, planPrice, userId } = req.body;

        if (!planName || !planPrice) {
            return res.status(400).json({ error: 'Plan name and price are required' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'upi'],
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: `StackForge AI - ${planName}`,
                        },
                        unit_amount: parseInt(planPrice) * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/pricing`,
            metadata: {
                userId: userId || 'anonymous',
                planName: planName,
            },
        });

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe Session Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// NOTE: Webhook handler (POST /webhook) is mounted directly in server.js
// because it needs express.raw() BEFORE express.json() parses the body.

// ── GET /api/payment/verify-session/:sessionId ──
router.get('/verify-session/:sessionId', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

        res.json({
            paid: session.payment_status === 'paid',
            planName: session.metadata?.planName || 'Unknown',
            customerEmail: session.customer_details?.email || null,
            status: session.status,
        });
    } catch (error) {
        console.error('Session Verify Error:', error.message);
        res.status(404).json({ paid: false, error: 'Session not found' });
    }
});

module.exports = router;
