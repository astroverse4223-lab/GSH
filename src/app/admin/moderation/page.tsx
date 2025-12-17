"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./moderation.module.css";

interface ModerationUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface ModerationReport {
  id: string;
  reason: string;
  createdAt: string;
  reporterId: string;
  reporter?: ModerationUser;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
}

interface ModerationPost {
  id: string;
  content: string;
  createdAt: string;
  user?: ModerationUser;
  reports?: ModerationReport[];
  media?: { url: string; type: string }[];
  likes: number;
  comments: number;
}

interface ModerationComment {
  id: string;
  content: string;
  createdAt: string;
  user?: ModerationUser;
  post?: { id: string; content: string };
  reports?: ModerationReport[];
  likes: number;
}

interface ModerationMedia {
  id: string;
  url: string;
  type: string;
  createdAt: string;
  user?: ModerationUser;
  reports?: ModerationReport[];
  associatedPost?: { id: string; content: string };
}

export default function ContentModerationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState("posts");
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [comments, setComments] = useState<ModerationComment[]>([]);
  const [media, setMedia] = useState<ModerationMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const isAdmin = session?.user?.email === "countryboya20@gmail.com";

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !isAdmin) {
      router.push("/");
      return;
    }

    // Fetch all data on initial load
    fetchAllData();
  }, [session, status, isAdmin, router]);

  // Separate effect for tab changes (optional - for refreshing data when switching tabs)
  useEffect(() => {
    if (!session || !isAdmin) return;
    // Optional: You can fetch specific tab data here if you want to refresh on tab change
    // For now, we'll just use the data that's already loaded
  }, [tab]);

  async function fetchAllData() {
    try {
      setLoading(true);

      // Fetch all data in parallel for better performance
      const [postsRes, commentsRes, mediaRes] = await Promise.all([
        fetch("/api/admin/moderation/posts"),
        fetch("/api/admin/moderation/comments"),
        fetch("/api/admin/moderation/media"),
      ]);

      if (postsRes.ok) {
        setPosts(await postsRes.json());
      }

      if (commentsRes.ok) {
        setComments(await commentsRes.json());
      }

      if (mediaRes.ok) {
        setMedia(await mediaRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch moderation data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      if (tab === "posts") {
        const res = await fetch("/api/admin/moderation/posts");
        if (res.ok) {
          setPosts(await res.json());
        }
      } else if (tab === "comments") {
        const res = await fetch("/api/admin/moderation/comments");
        if (res.ok) {
          setComments(await res.json());
        }
      } else if (tab === "media") {
        const res = await fetch("/api/admin/moderation/media");
        if (res.ok) {
          setMedia(await res.json());
        }
      }
    } catch (error) {
      console.error("Failed to fetch moderation data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch("/api/admin/moderation/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== postId));
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch("/api/admin/moderation/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      const res = await fetch("/api/admin/moderation/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (res.ok) {
        setMedia(media.filter((m) => m.id !== mediaId));
      }
    } catch (error) {
      console.error("Failed to delete media:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReportSeverity = (reportCount: number) => {
    if (reportCount >= 5) return "high";
    if (reportCount >= 2) return "medium";
    if (reportCount >= 1) return "low";
    return "none";
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "reported" && (post.reports?.length || 0) > 0) ||
      (filterStatus === "clean" && (post.reports?.length || 0) === 0);
    return matchesSearch && matchesFilter;
  });

  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "reported" && (comment.reports?.length || 0) > 0) ||
      (filterStatus === "clean" && (comment.reports?.length || 0) === 0);
    return matchesSearch && matchesFilter;
  });

  const filteredMedia = media.filter((mediaItem) => {
    const matchesSearch = mediaItem.user?.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "reported" && (mediaItem.reports?.length || 0) > 0) ||
      (filterStatus === "clean" && (mediaItem.reports?.length || 0) === 0);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Loading moderation data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundPattern}></div>

      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🛡️</span>
            Content Moderation
          </h1>
          <p className={styles.subtitle}>
            Monitor and manage platform content for safety and quality
          </p>
        </div>

        {/* Statistics Overview */}
        <div className={styles.statsOverview}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{posts.length}</div>
            <div className={styles.statLabel}>Total Posts</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{comments.length}</div>
            <div className={styles.statLabel}>Total Comments</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{media.length}</div>
            <div className={styles.statLabel}>Media Files</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {posts.reduce((acc, p) => acc + (p.reports?.length || 0), 0) +
                comments.reduce((acc, c) => acc + (c.reports?.length || 0), 0) +
                media.reduce((acc, m) => acc + (m.reports?.length || 0), 0)}
            </div>
            <div className={styles.statLabel}>Total Reports</div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className={styles.controlsSection}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              tab === "posts" ? styles.activeTab : ""
            }`}
            onClick={() => setTab("posts")}>
            <span className={styles.tabIcon}>📝</span>
            Posts ({posts.length})
          </button>
          <button
            className={`${styles.tab} ${
              tab === "comments" ? styles.activeTab : ""
            }`}
            onClick={() => setTab("comments")}>
            <span className={styles.tabIcon}>💬</span>
            Comments ({comments.length})
          </button>
          <button
            className={`${styles.tab} ${
              tab === "media" ? styles.activeTab : ""
            }`}
            onClick={() => setTab("media")}>
            <span className={styles.tabIcon}>🖼️</span>
            Media ({media.length})
          </button>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search content or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter content by status">
            <option value="all">All Content</option>
            <option value="reported">Reported Content</option>
            <option value="clean">Clean Content</option>
          </select>
        </div>
      </div>

      {/* Content Lists */}
      <div className={styles.contentSection}>
        {tab === "posts" && (
          <div className={styles.contentGrid}>
            {filteredPosts.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📝</div>
                <div className={styles.emptyText}>No posts found</div>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post.id} className={styles.contentCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {post.user?.profileImage ? (
                          <img
                            src={post.user.profileImage}
                            alt={post.user.name}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {post.user?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>
                          {post.user?.name || "Unknown User"}
                        </div>
                        <div className={styles.postDate}>
                          {formatDate(post.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className={styles.reportsBadge}>
                      <span
                        className={`${styles.reportsCount} ${
                          styles[getReportSeverity(post.reports?.length || 0)]
                        }`}>
                        {post.reports?.length || 0} reports
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardContent}>
                    <p className={styles.postContent}>{post.content}</p>

                    {post.media && post.media.length > 0 && (
                      <div className={styles.mediaPreview}>
                        <span className={styles.mediaIndicator}>
                          🖼️ {post.media.length} media file(s)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.engagementStats}>
                      <span className={styles.statItem}>❤️ {post.likes}</span>
                      <span className={styles.statItem}>
                        💬 {post.comments}
                      </span>
                    </div>

                    <div className={styles.actions}>
                      <button
                        className={styles.viewButton}
                        onClick={() =>
                          window.open(`/feed?highlight=${post.id}`, "_blank")
                        }>
                        View in Feed
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeletePost(post.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "comments" && (
          <div className={styles.contentGrid}>
            {filteredComments.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>💬</div>
                <div className={styles.emptyText}>No comments found</div>
              </div>
            ) : (
              filteredComments.map((comment) => (
                <div key={comment.id} className={styles.contentCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {comment.user?.profileImage ? (
                          <img
                            src={comment.user.profileImage}
                            alt={comment.user.name}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {comment.user?.name?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </div>
                        )}
                      </div>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>
                          {comment.user?.name || "Unknown User"}
                        </div>
                        <div className={styles.postDate}>
                          {formatDate(comment.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className={styles.reportsBadge}>
                      <span
                        className={`${styles.reportsCount} ${
                          styles[
                            getReportSeverity(comment.reports?.length || 0)
                          ]
                        }`}>
                        {comment.reports?.length || 0} reports
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardContent}>
                    <p className={styles.commentContent}>{comment.content}</p>

                    {comment.post && (
                      <div className={styles.parentPost}>
                        <span className={styles.parentLabel}>Reply to:</span>
                        <span className={styles.parentContent}>
                          {comment.post.content.slice(0, 60)}
                          {comment.post.content.length > 60 ? "..." : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.engagementStats}>
                      <span className={styles.statItem}>
                        ❤️ {comment.likes}
                      </span>
                    </div>

                    <div className={styles.actions}>
                      <button
                        className={styles.viewButton}
                        onClick={() =>
                          window.open(
                            `/feed?highlight=${comment.post?.id}`,
                            "_blank"
                          )
                        }>
                        View in Feed
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteComment(comment.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "media" && (
          <div className={styles.contentGrid}>
            {filteredMedia.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🖼️</div>
                <div className={styles.emptyText}>No media found</div>
              </div>
            ) : (
              filteredMedia.map((mediaItem) => (
                <div key={mediaItem.id} className={styles.contentCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        {mediaItem.user?.profileImage ? (
                          <img
                            src={mediaItem.user.profileImage}
                            alt={mediaItem.user.name}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {mediaItem.user?.name?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </div>
                        )}
                      </div>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>
                          {mediaItem.user?.name || "Unknown User"}
                        </div>
                        <div className={styles.postDate}>
                          {formatDate(mediaItem.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className={styles.reportsBadge}>
                      <span
                        className={`${styles.reportsCount} ${
                          styles[
                            getReportSeverity(mediaItem.reports?.length || 0)
                          ]
                        }`}>
                        {mediaItem.reports?.length || 0} reports
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardContent}>
                    <div className={styles.mediaPreviewLarge}>
                      {mediaItem.type.startsWith("image/") ? (
                        <img
                          src={mediaItem.url}
                          alt="Media content"
                          className={styles.mediaImage}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const fallback =
                              target.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.classList.remove("hidden");
                            }
                          }}
                        />
                      ) : (
                        <div className={styles.mediaPlaceholder}>
                          <span className={styles.mediaType}>
                            {mediaItem.type.startsWith("video/") ? "🎥" : "📄"}
                          </span>
                          <span className={styles.mediaTypeText}>
                            {mediaItem.type}
                          </span>
                        </div>
                      )}
                      <div
                        className={`${styles.mediaFallback} ${styles.hidden}`}>
                        <span className={styles.mediaType}>📄</span>
                        <span className={styles.mediaTypeText}>
                          {mediaItem.type}
                        </span>
                      </div>
                    </div>

                    {mediaItem.associatedPost && (
                      <div className={styles.parentPost}>
                        <span className={styles.parentLabel}>From post:</span>
                        <span className={styles.parentContent}>
                          {mediaItem.associatedPost.content.slice(0, 60)}
                          {mediaItem.associatedPost.content.length > 60
                            ? "..."
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.actions}>
                      <button
                        className={styles.viewButton}
                        onClick={() => window.open(mediaItem.url, "_blank")}>
                        View Full
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteMedia(mediaItem.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
