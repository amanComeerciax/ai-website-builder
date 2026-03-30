const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
    const { planName, userId, userEmail } = req.body;
    
    // Map plan names to Stripe Price IDs (or use fixed prices for demo)
    const priceMap = {
        'Pro': 2900, // $29.00
        'Agency': 9900 // $99.00
    };

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `StackForge AI - ${planName} Plan`,
                    },
                    unit_amount: priceMap[planName] || 0,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/pricing`,
            customer_email: userEmail,
            metadata: {
                userId,
                planName
            }
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
