import { useState } from "react";
import styles from "./ProfileMusicPlayer.module.css";

interface ProfileMusicPlayerProps {
  musicUrl: string | null;
  onSave: (url: string) => void;
  isEditing: boolean;
}

export function ProfileMusicPlayer({
  musicUrl,
  onSave,
  isEditing,
}: ProfileMusicPlayerProps) {
  const [inputUrl, setInputUrl] = useState(musicUrl || "");
  const [error, setError] = useState("");

  const validateAndExtractPlaylistId = (url: string) => {
    try {
      const spotifyMatch = url.match(
        /spotify.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/
      );
      if (spotifyMatch) {
        return spotifyMatch[2];
      }
      throw new Error("Invalid Spotify URL");
    } catch (err) {
      setError("Please enter a valid Spotify URL (track, playlist, or album)");
      return null;
    }
  };

  const handleSave = () => {
    const id = validateAndExtractPlaylistId(inputUrl);
    if (id) {
      setError("");
      onSave(inputUrl);
    }
  };

  const getEmbedUrl = (url: string) => {
    const id = validateAndExtractPlaylistId(url);
    if (!id) return null;

    if (url.includes("playlist")) {
      return `https://open.spotify.com/embed/playlist/${id}`;
    } else if (url.includes("album")) {
      return `https://open.spotify.com/embed/album/${id}`;
    } else if (url.includes("track")) {
      return `https://open.spotify.com/embed/track/${id}`;
    }
    return null;
  };

  // Debug info
  console.log("Music Player Props:", { musicUrl, isEditing });

  // Always show the component when editing, or when there's a music URL
  if (!isEditing && !musicUrl) {
    return (
      <div className={styles.musicPlayer}>
        <p className={styles.placeholder}>No music added yet</p>
      </div>
    );
  }

  return (
    <div className={styles.musicPlayer}>
      {isEditing ? (
        <div className={styles.editContainer}>
          <input
            type="text"
            value={inputUrl}
            placeholder="Enter Spotify URL (track, playlist, or album)"
            onChange={(e) => setInputUrl(e.target.value)}
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button onClick={handleSave} className={styles.saveButton}>
            Save Music
          </button>
        </div>
      ) : musicUrl ? (
        <div className={styles.playerContainer}>
          <iframe
            src={getEmbedUrl(musicUrl) || ""}
            width="100%"
            height="200"
            frameBorder="0"
            allow="encrypted-media"
            title="Profile Music"
            className={styles.spotifyEmbed}
          />
        </div>
      ) : null}
    </div>
  );
}
