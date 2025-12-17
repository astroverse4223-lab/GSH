"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Monitor } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    // Check if app is already installed (standalone mode)
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );

    // For iOS, show manual install instructions after some time
    if (isIOS && !isStandalone) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
    };
  }, [isIOS, isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  // Don't show if already installed or dismissed
  if (
    isStandalone ||
    !showInstallPrompt ||
    sessionStorage.getItem("pwa-prompt-dismissed")
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isIOS ? (
              <Smartphone className="w-6 h-6 text-white" />
            ) : (
              <Download className="w-6 h-6 text-white" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm">
              Install GamerSocial App
            </h3>

            {isIOS ? (
              <div className="text-white/90 text-xs mt-1">
                <p>
                  Tap <Monitor className="inline w-3 h-3" /> Share button
                </p>
                <p>Then "Add to Home Screen"</p>
              </div>
            ) : (
              <p className="text-white/90 text-xs mt-1">
                Get the full app experience with offline access and
                notifications
              </p>
            )}

            <div className="flex gap-2 mt-3">
              {!isIOS && (
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors">
                  Install
                </button>
              )}

              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white transition-colors"
                title="Dismiss install prompt"
                aria-label="Dismiss install prompt">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
