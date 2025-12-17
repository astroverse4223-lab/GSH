// Server-side Stripe configuration (uses server environment variables)
export const SERVER_SUBSCRIPTION_PLANS = {
  premium: {
    name: "Premium",
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    price: 9.99,
    features: [
      "Unlimited post boosts",
      "Priority support",
      "Custom themes",
      "Advanced analytics",
      "10 GB storage",
    ],
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    price: 19.99,
    features: [
      "Everything in Premium",
      "Group boost credits",
      "Marketplace priority",
      "Early access to features",
      "50 GB storage",
      "Custom branding",
    ],
  },
};

export const SERVER_BOOST_PRICES = {
  POST_BOOST: {
    "24h": 2.99,
    "72h": 7.99,
    "168h": 14.99,
  },
  PROFILE_BOOST: {
    "24h": 4.99,
    "72h": 12.99,
    "168h": 24.99,
  },
  GROUP_BOOST: {
    "24h": 9.99,
    "72h": 24.99,
    "168h": 44.99,
  },
};

export const SERVER_MARKETPLACE_FEE_RATE = 0.05; // 5% marketplace fee
