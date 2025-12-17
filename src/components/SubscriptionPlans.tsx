"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlowCard } from "@/components/ui/GlowCard";
import RGBButton from "@/components/ui/RGBButton";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe-config";
import styles from "./SubscriptionPlans.module.css";

interface SubscriptionPlansProps {
  currentTier?: string;
  currentStatus?: string;
}

export function SubscriptionPlans({
  currentTier = "free",
  currentStatus,
}: SubscriptionPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSubscribe = async (planKey: string) => {
    setLoading(planKey);
    try {
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Failed to start subscription. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;

    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      alert("Subscription will be canceled at the end of your billing period.");
      router.refresh();
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel subscription. Please try again.");
    }
  };

  return (
    <div className={styles.subscriptionPlans}>
      <div className={styles.header}>
        <h2>Choose Your Plan</h2>
        <p>Unlock premium features and boost your gaming social experience</p>
      </div>

      <div className={styles.plans}>
        {/* Free Plan */}
        <GlowCard
          className={`${styles.planCard} ${
            currentTier === "free" ? styles.current : ""
          }`}>
          <div className={styles.planHeader}>
            <h3>🔓 Free</h3>
            <div className={styles.price}>
              <span className={styles.amount}>$0</span>
              <span className={styles.period}>/month</span>
            </div>
          </div>

          <ul className={styles.features}>
            {SUBSCRIPTION_PLANS.free.features.map((feature, index) => (
              <li key={index}>
                {currentTier === "free" ? "✅" : "🔓"} {feature}
              </li>
            ))}
          </ul>

          {currentTier === "free" && (
            <div className={styles.currentPlan}>Current Plan</div>
          )}
        </GlowCard>

        {/* Premium Plan */}
        <GlowCard
          className={`${styles.planCard} ${
            currentTier === "premium" ? styles.current : ""
          } ${styles.popular}`}
          glowColor="primary">
          <div className={styles.popularBadge}>Most Popular</div>
          <div className={styles.planHeader}>
            <h3>🔥 Premium</h3>
            <div className={styles.price}>
              <span className={styles.amount}>
                ${SUBSCRIPTION_PLANS.premium.price}
              </span>
              <span className={styles.period}>/month</span>
            </div>
          </div>

          <ul className={styles.features}>
            {SUBSCRIPTION_PLANS.premium.features.map((feature, index) => (
              <li key={index}>
                {currentTier === "premium" || currentTier === "pro"
                  ? "✅"
                  : "🔥"}{" "}
                {feature}
              </li>
            ))}
          </ul>

          {currentTier === "premium" ? (
            <div className={styles.managePlan}>
              <div className={styles.currentPlan}>Current Plan</div>
              {currentStatus === "active" && (
                <RGBButton variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel Subscription
                </RGBButton>
              )}
            </div>
          ) : (
            <RGBButton
              variant="primary"
              onClick={() => handleSubscribe("premium")}
              disabled={loading === "premium"}>
              {loading === "premium" ? "Processing..." : "Upgrade to Premium"}
            </RGBButton>
          )}
        </GlowCard>

        {/* Pro Plan */}
        <GlowCard
          className={`${styles.planCard} ${
            currentTier === "pro" ? styles.current : ""
          }`}
          glowColor="accent">
          <div className={styles.planHeader}>
            <h3>💎 Pro</h3>
            <div className={styles.price}>
              <span className={styles.amount}>
                ${SUBSCRIPTION_PLANS.pro.price}
              </span>
              <span className={styles.period}>/month</span>
            </div>
          </div>

          <ul className={styles.features}>
            {SUBSCRIPTION_PLANS.pro.features.map((feature, index) => (
              <li key={index}>
                {currentTier === "pro" ? "✅" : "💎"} {feature}
              </li>
            ))}
          </ul>

          {currentTier === "pro" ? (
            <div className={styles.managePlan}>
              <div className={styles.currentPlan}>Current Plan</div>
              {currentStatus === "active" && (
                <RGBButton variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel Subscription
                </RGBButton>
              )}
            </div>
          ) : (
            <RGBButton
              variant="accent"
              onClick={() => handleSubscribe("pro")}
              disabled={loading === "pro"}>
              {loading === "pro" ? "Processing..." : "Upgrade to Pro"}
            </RGBButton>
          )}
        </GlowCard>
      </div>
    </div>
  );
}
