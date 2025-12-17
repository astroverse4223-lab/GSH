import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Gamer Social Hub",
  description: "Privacy Policy for Gamer Social Hub",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-lg text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. Information We Collect
          </h2>
          <p>
            Realm of Legends ("we," "our," or "us") operates realmoflegends.com.
            This page informs you of our policies regarding the collection, use,
            and disclosure of personal data when you use our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. How We Use Your Information
          </h2>
          <p>
            We use the information we collect to provide, maintain, and improve
            our services, process transactions, and communicate with you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. Payment Information
          </h2>
          <p>
            Payment information is processed by Stripe, our payment processor.
            We do not store your credit card information on our servers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibent mb-4">4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal
            information against unauthorized access, alteration, disclosure, or
            destruction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at: privacy@realmoflegends.info
          </p>
        </section>
      </div>
    </div>
  );
}
