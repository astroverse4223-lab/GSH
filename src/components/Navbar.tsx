"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Home,
  MessageCircle,
  Trophy,
  Gamepad2,
  Users,
  ShoppingCart,
  Tv,
  Bell,
  ChevronDown,
  User,
  Settings,
  CreditCard,
  Shield,
  Search,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { ThemeSelector } from "./ThemeSelector";
import { UserSearch } from "./UserSearch";
import NotificationBell from "./NotificationBell";
import styles from "./Navbar.module.css";
import { getUserImageWithFallback } from "@/lib/fallback-images";

export const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const { currentTheme } = useTheme();
  const router = useRouter();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  // Close mobile menu when clicking outside or on navigation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Also close menu on escape key
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setMobileMenuOpen(false);
        }
      };
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [mobileMenuOpen]);

  // Get theme-specific navbar class
  const getNavbarThemeClass = () => {
    switch (currentTheme.id) {
      case "valorant":
        return styles.navbarValorant;
      case "cyberpunk2077":
        return styles.navbarCyberpunk;
      case "fortnite":
        return styles.navbarFortnite;
      case "matrix":
        return styles.navbarMatrix;
      case "synthwave":
        return styles.navbarSynthwave;
      case "witcher":
        return styles.navbarWitcher;
      case "ghostrunner":
        return styles.navbarGhostrunner;
      case "darksouls":
        return styles.navbarDarksouls;
      case "halo":
        return styles.navbarHalo;
      case "default":
      default:
        return styles.navbarDefault;
    }
  };

  return (
    <nav className={`${styles.navbar} ${getNavbarThemeClass()}`}>
      <div className={styles.container}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <Link href="/" className={styles.logoContainer}>
            <Image
              src="/images/shieldLogo.png"
              alt="Gaming Logo"
              width={40}
              height={40}
              className={styles.logo}
            />
            <span className={styles.logoText}>GSH</span>
          </Link>
        </div>

        {/* Navigation Icons - Desktop */}
        <div className={styles.navSection}>
          <Link href="/feed" className={styles.navIcon} title="Feed">
            <Home size={20} />
            <span className={styles.navLabel}>Feed</span>
          </Link>
          <Link href="/messages" className={styles.navIcon} title="Messages">
            <MessageCircle size={20} />
            <span className={styles.navLabel}>Messages</span>
          </Link>
          <Link
            href="/leaderboard"
            className={styles.navIcon}
            title="Leaderboard">
            <Trophy size={20} />
            <span className={styles.navLabel}>Leaderboard</span>
          </Link>
          <Link href="/games/arcade" className={styles.navIcon} title="Arcade">
            <Gamepad2 size={20} />
            <span className={styles.navLabel}>Arcade</span>
          </Link>
          <Link href="/groups" className={styles.navIcon} title="Groups">
            <Users size={20} />
            <span className={styles.navLabel}>Groups</span>
          </Link>
          <Link href="/marketplace" className={styles.navIcon} title="Market">
            <ShoppingCart size={20} />
            <span className={styles.navLabel}>Market</span>
          </Link>
          <Link href="/streams" className={styles.navIcon} title="Streams">
            <Tv size={20} />
            <span className={styles.navLabel}>Streams</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          title="Menu">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* User Section */}
        <div className={styles.userSection}>
          {status === "loading" ? (
            <div className={styles.loadingAvatar}></div>
          ) : session?.user ? (
            <>
              {/* Search Dropdown */}
              <div className={styles.searchDropdown}>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className={styles.searchButton}
                  title="Search Users">
                  <Search size={20} />
                </button>

                {searchOpen && (
                  <div className={styles.searchMenu}>
                    <UserSearch />
                  </div>
                )}
              </div>

              <NotificationBell />

              {/* User Dropdown with Profile Picture */}
              <div className={styles.userDropdown}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setUserDropdownOpen(!userDropdownOpen);
                  }}
                  className={styles.userButton}>
                  <Image
                    src={getUserImageWithFallback(session.user)}
                    alt={session.user.name || "Profile"}
                    width={28}
                    height={28}
                    className={styles.userProfileImage}
                    unoptimized
                  />
                  <span className={styles.userName}>{session.user.name}</span>
                  <ChevronDown
                    size={16}
                    className={
                      userDropdownOpen ? styles.chevronUp : styles.chevronDown
                    }
                  />
                </button>

                {userDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link href="/profile" className={styles.dropdownItem}>
                      <User size={16} />
                      <span>Profile</span>
                    </Link>
                    <Link href="/subscription" className={styles.dropdownItem}>
                      <CreditCard size={16} />
                      <span>Subscription</span>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className={styles.dropdownItem}>
                        <Shield size={16} />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className={styles.dropdownItem}>
                      <Settings size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/auth/signin" className={styles.signInButton}>
              Sign In
            </Link>
          )}

          <ThemeSelector />
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu} ref={mobileMenuRef}>
          <div className={styles.mobileMenuContent}>
            {/* Mobile Search Section */}
            <div className={styles.mobileSearchWrapper}>
              <UserSearch />
            </div>

            <Link
              href="/feed"
              className={styles.mobileNavItem}
              onClick={() => setMobileMenuOpen(false)}>
              <Home size={20} />
              <span>Feed</span>
            </Link>
            <Link
              href="/messages"
              className={styles.mobileNavItem}
              onClick={() => setMobileMenuOpen(false)}>
              <MessageCircle size={20} />
              <span>Messages</span>
            </Link>
            <Link
              href="/leaderboard"
              className={styles.mobileNavItem}
              onClick={() => setMobileMenuOpen(false)}>
              <Trophy size={20} />
              <span>Leaderboard</span>
            </Link>
            <Link
              href="/games/arcade"
              className={styles.mobileNavItem}
              onClick={() => setMobileMenuOpen(false)}>
              <Gamepad2 size={20} />
              <span>Arcade</span>
            </Link>
            <Link
              href="/groups"
              className={styles.mobileNavItem}
              onClick={() => setMobileMenuOpen(false)}>
              <Users size={20} />
              <span>Groups</span>
            </Link>
            <Link
              href="/marketplace"
              className={styles.mobileNavItem}
              onClick={() => setMobileMenuOpen(false)}>
              <ShoppingCart size={20} />
              <span>Market</span>
            </Link>
            <Link
              href="/streams"
              className={styles.mobileNavItem}
              onClick={() => setMobileMenuOpen(false)}>
              <Tv size={20} />
              <span>Streams</span>
            </Link>

            {/* Mobile User Section */}
            {session?.user && (
              <div className={styles.mobileUserSection}>
                <Link
                  href="/profile"
                  className={styles.mobileNavItem}
                  onClick={() => setMobileMenuOpen(false)}>
                  <User size={20} />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/subscription"
                  className={styles.mobileNavItem}
                  onClick={() => setMobileMenuOpen(false)}>
                  <CreditCard size={20} />
                  <span>Subscription</span>
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={styles.mobileNavItem}
                    onClick={() => setMobileMenuOpen(false)}>
                    <Shield size={20} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className={styles.mobileNavItem}>
                  <Settings size={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {!session?.user && (
              <Link
                href="/auth/signin"
                className={styles.mobileSignInButton}
                onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
