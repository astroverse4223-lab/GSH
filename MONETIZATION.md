# Monetization Features Setup Guide

## Overview

This application includes comprehensive monetization features powered by Stripe:

- **Subscriptions**: Premium and Pro tiers with recurring billing
- **Post Boosts**: Pay to promote posts for increased visibility
- **Marketplace Fees**: Commission-based revenue from user transactions

## Features

### 1. Subscription Tiers

- **Free Tier**: Basic functionality
- **Premium ($9.99/month)**:

  - Create unlimited posts
  - Upload HD media
  - Advanced profile customization
  - Priority support
  - 3 free boosts per month
  - Custom themes

- **Pro ($19.99/month)**:
  - Everything in Premium
  - Create groups
  - Advanced analytics
  - Stream integration
  - Marketplace selling with reduced fees
  - Unlimited boosts
  - Early access to features
  - Verified badge

### 2. Post Boosts

Users can pay to boost their posts for increased visibility:

- **24 hours**: $2.99
- **72 hours**: $7.99
- **1 week**: $14.99

### 3. Marketplace Fees

- **Standard Fee**: 5% commission on all sales
- **Pro Members**: Reduced fees (could be customized)

## Setup Instructions

### 1. Stripe Account Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Set up webhook endpoints
4. Create subscription products and prices

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Subscription Price IDs (create these in Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_premium_monthly
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_pro_monthly
```

### 3. Stripe Products Setup

Create the following products in your Stripe Dashboard:

1. **Premium Subscription**

   - Product name: "Premium Gaming Subscription"
   - Price: $9.99/month
   - Copy the Price ID to `NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID`

2. **Pro Subscription**

   - Product name: "Pro Gaming Subscription"
   - Price: $19.99/month
   - Copy the Price ID to `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`

3. **Post Boosts** (handled dynamically in code)
   - No need to create products - handled via dynamic pricing

### 4. Webhook Configuration

Set up a webhook endpoint in Stripe Dashboard:

- **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
- **Events**: Select all events or specific ones:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `checkout.session.completed`

### 5. Database Migration

The database schema already includes the necessary tables:

- `Subscription`
- `Boost`
- `Transaction`
- `MarketplaceTransaction`

Run Prisma migration if needed:

```bash
npx prisma migrate deploy
```

## Usage

### For Users

1. **Subscriptions**: Access via Profile → Subscription
2. **Post Boosts**: Click "Boost" button on any post
3. **Marketplace**: Automatic fee calculation during checkout

### For Developers

#### Subscription Management

```typescript
// Check user subscription
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { subscription: true },
});

const isSubscribed = user?.subscription?.status === "active";
const tier = user?.subscription?.tier || "free";
```

#### Boost System

```typescript
// Create a boost
await prisma.boost.create({
  data: {
    postId,
    userId,
    duration: 24, // hours
    amount: 299, // cents
    status: "active",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
});
```

#### Marketplace Integration

```typescript
// Calculate fees
const feeAmount = Math.round(price * MARKETPLACE_FEE_RATE);
const sellerAmount = price - feeAmount;
```

## Security Considerations

1. **Webhook Verification**: All webhooks are verified using Stripe signatures
2. **User Authorization**: API routes check user authentication
3. **Input Validation**: All payment inputs are validated
4. **Error Handling**: Comprehensive error handling with user-friendly messages

## Testing

Use Stripe's test mode and test cards:

- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002

## Production Deployment

1. Switch to live Stripe keys
2. Update webhook URLs to production domain
3. Test all payment flows
4. Monitor Stripe Dashboard for transactions

## Troubleshooting

### Common Issues

1. **Webhook failures**: Check endpoint URL and signature verification
2. **Payment failures**: Verify API keys and test with different cards
3. **Subscription not updating**: Check webhook events and database sync

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG_STRIPE=true
```

## Support

For issues with:

- **Stripe Integration**: Check Stripe Dashboard logs
- **Database Issues**: Review Prisma logs
- **Frontend Issues**: Check browser console

## Revenue Analytics

Monitor your revenue through:

1. Stripe Dashboard for payment analytics
2. Application database for user behavior
3. Custom analytics endpoints (can be implemented)

## Future Enhancements

Possible additional monetization features:

- Tiered boost pricing based on user engagement
- Group creation fees
- Premium themes marketplace
- Revenue sharing with content creators
- Sponsored content system
