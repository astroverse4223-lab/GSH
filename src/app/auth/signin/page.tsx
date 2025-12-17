"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import styles from "./signin.module.css";

function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResendVerification, setIsResendVerification] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isResendVerification) {
      try {
        const res = await fetch("/api/auth/resend-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (res.ok) {
          setSuccess(data.message);
          setEmail("");
        } else {
          setError(data.message || "Failed to send verification email");
        }
      } catch (error) {
        setError("Failed to send verification email. Please try again.");
      }
      return;
    }

    if (isForgotPassword) {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (res.ok) {
          setSuccess(data.message);
          setEmail("");
        } else {
          setError(data.message || "Failed to send reset email");
        }
      } catch (error) {
        setError("Failed to send reset email. Please try again.");
      }
      return;
    }

    if (isSignUp) {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: name, email, password }),
        });

        const data = await res.json();

        if (res.ok) {
          setSuccess(data.message);
          setEmail("");
          setPassword("");
          setName("");
          setIsSignUp(false);
        } else {
          setError(data.message || "Failed to sign up");
        }
      } catch (error) {
        setError("Failed to sign up. Please try again.");
      }
    } else {
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (!result) {
          setError("Failed to sign in. Please try again.");
        } else if (result.error) {
          setError(
            typeof result.error === "string"
              ? result.error
              : "Invalid credentials"
          );
        } else {
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Sign in error:", error);
        setError("An error occurred during sign in. Please try again.");
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div className={styles.logoContainer}>
          <img
            src="/images/shieldLogo.png"
            alt="Gaming Logo"
            className={styles.logo}
          />
          <h1 className={styles.title}>GSH</h1>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {isSignUp && !isForgotPassword && !isResendVerification && (
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                placeholder="Enter your name"
                required
              />
            </div>
          )}
          <div className={styles.inputGroup}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="Enter your email"
              required
            />
          </div>

          {!isForgotPassword && !isResendVerification && (
            <div className={styles.inputGroup}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Enter your password"
                required
              />
            </div>
          )}

          <button type="submit" className={styles.submitButton}>
            {isResendVerification
              ? "Send Verification Email"
              : isForgotPassword
              ? "Send Reset Link"
              : isSignUp
              ? "Sign Up"
              : "Sign In"}
          </button>
        </form>

        <div className={styles.footer}>
          {!isForgotPassword && !isResendVerification ? (
            <>
              <p className={styles.footerText}>
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setSuccess("");
                  }}
                  className={styles.linkButton}>
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>

              {!isSignUp && (
                <>
                  <p className={styles.footerText}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError("");
                        setSuccess("");
                      }}
                      className={styles.linkButton}>
                      Forgot your password?
                    </button>
                  </p>
                  <p className={styles.footerText}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResendVerification(true);
                        setError("");
                        setSuccess("");
                      }}
                      className={styles.linkButton}>
                      Didn't receive verification email?
                    </button>
                  </p>
                </>
              )}
            </>
          ) : (
            <p className={styles.footerText}>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsResendVerification(false);
                  setError("");
                  setSuccess("");
                }}
                className={styles.linkButton}>
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignIn;
