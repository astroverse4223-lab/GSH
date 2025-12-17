"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Paperclip, Smile, Send } from "lucide-react";
import { getUserImageWithFallback } from "@/lib/fallback-images";
import styles from "./messages.module.css";

interface Message {
  id: string;
  content: string;
  createdAt: Date | string;
  senderId: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string | null;
    image: string | null;
  }[];
  messages: Message[];
  participantIds: string[];
}

interface Friend {
  id: string;
  name: string | null;
  image: string | null;
  lastSeen: Date | null;
}

export default function MessagesClient({
  initialConversations,
  currentUserId,
  friends,
}: {
  initialConversations: Conversation[];
  currentUserId: string;
  friends: Friend[];
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure hydration consistency
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get image source that's consistent between server and client
  const getSafeImageSrc = (user: any) => {
    if (!mounted) {
      // During SSR, use a simple fallback to prevent loading issues
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiM2MzY2ZjEiLz4KPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtd2VpZ2h0PSJib2xkIj4/PC90ZXh0Pgo8L3N2Zz4K";
    }
    // After hydration, use the full fallback system
    return getUserImageWithFallback(user);
  };

  // Common emojis for quick access
  const quickEmojis = [
    "😀",
    "😂",
    "❤️",
    "👍",
    "👎",
    "😢",
    "😠",
    "😮",
    "😍",
    "🤔",
    "👌",
    "🙏",
    "🔥",
    "💯",
    "🎉",
    "🚀",
    "⭐",
    "💙",
    "💚",
    "💜",
  ];

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowMobileChat(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) {
      console.error("Message or file is required");
      return;
    }

    if (!selectedConversation) {
      console.error("No conversation selected");
      return;
    }

    if (!Array.isArray(selectedConversation.participants)) {
      console.error(
        "participants is not an array:",
        selectedConversation.participants
      );
      return;
    }

    const receiver = selectedConversation.participants.find(
      (p) => p.id !== currentUserId
    );

    if (!receiver) {
      console.error("Could not find receiver in conversation");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("content", message);
      formData.append("receiverId", receiver.id);
      formData.append("conversationId", selectedConversation.id);

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setMessage("");
      setSelectedFile(null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderFileMessage = (msg: Message) => {
    if (!msg.fileUrl) return null;

    const isImage = msg.fileType?.startsWith("image/");
    const isVideo = msg.fileType?.startsWith("video/");

    return (
      <div className={styles.fileMessage}>
        {isImage && (
          <div className={styles.imageMessage}>
            <Image
              src={msg.fileUrl}
              alt={msg.fileName || "Uploaded image"}
              width={200}
              height={200}
              className={styles.messageImage}
            />
          </div>
        )}
        {isVideo && (
          <div className={styles.videoMessage}>
            <video
              src={msg.fileUrl}
              controls
              className={styles.messageVideo}
              width={200}
              height={150}
            />
          </div>
        )}
        {!isImage && !isVideo && (
          <div className={styles.fileAttachment}>
            <div className={styles.fileIcon}>📎</div>
            <div className={styles.fileInfo}>
              <div className={styles.fileName}>{msg.fileName}</div>
              <div className={styles.fileSize}>
                {msg.fileSize ? formatFileSize(msg.fileSize) : "Unknown size"}
              </div>
            </div>
            <a
              href={msg.fileUrl}
              download={msg.fileName}
              className={styles.downloadButton}>
              Download
            </a>
          </div>
        )}
      </div>
    );
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (
      !conversation ||
      !conversation.participants ||
      !Array.isArray(conversation.participants)
    ) {
      return null;
    }
    return conversation.participants.find((p) => p.id !== currentUserId);
  };

  const startNewConversation = async (friendId: string) => {
    try {
      const res = await fetch(`/api/messages?userId=${friendId}`);
      if (!res.ok) throw new Error("Failed to start conversation");
      const data = await res.json();

      if (data.conversation) {
        setSelectedConversation(data.conversation);
        setMessages(data.messages || []);
        setShowMobileChat(true);
        router.refresh();
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  return (
    <div className={styles.messagesContainer}>
      {/* Sidebar with Conversations and Friends */}
      <div
        className={`${styles.sidebar} ${
          showMobileChat ? styles.hiddenOnMobile : ""
        }`}>
        <h2 className={styles.sidebarHeader}>Messages</h2>

        {/* Recent Conversations */}
        <h3 className={styles.sectionHeader}>Recent Conversations</h3>
        <div>
          {conversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            if (!otherUser) return null;
            return (
              <div
                key={conversation.id}
                className={`${styles.conversationItem} ${
                  selectedConversation?.id === conversation.id
                    ? styles.activeConversation
                    : ""
                }`}
                onClick={() => {
                  setSelectedConversation(conversation);
                  setShowMobileChat(true);
                }}>
                <div className="flex items-center gap-3">
                  <div className={styles.avatar}>
                    <Image
                      src={getSafeImageSrc(otherUser)}
                      alt={otherUser?.name || "User"}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{otherUser?.name}</span>
                    {conversation.messages[0] && (
                      <span className={styles.userStatus}>
                        {conversation.messages[0].content}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Friends List */}
        <h3 className={styles.sectionHeader}>Friends</h3>
        <div>
          {friends.map((friend) => (
            <div
              key={friend.id}
              className={styles.conversationItem}
              onClick={() => {
                startNewConversation(friend.id);
              }}>
              <div className="flex items-center gap-3">
                <div className={styles.avatar}>
                  <Image
                    src={getSafeImageSrc(friend)}
                    alt={friend.name || "Friend"}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{friend.name}</span>
                  <span className={styles.userStatus} suppressHydrationWarning>
                    {mounted && friend.lastSeen
                      ? `Last seen ${new Date(
                          friend.lastSeen
                        ).toLocaleDateString()}`
                      : mounted
                      ? "Offline"
                      : "..."}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div
        className={`${styles.chatArea} ${
          !showMobileChat ? styles.hiddenOnMobile : ""
        }`}>
        {selectedConversation ? (
          <>
            {/* Mobile Header with Back Button */}
            <div className={styles.mobileHeader}>
              <button
                className={styles.backButton}
                onClick={() => setShowMobileChat(false)}
                title="Back to conversations"
                aria-label="Back to conversations">
                <ArrowLeft size={20} />
              </button>
              <div className={styles.mobileHeaderInfo}>
                {(() => {
                  const otherUser = getOtherParticipant(selectedConversation);
                  return otherUser ? (
                    <>
                      <div className={styles.avatar}>
                        <Image
                          src={getSafeImageSrc(otherUser)}
                          alt={otherUser?.name || "User"}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      </div>
                      <span className={styles.mobileHeaderName}>
                        {otherUser?.name}
                      </span>
                    </>
                  ) : (
                    <span className={styles.mobileHeaderName}>Loading...</span>
                  );
                })()}
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesArea}>
              {messages.map((msg) => {
                const isCurrentUser = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`${styles.messageGroup} ${
                      isCurrentUser
                        ? styles.messageGroupEnd
                        : styles.messageGroupStart
                    }`}>
                    {!isCurrentUser && (
                      <div className={styles.avatar}>
                        <Image
                          src={getSafeImageSrc(msg.sender)}
                          alt={msg.sender?.name || "User"}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      </div>
                    )}
                    <div
                      className={`${styles.messageBubble} ${
                        isCurrentUser
                          ? styles.outgoingMessage
                          : styles.incomingMessage
                      }`}>
                      {msg.content && <p>{msg.content}</p>}
                      {renderFileMessage(msg)}
                      <div
                        className={styles.messageTime}
                        suppressHydrationWarning>
                        {mounted
                          ? new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "..."}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input */}
            <div className={styles.inputArea}>
              {/* File Preview */}
              {selectedFile && (
                <div className={styles.filePreview}>
                  <div className={styles.filePreviewContent}>
                    <span className={styles.fileIcon}>📎</span>
                    <span className={styles.fileName}>{selectedFile.name}</span>
                    <span className={styles.fileSize}>
                      {formatFileSize(selectedFile.size)}
                    </span>
                    <button
                      onClick={removeSelectedFile}
                      className={styles.removeFileButton}>
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className={styles.emojiPicker}>
                  <div className={styles.emojiGrid}>
                    {quickEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => insertEmoji(emoji)}
                        className={styles.emojiButton}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.inputContainer}>
                <div className={styles.inputActions}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={styles.actionButton}
                    title="Attach file">
                    📎
                  </button>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={styles.actionButton}
                    title="Add emoji">
                    😀
                  </button>
                </div>

                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSend()
                  }
                  placeholder="Type a message..."
                  className={styles.messageInput}
                />

                <button
                  onClick={handleSend}
                  className={styles.sendButton}
                  disabled={uploading || (!message.trim() && !selectedFile)}>
                  {uploading ? "..." : "Send"}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              />
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>💬</div>
            <h3>Select a conversation to start messaging</h3>
            <p>
              Choose from your recent conversations or start a new one with a
              friend
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
