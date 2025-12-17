"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";

import { Announcements } from "@/components/Announcements";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <Announcements />
      <div className="flex flex-col items-center justify-center gap-8 py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          Welcome to Gamer Social Hub
        </h1>
        <p className="text-xl text-gray-300 text-center max-w-2xl">
          Connect with gamers. Share your achievements. Join the community.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {/* Feature Cards */}
          <div className="glass-effect p-6 rounded-xl hover:scale-105 transition-transform">
            <h2 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Global Feed
            </h2>
            <p className="text-gray-300">
              Share updates, clips, and achievements with the gaming community
            </p>
          </div>
          <div className="glass-effect p-6 rounded-xl hover:scale-105 transition-transform">
            <h2 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-600">
              Gaming Groups
            </h2>
            <p className="text-gray-300">
              Join communities or create your own gaming clan
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition">
            <h2 className="text-2xl font-semibold mb-4 neon-text-primary">
              Marketplace
            </h2>
            <p className="text-gray-400">
              Trade items, game codes, and connect with other players
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
