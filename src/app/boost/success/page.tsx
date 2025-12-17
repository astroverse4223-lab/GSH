"use client";

import { Suspense } from "react";
import Link from "next/link";

function BoostSuccessContent() {
  return (
    <div className="bg-gray-900/40 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_50px_0_rgba(0,0,0,0.3)] w-full max-w-md mx-4 border border-gray-800/50 text-center">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
      <div className="relative">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-purple-400 mb-4">
          Boost Activated!
        </h1>

        <p className="text-gray-300 mb-6">
          Your post boost has been successfully activated and is now live!
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]">
            Back to Feed
          </Link>

          <Link
            href="/profile"
            className="block w-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 font-medium py-3 px-4 rounded-xl transition-all border border-gray-600">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BoostSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      <Suspense
        fallback={
          <div className="bg-gray-900/40 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_50px_0_rgba(0,0,0,0.3)] w-full max-w-md mx-4 border border-gray-800/50 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        }>
        <BoostSuccessContent />
      </Suspense>
    </div>
  );
}
