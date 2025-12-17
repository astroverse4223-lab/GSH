"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import { useTheme } from "./ThemeProvider";
import { useEnhancedXP } from "@/hooks/useEnhancedXP";
import { useXPNotifications } from "@/hooks/useXPNotifications";
import { CommentCard } from "./CommentCard";
import { ProfilePicture } from "./ui/ProfilePicture";
import RGBButton from "./ui/RGBButton";
import RGBLink from "./ui/RGBLink";
import { BoostModal } from "./BoostModal";
import { EditPostModal } from "./EditPostModal";
import { ReportModal } from "./ReportModal";
import { Toast } from "./ui/Toast";
import styles from "./PostCard.module.css";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    image: string;
  };
  parentId?: string | null;
  replies?: Comment[];
  userReaction?: "🔥" | "🎮" | "💀" | "😂" | null;
  reactionCounts?: {
    "🔥": number;
    "🎮": number;
    "💀": number;
    "😂": number;
  };
  _count: {
    replies: number;
  };
}

interface PostProps {
  post: {
    id: string;
    content: string;
    image?: string;
    video?: string;
    createdAt: Date;
    updatedAt?: Date;
    isBoasted?: boolean;
    boostExpiresAt?: string | null;
    user: {
      id: string;
      name: string;
      image: string;
    };
    _count: {
      comments: number;
    };
    userReaction?: "🔥" | "🎮" | "💀" | "😂" | null;
    reactionCounts?: {
      "🔥": number;
      "🎮": number;
      "💀": number;
      "😂": number;
    };
    comments?: Comment[];
  };
  currentUser?: {
    id: string;
    email?: string | null;
  };
  onPostDelete?: (postId: string) => void;
  onPostUpdate?: (updatedPost: any) => void;
  onPostHide?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUser,
  onPostDelete,
  onPostUpdate,
  onPostHide,
}: PostProps) {
  const { currentTheme } = useTheme();
  const { data: session } = useSession();
  const { autoAwardXP } = useEnhancedXP();
  const { awardReactionXP, awardCommentXP } = useXPNotifications();
  const [currentPost, setCurrentPost] = useState(post);
  const [userReaction, setUserReaction] = useState<
    "🔥" | "🎮" | "💀" | "😂" | null
  >(post.userReaction || null);
  const [reactionCounts, setReactionCounts] = useState<{
    "🔥": number;
    "🎮": number;
    "💀": number;
    "😂": number;
  }>(
    post.reactionCounts || {
      "🔥": 0,
      "🎮": 0,
      "💀": 0,
      "😂": 0,
    }
  );
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  // Sync currentPost state when post prop changes
  useEffect(() => {
    setCurrentPost(post);
    setUserReaction(post.userReaction || null);
    setReactionCounts(
      post.reactionCounts || {
        "🔥": 0,
        "🎮": 0,
        "💀": 0,
        "😂": 0,
      }
    );
  }, [
    post.id,
    post.isBoasted,
    post.boostExpiresAt,
    post.userReaction,
    post.reactionCounts,
  ]);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info"
  );

  // Delete comment confirmation state
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<
    string | null
  >(null);

  // Helper function to show toast notifications
  const showToastNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Handle actual comment deletion
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/posts/${post.id}/comment/${commentId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
        showToastNotification("✅ Comment deleted successfully!", "success");
      } else {
        showToastNotification(
          "❌ Failed to delete comment. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      showToastNotification(
        "❌ Failed to delete comment. Please try again.",
        "error"
      );
    } finally {
      setPendingDeleteCommentId(null);
    }
  };

  // Fetch fresh reaction counts
  const fetchReactionCounts = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/reaction-counts`);
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
  }, [session?.user?.id, post.id]);

  const handleReaction = async (emoji: "🔥" | "🎮" | "💀" | "😂") => {
    if (!session?.user?.id) return;

    try {
      const method = userReaction === emoji ? "DELETE" : "POST";
      const response = await fetch(`/api/posts/${post.id}/reaction`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserReaction(data.userReaction);
        setReactionCounts(data.reactionCounts);

        // Award XP for giving a reaction (only when adding, not removing)
        if (method === "POST") {
          await awardReactionXP();
        }

        // Update parent component with new reaction data
        if (onPostUpdate) {
          const updatedPost = {
            ...currentPost,
            userReaction: data.userReaction,
            reactionCounts: data.reactionCounts,
          };
          setCurrentPost(updatedPost);
          onPostUpdate(updatedPost);
        }
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      const response = await fetch(`/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: commentContent }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([...comments, newComment]);
        setCommentContent("");
        setIsCommenting(false);

        // Award XP for adding a comment
        await awardCommentXP();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handlePostUpdate = (updatedPost: any) => {
    setCurrentPost(updatedPost);
    if (onPostUpdate) {
      onPostUpdate(updatedPost);
    }
  };

  const handleBlockUser = async () => {
    if (!session?.user?.id || !currentPost.user.id) {
      showToastNotification("Please log in to block users", "error");
      return;
    }

    if (currentPost.user.id === session.user.id) {
      showToastNotification("You cannot block yourself", "error");
      return;
    }

    setIsBlocking(true);

    try {
      const response = await fetch("/api/privacy/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentPost.user.id,
          reason: "Blocked from post",
        }),
      });
      if (response.ok) {
        showToastNotification(
          `Blocked ${currentPost.user.name || "user"} successfully`,
          "success"
        );
        // Hide this post from the current user's view
        if (onPostHide) {
          onPostHide(currentPost.id);
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      showToastNotification("Failed to block user. Please try again.", "error");
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <div className={styles.postCard}>
      <div className={styles.userInfo}>
        <ProfilePicture
          src={post.user.image}
          alt={post.user.name}
          size="md"
          userId={post.user.id}
          userName={post.user.name}
        />
        <div>
          <h3 className={styles.userName}>
            <Link
              href={
                currentUser?.id === post.user.id
                  ? "/profile"
                  : `/users/${post.user.id}`
              }
              className={styles.userNameLink}>
              {post.user.name}
            </Link>
            {currentPost.isBoasted && (
              <span
                className={styles.boostIndicator}
                title="This post is boosted and appears at the top of feeds">
                🚀 Boosted
              </span>
            )}
          </h3>
          <p className={styles.timestamp}>
            {formatDistanceToNow(new Date(post.createdAt))} ago
            {currentPost.updatedAt &&
              new Date(currentPost.updatedAt).getTime() >
                new Date(currentPost.createdAt || 0).getTime() && (
                <span className={styles.editedIndicator}> • edited</span>
              )}
            {currentPost.isBoasted && currentPost.boostExpiresAt && (
              <span className={styles.boostExpiry}>
                • Boost expires{" "}
                {formatDistanceToNow(new Date(currentPost.boostExpiresAt))} from
                now
              </span>
            )}
          </p>
        </div>
        {currentUser?.id === post.user.id && (
          <div className="ml-auto flex items-center gap-2">
            {showDeleteConfirm ? (
              <>
                <span className={styles.timestamp}>Delete this post?</span>
                <RGBButton
                  variant="accent"
                  size="sm"
                  onClick={async () => {
                    try {
                      if (onPostDelete) {
                        await onPostDelete(post.id);
                      }
                    } catch (error) {
                      console.error("Error deleting post:", error);
                    } finally {
                      setShowDeleteConfirm(false);
                    }
                  }}>
                  Yes
                </RGBButton>
                <RGBButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}>
                  No
                </RGBButton>
              </>
            ) : (
              <>
                <RGBButton
                  variant="primary"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                  title="Edit post">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.379-8.379-2.828-2.828z" />
                  </svg>
                </RGBButton>
                <RGBButton
                  variant="accent"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete post">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </RGBButton>
              </>
            )}
          </div>
        )}

        {/* Block and Report buttons for other users' posts */}
        {currentUser?.id && currentUser.id !== post.user.id && (
          <div className="ml-auto flex items-center gap-2">
            <RGBButton
              variant="accent"
              size="sm"
              onClick={() => setShowReportModal(true)}
              title="Report this post">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                  clipRule="evenodd"
                />
              </svg>
            </RGBButton>
            <RGBButton
              variant="ghost"
              size="sm"
              onClick={handleBlockUser}
              disabled={isBlocking}
              title="Block user">
              {isBlocking ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="opacity-25"
                  />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    className="opacity-75"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 008.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </RGBButton>
          </div>
        )}
      </div>

      <p className={styles.postContent}>{currentPost.content}</p>

      {currentPost.image && (
        <div className={styles.mediaContainer}>
          <Image
            src={currentPost.image}
            alt="Post image"
            width={800}
            height={450}
            className={styles.postImage}
            priority
            loading="eager"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 640px, 800px"
          />
        </div>
      )}

      {currentPost.video && (
        <div className={styles.mediaContainer}>
          <video
            src={currentPost.video}
            controls
            className={styles.postVideo}
            poster={currentPost.image}
            onError={(e) => {
              console.error("Video loading error for URL:", currentPost.video);
              console.error("Error event:", e);
            }}
            onLoadStart={() => {
              console.log("Video loading started for URL:", currentPost.video);
            }}
            onLoadedMetadata={() => {
              console.log(
                "Video metadata loaded successfully for:",
                currentPost.video
              );
            }}
            onCanPlay={() => {
              console.log("Video can play:", currentPost.video);
            }}
          />
          <div className={styles.mediaOverlay} />
        </div>
      )}

      <div className={styles.actions}>
        <RGBButton
          variant="ghost"
          size="md"
          onClick={() => setIsCommenting(!isCommenting)}
          className="flex items-center gap-2">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                clipRule="evenodd"
              />
            </svg>
            {isCommenting && (
              <div className="absolute -inset-1 bg-purple-400/20 rounded-full blur-sm" />
            )}
          </div>
          <span className="font-medium">{post._count.comments}</span>
        </RGBButton>

        {/* Boost Button - now works with both free and paid boosts */}
        {session?.user?.id && (
          <RGBButton
            variant="ghost"
            size="md"
            onClick={() => setShowBoostModal(true)}
            className="flex items-center gap-2"
            title="Boost this post">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <div className="absolute -inset-1 bg-yellow-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-medium">Boost</span>
          </RGBButton>
        )}

        <div className={styles.reactionsContainer}>
          {(["🔥", "🎮", "💀", "😂"] as const).map((reaction) => (
            <RGBButton
              key={reaction}
              variant={userReaction === reaction ? "primary" : "ghost"}
              size="sm"
              onClick={() => handleReaction(reaction)}
              className="flex items-center gap-1">
              {reaction}
              {reactionCounts[reaction] > 0 && (
                <span className={styles.reactionCount}>
                  {reactionCounts[reaction]}
                </span>
              )}
            </RGBButton>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      {(isCommenting || comments.length > 0) && (
        <div className={styles.commentSection}>
          {isCommenting && (
            <form onSubmit={handleComment} className={styles.commentForm}>
              <div className="relative">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  className={styles.commentInput}
                  rows={2}
                />
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </div>
              <div className={`flex justify-end space-x-3 mt-3`}>
                <RGBButton
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setIsCommenting(false)}>
                  Cancel
                </RGBButton>
                <RGBButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!commentContent.trim()}>
                  Comment
                </RGBButton>
              </div>
            </form>
          )}

          <div className="space-y-6">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex space-x-4 ${
                  comment.parentId ? "ml-8" : ""
                } group`}>
                <CommentCard
                  comment={comment}
                  postId={post.id}
                  onReply={(userName: string) => {
                    setCommentContent(`@${userName} `);
                    setIsCommenting(true);
                  }}
                  onDelete={async (commentId: string) => {
                    // Set pending delete comment ID for confirmation
                    setPendingDeleteCommentId(commentId);
                  }}
                  currentUserId={currentUser?.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boost Modal */}
      {showBoostModal && (
        <BoostModal
          isOpen={showBoostModal}
          onClose={() => setShowBoostModal(false)}
          postId={post.id}
          onBoostSuccess={(boostData) => {
            console.log("Post boosted successfully:", boostData);

            // Update the current post state to show boost indicator immediately
            setCurrentPost((prev) => ({
              ...prev,
              isBoasted: true,
              boostExpiresAt:
                boostData.expiresAt ||
                new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }));

            // Call the parent's onPostUpdate if available
            if (onPostUpdate) {
              onPostUpdate({
                ...currentPost,
                isBoasted: true,
                boostExpiresAt:
                  boostData.expiresAt ||
                  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              });
            }

            setShowBoostModal(false);
          }}
        />
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          post={currentPost}
          onPostUpdate={handlePostUpdate}
        />
      )}

      {/* Delete Comment Confirmation Dialog */}
      {pendingDeleteCommentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Delete Comment?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setPendingDeleteCommentId(null)}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={() =>
                  pendingDeleteCommentId &&
                  handleDeleteComment(pendingDeleteCommentId)
                }
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="POST"
        targetId={currentPost.id}
        targetName={`${currentPost.user.name || "Unknown user"}'s post`}
      />
    </div>
  );
}
