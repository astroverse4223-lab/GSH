import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useXPNotifications } from "@/hooks/useXPNotifications";
import styles from "./ModernStories.module.css";
import { getUserImageWithFallback } from "@/lib/fallback-images";

interface Story {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
  content: string;
  type: "text" | "image" | "gaming_status" | "achievement";
  mediaUrl?: string;
  gameTitle?: string;
  status?: "playing" | "completed" | "streaming" | "looking_for_team";
  createdAt: string;
  expiresAt: string;
  isViewed?: boolean;
}

interface ModernStoriesProps {
  onCreateStory?: () => void;
}

export default function ModernStories({ onCreateStory }: ModernStoriesProps) {
  const { data: session } = useSession();
  const { awardStoryCreationXP } = useXPNotifications();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newStoryContent, setNewStoryContent] = useState("");
  const [newStoryType, setNewStoryType] = useState<"text" | "gaming_status">(
    "text"
  );
  const [gameTitle, setGameTitle] = useState("");
  const [gameStatus, setGameStatus] = useState<
    "playing" | "completed" | "streaming" | "looking_for_team"
  >("playing");

  useEffect(() => {
    setMounted(true);
    fetchStories();
  }, []);

  // Get image source that's consistent between server and client
  const getSafeImageSrc = (user: any) => {
    if (!mounted) {
      // During SSR, use a simple fallback to prevent loading issues
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiM2MzY2ZjEiLz4KPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjgiIGZvbnQtd2VpZ2h0PSJib2xkIj4/PC90ZXh0Pgo8L3N2Zz4K";
    }
    return getUserImageWithFallback(user);
  };

  const fetchStories = async () => {
    try {
      const response = await fetch("/api/stories");
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  const createStory = async () => {
    if (!newStoryContent.trim() && newStoryType === "text") return;
    if (!gameTitle.trim() && newStoryType === "gaming_status") return;

    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content:
            newStoryType === "gaming_status"
              ? `${
                  gameStatus === "playing"
                    ? "🎮"
                    : gameStatus === "completed"
                    ? "🏆"
                    : gameStatus === "streaming"
                    ? "📺"
                    : "👥"
                } ${gameTitle}`
              : newStoryContent,
          type: newStoryType,
          gameTitle: newStoryType === "gaming_status" ? gameTitle : undefined,
          status: newStoryType === "gaming_status" ? gameStatus : undefined,
        }),
      });

      if (response.ok) {
        setNewStoryContent("");
        setGameTitle("");
        setIsCreating(false);
        fetchStories();

        // Award XP for creating a story
        await awardStoryCreationXP();
      }
    } catch (error) {
      console.error("Error creating story:", error);
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "playing":
        return "🎮";
      case "completed":
        return "🏆";
      case "streaming":
        return "📺";
      case "looking_for_team":
        return "👥";
      default:
        return "🎮";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Scroll functionality
  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  useEffect(() => {
    checkScrollability();
  }, [stories]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollability);
      const resizeObserver = new ResizeObserver(checkScrollability);
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener("scroll", checkScrollability);
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <>
      <div className={styles.container}>
        {/* Enhanced Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div className={styles.iconWrapper}>
              <svg
                className={styles.headerIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className={styles.title}>Stories</h3>
            <div className={styles.storyCount}>{stories.length}</div>
          </div>
          <div className={styles.activeIndicator}>
            <div className={styles.pulseRing}></div>
            <span className={styles.liveText}>Live</span>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.scrollContainer}>
            {canScrollLeft && (
              <button
                className={`${styles.scrollButton} ${styles.scrollLeft}`}
                onClick={scrollLeft}
                aria-label="Scroll left">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
                </svg>
              </button>
            )}

            <div
              ref={scrollContainerRef}
              className={styles.storiesScroll}
              onScroll={checkScrollability}>
              {/* Create Story Card */}
              <div
                className={styles.createStoryCard}
                onClick={() => setIsCreating(true)}>
                <div className={styles.createStoryAvatar}>
                  <div className={styles.avatarContainer}>
                    {session?.user ? (
                      <Image
                        src={getSafeImageSrc(session?.user)}
                        alt="Your avatar"
                        width={64}
                        height={64}
                        className={styles.avatar}
                        unoptimized
                        suppressHydrationWarning
                      />
                    ) : (
                      <div className={styles.avatarFallback}>
                        {session?.user?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <div className={styles.addIcon}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <span className={styles.createStoryText}>Your Story</span>
              </div>

              {/* Stories */}
              {stories.map((story, index) => (
                <div
                  key={story.id}
                  className={`${styles.storyCard} ${styles[`delay${index}`]}`}
                  onClick={() => setSelectedStory(story)}>
                  <div className={styles.storyAvatar}>
                    <div
                      className={`${styles.avatarRing} ${
                        !story.isViewed ? styles.unviewed : styles.viewed
                      }`}>
                      <Image
                        src={getSafeImageSrc(story.user)}
                        alt={story.user.name}
                        width={64}
                        height={64}
                        className={styles.avatar}
                        unoptimized
                        suppressHydrationWarning
                      />
                    </div>
                    {story.type === "gaming_status" && (
                      <div className={styles.gameStatusBadge}>
                        {getStatusEmoji(story.status || "playing")}
                      </div>
                    )}
                  </div>
                  <span className={styles.storyUsername}>
                    {story.user.name}
                  </span>
                  <span className={styles.storyTime}>
                    {formatTimeAgo(story.createdAt)}
                  </span>
                </div>
              ))}
            </div>

            {canScrollRight && (
              <button
                className={`${styles.scrollButton} ${styles.scrollRight}`}
                onClick={scrollRight}
                aria-label="Scroll right">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create Story Modal - Rendered as Portal */}
      {isCreating &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={styles.modalOverlay}
            onClick={() => setIsCreating(false)}>
            <div
              className={styles.createModal}
              onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Create Story</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setIsCreating(false)}
                  title="Close modal">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>

              <div className={styles.storyTypeTabs}>
                <button
                  className={`${styles.typeTab} ${
                    newStoryType === "text" ? styles.active : ""
                  }`}
                  onClick={() => setNewStoryType("text")}>
                  <svg
                    className={styles.tabIcon}
                    viewBox="0 0 24 24"
                    fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10,9 9,9 8,9" />
                  </svg>
                  Text Story
                </button>
                <button
                  className={`${styles.typeTab} ${
                    newStoryType === "gaming_status" ? styles.active : ""
                  }`}
                  onClick={() => setNewStoryType("gaming_status")}>
                  <svg
                    className={styles.tabIcon}
                    viewBox="0 0 24 24"
                    fill="currentColor">
                    <path d="M21.58 16.09l-1.09-1.09 1.09-1.09a.996.996 0 000-1.41l-1.96-1.96a.996.996 0 00-1.41 0l-1.09 1.09-1.09-1.09A.996.996 0 0015 10.46V9a1 1 0 00-1-1h-4a1 1 0 00-1 1v1.46c0 .28.11.52.29.71l1.09 1.09-1.09 1.09A.996.996 0 009.29 14.54l1.96 1.96c.39.39 1.02.39 1.41 0l1.09-1.09 1.09 1.09c.39.39 1.02.39 1.41 0l1.96-1.96a.996.996 0 000-1.41z" />
                  </svg>
                  Gaming Status
                </button>
              </div>

              {newStoryType === "text" ? (
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    What's on your mind?
                  </label>
                  <textarea
                    className={styles.textInput}
                    value={newStoryContent}
                    onChange={(e) => setNewStoryContent(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                  />
                </div>
              ) : (
                <div className={styles.gamingInputs}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Game Title</label>
                    <input
                      className={styles.textInput}
                      type="text"
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                      placeholder="What are you playing?"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Status</label>
                    <select
                      className={styles.selectInput}
                      value={gameStatus}
                      onChange={(e) => setGameStatus(e.target.value as any)}
                      title="Select game status">
                      <option value="playing">🎮 Playing</option>
                      <option value="completed">🏆 Completed</option>
                      <option value="streaming">📺 Streaming</option>
                      <option value="looking_for_team">
                        👥 Looking for Team
                      </option>
                    </select>
                  </div>
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setIsCreating(false)}>
                  Cancel
                </button>
                <button className={styles.createBtn} onClick={createStory}>
                  <svg
                    className={styles.btnIcon}
                    viewBox="0 0 24 24"
                    fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  Create Story
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Story Viewer Modal - Rendered as Portal */}
      {selectedStory &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={styles.storyViewerOverlay}
            onClick={() => setSelectedStory(null)}>
            <div
              className={styles.storyViewer}
              onClick={(e) => e.stopPropagation()}>
              <div className={styles.viewerHeader}>
                <div className={styles.storyAuthor}>
                  <div className={styles.authorAvatar}>
                    <Image
                      src={getSafeImageSrc(selectedStory.user)}
                      alt={selectedStory.user.name}
                      width={40}
                      height={40}
                      className={styles.avatar}
                      unoptimized
                      suppressHydrationWarning
                    />
                  </div>
                  <div className={styles.authorInfo}>
                    <span className={styles.authorName}>
                      {selectedStory.user.name}
                    </span>
                    <span className={styles.storyTimestamp}>
                      {formatTimeAgo(selectedStory.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  className={styles.closeViewerBtn}
                  onClick={() => setSelectedStory(null)}
                  title="Close story viewer">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
              <div className={styles.storyContent}>
                <p className={styles.storyText}>{selectedStory.content}</p>
                {selectedStory.type === "gaming_status" && (
                  <div className={styles.gameInfo}>
                    <span className={styles.gameStatus}>
                      {getStatusEmoji(selectedStory.status || "playing")}
                      {selectedStory.gameTitle}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
