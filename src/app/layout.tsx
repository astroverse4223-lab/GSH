import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import { AppLayout } from "@/components/AppLayout";
import { ParticleBackground } from "@/components/ParticleBackground";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gamer Social Hub",
  description: "A modern social network for gamers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GamerSocial",
  },
  icons: {
    icon: "/images/icon-192.png",
    apple: "/images/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GamerSocial" />
        <link rel="apple-touch-icon" href="/images/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Simple theme flash prevention without DOM manipulation
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme) {
                    console.log('Theme will load:', savedTheme);
                  }
                } catch (e) {
                  console.warn('Could not access localStorage');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.className} bg-gray-900 min-h-screen theme-loading`}
        suppressHydrationWarning>
        <Providers>
          <AppLayout>{children}</AppLayout>
          <ConditionalFooter />
          <ParticleBackground />
          <PWAInstallPrompt />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `,
          }}
        />
      </body>
    </html>
  );
}
