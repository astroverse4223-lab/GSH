import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { getUserImageWithFallback } from "@/lib/fallback-images";
import styles from "./Stories.module.css";

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

interface StoriesProps {
  onCreateStory?: () => void;
}

export default function Stories({ onCreateStory }: StoriesProps) {
  const { data: session } = useSession();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newStoryContent, setNewStoryContent] = useState("");
  const [newStoryType, setNewStoryType] = useState<"text" | "gaming_status">(
    "text"
  );
  const [gameTitle, setGameTitle] = useState("");
  const [gameStatus, setGameStatus] = useState<
    "playing" | "completed" | "streaming" | "looking_for_team"
  >("playing");

  useEffect(() => {
    fetchStories();
  }, []);

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "playing":
        return "Playing";
      case "completed":
        return "Just beat";
      case "streaming":
        return "Streaming";
      case "looking_for_team":
        return "LFT";
      default:
        return "Playing";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return "1d";
  };

  return (
    <div className={styles.storiesContainer}>
      <div className={styles.storiesScroll}>
        {/* Create Story Button */}
        <div
          className={styles.createStoryCard}
          onClick={() => setIsCreating(true)}>
          <div className={styles.createStoryAvatar}>
            <div className={styles.avatarContainer}>
              <Image
                src={getUserImageWithFallback(session?.user)}
                alt="Your avatar"
                width={60}
                height={60}
                className={styles.avatar}
                unoptimized
              />
              <div className={styles.addIcon}>+</div>
            </div>
          </div>
          <span className={styles.createStoryText}>Your Story</span>
        </div>

        {/* Stories */}
        {stories.map((story) => (
          <div
            key={story.id}
            className={`${styles.storyCard} ${
              story.isViewed ? styles.viewed : ""
            }`}
            onClick={() => setSelectedStory(story)}>
            <div className={styles.storyAvatar}>
              <div
                className={`${styles.avatarRing} ${
                  !story.isViewed ? styles.unviewed : ""
                }`}>
                <Image
                  src={getUserImageWithFallback(story.user)}
                  alt={story.user.name}
                  width={60}
                  height={60}
                  className={styles.avatar}
                  unoptimized
                />
              </div>
              {story.type === "gaming_status" && (
                <div className={styles.gameStatusBadge}>
                  {getStatusEmoji(story.status || "playing")}
                </div>
              )}
            </div>
            <span className={styles.storyUsername}>{story.user.name}</span>
            <span className={styles.storyTime}>
              {formatTimeAgo(story.createdAt)}
            </span>
          </div>
        ))}
      </div>

      {/* Create Story Modal */}
      {isCreating && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsCreating(false)}>
          <div
            className={styles.createModal}
            onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Create Story</h3>

            <div className={styles.storyTypeTabs}>
              <button
                className={`${styles.typeTab} ${
                  newStoryType === "text" ? styles.active : ""
                }`}
                onClick={() => setNewStoryType("text")}>
                💭 Text Story
              </button>
              <button
                className={`${styles.typeTab} ${
                  newStoryType === "gaming_status" ? styles.active : ""
                }`}
                onClick={() => setNewStoryType("gaming_status")}>
                🎮 Gaming Status
              </button>
            </div>

            {newStoryType === "text" ? (
              <textarea
                value={newStoryContent}
                onChange={(e) => setNewStoryContent(e.target.value)}
                placeholder="What's on your mind?"
                className={styles.textInput}
                maxLength={150}
              />
            ) : (
              <div className={styles.gamingStatusForm}>
                <select
                  value={gameStatus}
                  onChange={(e) => setGameStatus(e.target.value as any)}
                  className={styles.statusSelect}>
                  <option value="playing">🎮 Playing</option>
                  <option value="completed">🏆 Just beat</option>
                  <option value="streaming">📺 Streaming</option>
                  <option value="looking_for_team">👥 Looking for team</option>
                </select>
                <input
                  type="text"
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  placeholder="Game title..."
                  className={styles.gameInput}
                />
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                onClick={() => setIsCreating(false)}
                className={styles.cancelButton}>
                Cancel
              </button>
              <button
                onClick={createStory}
                className={styles.createButton}
                disabled={
                  (newStoryType === "text" && !newStoryContent.trim()) ||
                  (newStoryType === "gaming_status" && !gameTitle.trim())
                }>
                Share Story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div
          className={styles.storyViewer}
          onClick={() => setSelectedStory(null)}>
          <div
            className={styles.storyContent}
            onClick={(e) => e.stopPropagation()}>
            <div className={styles.storyHeader}>
              <div className={styles.storyUserInfo}>
                <Image
                  src={getUserImageWithFallback(selectedStory.user)}
                  alt={selectedStory.user.name}
                  width={40}
                  height={40}
                  className={styles.storyUserAvatar}
                  unoptimized
                />
                <div>
                  <div className={styles.storyUserName}>
                    {selectedStory.user.name}
                  </div>
                  <div className={styles.storyTimestamp}>
                    {formatTimeAgo(selectedStory.createdAt)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStory(null)}
                className={styles.closeButton}>
                ✕
              </button>
            </div>

            <div className={styles.storyBody}>
              {selectedStory.type === "gaming_status" ? (
                <div className={styles.gamingStatusDisplay}>
                  <div className={styles.statusEmoji}>
                    {getStatusEmoji(selectedStory.status || "playing")}
                  </div>
                  <div className={styles.statusText}>
                    <div className={styles.statusAction}>
                      {getStatusText(selectedStory.status || "playing")}
                    </div>
                    <div className={styles.gameTitle}>
                      {selectedStory.gameTitle}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.textStoryContent}>
                  {selectedStory.content}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
