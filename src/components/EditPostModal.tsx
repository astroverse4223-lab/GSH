"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { GlowCard } from "@/components/ui/GlowCard";
import RGBButton from "@/components/ui/RGBButton";
import styles from "./EditPostModal.module.css";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    content: string;
    image?: string;
    video?: string;
  };
  onPostUpdate: (updatedPost: any) => void;
}

export function EditPostModal({
  isOpen,
  onClose,
  post,
  onPostUpdate,
}: EditPostModalProps) {
  const [content, setContent] = useState(post.content);
  const [image, setImage] = useState(post.image || "");
  const [video, setVideo] = useState(post.video || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert("Post content cannot be empty");
      return;
    }

    if (content.length > 2000) {
      alert("Post content too long (max 2000 characters)");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          image: image.trim() || null,
          video: video.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update post");
      }

      const updatedPost = await response.json();
      onPostUpdate(updatedPost);
      onClose();
    } catch (error) {
      console.error("Error updating post:", error);
      alert(error instanceof Error ? error.message : "Failed to update post");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <GlowCard className={styles.modal} glowColor="primary">
        <div className={styles.header}>
          <h3>Edit Post</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Close edit modal"
            aria-label="Close edit modal">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
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
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className={styles.textarea}
              rows={4}
              maxLength={2000}
              required
            />
            <div className={styles.charCount}>
              {content.length}/2000 characters
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="image">Image URL (optional)</label>
            <input
              type="url"
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="video">Video URL (optional)</label>
            <input
              type="url"
              id="video"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className={styles.input}
            />
          </div>

          <div className={styles.actions}>
            <RGBButton
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}>
              Cancel
            </RGBButton>
            <RGBButton
              type="submit"
              variant="primary"
              disabled={loading || !content.trim()}>
              {loading ? "Updating..." : "Update Post"}
            </RGBButton>
          </div>
        </form>
      </GlowCard>
    </div>
  );

  // Render modal in a portal to ensure it's at the document body level
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
