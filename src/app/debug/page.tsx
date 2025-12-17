"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function AuthDebug() {
  const { data: session, status } = useSession();
  const [providers, setProviders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Test if NextAuth API is working
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">NextAuth Debug Page</h1>

        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Session Status</h2>
            <p>
              <strong>Status:</strong> {status}
            </p>
            <p>
              <strong>Session Data:</strong>
            </p>
            <pre className="bg-gray-700 p-4 rounded mt-2 text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Available Providers</h2>
            {error ? (
              <div className="text-red-400">
                <p>
                  <strong>Error:</strong> {error}
                </p>
                <p>This means the NextAuth API is not working properly.</p>
              </div>
            ) : (
              <pre className="bg-gray-700 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(providers, null, 2)}
              </pre>
            )}
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
            <div className="text-sm">
              <p>
                <strong>Current URL:</strong>{" "}
                {typeof window !== "undefined" ? window.location.href : "N/A"}
              </p>
              <p>
                <strong>Expected NEXTAUTH_URL:</strong>{" "}
                https://realmoflegends.info
              </p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Quick Tests</h2>
            <div className="space-y-2">
              <button
                onClick={() => window.open("/api/auth/providers", "_blank")}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mr-4">
                Test Providers API
              </button>
              <button
                onClick={() => window.open("/api/auth/signin", "_blank")}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded mr-4">
                Test Sign-in API
              </button>
              <button
                onClick={() => window.open("/api/auth/session", "_blank")}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
                Test Session API
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
