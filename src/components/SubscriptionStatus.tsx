import React from "react";
import { useSession } from "next-auth/react";
import styles from "./SubscriptionStatus.module.css";

interface SubscriptionStatusProps {
  className?: string;
}

export default function SubscriptionStatus({
  className = "",
}: SubscriptionStatusProps) {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const subscription = session.user.subscription;
  const isPro =
    subscription?.status === "active" && subscription?.tier === "pro";
  const isFreeTrial = subscription?.status === "trialing";

  if (!isPro && !isFreeTrial) return null;

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={`${styles.badge} ${isPro ? styles.pro : styles.trial}`}>
        <div className={styles.icon}>{isPro ? "👑" : "⭐"}</div>
        <div className={styles.content}>
          <div className={styles.title}>{isPro ? "PRO" : "FREE TRIAL"}</div>
          {isFreeTrial && subscription?.trialEnd && (
            <div className={styles.subtitle}>
              Ends {new Date(subscription.trialEnd).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
