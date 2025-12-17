import Stripe from "stripe";
import {
  SERVER_SUBSCRIPTION_PLANS,
  SERVER_BOOST_PRICES,
  SERVER_MARKETPLACE_FEE_RATE,
} from "./stripe-server-config";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

// Re-export the server config
export const SUBSCRIPTION_PLANS = SERVER_SUBSCRIPTION_PLANS;
export const BOOST_PRICES = SERVER_BOOST_PRICES;
export const MARKETPLACE_FEE_RATE = SERVER_MARKETPLACE_FEE_RATE;
