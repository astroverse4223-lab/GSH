import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Support - Realm of Legends",
  description: "Get in touch with the Realm of Legends support team",
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Contact & Support</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Support Section */}
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Get Support</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">🎮 General Support</h3>
                <p className="text-gray-300 mb-2">
                  Questions about your account, features, or general inquiries
                </p>
                <a
                  href="mailto:support@realmoflegends.info"
                  className="text-blue-400 hover:text-blue-300">
                  support@realmoflegends.info
                </a>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  💳 Billing & Subscriptions
                </h3>
                <p className="text-gray-300 mb-2">
                  Payment issues, subscription changes, refund requests
                </p>
                <a
                  href="mailto:billing@realmoflegends.info"
                  className="text-blue-400 hover:text-blue-300">
                  billing@realmoflegends.info
                </a>
              </div>

              <div>
                <h3 className="font-semibold mb-2">🔒 Privacy & Data</h3>
                <p className="text-gray-300 mb-2">
                  Privacy concerns, data requests, account deletion
                </p>
                <a
                  href="mailto:privacy@realmoflegends.info"
                  className="text-blue-400 hover:text-blue-300">
                  privacy@realmoflegends.info
                </a>
              </div>

              <div>
                <h3 className="font-semibold mb-2">🐛 Bug Reports</h3>
                <p className="text-gray-300 mb-2">
                  Found a bug? Technical issues or feature requests
                </p>
                <a
                  href="mailto:bugs@realmoflegends.info"
                  className="text-blue-400 hover:text-blue-300">
                  bugs@realmoflegends.info
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Quick Help Section */}
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Quick Help</h2>
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🚀 Getting Started</h3>
                <ul className="text-gray-300 space-y-1">
                  <li>• Create your profile and add gaming preferences</li>
                  <li>• Join groups related to your favorite games</li>
                  <li>• Start following other gamers</li>
                  <li>• Share your gaming achievements</li>
                </ul>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">💎 Premium Features</h3>
                <ul className="text-gray-300 space-y-1">
                  <li>• Post boosts for increased visibility</li>
                  <li>• Priority customer support</li>
                  <li>• Extended media storage</li>
                  <li>• Advanced gaming stats tracking</li>
                </ul>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🛡️ Account & Privacy</h3>
                <ul className="text-gray-300 space-y-1">
                  <li>• Update privacy settings in your profile</li>
                  <li>• Manage notification preferences</li>
                  <li>• Block or report inappropriate content</li>
                  <li>• Download your data or delete account</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Response Time */}
      <div className="mt-12 p-6 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">📞 Response Times</h3>
        <div className="grid md:grid-cols-2 gap-4 text-gray-300">
          <div>
            <strong className="text-blue-400">General Support:</strong> 24-48
            hours
          </div>
          <div>
            <strong className="text-blue-400">Billing Issues:</strong> 12-24
            hours
          </div>
          <div>
            <strong className="text-blue-400">Privacy Requests:</strong> 3-5
            business days
          </div>
          <div>
            <strong className="text-blue-400">Bug Reports:</strong> 48-72 hours
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="mt-8 pt-8 border-t border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Business Information</h3>
        <div className="text-gray-300 space-y-2">
          <p>
            <strong>Service Name:</strong> Realm of Legends
          </p>
          <p>
            <strong>Website:</strong> realmoflegends.info
          </p>
          <p>
            <strong>Business Hours:</strong> Monday - Friday, 9 AM - 6 PM EST
          </p>
          <p>
            <strong>Legal:</strong>
            <a
              href="/legal/privacy"
              className="text-blue-400 hover:text-blue-300 ml-2">
              Privacy Policy
            </a>{" "}
            |
            <a
              href="/legal/terms"
              className="text-blue-400 hover:text-blue-300 ml-2">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
