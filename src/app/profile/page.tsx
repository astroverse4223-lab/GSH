"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { GlowCard } from "@/components/ui/GlowCard";
import { PostCard } from "@/components/PostCard";
import { FollowerStats } from "@/components/FollowerStats";
import { ProfileMusicPlayer } from "@/components/ProfileMusicPlayer";
import XPCard from "@/components/XPCard";
import XPGuideModal from "@/components/XPGuideModal";
import { NotificationSettings } from "@/components/NotificationSettings";
import Image from "next/image";
import { redirect, useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import styles from "./profile.module.css";
import RGBButton from "@/components/ui/RGBButton";

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { currentTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingMusic, setIsEditingMusic] = useState(false);
  const [isXPGuideOpen, setIsXPGuideOpen] = useState(false);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");

  // Initialize and track session data
  useEffect(() => {
    if (session?.user) {
      setMusicUrl(session.user.musicUrl || null);
    }
  }, [session?.user?.musicUrl]);
  const [uploadingStates, setUploadingStates] = useState({
    profile: false,
    banner: false,
    wallpaper: false,
  });
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [localProfileImage, setLocalProfileImage] = useState<string | null>(
    null
  );
  const [localBannerImage, setLocalBannerImage] = useState<string | null>(null);
  const [localWallpaper, setLocalWallpaper] = useState<string | null>(null);
  const [localBio, setLocalBio] = useState<string | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [followCounts, setFollowCounts] = useState({
    followers: 0,
    following: 0,
  });

  // Keep track of current wallpaper
  const [currentWallpaper, setCurrentWallpaper] = useState<string | null>(null);

  // Initialize and sync wallpaper from session and database
  useEffect(() => {
    const initializeWallpaper = async () => {
      if (session?.user?.id) {
        try {
          // First try to get from session
          if (session.user.wallpaper) {
            setCurrentWallpaper(session.user.wallpaper);
            setLocalWallpaper(session.user.wallpaper);
          }

          // Then fetch from database to ensure we have the latest
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const userData = await response.json();
            if (userData.wallpaper) {
              setCurrentWallpaper(userData.wallpaper);
              setLocalWallpaper(userData.wallpaper);

              // Update session if it's out of sync
              if (userData.wallpaper !== session.user.wallpaper) {
                await updateSession({
                  user: {
                    ...session.user,
                    wallpaper: userData.wallpaper,
                  },
                });
              }
            }
          }
        } catch (error) {
          console.error("Error fetching wallpaper:", error);
        }
      }
    };

    initializeWallpaper();
  }, [session?.user?.id]);

  // Update current wallpaper when local changes
  useEffect(() => {
    if (localWallpaper) {
      setCurrentWallpaper(localWallpaper);
    }
  }, [localWallpaper]);

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.id) {
        try {
          const [userResponse, followResponse] = await Promise.all([
            fetch(`/api/users/${session.user.id}`),
            fetch(`/api/follow?userId=${session.user.id}`),
          ]);

          if (userResponse.ok) {
            const userData = await userResponse.json();
            setFriendCount(userData._count?.friends || 0);
          }

          if (followResponse.ok) {
            const followData = await followResponse.json();
            setFollowCounts({
              followers: followData.followers,
              following: followData.following,
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchData();
  }, [session?.user?.id, refreshKey]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (session?.user?.id) {
        setLoadingPosts(true);
        try {
          const response = await fetch(`/api/users/${session.user.id}/posts`);
          if (response.ok) {
            const data = await response.json();
            setPosts(data);
          } else {
            console.error("Failed to fetch posts");
          }
        } catch (error) {
          console.error("Error fetching posts:", error);
        } finally {
          setLoadingPosts(false);
        }
      }
    };
    fetchPosts();
  }, [session?.user?.id, refreshKey]);

  useEffect(() => {
    if (session?.user) {
      setBio(session.user.bio || "");
      setLocalBio(session.user.bio || null);
      setLocalProfileImage(session.user.image || null);
      setLocalBannerImage(session.user.bannerImage || null);
      setLocalWallpaper(session.user.wallpaper || null);
    }
  }, [session?.user]);

  const handleBioUpdate = async () => {
    try {
      setLocalBio(bio.trim());
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bio.trim() }),
      });

      if (!response.ok) throw new Error("Failed to update bio");

      setIsEditing(false);
      await updateSession({ user: { ...session?.user, bio: bio.trim() } });
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.refresh();
    } catch (error) {
      console.error("Error updating bio:", error);
      alert("Failed to update bio. Please try again.");
    }
  };

  const handleMusicUpdate = async (url: string) => {
    try {
      const response = await fetch("/api/profile/music", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicUrl: url }),
      });

      if (!response.ok) throw new Error("Failed to update music");

      const updatedUser = await response.json();
      console.log("Music Update Response:", updatedUser);

      // Update local state immediately
      setMusicUrl(url);

      // Update session
      await updateSession({
        user: { ...session?.user, musicUrl: url },
      });
      console.log("Updated Session:", { musicUrl: url });

      setIsEditingMusic(false);
      toast.success("Music updated successfully!");
    } catch (error) {
      console.error("Error updating music:", error);
      toast.error("Failed to update music. Please try again.");
    }
  };

  type ImageType = "profile" | "banner" | "wallpaper";

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: ImageType
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingStates((prev) => ({ ...prev, [type]: true }));
    console.log("Starting upload for type:", type);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Upload failed");

      const { url } = await uploadResponse.json();
      if (!url) throw new Error("No URL returned from upload");

      // Set local state immediately for instant visual feedback
      if (type === "profile") {
        setLocalProfileImage(url);
      } else if (type === "banner") {
        setLocalBannerImage(url);
      } else if (type === "wallpaper") {
        setLocalWallpaper(url);
        setCurrentWallpaper(url);
      }

      // Update database first
      const updateData =
        type === "profile"
          ? { image: url }
          : type === "banner"
          ? { bannerImage: url }
          : { wallpaper: url };

      const profileResponse = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to update profile");
      }

      // Update session immediately for all types
      if (type === "profile") {
        await updateSession({
          user: {
            ...session?.user,
            image: url,
          },
        });
        toast.success("Profile picture updated successfully!");
      } else if (type === "banner") {
        await updateSession({
          user: {
            ...session?.user,
            bannerImage: url,
          },
        });
        toast.success("Cover photo updated successfully!");
      } else if (type === "wallpaper") {
        await updateSession({
          user: {
            ...session?.user,
            wallpaper: url,
          },
        });

        // Additional verification for wallpaper
        try {
          const verifyResponse = await fetch(`/api/users/${session?.user?.id}`);
          const userData = await verifyResponse.json();

          if (userData?.wallpaper === url) {
            toast.success("Wallpaper updated and saved successfully!");
          } else {
            toast.success("Wallpaper updated!");
          }
        } catch (error) {
          toast.success("Wallpaper updated!");
        }
      }
    } catch (error) {
      console.error(`Failed to update ${type}:`, error);
      toast.error(`Failed to update ${type}. Please try again.`);

      // Reset local state on error
      if (type === "profile") {
        setLocalProfileImage(null);
      } else if (type === "banner") {
        setLocalBannerImage(null);
      } else if (type === "wallpaper") {
        setLocalWallpaper(null);
      }
    } finally {
      setUploadingStates((prev) => ({ ...prev, [type]: false }));
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-purple-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  return (
    <div className={`min-h-screen ${styles.pageContainer}`}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#333",
            color: "#fff",
            zIndex: 9999,
          },
        }}
      />

      {/* Background Wallpaper */}
      <div className={styles.wallpaper}>
        <div
          ref={(el) => {
            if (el) {
              el.style.setProperty(
                "--wallpaper-url",
                `url(${currentWallpaper || ""})`
              );
              el.style.setProperty(
                "--wallpaper-opacity",
                currentWallpaper ? "0.85" : "0"
              );
            }
          }}
          className={`${styles.wallpaperImage} ${styles.wallpaperVisible}`}
        />
        <div className={styles.overlay} />
      </div>

      {/* Main Content */}
      <div className={styles.contentContainer}>
        {/* Main Profile Card */}
        <div className={styles.profileCardContainer}>
          {/* Profile Banner */}
          <div className={styles.coverPhotoContainer}>
            {localBannerImage || session?.user?.bannerImage ? (
              <Image
                src={localBannerImage || session?.user?.bannerImage || ""}
                alt="Cover"
                width={1920}
                height={400}
                priority
                className={styles.coverPhoto}
                unoptimized
              />
            ) : (
              <div
                className={`${styles.coverPhoto} ${styles.gradientBackground}`}
              />
            )}
            <div className={styles.changeCoverButton}>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, "banner")}
                disabled={uploadingStates.banner}
                id="cover-upload"
                aria-label="Change cover photo"
              />
              <RGBButton
                variant="ghost"
                size="md"
                onClick={() => document.getElementById("cover-upload")?.click()}
                disabled={uploadingStates.banner}>
                {uploadingStates.banner ? "Uploading..." : "Change Cover"}
              </RGBButton>
            </div>
          </div>

          {/* Profile Content */}
          <div className={styles.profileContent}>
            {/* Profile Header */}
            <div className={styles.profileHeader}>
              {/* Profile Picture Section */}
              <div className={styles.profileImageSection}>
                <div className={styles.profilePictureContainer}>
                  <div className={styles.profilePicture}>
                    {localProfileImage || session?.user?.image ? (
                      <Image
                        src={localProfileImage || session?.user?.image || ""}
                        alt={session?.user?.name || "Profile"}
                        fill
                        sizes="200px"
                        className="object-cover"
                        priority
                        unoptimized
                      />
                    ) : (
                      <div className={styles.profilePicturePlaceholder}>
                        <span className={styles.profilePicturePlaceholderText}>
                          {(session?.user?.name || "U")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={styles.profileImageButton}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "profile")}
                      disabled={uploadingStates.profile}
                      id="profile-upload"
                      aria-label="Change profile picture"
                    />
                    <RGBButton
                      variant="ghost"
                      size="md"
                      onClick={() =>
                        document.getElementById("profile-upload")?.click()
                      }
                      disabled={uploadingStates.profile}>
                      {uploadingStates.profile
                        ? "Uploading..."
                        : "Change Picture"}
                    </RGBButton>
                  </div>
                </div>
              </div>

              {/* Profile Info Section */}
              <div className={styles.profileInfoSection}>
                {/* Name and Email */}
                <div className={styles.profileNameSection}>
                  <h1 className={styles.profileName}>
                    {session?.user?.name || "Anonymous"}
                  </h1>
                  <p className={styles.profileEmail}>
                    {session?.user?.email || "No email provided"}
                  </p>
                </div>

                {/* Bio Section */}
                {isEditing ? (
                  <div className="space-y-2 mb-4">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className={styles.bioTextarea}
                      rows={3}
                      placeholder="Write something about yourself..."
                    />
                    <div className="flex justify-start space-x-2">
                      <RGBButton
                        variant="primary"
                        size="md"
                        onClick={handleBioUpdate}>
                        Save
                      </RGBButton>
                      <RGBButton
                        variant="ghost"
                        size="md"
                        onClick={() => setIsEditing(false)}>
                        Cancel
                      </RGBButton>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className={styles.bioText}>
                      {localBio || session?.user?.bio || "No bio yet"}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.profileActionsSection}>
                  {!isEditing && (
                    <RGBButton
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setBio(session?.user?.bio || "");
                        setIsEditing(true);
                      }}>
                      Edit Bio
                    </RGBButton>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "wallpaper")}
                      disabled={uploadingStates.wallpaper}
                      id="wallpaper-upload"
                      aria-label="Change wallpaper"
                    />
                    <RGBButton
                      variant="ghost"
                      size="md"
                      onClick={() =>
                        document.getElementById("wallpaper-upload")?.click()
                      }
                      disabled={uploadingStates.wallpaper}>
                      {uploadingStates.wallpaper
                        ? "Uploading..."
                        : "Change Wallpaper"}
                    </RGBButton>
                  </div>
                  <RGBButton
                    variant="ghost"
                    size="md"
                    onClick={() => router.push("/privacy")}>
                    Privacy Settings
                  </RGBButton>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className={styles.statsSection}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{posts.length}</div>
                <div className={styles.statLabel}>Posts</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{friendCount}</div>
                <div className={styles.statLabel}>Friends</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{followCounts.followers}</div>
                <div className={styles.statLabel}>Followers</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{followCounts.following}</div>
                <div className={styles.statLabel}>Following</div>
              </div>
            </div>

            {/* XP and Level Section */}
            <div className={styles.xpSection}>
              <XPCard onOpenGuide={() => setIsXPGuideOpen(true)} />
            </div>

            {/* App Settings Section */}
            <div className={styles.xpSection}>
              <NotificationSettings />
            </div>

            {/* Music Player */}
            <div className={styles.musicSection}>
              <h3 className={styles.sectionTitle}>Profile Music</h3>
              <ProfileMusicPlayer
                musicUrl={musicUrl}
                onSave={handleMusicUpdate}
                isEditing={isEditingMusic}
              />
              <RGBButton
                variant="ghost"
                size="md"
                onClick={() => setIsEditingMusic(!isEditingMusic)}>
                {isEditingMusic ? "Cancel" : "Change Music"}
              </RGBButton>
            </div>

            {/* Activity Section */}
            <div className={styles.activitySection}>
              <h2 className={styles.sectionTitle}>Activity</h2>
              <div className={styles.activityGrid}>
                <p>Member since: {new Date().toLocaleDateString()}</p>
                <p>Last active: Now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section - Now outside the main profile card */}
        <div className={styles.postsContainer}>
          <h2 className={styles.sectionTitle}>Posts</h2>
          {loadingPosts ? (
            <div className={styles.loadingPosts}>Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className={styles.noPosts}>No posts yet</div>
          ) : (
            <div className="space-y-6">
              {Array.from(new Set(posts.map((p) => p.id))).map((postId) => {
                const post = posts.find((p) => p.id === postId);
                return post ? (
                  <GlowCard key={postId}>
                    <PostCard
                      post={post}
                      currentUser={session?.user}
                      onPostDelete={async (deletedPostId) => {
                        try {
                          const response = await fetch(
                            `/api/posts/${deletedPostId}`,
                            {
                              method: "DELETE",
                            }
                          );

                          if (response.ok) {
                            // Remove from local state after successful deletion
                            setPosts(
                              posts.filter((p) => p.id !== deletedPostId)
                            );
                          } else {
                            console.error(
                              "Failed to delete post:",
                              response.statusText
                            );
                            alert("Failed to delete post. Please try again.");
                          }
                        } catch (error) {
                          console.error("Error deleting post:", error);
                          alert("Failed to delete post. Please try again.");
                        }
                      }}
                      onPostUpdate={(updatedPost) => {
                        // Update the post in the local posts array
                        setPosts((prevPosts) =>
                          prevPosts.map((p) =>
                            p.id === updatedPost.id ? updatedPost : p
                          )
                        );
                      }}
                      onPostHide={(postId: string) => {
                        // Hide post when user is blocked
                        setPosts(posts.filter((p) => p.id !== postId));
                      }}
                    />
                  </GlowCard>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* XP Guide Modal */}
      <XPGuideModal
        isOpen={isXPGuideOpen}
        onClose={() => setIsXPGuideOpen(false)}
      />
    </div>
  );
}
