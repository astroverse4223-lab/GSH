"use client";

import { X } from "lucide-react";
import styles from "./XPGuideModal.module.css";

interface XPGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function XPGuideModal({ isOpen, onClose }: XPGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>
            <span className={styles.titleIcon}>🌟</span>
            <h2>XP & Level Guide</h2>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>🎯 How to Earn XP</h3>
            <p>
              Complete activities to earn Experience Points (XP) and level up
              your profile!
            </p>
          </div>

          <div className={styles.categoryGrid}>
            <div className={styles.category}>
              <h4>Getting Started</h4>
              <div className={styles.activityList}>
                <div className={styles.activity}>
                  <span className={styles.icon}>🎉</span>
                  <div className={styles.details}>
                    <strong>First Login</strong>
                    <p>Welcome to the platform!</p>
                  </div>
                  <span className={styles.xp}>+25 XP</span>
                </div>
                <div className={styles.activity}>
                  <span className={styles.icon}>✅</span>
                  <div className={styles.details}>
                    <strong>Email Verification</strong>
                    <p>Verify your email address</p>
                  </div>
                  <span className={styles.xp}>+50 XP</span>
                </div>
                <div className={styles.activity}>
                  <span className={styles.icon}>📅</span>
                  <div className={styles.details}>
                    <strong>Daily Login</strong>
                    <p>Login once per day</p>
                  </div>
                  <span className={styles.xp}>+5 XP</span>
                </div>
              </div>
            </div>

            <div className={styles.category}>
              <h4>Social Activities</h4>
              <div className={styles.activityList}>
                <div className={styles.activity}>
                  <span className={styles.icon}>📝</span>
                  <div className={styles.details}>
                    <strong>Create a Post</strong>
                    <p>Share your thoughts with the community</p>
                  </div>
                  <span className={styles.xp}>+10 XP</span>
                </div>
                <div className={styles.activity}>
                  <span className={styles.icon}>💬</span>
                  <div className={styles.details}>
                    <strong>Write a Comment</strong>
                    <p>Engage with other posts</p>
                  </div>
                  <span className={styles.xp}>+5 XP</span>
                </div>
                <div className={styles.activity}>
                  <span className={styles.icon}>👥</span>
                  <div className={styles.details}>
                    <strong>Add a Friend</strong>
                    <p>Connect with other users</p>
                  </div>
                  <span className={styles.xp}>+15 XP</span>
                </div>
                <div className={styles.activity}>
                  <span className={styles.icon}>🚀</span>
                  <div className={styles.details}>
                    <strong>Boost a Post</strong>
                    <p>Promote content you like</p>
                  </div>
                  <span className={styles.xp}>+15 XP</span>
                </div>
              </div>
            </div>

            <div className={styles.category}>
              <h4>Profile & Customization</h4>
              <div className={styles.activityList}>
                <div className={styles.activity}>
                  <span className={styles.icon}>✏️</span>
                  <div className={styles.details}>
                    <strong>Update Profile</strong>
                    <p>Keep your profile fresh</p>
                  </div>
                  <span className={styles.xp}>+5 XP</span>
                </div>
                <div className={styles.activity}>
                  <span className={styles.icon}>📖</span>
                  <div className={styles.details}>
                    <strong>Create a Story</strong>
                    <p>Share a story with friends</p>
                  </div>
                  <span className={styles.xp}>+7 XP</span>
                </div>
              </div>
            </div>

            <div className={styles.category}>
              <h4>Gaming</h4>
              <div className={styles.activityList}>
                <div className={styles.activity}>
                  <span className={styles.icon}>🎮</span>
                  <div className={styles.details}>
                    <strong>Play a Game</strong>
                    <p>Participate in gaming activities</p>
                  </div>
                  <span className={styles.xp}>+8 XP</span>
                </div>
                <div className={styles.activity}>
                  <span className={styles.icon}>🏆</span>
                  <div className={styles.details}>
                    <strong>Win a Game</strong>
                    <p>Victory in competitive games</p>
                  </div>
                  <span className={styles.xp}>+20 XP</span>
                </div>
              </div>
            </div>

            <div className={styles.category}>
              <h4>Community</h4>
              <div className={styles.activityList}>
                <div className={styles.activity}>
                  <span className={styles.icon}>🏘️</span>
                  <div className={styles.details}>
                    <strong>Join a Group</strong>
                    <p>Become part of a community</p>
                  </div>
                  <span className={styles.xp}>+10 XP</span>
                </div>
                <div className={styles.activity}>
                  <span className={styles.icon}>🏗️</span>
                  <div className={styles.details}>
                    <strong>Create a Group</strong>
                    <p>Start your own community</p>
                  </div>
                  <span className={styles.xp}>+25 XP</span>
                </div>
              </div>
            </div>

            <div className={styles.category}>
              <h4>Marketplace</h4>
              <div className={styles.activityList}>
                <div className={styles.activity}>
                  <span className={styles.icon}>🏪</span>
                  <div className={styles.details}>
                    <strong>List an Item</strong>
                    <p>Sell items in the marketplace</p>
                  </div>
                  <span className={styles.xp}>+12 XP</span>
                </div>
                <div className={styles.activity}>
                  <span className={styles.icon}>🛒</span>
                  <div className={styles.details}>
                    <strong>Make a Purchase</strong>
                    <p>Buy from other users</p>
                  </div>
                  <span className={styles.xp}>+8 XP</span>
                </div>
              </div>
            </div>

            <div className={styles.category}>
              <h4>Streaming</h4>
              <div className={styles.activityList}>
                <div className={styles.activity}>
                  <span className={styles.icon}>📺</span>
                  <div className={styles.details}>
                    <strong>Start a Stream</strong>
                    <p>Go live and engage viewers</p>
                  </div>
                  <span className={styles.xp}>+15 XP</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>🏆 Level Tiers</h3>
            <p>As you gain XP, you'll unlock new level tiers and badges!</p>

            <div className={styles.tierGrid}>
              <div className={styles.tier}>
                <span className={styles.tierIcon}>🌱</span>
                <div className={styles.tierInfo}>
                  <strong>Rookie</strong>
                  <span>Level 1-4</span>
                </div>
              </div>
              <div className={styles.tier}>
                <span className={styles.tierIcon}>🛡️</span>
                <div className={styles.tierInfo}>
                  <strong>Novice</strong>
                  <span>Level 5-9</span>
                </div>
              </div>
              <div className={styles.tier}>
                <span className={styles.tierIcon}>🗡️</span>
                <div className={styles.tierInfo}>
                  <strong>Adventurer</strong>
                  <span>Level 10-14</span>
                </div>
              </div>
              <div className={styles.tier}>
                <span className={styles.tierIcon}>🚀</span>
                <div className={styles.tierInfo}>
                  <strong>Rising Hero</strong>
                  <span>Level 15-24</span>
                </div>
              </div>
              <div className={styles.tier}>
                <span className={styles.tierIcon}>⚔️</span>
                <div className={styles.tierInfo}>
                  <strong>Skilled Warrior</strong>
                  <span>Level 25-34</span>
                </div>
              </div>
              <div className={styles.tier}>
                <span className={styles.tierIcon}>💎</span>
                <div className={styles.tierInfo}>
                  <strong>Expert Player</strong>
                  <span>Level 35-49</span>
                </div>
              </div>
              <div className={styles.tier}>
                <span className={styles.tierIcon}>⭐</span>
                <div className={styles.tierInfo}>
                  <strong>Master Gamer</strong>
                  <span>Level 50-74</span>
                </div>
              </div>
              <div className={styles.tier}>
                <span className={styles.tierIcon}>🏆</span>
                <div className={styles.tierInfo}>
                  <strong>Elite Champion</strong>
                  <span>Level 75-99</span>
                </div>
              </div>
              <div className={styles.tier}>
                <span className={styles.tierIcon}>👑</span>
                <div className={styles.tierInfo}>
                  <strong>Legendary Master</strong>
                  <span>Level 100+</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>💡 Pro Tips</h3>
            <div className={styles.tipsList}>
              <div className={styles.tip}>
                <span className={styles.icon}>📅</span>
                <span>Login daily to earn consistent XP bonuses</span>
              </div>
              <div className={styles.tip}>
                <span className={styles.icon}>💬</span>
                <span>
                  Engage with the community through posts and comments
                </span>
              </div>
              <div className={styles.tip}>
                <span className={styles.icon}>🎮</span>
                <span>Participate in gaming activities for bonus XP</span>
              </div>
              <div className={styles.tip}>
                <span className={styles.icon}>🏆</span>
                <span>
                  Create groups and engage with marketplace for higher XP
                  rewards
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
