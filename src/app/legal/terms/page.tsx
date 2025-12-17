import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Gamer Social Hub",
  description: "Terms of Service for Gamer Social Hub",
};

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and using Realm of Legends ("the Service") located at{" "}
            <strong>realmoflegends.com</strong>, you accept and agree to be
            bound by the terms and provision of this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. Subscription Services
          </h2>
          <p>
            Our premium subscriptions provide enhanced features including post
            boosts, priority support, and additional storage. Subscriptions are
            billed monthly and automatically renew unless cancelled.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Payment Terms</h2>
          <p>
            All payments are processed through Stripe. By subscribing, you agree
            to pay all charges associated with your account. Refunds are handled
            in accordance with our refund policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibent mb-4">4. Cancellation</h2>
          <p>
            You may cancel your subscription at any time through your account
            settings. Cancellations take effect at the end of the current
            billing period.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            5. Contact Information
          </h2>
          <p>
            For questions about these terms, please contact us at:
            support@realmoflegends.info
          </p>
        </section>
      </div>
    </div>
  );
}
