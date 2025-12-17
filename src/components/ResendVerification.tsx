import React, { useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./ResendVerification.module.css";

interface ResendVerificationProps {
  className?: string;
  email?: string;
}

export default function ResendVerification({
  className = "",
  email,
}: ResendVerificationProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userEmail = email || session?.user?.email;

  const handleResendVerification = async () => {
    if (!userEmail) {
      setError("No email address found");
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Verification email sent successfully! Please check your inbox."
        );
      } else {
        setError(data.error || "Failed to send verification email");
      }
    } catch (err) {
      console.error("Error resending verification:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userEmail) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.content}>
        <div className={styles.icon}>📧</div>
        <h3 className={styles.title}>Email Verification</h3>
        <p className={styles.description}>
          Please verify your email address to access all features.
        </p>
        <p className={styles.email}>
          Sending to: <strong>{userEmail}</strong>
        </p>

        {message && (
          <div className={styles.success}>
            <span className={styles.successIcon}>✅</span>
            {message}
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>❌</span>
            {error}
          </div>
        )}

        <button
          onClick={handleResendVerification}
          disabled={isLoading}
          className={styles.resendButton}>
          {isLoading ? (
            <>
              <span className={styles.spinner}></span>
              Sending...
            </>
          ) : (
            "Resend Verification Email"
          )}
        </button>

        <p className={styles.helpText}>
          Didn't receive the email? Check your spam folder or try resending.
        </p>
      </div>
    </div>
  );
}
