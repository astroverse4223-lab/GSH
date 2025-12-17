"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EmailVerifiedPage() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Email Verified!
          </h2>
          <div className="mt-4 text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Your email has been successfully verified.
          </p>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            You will be redirected to the homepage in {countdown} seconds.
          </p>
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Click here to go back now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
