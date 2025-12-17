"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProfilePicture } from "../ui/ProfilePicture";
import RGBButton from "../ui/RGBButton";
import { GlowCard } from "../ui/GlowCard";
import { formatDistanceToNow } from "date-fns";
import styles from "./MarketplaceListing.module.css";

interface MarketplaceListingProps {
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    condition: string;
    category: string;
    images: { url: string }[];
    status: string;
    createdAt: Date;
    seller: {
      id: string;
      name: string;
      image: string;
    };
  };
  onDelete?: () => void;
}

export function MarketplaceListing({
  listing,
  onDelete,
}: MarketplaceListingProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isContactingSeller, setIsContactingSeller] = useState(false);

  const handleContactSeller = async () => {
    if (!session?.user) {
      router.push("/auth/signin?callbackUrl=/messages");
      return;
    }

    if (session.user.id === listing.seller.id) {
      return; // Can't message yourself
    }

    setIsContactingSeller(true);
    try {
      // Create or find a conversation with the seller
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId: listing.seller.id,
          message: `Hi, I'm interested in your listing: ${listing.title}`,
          listingId: listing.id,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create conversation");
      }

      const { conversationId } = await response.json();
      router.push(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setIsContactingSeller(false);
    }
  };

  const handleDeleteClick = () => {
    if (!session?.user || session.user.id !== listing.seller.id) return;
    setShowConfirmDelete(true);
  };

  const handleDelete = async () => {
    if (!session?.user || session.user.id !== listing.seller.id) return;

    setIsDeleting(true);
    try {
      console.log("Deleting listing:", listing.id);
      const response = await fetch(`/api/marketplace/listings/${listing.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to delete listing");

      // Call the onDelete callback to update the UI immediately
      onDelete?.();
      router.refresh(); // Also refresh for good measure
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Failed to delete listing. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <GlowCard className={styles.listingCard}>
      <div className={styles.imageContainer}>
        {listing.images[0]?.url && (
          <Image
            src={listing.images[0].url}
            alt={listing.title}
            fill
            className={styles.image}
            priority
          />
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{listing.title}</h3>
          <span className={styles.price}>${listing.price}</span>
        </div>
        <div className={styles.sellerInfo}>
          <ProfilePicture
            src={listing.seller.image}
            alt={listing.seller.name}
            size="sm"
            userId={listing.seller.id}
            userName={listing.seller.name}
          />
          <Link
            href={
              session?.user?.id === listing.seller.id
                ? "/profile"
                : `/users/${listing.seller.id}`
            }
            className={styles.sellerName}>
            {listing.seller.name}
          </Link>
          <span className={styles.timestamp}>
            {formatDistanceToNow(new Date(listing.createdAt))} ago
          </span>
        </div>
        <p className={styles.description}>{listing.description}</p>
        <div className={styles.details}>
          <span className={styles.badge}>{listing.condition}</span>
          <span className={styles.badge}>{listing.category}</span>
        </div>
        <div className={styles.actions}>
          {session?.user?.id !== listing.seller.id ? (
            <RGBButton
              onClick={handleContactSeller}
              disabled={isContactingSeller}
              className={styles.contactButton}>
              {isContactingSeller ? "Opening Chat..." : "Contact Seller"}
            </RGBButton>
          ) : (
            <>
              {showConfirmDelete ? (
                <div className={styles.confirmDelete}>
                  <p className={styles.confirmText}>Delete this listing?</p>
                  <div className={styles.confirmButtons}>
                    <RGBButton
                      onClick={handleDelete}
                      variant="ghost"
                      disabled={isDeleting}
                      className={`${styles.confirmButton} !text-red-500 !border-red-500/30 hover:!bg-red-500/10`}>
                      {isDeleting ? "Deleting..." : "Yes, Delete"}
                    </RGBButton>
                    <RGBButton
                      onClick={() => setShowConfirmDelete(false)}
                      variant="ghost"
                      disabled={isDeleting}
                      className={`${styles.cancelButton} !text-gray-400 !border-gray-400/30 hover:!bg-gray-400/10`}>
                      Cancel
                    </RGBButton>
                  </div>
                </div>
              ) : (
                <RGBButton
                  onClick={handleDeleteClick}
                  variant="ghost"
                  className={`${styles.deleteButton} !text-red-500 !border-red-500/30 hover:!bg-red-500/10`}>
                  Delete Listing
                </RGBButton>
              )}
            </>
          )}
        </div>
      </div>
    </GlowCard>
  );
}
