"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getUserImageWithFallback } from "@/lib/fallback-images";
import styles from "./ProfilePicture.module.css";

interface ProfilePictureProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  userId?: string;
  userName?: string;
  className?: string;
}

export function ProfilePicture({
  src,
  alt,
  size = "md",
  userId,
  userName,
  className = "",
}: ProfilePictureProps) {
  const fallbackSrc = getUserImageWithFallback({
    image: src,
    name: userName || alt,
    id: userId,
  });

  const imageComponent = (
    <div className={`${styles.profilePicture} ${styles[size]} ${className}`}>
      <Image
        src={fallbackSrc}
        alt={alt}
        width={
          size === "xl" ? 150 : size === "lg" ? 64 : size === "md" ? 48 : 32
        }
        height={
          size === "xl" ? 150 : size === "lg" ? 64 : size === "md" ? 48 : 32
        }
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        unoptimized={true}
        priority={false}
      />
    </div>
  );

  if (userId) {
    const { data: session } = useSession();
    const isCurrentUser = session?.user?.id === userId;
    return (
      <Link href={isCurrentUser ? "/profile" : `/users/${userId}`}>
        {imageComponent}
      </Link>
    );
  }

  return imageComponent;
}
