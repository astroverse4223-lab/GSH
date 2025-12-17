"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Modal } from "../ui/Modal";
import { UploadProgress } from "../ui/UploadProgress";
import RGBButton from "../ui/RGBButton";
import { uploadMedia } from "@/lib/uploadMedia";
import styles from "./CreateListingModal.module.css";

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: () => void;
}

export function CreateListingModal({
  isOpen,
  onClose,
  onListingCreated,
}: CreateListingModalProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    condition: "NEW",
    category: "GAMES",
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages((prev) => [...prev, ...files].slice(0, 5)); // Limit to 5 images
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    try {
      setIsSubmitting(true);

      // Upload images first
      const uploadedImages = await Promise.all(
        selectedImages.map(async (file) => {
          const url = await uploadMedia(file, (progress) => {
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: progress.progress,
            }));
          });
          return url;
        })
      );

      // Create listing
      const response = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          images: uploadedImages,
          userId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create listing");
      }

      onListingCreated();
      onClose();
      setFormData({
        title: "",
        description: "",
        price: "",
        condition: "NEW",
        category: "GAMES",
      });
      setSelectedImages([]);
      setUploadProgress({});
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Listing">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Title
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className={styles.input}
            required
            maxLength={100}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className={styles.textarea}
            required
            maxLength={1000}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.label}>
              Price ($)
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className={styles.input}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="condition" className={styles.label}>
              Condition
            </label>
            <select
              id="condition"
              value={formData.condition}
              onChange={(e) =>
                setFormData({ ...formData, condition: e.target.value })
              }
              className={styles.select}
              required>
              <option value="NEW">New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="category" className={styles.label}>
            Category
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className={styles.select}
            required>
            <option value="GAMES">Games</option>
            <option value="CONSOLES">Consoles</option>
            <option value="ACCESSORIES">Accessories</option>
            <option value="COLLECTIBLES">Collectibles</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Images (max 5)</label>
          <div className={styles.imageUpload}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className={styles.fileInput}
              disabled={selectedImages.length >= 5}
              aria-label="Upload listing images"
              title="Choose up to 5 images for your listing"
              id="listingImages"
            />
            <div className={styles.selectedImages}>
              {selectedImages.map((file, index) => (
                <div key={index} className={styles.imagePreview}>
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    width={100}
                    height={100}
                    className={styles.previewImage}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className={styles.removeImage}>
                    ✕
                  </button>
                  {uploadProgress[file.name] !== undefined && (
                    <UploadProgress
                      progress={uploadProgress[file.name]}
                      fileName={file.name}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <RGBButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}>
            Cancel
          </RGBButton>
          <RGBButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Listing"}
          </RGBButton>
        </div>
      </form>
    </Modal>
  );
}
