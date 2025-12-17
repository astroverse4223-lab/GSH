"use client";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-500 mb-4">
            Authentication Error
          </h2>
        </div>

        <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="text-center space-y-4">
            <p className="text-gray-300">
              There was a problem signing you in. Please try again.
            </p>
            <div className="pt-4">
              <a
                href="/auth/signin"
                className="inline-block w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                Back to Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
