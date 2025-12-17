"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlowCard } from "./ui/GlowCard";
import RGBButton from "./ui/RGBButton";
import styles from "./UpgradeModal.module.css";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitation: string;
  feature: string;
  currentTier: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  limitation,
  feature,
  currentTier,
}: UpgradeModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    router.push("/subscription");
  };

  if (!isOpen) return null;

  const getRecommendedPlan = () => {
    if (feature.includes("group") || feature.includes("Group")) {
      return "premium";
    }
    if (feature.includes("boost") || feature.includes("unlimited")) {
      return "pro";
    }
    return "premium";
  };

  const recommendedPlan = getRecommendedPlan();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <GlowCard className={styles.modalContent} glowColor="primary">
          <div className={styles.header}>
            <h2>🚀 Upgrade Required</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.limitationInfo}>
              <p className={styles.limitation}>
                <strong>{limitation}</strong>
              </p>
              <p className={styles.description}>
                You've reached the limit for your current plan. Upgrade to
                continue using {feature}.
              </p>
            </div>

            <div className={styles.comparison}>
              <div className={styles.currentPlan}>
                <h4>Your Current Plan: {currentTier.toUpperCase()}</h4>
                <ul>
                  {currentTier === "free" ? (
                    <>
                      <li>10 posts per day</li>
                      <li>1 GB storage</li>
                      <li>Join 5 groups</li>
                      <li>No group creation</li>
                      <li>Pay per boost</li>
                    </>
                  ) : (
                    <li>Limited features</li>
                  )}
                </ul>
              </div>

              <div className={styles.recommendedPlan}>
                <h4>Recommended: {recommendedPlan.toUpperCase()}</h4>
                <div className={styles.price}>
                  ${recommendedPlan === "premium" ? "9.99" : "19.99"}
                  <span>/month</span>
                </div>
                <ul>
                  {recommendedPlan === "premium" ? (
                    <>
                      <li>50 posts per day</li>
                      <li>10 GB storage</li>
                      <li>Join 20 groups</li>
                      <li>Create groups</li>
                      <li>3 free boosts/month</li>
                      <li>Custom themes</li>
                      <li>Priority support</li>
                    </>
                  ) : (
                    <>
                      <li>Unlimited posts</li>
                      <li>50 GB storage</li>
                      <li>Unlimited groups</li>
                      <li>Create groups</li>
                      <li>Unlimited boosts</li>
                      <li>Custom themes</li>
                      <li>Marketplace priority</li>
                      <li>Early access features</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <RGBButton variant="ghost" onClick={onClose} disabled={loading}>
              Maybe Later
            </RGBButton>
            <RGBButton
              variant="primary"
              onClick={handleUpgrade}
              disabled={loading}>
              {loading
                ? "Loading..."
                : `Upgrade to ${recommendedPlan.toUpperCase()}`}
            </RGBButton>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
