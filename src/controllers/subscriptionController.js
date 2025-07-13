// src/controllers/subscriptionController.js - FINAL COMPLETE VERSION
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Subscription } = require('../models');

// ========================================
// HELPER FUNCTIONS (Outside class to avoid 'this' binding issues)
// ========================================

/**
 * Handle checkout session completed (TEST VERSION)
 */
async function handleCheckoutSessionCompletedTest(session) {
  console.log('💳 Processing TEST checkout session completed');
  console.log('📋 Session ID:', session.id);
  console.log('📋 Customer Email:', session.customer_email);
  console.log('📋 Metadata:', session.metadata);

  const userId = session.metadata?.userId || session.client_reference_id;
  const subscriptionId = session.subscription || `sub_test_${Date.now()}`;

  if (!userId) {
    console.error('❌ No userId found in session metadata');
    throw new Error('No userId found in session metadata');
  }

  try {
    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    console.log('✅ User found:', user.mobile);

    // Create mock subscription data for testing
    console.log('🧪 Creating test subscription in database...');
    
    const [subscription, created] = await Subscription.upsert({
      userId,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: `cus_test_${Date.now()}`,
      tier: 'pro',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      metadata: {
        priceId: process.env.STRIPE_PRICE_ID_PRO || 'price_test_pro',
        sessionId: session.id,
        processedAt: new Date(),
        testMode: true
      }
    });

    console.log(`✅ Test subscription ${created ? 'created' : 'updated'} for user ${userId}`);
    
    // Log the subscription details
    console.log('📊 Subscription details:', {
      id: subscription.id,
      userId: subscription.userId,
      tier: subscription.tier,
      status: subscription.status,
      stripeSubscriptionId: subscription.stripeSubscriptionId
    });

    return {
      subscriptionId: subscription.id,
      userId: userId,
      tier: subscription.tier,
      status: subscription.status,
      created: created,
      stripeSubscriptionId: subscription.stripeSubscriptionId
    };

  } catch (error) {
    console.error('❌ Error handling test checkout session:', error);
    throw error;
  }
}

/**
 * Handle subscription updated (TEST VERSION)
 */
async function handleSubscriptionUpdatedTest(stripeSubscription) {
  console.log('🔄 Processing TEST subscription updated');
  console.log('📋 Subscription ID:', stripeSubscription.id);
  console.log('📋 Status:', stripeSubscription.status);

  const subscriptionId = stripeSubscription.id;

  try {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (subscription) {
      const status = stripeSubscription.status === 'active' ? 'active' : 'inactive';

      await subscription.update({
        status,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      console.log(`🔄 Test subscription ${subscriptionId} updated to status: ${status}`);
      return { subscriptionId, status, updated: true };
    } else {
      console.log(`⚠️ Test subscription ${subscriptionId} not found in database`);
      return { subscriptionId, status: 'not_found', updated: false };
    }

  } catch (error) {
    console.error('❌ Error handling test subscription update:', error);
    throw error;
  }
}

/**
 * Handle subscription deleted (TEST VERSION)
 */
async function handleSubscriptionDeletedTest(stripeSubscription) {
  console.log('🗑️ Processing TEST subscription deleted');
  console.log('📋 Subscription ID:', stripeSubscription.id);

  const subscriptionId = stripeSubscription.id;

  try {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (subscription) {
      await subscription.update({
        status: 'cancelled'
      });

      console.log(`🗑️ Test subscription ${subscriptionId} cancelled`);
      return { subscriptionId, status: 'cancelled', deleted: true };
    } else {
      console.log(`⚠️ Test subscription ${subscriptionId} not found in database`);
      return { subscriptionId, status: 'not_found', deleted: false };
    }

  } catch (error) {
    console.error('❌ Error handling test subscription deletion:', error);
    throw error;
  }
}

/**
 * Handle invoice payment succeeded (TEST VERSION)
 */
async function handleInvoicePaymentSucceededTest(invoice) {
  console.log('✅ Processing TEST invoice payment succeeded');
  console.log('📋 Invoice ID:', invoice.id);
  console.log('📋 Subscription ID:', invoice.subscription);

  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    console.log('ℹ️ No subscription ID in test invoice, skipping');
    return { message: 'No subscription ID found' };
  }

  try {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (subscription) {
      await subscription.update({
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      console.log(`✅ Test payment succeeded for subscription ${subscriptionId}`);
      return { subscriptionId, status: 'active', updated: true };
    } else {
      console.warn(`⚠️ Test subscription ${subscriptionId} not found in database`);
      return { subscriptionId, status: 'not_found', updated: false };
    }

  } catch (error) {
    console.error('❌ Error handling test payment success:', error);
    throw error;
  }
}

/**
 * Handle invoice payment failed (TEST VERSION)
 */
async function handleInvoicePaymentFailedTest(invoice) {
  console.log('❌ Processing TEST invoice payment failed');
  console.log('📋 Invoice ID:', invoice.id);
  console.log('📋 Subscription ID:', invoice.subscription);

  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return { message: 'No subscription ID found' };
  }

  try {
    const subscription = await Subscription.findOne({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (subscription) {
      await subscription.update({
        status: 'past_due'
      });

      console.log(`❌ Test payment failed for subscription ${subscriptionId}`);
      return { subscriptionId, status: 'past_due', updated: true };
    } else {
      return { subscriptionId, status: 'not_found', updated: false };
    }

  } catch (error) {
    console.error('❌ Error handling test payment failure:', error);
    throw error;
  }
}

// ========================================
// MAIN SUBSCRIPTION CONTROLLER CLASS
// ========================================

class SubscriptionController {
/**
 * Create Pro subscription checkout session (ENHANCED - Better user tracking)
 */
async createProSubscription(req, res) {
  try {
    const userId = req.user.userId;

    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      where: { userId, status: 'active' }
    });

    if (existingSubscription && existingSubscription.tier === 'pro') {
      return res.status(400).json({
        success: false,
        message: 'User already has an active Pro subscription'
      });
    }

    // Validate required environment variables
    if (!process.env.STRIPE_PRICE_ID_PRO) {
      return res.status(500).json({
        success: false,
        message: 'Stripe price ID not configured'
      });
    }

    // Create Stripe checkout session with proper metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.protocol}://${req.get('host')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/subscription/cancel`,
      client_reference_id: userId, // This is key - Stripe will return this in webhooks
      customer_email: user.email || undefined,
      metadata: {
        userId: userId,           // Primary user identification
        mobile: user.mobile,      // Additional identification
        userEmail: user.email || 'no-email',
        appName: 'Gemini Backend Clone'
      }
    });

    console.log('🎫 Checkout session created:', {
      sessionId: session.id,
      userId: userId,
      userEmail: user.email,
      mobile: user.mobile
    });

    res.json({
      success: true,
      message: 'Checkout session created successfully',
      data: {
        checkoutUrl: session.url,
        sessionId: session.id,
        userId: userId // Include for frontend tracking
      }
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

  /**
   * Test webhook endpoint (for development) - FIXED
   */
  async testWebhook(req, res) {
    try {
      console.log('🧪 Test webhook endpoint called');
      console.log('📋 Received data:', JSON.stringify(req.body, null, 2));

      const { eventType, data } = req.body;

      if (!eventType || !data) {
        return res.status(400).json({
          success: false,
          message: 'eventType and data are required for test webhook',
          expectedFormat: {
            eventType: 'checkout.session.completed',
            data: { /* webhook data */ }
          }
        });
      }

      // Process the test event using standalone functions
      let result;
      switch (eventType) {
        case 'checkout.session.completed':
          console.log('💳 Processing test checkout session completed...');
          result = await handleCheckoutSessionCompletedTest(data);
          break;
        
        case 'customer.subscription.updated':
          console.log('🔄 Processing test subscription updated...');
          result = await handleSubscriptionUpdatedTest(data);
          break;
        
        case 'customer.subscription.deleted':
          console.log('🗑️ Processing test subscription deleted...');
          result = await handleSubscriptionDeletedTest(data);
          break;
        
        case 'invoice.payment_succeeded':
          console.log('✅ Processing test invoice payment succeeded...');
          result = await handleInvoicePaymentSucceededTest(data);
          break;
        
        case 'invoice.payment_failed':
          console.log('❌ Processing test invoice payment failed...');
          result = await handleInvoicePaymentFailedTest(data);
          break;
        
        default:
          return res.status(400).json({
            success: false,
            message: `Unsupported test event type: ${eventType}`,
            supportedEvents: [
              'checkout.session.completed',
              'customer.subscription.updated',
              'customer.subscription.deleted',
              'invoice.payment_succeeded',
              'invoice.payment_failed'
            ]
          });
      }

      res.json({
        success: true,
        message: 'Test webhook processed successfully',
        eventType,
        testEventId: `evt_test_${Date.now()}`,
        result: result
      });

    } catch (error) {
      console.error('❌ Test webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Test webhook processing failed',
        error: error.message
      });
    }
  }

  /**
   * Handle Stripe webhook events with testing support
   */
  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    // Check if this is a test call (for development/testing)
    const isTestCall = req.headers['x-test-webhook'] === 'true';

    if (isTestCall) {
      // For testing purposes - skip signature verification
      console.log('🧪 Test webhook call detected, skipping signature verification');
      event = req.body;
    } else {
      // Production webhook - verify signature
      if (!sig) {
        console.error('❌ Webhook signature missing');
        return res.status(400).json({
          success: false,
          message: 'Webhook Error: No stripe-signature header value was provided'
        });
      }

      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).json({
          success: false,
          message: 'Webhook Error: STRIPE_WEBHOOK_SECRET not configured'
        });
      }

      try {
        event = stripe.webhooks.constructEvent(
          req.body, 
          sig, 
          process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log('✅ Webhook signature verified');
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).json({
          success: false,
          message: `Webhook Error: ${err.message}`
        });
      }
    }

    console.log(`📨 Received webhook event: ${event.type}`);
    console.log(`📋 Event ID: ${event.id || 'test'}`);

    try {
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          console.log('💳 Processing checkout session completed...');
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          console.log('✅ Processing invoice payment succeeded...');
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          console.log('❌ Processing invoice payment failed...');
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          console.log('🔄 Processing subscription updated...');
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          console.log('🗑️ Processing subscription deleted...');
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        
        default:
          console.log(`ℹ️ Unhandled event type: ${event.type}`);
      }

      res.json({ 
        received: true,
        eventType: event.type,
        eventId: event.id || 'test'
      });

    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Webhook processing failed',
        error: error.message 
      });
    }
  }

  /**
   * Handle successful checkout session (PRODUCTION VERSION)
   */
  async handleCheckoutSessionCompleted(session) {
    console.log('💳 Processing checkout session completed');
    console.log('📋 Session ID:', session.id);
    console.log('📋 Customer Email:', session.customer_email);
    console.log('📋 Metadata:', session.metadata);

    const userId = session.metadata?.userId || session.client_reference_id;
    const subscriptionId = session.subscription;

    if (!userId) {
      console.error('❌ No userId found in session metadata');
      throw new Error('No userId found in session metadata');
    }

    if (!subscriptionId) {
      console.error('❌ No subscription ID found in session');
      throw new Error('No subscription ID found in session');
    }

    try {
      let subscriptionData;

      // Check if this is a test subscription
      if (subscriptionId.startsWith('sub_test_') || subscriptionId.includes('test')) {
        console.log('🧪 Test subscription detected, using mock data');
        
        // Create mock subscription data for testing
        subscriptionData = {
          id: subscriptionId,
          customer: `cus_test_${Date.now()}`,
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000), // 30 days
          status: 'active',
          items: {
            data: [{
              price: {
                id: process.env.STRIPE_PRICE_ID_PRO || 'price_test_pro'
              }
            }]
          }
        };
      } else {
        // Real subscription - fetch from Stripe
        console.log('📡 Fetching real subscription details from Stripe...');
        subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
      }

      // Create or update subscription in database
      console.log('💾 Updating subscription in database...');
      const [subscription, created] = await Subscription.upsert({
        userId,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: subscriptionData.customer,
        tier: 'pro',
        status: 'active',
        currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
        currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
        metadata: {
          priceId: subscriptionData.items.data[0].price.id,
          sessionId: session.id,
          processedAt: new Date(),
          testMode: subscriptionId.startsWith('sub_test_') || subscriptionId.includes('test')
        }
      });

      console.log(`✅ Subscription ${created ? 'created' : 'updated'} for user ${userId}`);
      return subscription;

    } catch (error) {
      console.error('❌ Error handling checkout session:', error);
      throw error;
    }
  }

  /**
   * Handle successful invoice payment
   */
  async handleInvoicePaymentSucceeded(invoice) {
    console.log('✅ Processing invoice payment succeeded');
    console.log('📋 Invoice ID:', invoice.id);
    console.log('📋 Subscription ID:', invoice.subscription);

    const subscriptionId = invoice.subscription;

    if (!subscriptionId) {
      console.log('ℹ️ No subscription ID in invoice, skipping');
      return;
    }

    try {
      const subscription = await Subscription.findOne({
        where: { stripeSubscriptionId: subscriptionId }
      });

      if (subscription) {
        // Skip Stripe API call for test subscriptions
        if (subscriptionId.includes('test')) {
          await subscription.update({
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          });
        } else {
          // Get updated subscription from Stripe for real subscriptions
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          await subscription.update({
            status: 'active',
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
          });
        }

        console.log(`✅ Payment succeeded for subscription ${subscriptionId}`);
      } else {
        console.warn(`⚠️ Subscription ${subscriptionId} not found in database`);
      }

    } catch (error) {
      console.error('❌ Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Handle failed invoice payment
   */
  async handleInvoicePaymentFailed(invoice) {
    console.log('❌ Processing invoice payment failed');
    console.log('📋 Invoice ID:', invoice.id);
    console.log('📋 Subscription ID:', invoice.subscription);

    const subscriptionId = invoice.subscription;

    if (!subscriptionId) return;

    try {
      const subscription = await Subscription.findOne({
        where: { stripeSubscriptionId: subscriptionId }
      });

      if (subscription) {
        await subscription.update({
          status: 'past_due'
        });
        console.log(`❌ Payment failed for subscription ${subscriptionId}`);
      }
    } catch (error) {
      console.error('❌ Error handling payment failure:', error);
      throw error;
    }
  }

  /**
   * Handle subscription updates
   */
  async handleSubscriptionUpdated(stripeSubscription) {
    console.log('🔄 Processing subscription updated');
    console.log('📋 Subscription ID:', stripeSubscription.id);
    console.log('📋 Status:', stripeSubscription.status);

    const subscriptionId = stripeSubscription.id;

    try {
      const subscription = await Subscription.findOne({
        where: { stripeSubscriptionId: subscriptionId }
      });

      if (subscription) {
        const status = this.mapStripeStatus(stripeSubscription.status);
        await subscription.update({
          status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
        });
        console.log(`🔄 Subscription ${subscriptionId} updated to status: ${status}`);
      }
    } catch (error) {
      console.error('❌ Error handling subscription update:', error);
      throw error;
    }
  }

  /**
   * Handle subscription deletion/cancellation
   */
  async handleSubscriptionDeleted(stripeSubscription) {
    console.log('🗑️ Processing subscription deleted');
    console.log('📋 Subscription ID:', stripeSubscription.id);

    const subscriptionId = stripeSubscription.id;

    try {
      const subscription = await Subscription.findOne({
        where: { stripeSubscriptionId: subscriptionId }
      });

      if (subscription) {
        await subscription.update({ status: 'cancelled' });
        console.log(`🗑️ Subscription ${subscriptionId} cancelled`);
      }
    } catch (error) {
      console.error('❌ Error handling subscription deletion:', error);
      throw error;
    }
  }

  /**
   * Get user's subscription status
   */
  async getSubscriptionStatus(req, res) {
    try {
      const userId = req.user.userId;

      const subscription = await Subscription.findOne({
        where: { userId },
        attributes: ['tier', 'status', 'currentPeriodStart', 'currentPeriodEnd', 'stripeSubscriptionId', 'metadata']
      });

      const subscriptionData = {
        tier: subscription?.tier || 'basic',
        status: subscription?.status || 'inactive',
        currentPeriodStart: subscription?.currentPeriodStart || null,
        currentPeriodEnd: subscription?.currentPeriodEnd || null,
        isActive: subscription?.status === 'active' || false,
        testMode: subscription?.metadata?.testMode || false
      };

      // Get additional Stripe details for real subscriptions
      if (subscription?.stripeSubscriptionId && subscription.status === 'active' && !subscription.stripeSubscriptionId.includes('test')) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
          subscriptionData.nextBillingDate = new Date(stripeSubscription.current_period_end * 1000);
          subscriptionData.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
        } catch (stripeError) {
          console.error('Error fetching Stripe subscription:', stripeError);
        }
      }

      res.json({
        success: true,
        message: 'Subscription status retrieved successfully',
        data: subscriptionData
      });

    } catch (error) {
      console.error('Get subscription status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error retrieving subscription status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req, res) {
    try {
      const userId = req.user.userId;

      const subscription = await Subscription.findOne({
        where: { userId, status: 'active' }
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found'
        });
      }

      // Handle test vs real subscriptions
      if (subscription.stripeSubscriptionId.includes('test')) {
        await subscription.update({ status: 'cancelled' });
        console.log(`🧪 Test subscription ${subscription.stripeSubscriptionId} cancelled directly`);
      } else {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
        console.log(`📡 Real subscription ${subscription.stripeSubscriptionId} scheduled for cancellation`);
      }

      res.json({
        success: true,
        message: 'Subscription will be cancelled at the end of the current period'
      });

    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error cancelling subscription',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(req, res) {
    try {
      const userId = req.user.userId;

      const subscription = await Subscription.findOne({
        where: { userId }
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({
          success: false,
          message: 'No subscription found'
        });
      }

      // Handle test vs real subscriptions
      if (subscription.stripeSubscriptionId.includes('test')) {
        await subscription.update({ 
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        console.log(`🧪 Test subscription ${subscription.stripeSubscriptionId} reactivated directly`);
      } else {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false
        });
        console.log(`📡 Real subscription ${subscription.stripeSubscriptionId} reactivated`);
      }

      res.json({
        success: true,
        message: 'Subscription reactivated successfully'
      });

    } catch (error) {
      console.error('Reactivate subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error reactivating subscription',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

/**
 * Get subscription success page (PROPER - Gets real user ID from Stripe)
 */
async subscriptionSuccess(req, res) {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required'
    });
  }

  try {
    let sessionData;
    let shouldProcessWebhook = false;
    
    // Handle test session IDs
    if (session_id.includes('test')) {
      console.log('🧪 Processing test session success');
      sessionData = {
        id: session_id,
        customer_email: 'test@example.com',
        subscription: 'sub_test_subscription',
        client_reference_id: null, // Will be handled differently for test
        metadata: {},
        testMode: true
      };
    } else {
      // Real Stripe session - get actual data
      console.log('📡 Fetching real session from Stripe');
      sessionData = await stripe.checkout.sessions.retrieve(session_id);
      sessionData.testMode = false;
      shouldProcessWebhook = true; // Only process webhook for real sessions
    }

    // Auto-process the webhook if we have real session data
    if (shouldProcessWebhook && sessionData.subscription && sessionData.client_reference_id) {
      console.log('🔄 Auto-processing checkout.session.completed webhook...');
      console.log('📋 Session metadata:', sessionData.metadata);
      console.log('📋 Client reference ID (userId):', sessionData.client_reference_id);
      
      try {
        // Use the real session data from Stripe
        await this.handleCheckoutSessionCompleted(sessionData);
        console.log('✅ Webhook processed automatically');
      } catch (webhookError) {
        console.error('❌ Auto webhook processing failed:', webhookError);
        // Continue with response even if webhook fails
      }
    }

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        sessionId: sessionData.id,
        customerEmail: sessionData.customer_email,
        subscriptionId: sessionData.subscription,
        userId: sessionData.client_reference_id,
        testMode: sessionData.testMode,
        autoProcessed: shouldProcessWebhook
      }
    });

  } catch (error) {
    console.error('Subscription success error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing subscription success',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

  /**
   * Get subscription cancel page
   */
  async subscriptionCancel(req, res) {
    res.json({
      success: false,
      message: 'Subscription cancelled by user',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Map Stripe subscription status to our status
   */
  mapStripeStatus(stripeStatus) {
    const statusMap = {
      'active': 'active',
      'past_due': 'past_due',
      'canceled': 'cancelled',
      'unpaid': 'past_due',
      'incomplete': 'inactive',
      'incomplete_expired': 'inactive',
      'trialing': 'active'
    };

    return statusMap[stripeStatus] || 'inactive';
  }
  /**
 * Manual webhook trigger endpoint (for testing when webhooks fail)
 */
async triggerWebhookManually(req, res) {
  try {
    const { session_id } = req.body;
    const userId = req.user.userId; // Get from authenticated user

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id is required'
      });
    }

    console.log('🔧 Manual webhook trigger requested');
    console.log('👤 User ID:', userId);
    console.log('🎫 Session ID:', session_id);

    // Create proper session data for webhook
    const mockSessionData = {
      id: session_id,
      subscription: `sub_manual_${Date.now()}`,
      customer_email: 'manual@trigger.com',
      client_reference_id: userId, // Use the actual authenticated user ID
      metadata: {
        userId: userId,
        manualTrigger: true
      }
    };

    // Process the webhook
    await handleCheckoutSessionCompletedTest(mockSessionData);

    res.json({
      success: true,
      message: 'Webhook triggered manually',
      data: {
        sessionId: session_id,
        userId: userId,
        processed: true
      }
    });

  } catch (error) {
    console.error('❌ Manual webhook trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger webhook manually',
      error: error.message
    });
  }
}
}

module.exports = new SubscriptionController();