"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { NeonButton } from "./ui/NeonButton";
import { Toast } from "./ui/Toast";
import styles from "./ReportModal.module.css";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "USER" | "POST" | "COMMENT" | "LISTING";
  targetId: string;
  targetName: string; // For display purposes
}

export function ReportModal({
  isOpen,
  onClose,
  type,
  targetId,
  targetName,
}: ReportModalProps) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = [
    { value: "SPAM", label: "Spam" },
    { value: "HARASSMENT", label: "Harassment or Bullying" },
    { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content" },
    { value: "SCAM", label: "Scam or Fraud" },
    { value: "OTHER", label: "Other" },
  ];

  const showToastNotification = (
    message: string,
    type: "success" | "error"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !description.trim()) {
      showToastNotification(
        "Please select a category and provide a description",
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData: any = {
        type,
        category,
        description: description.trim(),
      };

      // Add the appropriate ID based on type
      switch (type) {
        case "USER":
          reportData.reportedUserId = targetId;
          break;
        case "POST":
          reportData.reportedPostId = targetId;
          break;
        case "COMMENT":
          reportData.reportedCommentId = targetId;
          break;
        case "LISTING":
          reportData.reportedListingId = targetId;
          break;
      }

      const response = await fetch("/api/privacy/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        showToastNotification(
          "Report submitted successfully. We'll review it shortly.",
          "success"
        );
        setCategory("");
        setDescription("");
        setTimeout(() => onClose(), 2000);
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      showToastNotification(
        "Failed to submit report. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Report {type.toLowerCase()}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              Reporting: <strong>{targetName}</strong>
            </label>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.select}
              required
              disabled={isSubmitting}
              title="Select report category">
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              rows={4}
              placeholder="Please provide details about why you're reporting this..."
              required
              disabled={isSubmitting}
              maxLength={500}
            />
            <div className={styles.charCount}>
              {description.length}/500 characters
            </div>
          </div>

          <div className={styles.actions}>
            <NeonButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}>
              Cancel
            </NeonButton>
            <NeonButton
              type="submit"
              variant="primary"
              disabled={isSubmitting || !category || !description.trim()}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </NeonButton>
          </div>
        </form>

        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
