"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { GlowCard } from "@/components/ui/GlowCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { PostCard } from "@/components/PostCard";
import { Toast } from "@/components/ui/Toast";
import Image from "next/image";
import { useParams } from "next/navigation";
import { uploadMedia } from "@/lib/uploadMedia";
import { UploadProgress } from "@/components/ui/UploadProgress";
import { getUserImageWithFallback } from "@/lib/fallback-images";

type Group = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  members: {
    role: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    image: string;
  };
  _count: {
    likes: number;
  };
}

type Post = {
  id: string;
  content: string;
  image?: string;
  video?: string;
  createdAt: Date;
  isBoasted?: boolean;
  boostExpiresAt?: string | null;
  user: {
    id: string;
    name: string;
    image: string;
  };
  _count: {
    reactions: number;
    comments: number;
  };
  userReaction?: "🔥" | "🎮" | "💀" | "😂" | null;
  reactionCounts?: {
    "🔥": number;
    "🎮": number;
    "💀": number;
    "😂": number;
  };
};

import styles from "./group.module.css";

export default function GroupPage() {
  const { data: session } = useSession();
  const params = useParams();
  const groupId = params?.groupId as string;

  if (!groupId) {
    return null;
  }

  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [newPost, setNewPost] = useState({ content: "", image: "" });
  const [isJoining, setIsJoining] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("info");

  // Helper function to show toast notifications
  const showToastNotification = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  useEffect(() => {
    if (session?.user) {
      fetchGroupDetails();
      fetchGroupPosts();
    }
  }, [groupId, session]);

  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) throw new Error("Failed to fetch group");
      const data = await response.json();
      setGroup(data);
      // Check if user is owner or member
      const isOwner = data.owner.id === session?.user?.id;
      const isMemberCheck = data.members.some(
        (m: any) => m.user.id === session?.user?.id
      );
      setIsMember(isOwner || isMemberCheck);
    } catch (error) {
      console.error("Error fetching group:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupPosts = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/posts`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      const formattedPosts = data.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt),
        isBoasted: post.isBoasted || false,
        boostExpiresAt: post.boostExpiresAt || null,
        user: {
          ...post.user,
          name: post.user.name || "Anonymous",
          image: post.user.image || "/images/default-avatar.png",
        },
        reactionCounts: post.reactionCounts || {
          "🔥": 0,
          "🎮": 0,
          "💀": 0,
          "😂": 0,
        },
        userReaction: post.userReaction || null,
      }));
      setPosts(formattedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleJoinGroup = async () => {
    if (!session?.user) return;
    try {
      setIsJoining(true);
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 403) {
          // Subscription limit reached
          const errorData = await response.json();
          showToastNotification(
            `🚫 ${errorData.error} Upgrade your subscription to join more groups!`,
            "warning"
          );
          return;
        }
        throw new Error("Failed to join group");
      }

      await fetchGroupDetails();
      showToastNotification("🎉 Successfully joined the group!", "success");
    } catch (error) {
      console.error("Error joining group:", error);
      showToastNotification(
        "❌ Failed to join group. Please try again.",
        "error"
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !isMember) return;

    try {
      let imageUrl = newPost.image;

      if (selectedImage) {
        setIsUploading(true);
        try {
          imageUrl = await uploadMedia(selectedImage, (progress) => {
            setUploadProgress(progress.progress);
          });
          setUploadProgress(100);
        } catch (error) {
          console.error("Error uploading image:", error);
          showToastNotification(
            "❌ Failed to upload image. Please try again.",
            "error"
          );
          return;
        }
      }

      const response = await fetch(`/api/groups/${groupId}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newPost.content,
          image: imageUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to create post");

      const createdPost = await response.json();
      setPosts((prev) => [createdPost, ...prev]);
      setNewPost({ content: "", image: "" });
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      showToastNotification("🎉 Post created successfully!", "success");
    } catch (error) {
      console.error("Error creating post:", error);
      showToastNotification(
        "❌ Failed to create post. Please try again.",
        "error"
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      // If successful, remove the post from state
      if (response.status === 204) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        return;
      }

      // Handle specific error cases
      if (response.status === 404) {
        // Post already deleted - remove from state
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        return;
      }

      // For other errors, get the error message from the response
      const errorText = await response.text();
      throw new Error(errorText || "Failed to delete post");
    } catch (error) {
      console.error("Error deleting post:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete post. Please try again.";
      showToastNotification(`❌ ${message}`, "error");

      // Only refresh posts if there was an actual error (not a 404)
      if (
        !(error instanceof Error && error.message.includes("already deleted"))
      ) {
        await fetchGroupPosts();
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!group) {
    return <div>Group not found</div>;
  }

  return (
    <div className={styles.groupPage}>
      <div className={styles.groupContent}>
        {/* Banner */}
        <div className={styles.banner}>
          <Image
            src={group.image || "https://picsum.photos/seed/default/1200/300"}
            alt={group.name}
            fill
            className={styles.bannerImage}
            priority
          />
        </div>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.groupInfo}>
            <h1 className={styles.groupName}>{group.name}</h1>
            <p className={styles.groupDescription}>{group.description}</p>
            <div className={styles.groupMeta}>
              <div className={styles.metaItem}>
                <div className="relative w-8 h-8">
                  <Image
                    src={getUserImageWithFallback(group.owner)}
                    alt={group.owner.name || "Owner"}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <span>Created by {group.owner.name || "Anonymous"}</span>
              </div>
              <div className={styles.metaItem}>
                <svg
                  className={styles.metaIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{group.members.length} members</span>
              </div>
            </div>
          </div>
          {!isMember && (
            <button
              onClick={handleJoinGroup}
              disabled={isJoining}
              className={styles.joinButton}>
              {isJoining ? "Joining..." : "Join Group"}
            </button>
          )}
        </div>

        {/* Content Grid */}
        <div className={styles.contentGrid}>
          {/* Posts Section */}
          <div className={styles.postsSection}>
            {isMember && (
              <div className={styles.postComposer}>
                <form onSubmit={handleCreatePost}>
                  <textarea
                    value={newPost.content}
                    onChange={(e) =>
                      setNewPost({ ...newPost, content: e.target.value })
                    }
                    placeholder="Share something with the group..."
                    className={styles.textarea}
                  />
                  <div className={styles.postActions}>
                    <div className={styles.imageUploadContainer}>
                      <label htmlFor="imageUpload" className="sr-only">
                        Upload Image
                      </label>
                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedImage(file);
                          }
                        }}
                        ref={fileInputRef}
                        className="hidden"
                        aria-label="Upload Image"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={styles.actionButton}>
                        {selectedImage ? selectedImage.name : "Add Image"}
                      </button>
                      {selectedImage && !isUploading && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className={styles.removeImageButton}>
                          ✕
                        </button>
                      )}
                    </div>
                    {isUploading && (
                      <div className={styles.uploadProgress}>
                        <UploadProgress
                          progress={uploadProgress}
                          fileName={selectedImage?.name || ""}
                        />
                      </div>
                    )}
                    <button
                      type="submit"
                      className={styles.postButton}
                      disabled={
                        isUploading ||
                        (!newPost.content.trim() && !selectedImage)
                      }>
                      {isUploading ? "Uploading..." : "Post"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No posts yet.{" "}
                {isMember ? "Be the first to post!" : "Join to start posting!"}
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={
                    session?.user ? { id: session.user.id } : undefined
                  }
                  onPostDelete={handleDeletePost}
                  onPostHide={(postId: string) => {
                    setPosts(posts.filter((p) => p.id !== postId));
                  }}
                />
              ))
            )}
          </div>

          {/* Members Section */}
          <div className={styles.membersSection}>
            <div className={styles.membersList}>
              <h2 className="text-xl font-bold text-neon-primary mb-4">
                Members
              </h2>
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div key={member.user.id} className={styles.memberCard}>
                    <div className={styles.memberImage}>
                      <Image
                        src={getUserImageWithFallback(member.user)}
                        alt={member.user.name || "Member"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className={styles.memberInfo}>
                      <p className={styles.memberName}>
                        {member.user.name || "Anonymous"}
                      </p>
                      <p className={styles.memberRole}>{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
    </div>
  );
}
