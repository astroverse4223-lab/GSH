import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import styles from "./CommentCard.module.css";
import RGBButton from "./ui/RGBButton";
import RGBLink from "./ui/RGBLink";
import { getUserImageWithFallback } from "@/lib/fallback-images";

interface CommentCardProps {
  comment: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      image: string;
    };
    userReaction?: "🔥" | "🎮" | "💀" | "😂" | null;
    reactionCounts?: {
      "🔥": number;
      "🎮": number;
      "💀": number;
      "😂": number;
    };
  };
  postId: string;
  onReply: (userName: string) => void;
  onDelete?: (commentId: string) => void;
  currentUserId?: string;
}

export function CommentCard({
  comment,
  postId,
  onReply,
  onDelete,
  currentUserId,
}: CommentCardProps) {
  const { data: session } = useSession();
  const [userReaction, setUserReaction] = useState<
    "🔥" | "🎮" | "💀" | "😂" | null
  >(comment.userReaction || null);
  const [reactionCounts, setReactionCounts] = useState<{
    "🔥": number;
    "🎮": number;
    "💀": number;
    "😂": number;
  }>(
    comment.reactionCounts || {
      "🔥": 0,
      "🎮": 0,
      "💀": 0,
      "😂": 0,
    }
  );

  // Fetch fresh reaction counts
  const fetchReactionCounts = async () => {
    try {
      const response = await fetch(
        `/api/posts/${postId}/comment/${comment.id}/reaction-counts`
      );
      if (response.ok) {
        const data = await response.json();
        setReactionCounts(data.reactionCounts);
        setUserReaction(data.userReaction);
      }
    } catch (error) {
      console.error("Error fetching reaction counts:", error);
    }
  };

  // Fetch fresh counts on mount and when session changes
  useEffect(() => {
    fetchReactionCounts();
  }, [session?.user?.id, comment.id]);

  // Sync state when comment prop changes
  useEffect(() => {
    setUserReaction(comment.userReaction || null);
    setReactionCounts(
      comment.reactionCounts || {
        "🔥": 0,
        "🎮": 0,
        "💀": 0,
        "😂": 0,
      }
    );
  }, [comment.userReaction, comment.reactionCounts]);

  const handleReaction = async (emoji: "🔥" | "🎮" | "💀" | "😂") => {
    if (!session?.user?.id) return;

    try {
      const method = userReaction === emoji ? "DELETE" : "POST";
      const response = await fetch(
        `/api/posts/${postId}/comment/${comment.id}/reaction`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emoji }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserReaction(data.userReaction);
        setReactionCounts(data.reactionCounts);
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  return (
    <div className={styles.commentCard}>
      <div className={styles.commentHeader}>
        <Image
          src={getUserImageWithFallback(comment.user)}
          alt={comment.user.name}
          width={40}
          height={40}
          className={styles.userImage}
        />
        <div className={styles.userInfo}>
          <div className={styles.userName}>{comment.user.name}</div>
          <div className={styles.timestamp}>
            {formatDistanceToNow(new Date(comment.createdAt))} ago
          </div>
        </div>
      </div>

      <div className={styles.commentContent}>{comment.content}</div>

      <div className={styles.actions}>
        <div className={styles.reactionsContainer}>
          {["🔥", "🎮", "💀", "😂"].map((emoji) => (
            <RGBButton
              key={emoji}
              variant={userReaction === emoji ? "primary" : "ghost"}
              size="sm"
              onClick={() => handleReaction(emoji as "🔥" | "🎮" | "💀" | "😂")}
              className="flex items-center gap-1">
              {emoji}
              {reactionCounts[emoji as keyof typeof reactionCounts] > 0 && (
                <span className={styles.reactionCount}>
                  {reactionCounts[emoji as keyof typeof reactionCounts]}
                </span>
              )}
            </RGBButton>
          ))}
        </div>
        <RGBButton
          variant="ghost"
          size="sm"
          onClick={() => onReply(comment.user.name)}
          className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Reply
        </RGBButton>
        {currentUserId === comment.user.id && onDelete && (
          <RGBButton
            variant="accent"
            size="sm"
            onClick={() => onDelete(comment.id)}>
            Delete
          </RGBButton>
        )}
      </div>
    </div>
  );
}
