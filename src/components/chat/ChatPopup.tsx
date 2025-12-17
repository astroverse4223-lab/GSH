"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { X, MessageCircle, Send, Minimize2, Maximize2 } from "lucide-react";
import { getUserImageWithFallback } from "@/lib/fallback-images";
import styles from "./ModernChatPopup.module.css";

interface User {
  id: string;
  name: string;
  image: string;
  lastSeen?: Date;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
  sender: User;
}

interface ChatWindow {
  id: string;
  user: User;
  messages: Message[];
  isMinimized: boolean;
}

interface ChatPopupProps {
  onStartChat?: (userId: string) => void;
}

export function ChatPopup({ onStartChat }: ChatPopupProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fetch friends when component mounts
  useEffect(() => {
    if (session?.user?.id) {
      fetchFriends();
    }
  }, [session]);

  const fetchFriends = async () => {
    try {
      const response = await fetch("/api/friends");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched friends:", data); // Debug log
        setFriends(data.friends || []); // API returns { friends: [] }
      } else {
        console.error("Failed to fetch friends:", response.status);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const openChatWindow = async (friend: User) => {
    // Check if chat window already exists
    const existingWindow = chatWindows.find(
      (window) => window.id === friend.id
    );
    if (existingWindow) {
      // If minimized, expand it
      if (existingWindow.isMinimized) {
        setChatWindows((prev) =>
          prev.map((window) =>
            window.id === friend.id ? { ...window, isMinimized: false } : window
          )
        );
      }
      return;
    }

    // Fetch existing messages
    const messages = await fetchMessages(friend.id);

    const newChatWindow: ChatWindow = {
      id: friend.id,
      user: friend,
      messages,
      isMinimized: false,
    };

    setChatWindows((prev) => [...prev, newChatWindow]);
    setIsOpen(false); // Close the main popup
  };

  const closeChatWindow = (windowId: string) => {
    setChatWindows((prev) => prev.filter((window) => window.id !== windowId));
    setNewMessage((prev) => {
      const { [windowId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const minimizeChatWindow = (windowId: string) => {
    setChatWindows((prev) =>
      prev.map((window) =>
        window.id === windowId
          ? { ...window, isMinimized: !window.isMinimized }
          : window
      )
    );
  };

  const fetchMessages = async (userId: string): Promise<Message[]> => {
    try {
      const response = await fetch(
        `/api/messages/conversations?userId=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  const sendMessage = async (windowId: string) => {
    const content = newMessage[windowId]?.trim();
    if (!content) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          receiverId: windowId,
        }),
      });

      if (response.ok) {
        const message = await response.json();

        // Add message to chat window
        setChatWindows((prev) =>
          prev.map((window) =>
            window.id === windowId
              ? { ...window, messages: [...window.messages, message] }
              : window
          )
        );

        // Clear input
        setNewMessage((prev) => ({ ...prev, [windowId]: "" }));

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current[windowId]?.scrollIntoView({
            behavior: "smooth",
          });
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId: string, windowId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      const response = await fetch(`/api/messages?messageId=${messageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove message from chat window
        setChatWindows((prev) =>
          prev.map((window) =>
            window.id === windowId
              ? {
                  ...window,
                  messages: window.messages.filter(
                    (msg) => msg.id !== messageId
                  ),
                }
              : window
          )
        );
      } else {
        console.error("Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, windowId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(windowId);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatWindows.forEach((window) => {
      if (messagesEndRef.current[window.id] && !window.isMinimized) {
        messagesEndRef.current[window.id]?.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  }, [chatWindows]);

  if (!session?.user?.id) return null;

  return (
    <>
      {/* Chat Button with Popup */}
      <div className={styles.chatButton}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={styles.chatButtonIcon}
          aria-label="Open chat">
          <MessageCircle size={24} />
          {friends.length > 0 && (
            <span className={styles.friendCount}>{friends.length}</span>
          )}
        </button>

        {/* Friends List Popup */}
        {isOpen && (
          <div className={styles.friendsPopup}>
            <div className={styles.friendsHeader}>
              <h3>Friends</h3>
              <button
                onClick={() => setIsOpen(false)}
                className={styles.closeBtn}
                aria-label="Close friends list">
                <X size={20} />
              </button>
            </div>
            <div className={styles.friendsList}>
              {friends.length === 0 ? (
                <p className={styles.noFriends}>No friends online</p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className={styles.friendItem}
                    onClick={() => openChatWindow(friend)}>
                    <div className={styles.friendAvatar}>
                      <Image
                        src={getUserImageWithFallback(friend)}
                        alt={friend.name}
                        width={40}
                        height={40}
                        className={styles.avatar}
                      />
                      <div className={styles.onlineIndicator} />
                    </div>
                    <span className={styles.friendName}>{friend.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Windows */}
      {chatWindows.map((window, index) => (
        <div
          key={window.id}
          ref={(el) => {
            if (el) {
              el.style.setProperty(
                "--chat-window-right",
                `${20 + index * 320}px`
              );
            }
          }}
          className={`${styles.chatWindow} ${
            window.isMinimized ? styles.minimized : ""
          }`}>
          {/* Chat Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatUser}>
              <Image
                src={getUserImageWithFallback(window.user)}
                alt={window.user.name}
                width={32}
                height={32}
                className={styles.chatAvatar}
              />
              <span className={styles.chatUserName}>{window.user.name}</span>
            </div>
            <div className={styles.chatControls}>
              <button
                onClick={() => minimizeChatWindow(window.id)}
                className={styles.controlBtn}
                aria-label={
                  window.isMinimized
                    ? "Maximize chat window"
                    : "Minimize chat window"
                }>
                {window.isMinimized ? (
                  <Maximize2 size={16} />
                ) : (
                  <Minimize2 size={16} />
                )}
              </button>
              <button
                onClick={() => closeChatWindow(window.id)}
                className={`${styles.controlBtn} ${styles.close}`}
                aria-label="Close chat window">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          {!window.isMinimized && (
            <>
              <div className={styles.chatMessages}>
                {window.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`${styles.message} ${
                      message.senderId === session.user.id
                        ? styles.own
                        : styles.other
                    }`}>
                    {message.senderId === session.user.id && (
                      <button
                        onClick={() => deleteMessage(message.id, window.id)}
                        className={styles.deleteButton}
                        title="Delete message"
                        aria-label="Delete message">
                        ✕
                      </button>
                    )}
                    <div className={styles.messageContent}>
                      {message.content}
                    </div>
                    <div className={styles.messageTime}>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
                <div
                  ref={(el) => {
                    messagesEndRef.current[window.id] = el;
                  }}
                />
              </div>

              {/* Chat Input */}
              <div className={styles.chatInput}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage[window.id] || ""}
                  onChange={(e) =>
                    setNewMessage((prev) => ({
                      ...prev,
                      [window.id]: e.target.value,
                    }))
                  }
                  onKeyPress={(e) => handleKeyPress(e, window.id)}
                  className={styles.messageInput}
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage(window.id)}
                  className={styles.sendBtn}
                  disabled={isLoading || !newMessage[window.id]?.trim()}
                  aria-label="Send message">
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </>
  );
}
