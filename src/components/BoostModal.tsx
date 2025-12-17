"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { GlowCard } from "@/components/ui/GlowCard";
import RGBButton from "@/components/ui/RGBButton";
import { Toast } from "@/components/ui/Toast";
import { BOOST_PRICES } from "@/lib/stripe-config";
import styles from "./BoostModal.module.css";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "POST_BOOST" | "PROFILE_BOOST" | "GROUP_BOOST";
  targetId?: string;
  targetName?: string;
  postId?: string;
  onBoostSuccess?: (boostData: any) => void;
}

function BoostForm({
  type = "POST_BOOST",
  targetId,
  targetName,
  postId,
  onClose,
  onBoostSuccess,
}: Omit<BoostModalProps, "isOpen">) {
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState<"24h" | "72h" | "168h">("24h");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [boostPermission, setBoostPermission] = useState<any>(null);
  const [checkingFreeBoosts, setCheckingFreeBoosts] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const prices = BOOST_PRICES[type];
  const selectedPrice = prices[duration];

  // Check if user has free boosts available
  useEffect(() => {
    const checkFreeBoosts = async () => {
      try {
        const response = await fetch("/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          // Check if user can boost for free
          const canBoost =
            data.limits.maxBoostsPerMonth === -1 ||
            data.usage.boostsThisMonth < data.limits.maxBoostsPerMonth;

          setBoostPermission({
            allowed: canBoost,
            remainingBoosts:
              data.limits.maxBoostsPerMonth === -1
                ? "unlimited"
                : Math.max(
                    0,
                    data.limits.maxBoostsPerMonth - data.usage.boostsThisMonth
                  ),
            tier: data.tier,
          });

          // If user has free boosts, force duration to 24h
          if (canBoost) {
            setDuration("24h");
          }
        }
      } catch (error) {
        console.error("Error checking boost permission:", error);
        setBoostPermission({
          allowed: false,
          remainingBoosts: 0,
          tier: "free",
        });
      } finally {
        setCheckingFreeBoosts(false);
      }
    };

    checkFreeBoosts();
  }, []);

  const handleFreeBoost = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/boost/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId, duration }),
      });

      if (!response.ok) throw new Error("Failed to create boost");

      const result = await response.json();

      if (result.success) {
        const successMessage =
          result.message ||
          "🚀 Your boost is now active! Your content will appear at the top of feeds.";
        setToastMessage(successMessage);
        setShowSuccessToast(true);

        // Close modal after a short delay to show the toast
        setTimeout(() => {
          onClose();
          onBoostSuccess?.(result.boost);
        }, 500);
      } else {
        throw new Error("Boost creation failed");
      }
    } catch (error) {
      console.error("Free boost error:", error);
      setToastMessage("❌ Failed to activate boost. Please try again.");
      setShowSuccessToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaymentIntent = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/boost/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId, duration }),
      });

      if (!response.ok) throw new Error("Failed to create boost");

      const result = await response.json();

      if (result.success) {
        // This is a free boost, handle it directly
        const successMessage =
          result.message ||
          "🚀 Your boost is now active! Your content will appear at the top of feeds.";
        setToastMessage(successMessage);
        setShowSuccessToast(true);

        // Close modal after a short delay to show the toast
        setTimeout(() => {
          onClose();
          onBoostSuccess?.(result.boost);
        }, 500);
      } else if (result.requiresPayment && result.clientSecret) {
        // This requires payment, set up Stripe
        setClientSecret(result.clientSecret);
      } else {
        throw new Error(result.message || "Failed to create boost");
      }
    } catch (error) {
      console.error("Boost creation error:", error);
      setToastMessage("❌ Failed to create boost. Please try again.");
      setShowSuccessToast(true);
    } finally {
      setLoading(false);
    }
  };

  const getDurationLabel = (dur: string) => {
    switch (dur) {
      case "24h":
        return "24 Hours";
      case "72h":
        return "3 Days";
      case "168h":
        return "1 Week";
      default:
        return dur;
    }
  };

  const getBoostDescription = () => {
    switch (type) {
      case "POST_BOOST":
        return "Boost your post to appear higher in feeds and get more visibility";
      case "PROFILE_BOOST":
        return "Boost your profile to appear in suggested users and get more followers";
      case "GROUP_BOOST":
        return "Boost your group to appear in trending groups and attract more members";
    }
  };

  return (
    <div className={styles.boostForm}>
      <div className={styles.header}>
        <h3>Boost {targetName || "Content"}</h3>
        <p>{getBoostDescription()}</p>

        {checkingFreeBoosts && (
          <div className={styles.loadingMessage}>
            <p>Checking available boosts...</p>
          </div>
        )}

        {!checkingFreeBoosts && boostPermission?.allowed && (
          <div className={styles.freeBoostNotice}>
            <p className={styles.freeBoostText}>
              🎉 You have{" "}
              {boostPermission.remainingBoosts === "unlimited"
                ? "unlimited"
                : boostPermission.remainingBoosts}{" "}
              free boosts remaining this month!
            </p>
            <p className={styles.freeBoostExplanation}>
              Free boosts are limited to 24 hours. For longer durations, upgrade
              your plan or purchase additional boosts.
            </p>
          </div>
        )}
      </div>

      <div className={styles.durationSelector}>
        <h4>Select Duration</h4>
        <div className={styles.durationOptions}>
          {Object.entries(prices)
            .filter(([dur, price]) => {
              // If user has free boosts, only show 24h option
              if (!checkingFreeBoosts && boostPermission?.allowed) {
                return dur === "24h";
              }
              // If user needs to pay, show all options
              return true;
            })
            .map(([dur, price]) => (
              <button
                key={dur}
                className={`${styles.durationOption} ${
                  duration === dur ? styles.selected : ""
                }`}
                onClick={() => setDuration(dur as any)}
                type="button">
                <div className={styles.durationLabel}>
                  {getDurationLabel(dur)}
                </div>
                <div className={styles.durationPrice}>
                  {!checkingFreeBoosts && boostPermission?.allowed
                    ? "FREE"
                    : `$${price}`}
                </div>
              </button>
            ))}
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span>Duration:</span>
          <span>{getDurationLabel(duration)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span>Price:</span>
          <span>
            {!checkingFreeBoosts && boostPermission?.allowed
              ? "FREE"
              : `$${selectedPrice}`}
          </span>
        </div>
        {!checkingFreeBoosts && boostPermission?.allowed && (
          <div className={styles.summaryItem}>
            <span>Remaining:</span>
            <span>
              {boostPermission.remainingBoosts === "unlimited"
                ? "Unlimited"
                : `${boostPermission.remainingBoosts} boosts`}
            </span>
          </div>
        )}
      </div>

      {/* Single boost button that handles both free and paid boosts */}
      {!checkingFreeBoosts && !clientSecret ? (
        <RGBButton
          variant="primary"
          onClick={
            boostPermission?.allowed
              ? handleFreeBoost
              : handleCreatePaymentIntent
          }
          disabled={loading}
          className={styles.proceedButton}>
          {loading
            ? "Processing..."
            : boostPermission?.allowed
            ? `Activate Free Boost (${getDurationLabel(duration)})`
            : `Purchase Boost - $${selectedPrice}`}
        </RGBButton>
      ) : !checkingFreeBoosts && clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            selectedPrice={selectedPrice}
            onClose={onClose}
            onBoostSuccess={onBoostSuccess}
          />
        </Elements>
      ) : checkingFreeBoosts ? (
        <RGBButton
          variant="primary"
          disabled={true}
          className={styles.proceedButton}>
          Checking available boosts...
        </RGBButton>
      ) : null}

      {/* Success Toast */}
      {showSuccessToast && (
        <Toast
          message={toastMessage}
          type={toastMessage.includes("❌") ? "error" : "success"}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
}

function PaymentForm({
  selectedPrice,
  onClose,
  onBoostSuccess,
}: {
  selectedPrice: number;
  onClose: () => void;
  onBoostSuccess?: (boostData: any) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/boost/success`,
        },
      });

      if (error) {
        console.error("Payment error:", error);
        alert("Payment failed. Please try again.");
      } else {
        onClose();
        onBoostSuccess?.({}); // Call success callback
        alert("Boost activated successfully!");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className={styles.paymentForm}>
      <PaymentElement />
      <RGBButton
        type="submit"
        variant="primary"
        disabled={loading || !stripe || !elements}
        className={styles.payButton}>
        {loading ? "Processing..." : `Pay $${selectedPrice}`}
      </RGBButton>
    </form>
  );
}

export function BoostModal({
  isOpen,
  onClose,
  type = "POST_BOOST",
  targetId,
  targetName,
  postId,
  onBoostSuccess,
}: BoostModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = "";
    }

    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <GlowCard className={styles.modal} glowColor="primary">
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close boost modal"
          title="Close boost modal">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true">
            <path
              d="M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <BoostForm
          type={type}
          targetId={targetId || postId}
          targetName={targetName}
          postId={postId}
          onClose={onClose}
          onBoostSuccess={onBoostSuccess}
        />
      </GlowCard>
    </div>
  );

  // Render modal in a portal to ensure it's at the document body level
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
