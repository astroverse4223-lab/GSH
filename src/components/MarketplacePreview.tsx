"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { ShoppingBag, TrendingUp, Clock, Star } from "lucide-react";
import styles from "./MarketplacePreview.module.css";

interface MarketplaceListing {
  id: string;
  title: string;
  price: number;
  images: { url: string }[];
  condition: string;
  createdAt: string;
}

interface MarketplacePreviewProps {
  className?: string;
}

export function MarketplacePreview({ className }: MarketplacePreviewProps) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentTheme } = useTheme();
  const router = useRouter();

  // Get theme-specific marketplace class
  const getMarketplaceThemeClass = () => {
    switch (currentTheme.id) {
      case "valorant":
        return styles.marketplaceValorant;
      case "cyberpunk2077":
        return styles.marketplaceCyberpunk;
      case "fortnite":
        return styles.marketplaceFortnite;
      case "matrix":
        return styles.marketplaceMatrix;
      case "synthwave":
        return styles.marketplaceSynthwave;
      case "witcher":
        return styles.marketplaceWitcher;
      case "ghostrunner":
        return styles.marketplaceGhostrunner;
      case "darksouls":
        return styles.marketplaceDarksouls;
      case "halo":
        return styles.marketplaceHalo;
      case "default":
      default:
        return styles.marketplaceDefault;
    }
  };

  useEffect(() => {
    async function fetchListings() {
      try {
        const response = await fetch("/api/marketplace/listings?limit=4");
        if (response.ok) {
          const data = await response.json();
          setListings(data);
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, []);

  if (isLoading) {
    return (
      <div className={`${styles.container} ${getMarketplaceThemeClass()}`}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <ShoppingBag className={styles.headerIcon} size={20} />
            <h3>Marketplace</h3>
            <TrendingUp className={styles.trendingIcon} size={16} />
          </div>
        </div>
        <div className={styles.loadingState}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.loadingSkeleton}>
              <div className={styles.skeletonImage}></div>
              <div className={styles.skeletonContent}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonPrice}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className={`${styles.container} ${getMarketplaceThemeClass()}`}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div className={styles.iconWrapper}>
              <ShoppingBag className={styles.headerIcon} size={20} />
            </div>
            <h3 className={styles.title}>Marketplace</h3>
          </div>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <ShoppingBag size={48} />
          </div>
          <h4 className={styles.emptyTitle}>No Items Available</h4>
          <p className={styles.emptyText}>
            Be the first to list something amazing!
          </p>
          <button
            onClick={() => router.push("/marketplace")}
            className={styles.exploreButton}>
            <svg
              className={styles.buttonIcon}
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Create Listing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.container} ${getMarketplaceThemeClass()} ${
        className || ""
      }`}>
      {/* Enhanced Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.iconWrapper}>
            <ShoppingBag className={styles.headerIcon} size={20} />
          </div>
          <h3 className={styles.title}>Marketplace</h3>
          <div className={styles.trendingBadge}>
            <TrendingUp className={styles.trendingIcon} size={14} />
            <span>Hot</span>
          </div>
        </div>
        <button
          onClick={() => router.push("/marketplace")}
          className={styles.viewAllHeader}>
          <span>View All</span>
          <svg
            className={styles.arrowIcon}
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className={styles.listingsGrid}>
        {listings.slice(0, 4).map((listing, index) => (
          <div
            key={listing.id}
            className={`${styles.listingCard} ${
              styles[`listing${index + 1}`]
            } ${styles[`delay${index}`]}`}
            onClick={() => router.push(`/marketplace?listing=${listing.id}`)}
            role="button"
            tabIndex={0}>
            <div className={styles.cardImageContainer}>
              {listing.images[0] ? (
                <Image
                  src={listing.images[0].url}
                  alt={listing.title}
                  fill
                  className={styles.cardImage}
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className={styles.placeholderImage}>
                  <ShoppingBag size={24} />
                  <span>No Image</span>
                </div>
              )}
              <div className={styles.conditionBadge}>
                <Star size={12} />
                {listing.condition}
              </div>
              <div className={styles.hoverOverlay}>
                <div className={styles.quickViewBtn}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Quick View
                </div>
              </div>
            </div>

            <div className={styles.cardContent}>
              <h4 className={styles.cardTitle}>{listing.title}</h4>
              <div className={styles.cardMeta}>
                <div className={styles.priceContainer}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.price}>
                    {listing.price.toFixed(2)}
                  </span>
                </div>
                <div className={styles.timeContainer}>
                  <Clock size={12} />
                  <span className={styles.timeAgo}>
                    {new Date(listing.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.cardGlow}></div>
            <div className={styles.shimmerEffect}></div>
          </div>
        ))}
      </div>

      {listings.length > 4 && (
        <div className={styles.moreItemsIndicator}>
          <div className={styles.moreItemsContent}>
            <div className={styles.moreIcon}>
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span>{listings.length - 4} more items available</span>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <button
          onClick={() => router.push("/marketplace")}
          className={styles.exploreButton}>
          <svg
            className={styles.buttonIcon}
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z"
              clipRule="evenodd"
            />
          </svg>
          Explore Marketplace
        </button>
      </div>
    </div>
  );
}
