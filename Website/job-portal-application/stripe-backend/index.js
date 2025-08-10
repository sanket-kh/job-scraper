// Express server for Stripe Checkout integration
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

dotenv.config();
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  console.log('Received request for /create-checkout-session:', req.body);
  const { priceId } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // Changed from 'payment' to 'subscription'
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:5173/success',
      cancel_url: 'http://localhost:5173/cancel',
    });
    console.log('Stripe session created:', session.id, 'Session URL:', session.url);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message, details: err });
  }
});

// Get subscription details
app.get('/get-subscription', async (req, res) => {
    try {
        // You'll need to identify the user somehow - via session, JWT token, etc.
        // For this example, I'm assuming you have a way to get the customer ID
        const customerId = req.user?.stripeCustomerId; // Replace with your user identification logic
        
        if (!customerId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Get all subscriptions for the customer
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 1, // Get the most recent subscription
        });

        if (subscriptions.data.length === 0) {
            return res.status(404).json({ error: 'No subscription found' });
        }

        const subscription = subscriptions.data[0];
        
        res.json({ 
            subscription: subscription,
            success: true 
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ 
            error: 'Failed to fetch subscription details',
            message: error.message 
        });
    }
});

// Cancel subscription
app.post('/cancel-subscription', async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        
        if (!subscriptionId) {
            return res.status(400).json({ error: 'Subscription ID is required' });
        }

        // Cancel the subscription at the end of the current period
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });

        res.json({ 
            subscription: subscription,
            success: true,
            message: 'Subscription will be canceled at the end of the current billing period'
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ 
            error: 'Failed to cancel subscription',
            message: error.message 
        });
    }
});

// Reactivate subscription (undo cancellation)
app.post('/reactivate-subscription', async (req, res) => {
    try {
        const { subscriptionId } = req.body;
        
        if (!subscriptionId) {
            return res.status(400).json({ error: 'Subscription ID is required' });
        }

        // Remove the cancellation
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false,
        });

        res.json({ 
            subscription: subscription,
            success: true,
            message: 'Subscription has been reactivated'
        });
    } catch (error) {
        console.error('Error reactivating subscription:', error);
        res.status(500).json({ 
            error: 'Failed to reactivate subscription',
            message: error.message 
        });
    }
});

// Webhook to handle subscription events
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'customer.subscription.created':
            console.log('Subscription created:', event.data.object);
            // Update your database to reflect the new subscription
            break;
        case 'customer.subscription.updated':
            console.log('Subscription updated:', event.data.object);
            // Update your database to reflect subscription changes
            break;
        case 'customer.subscription.deleted':
            console.log('Subscription deleted:', event.data.object);
            // Update your database to reflect subscription cancellation
            break;
        case 'invoice.payment_succeeded':
            console.log('Invoice payment succeeded:', event.data.object);
            // Handle successful payment
            break;
        case 'invoice.payment_failed':
            console.log('Invoice payment failed:', event.data.object);
            // Handle failed payment
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

app.get('/payment-success/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Retrieve the checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items', 'payment_intent', 'subscription']
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Get payment intent details
        const paymentIntent = session.payment_intent;
        
        // Get subscription details if it exists
        const subscription = session.subscription;
        
        let subscriptionExpiry = null;
        let planName = 'Standard Plan';

        if (subscription) {
            // For subscription payments, get the current period end
            subscriptionExpiry = subscription.current_period_end;
            
            // Get plan details from line items
            const lineItem = session.line_items.data[0];
            if (lineItem && lineItem.price) {
                planName = lineItem.price.nickname || lineItem.description || 'Standard Plan';
            }
        } else {
            // For one-time payments, set expiry to one month from now
            const oneMonthFromNow = new Date();
            oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
            subscriptionExpiry = Math.floor(oneMonthFromNow.getTime() / 1000);
        }

        // Get payment method details
        let cardDetails = {};
        if (paymentIntent && paymentIntent.payment_method) {
            const paymentMethod = await stripe.paymentMethods.retrieve(
                paymentIntent.payment_method
            );
            
            if (paymentMethod.card) {
                cardDetails = {
                    lastFourDigits: paymentMethod.card.last4,
                    cardBrand: paymentMethod.card.brand,
                    cardExpiry: `${paymentMethod.card.exp_month.toString().padStart(2, '0')}/${paymentMethod.card.exp_year.toString().slice(-2)}`
                };
            }
        }

        // Prepare response data
        const paymentDetails = {
            sessionId: session.id,
            transactionId: paymentIntent ? paymentIntent.id : session.id,
            paymentStatus: session.payment_status,
            customerEmail: session.customer_details.email,
            amountPaid: session.amount_total,
            currency: session.currency,
            paymentDate: session.created,
            subscriptionExpiry: subscriptionExpiry,
            planName: planName,
            ...cardDetails
        };

        // Optional: Save payment details to your database
        await savePaymentToDatabase(paymentDetails);

        // Optional: Send confirmation email
        await sendConfirmationEmail(paymentDetails);

        res.json(paymentDetails);

    } catch (error) {
        console.error('Error retrieving payment details:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve payment details',
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Stripe backend running on port ${PORT}`));
