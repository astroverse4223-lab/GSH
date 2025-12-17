// Client-side Stripe configuration (no secret keys!)
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "📝 10 posts per day",
      "👥 Join up to 5 groups",
      "🆕 Create up to 2 groups",
      "⚡ 5 free boosts per month",
      "💾 1 GB storage",
      "🛠️ Community support",
    ],
  },
  premium: {
    name: "Premium",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID!,
    price: 9.99,
    features: [
      "📝 50 posts per day",
      "👥 Join up to 10 groups",
      "🆕 Create up to 10 groups",
      "⚡ 25 free boosts per month",
      "🎨 Custom themes access",
      "💾 10 GB storage",
      "🔥 Priority support",
    ],
  },
  pro: {
    name: "Pro",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    price: 19.99,
    features: [
      "📝 Unlimited posts",
      "👥 Unlimited group memberships",
      "🆕 Unlimited group creation",
      "⚡ Unlimited boosts",
      "🎨 All custom themes",
      "🛒 Marketplace priority",
      "💾 50 GB storage",
      "💎 Premium support",
    ],
  },
};

export const BOOST_PRICES = {
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

export const MARKETPLACE_FEE_RATE = 0.05; // 5% marketplace fee
