import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import Image from "next/image";
import { uploadMedia } from "@/lib/uploadMedia";
import {
  uploadVideo,
  getVideoSizeLimit,
  validateVideoFile,
  formatFileSize,
} from "@/lib/uploadVideo";
import { getUserImageWithFallback } from "@/lib/fallback-images";
import styles from "./EnhancedPostCreator.module.css";

interface EnhancedPostCreatorProps {
  onPostCreated?: () => void;
  onShowToast?: (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => void;
}

interface PostTemplate {
  id: string;
  title: string;
  icon: string;
  template: string;
  placeholder: string;
  category: "gaming" | "social" | "achievement" | "streaming";
}

const POST_TEMPLATES: PostTemplate[] = [
  {
    id: "playing",
    title: "Now Playing",
    icon: "🎮",
    template: "Currently playing {game}! {activity}",
    placeholder: "What game are you playing?",
    category: "gaming",
  },
  {
    id: "looking_for_team",
    title: "LFT",
    icon: "👥",
    template: "Looking for teammates in {game}! {platform} {rank}",
    placeholder: "Which game? What platform?",
    category: "gaming",
  },
  {
    id: "achievement",
    title: "Achievement",
    icon: "🏆",
    template: "Just {achievement} in {game}! {feeling}",
    placeholder: "What did you achieve?",
    category: "achievement",
  },
  {
    id: "streaming",
    title: "Going Live",
    icon: "📺",
    template: "Going live with {game}! {platform} {activity}",
    placeholder: "What are you streaming?",
    category: "streaming",
  },
  {
    id: "review",
    title: "Game Review",
    icon: "⭐",
    template: "Just finished {game}! Rating: {rating}/10. {thoughts}",
    placeholder: "What did you think?",
    category: "gaming",
  },
  {
    id: "setup",
    title: "Setup Showcase",
    icon: "💻",
    template: "Check out my {setup_type}! {specs} {thoughts}",
    placeholder: "Show off your gaming setup!",
    category: "social",
  },
];

const QUICK_REACTIONS = ["🔥", "🎮", "💀", "😂", "❤️", "😤", "🤔", "🚀"];

const GAMING_MOODS = [
  { emoji: "😎", label: "Confident" },
  { emoji: "😤", label: "Competitive" },
  { emoji: "😂", label: "Having Fun" },
  { emoji: "🤔", label: "Strategic" },
  { emoji: "😨", label: "Nervous" },
  { emoji: "🔥", label: "On Fire" },
  { emoji: "😴", label: "Chill" },
  { emoji: "🤬", label: "Tilted" },
];

export default function EnhancedPostCreator({
  onPostCreated,
  onShowToast,
}: EnhancedPostCreatorProps) {
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate | null>(
    null
  );
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTemplates, setShowTemplates] = useState(false);
  const [gameTitle, setGameTitle] = useState("");
  const [platform, setPlatform] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Handle hydration to prevent server/client mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Get image source that's consistent between server and client
  const getSafeImageSrc = (user: any) => {
    // Always use the same fallback initially to prevent hydration mismatch
    // After mount, this will be replaced with the proper fallback system
    return getUserImageWithFallback(user);
  };

  // Update the image source after hydration
  useEffect(() => {
    if (isHydrated) {
      // Force a re-render to update any cached image sources
      setIsHydrated(true);
    }
  }, [isHydrated]);

  const handleTemplateSelect = (template: PostTemplate) => {
    setSelectedTemplate(template);
    setContent(template.template);
    setShowTemplates(false);
    setIsExpanded(true);
    // Focus the textarea after a brief delay to ensure it's rendered
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedImage && !selectedVideo) {
      onShowToast?.("Please add some content to your post!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = "";
      let videoUrl = "";

      // Upload media if selected
      if (selectedImage) {
        setUploadProgress(0);
        imageUrl = await uploadMedia(selectedImage, (progress) => {
          setUploadProgress(progress.progress);
        });
      }

      if (selectedVideo) {
        setUploadProgress(0);

        // Use different upload methods based on video size
        // Small videos (≤100MB) go to Cloudinary for compatibility
        // Large videos (>100MB) go to Google Cloud Storage
        const videoSizeLimit = 100 * 1024 * 1024; // 100MB

        if (selectedVideo.size <= videoSizeLimit) {
          // Upload small videos to Cloudinary (like before)
          videoUrl = await uploadMedia(selectedVideo, (progress) => {
            setUploadProgress(progress.progress);
          });
        } else {
          // Upload large videos to Google Cloud Storage
          videoUrl = await uploadVideo(selectedVideo, {
            onProgress: (progress) => {
              setUploadProgress(progress.progress);
            },
          });
        }
      }

      // Prepare post content with mood if selected
      let finalContent = content;
      if (selectedMood) {
        finalContent = `${selectedMood} ${content}`;
      }

      // Replace template placeholders if using a template
      if (selectedTemplate) {
        finalContent = finalContent
          .replace("{game}", gameTitle || "[Game Name]")
          .replace("{platform}", platform || "[Platform]")
          .replace("{activity}", "")
          .replace("{achievement}", "")
          .replace("{feeling}", "")
          .replace("{rating}", "")
          .replace("{thoughts}", "")
          .replace("{setup_type}", "")
          .replace("{specs}", "");
      }

      // Debug: Log what we're sending to the API
      console.log("Sending to post creation API:", {
        content: finalContent.substring(0, 50) + "...",
        hasImage: !!imageUrl,
        hasVideo: !!videoUrl,
        imageUrl: imageUrl ? imageUrl.substring(0, 50) + "..." : null,
        videoUrl: videoUrl ? videoUrl.substring(0, 50) + "..." : null,
      });

      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: finalContent,
          image: imageUrl || undefined,
          video: videoUrl || undefined,
        }),
      });

      if (response.ok) {
        // Reset form
        setContent("");
        setSelectedTemplate(null);
        setSelectedMood("");
        setSelectedImage(null);
        setSelectedVideo(null);
        setGameTitle("");
        setPlatform("");
        setIsExpanded(false);
        setUploadProgress(0);

        onShowToast?.("Post created successfully! 🎮", "success");
        onPostCreated?.();
      } else {
        throw new Error("Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      onShowToast?.("Failed to create post. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onShowToast?.("Image must be less than 5MB", "warning");
        return;
      }
      setSelectedImage(file);
      setSelectedVideo(null); // Can't have both
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate video file format first
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        onShowToast?.(validation.error || "Invalid video file", "error");
        return;
      }

      // Get the user's video size limit based on subscription
      const maxSize = await getVideoSizeLimit();
      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        onShowToast?.(
          `Video file size (${formatFileSize(
            file.size
          )}) exceeds your ${maxSizeMB}MB limit. Upgrade your subscription for larger videos.`,
          "warning"
        );
        return;
      }

      setSelectedVideo(file);
      setSelectedImage(null); // Can't have both
    }
  };

  const getThemeClass = () => {
    switch (currentTheme.id) {
      case "valorant":
        return styles.valorant;
      case "cyberpunk2077":
        return styles.cyberpunk;
      case "fortnite":
        return styles.fortnite;
      case "matrix":
        return styles.matrix;
      case "synthwave":
        return styles.synthwave;
      case "witcher":
        return styles.witcher;
      case "ghostrunner":
        return styles.ghostrunner;
      case "darksouls":
        return styles.darksouls;
      case "halo":
        return styles.halo;
      case "default":
        return styles.default;
      default:
        return "";
    }
  };

  return (
    <div className={`${styles.postCreator} ${getThemeClass()}`}>
      {/* User Avatar and Basic Input */}
      <div className={styles.mainRow}>
        <div className={styles.avatar} suppressHydrationWarning>
          <Image
            src={getSafeImageSrc(session?.user || {})}
            alt="Your avatar"
            width={48}
            height={48}
            className={styles.avatarImage}
            unoptimized
            suppressHydrationWarning
            key={`avatar-${isHydrated ? "hydrated" : "initial"}`}
          />
        </div>

        <div className={styles.inputContainer}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder={
              selectedTemplate?.placeholder || "What's on your mind, gamer?"
            }
            className={`${styles.textInput} ${
              isExpanded ? styles.expanded : ""
            }`}
            rows={isExpanded ? 3 : 1}
          />

          {isExpanded && selectedTemplate && (
            <div className={styles.templateInputs}>
              {selectedTemplate.template.includes("{game}") && (
                <input
                  type="text"
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  placeholder="Game title..."
                  className={styles.templateInput}
                />
              )}
              {selectedTemplate.template.includes("{platform}") && (
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className={styles.templateSelect}>
                  <option value="">Select Platform</option>
                  <option value="PC">PC</option>
                  <option value="PlayStation 5">PlayStation 5</option>
                  <option value="Xbox Series X/S">Xbox Series X/S</option>
                  <option value="Nintendo Switch">Nintendo Switch</option>
                  <option value="Mobile">Mobile</option>
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Controls (shown when expanded) */}
      {isExpanded && (
        <div className={styles.enhancedControls}>
          {/* Gaming Templates */}
          <div className={styles.controlSection}>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className={`${styles.controlButton} ${
                showTemplates ? styles.active : ""
              }`}>
              🎮 Templates
            </button>

            {showTemplates && (
              <div className={styles.templateGrid}>
                {POST_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`${styles.templateCard} ${
                      selectedTemplate?.id === template.id
                        ? styles.selected
                        : ""
                    }`}>
                    <span className={styles.templateIcon}>{template.icon}</span>
                    <span className={styles.templateTitle}>
                      {template.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Gaming Moods */}
          <div className={styles.controlSection}>
            <span className={styles.sectionLabel}>Mood:</span>
            <div className={styles.moodGrid}>
              {GAMING_MOODS.map((mood) => (
                <button
                  key={mood.emoji}
                  onClick={() =>
                    setSelectedMood(
                      selectedMood === mood.emoji ? "" : mood.emoji
                    )
                  }
                  className={`${styles.moodButton} ${
                    selectedMood === mood.emoji ? styles.selected : ""
                  }`}
                  title={mood.label}>
                  {mood.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Media Attachments */}
          <div className={styles.controlSection}>
            <div className={styles.mediaControls}>
              <button
                onClick={() => imageInputRef.current?.click()}
                className={styles.mediaButton}
                disabled={!!selectedVideo}>
                📷 Photo
              </button>

              <button
                onClick={() => videoInputRef.current?.click()}
                className={styles.mediaButton}
                disabled={!!selectedImage}>
                🎥 Video
              </button>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className={styles.hiddenInput}
              />

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className={styles.hiddenInput}
              />
            </div>
          </div>

          {/* Selected Media Preview */}
          {(selectedImage || selectedVideo) && (
            <div className={styles.mediaPreview}>
              {selectedImage && (
                <div className={styles.previewItem}>
                  <Image
                    src={URL.createObjectURL(selectedImage)}
                    alt="Selected image"
                    width={100}
                    height={100}
                    className={styles.previewImage}
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className={styles.removeButton}>
                    ✕
                  </button>
                </div>
              )}

              {selectedVideo && (
                <div className={styles.previewItem}>
                  <video
                    src={URL.createObjectURL(selectedVideo)}
                    className={styles.previewVideo}
                    controls
                  />
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className={styles.removeButton}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className={styles.uploadProgress}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className={styles.progressText}>{uploadProgress}%</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              onClick={() => {
                setIsExpanded(false);
                setContent("");
                setSelectedTemplate(null);
                setSelectedMood("");
                setSelectedImage(null);
                setSelectedVideo(null);
                setGameTitle("");
                setPlatform("");
              }}
              className={styles.cancelButton}>
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (!content.trim() && !selectedImage && !selectedVideo)
              }
              className={styles.postButton}>
              {isSubmitting ? "Posting..." : "Share Post"} 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
