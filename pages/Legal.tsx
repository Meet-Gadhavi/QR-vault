import React from 'react';

const LegalLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="max-w-4xl mx-auto px-4 py-16">
    <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">{title}</h1>
    <div className="prose prose-slate max-w-none text-gray-600 space-y-6">
      {children}
    </div>
  </div>
);

export const Privacy: React.FC = () => (
  <LegalLayout title="Privacy Policy">
    <p>Welcome to QR Vault. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.</p>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
      <p>When you use QR Vault, we may collect the following types of information:</p>
      <div className="ml-4 space-y-4 mt-2">
        <div>
          <h3 className="font-semibold text-gray-800">Account Information</h3>
          <ul className="list-disc ml-5">
            <li>Email address</li>
            <li>Login credentials</li>
            <li>Authentication data when signing in through Google</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">User Content</h3>
          <ul className="list-disc ml-5">
            <li>Files uploaded such as photos, PDFs, ZIP files, or other documents</li>
            <li>Links and QR codes created through the platform</li>
            <li>Metadata related to stored files</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Usage Data</h3>
          <ul className="list-disc ml-5">
            <li>Device information</li>
            <li>Browser type</li>
            <li>Pages visited</li>
            <li>IP address and activity logs</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Payment Information</h3>
          <p>When you purchase a subscription, payment processing is handled securely by Razorpay. QR Vault does not store your full card details or sensitive financial information.</p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul className="list-disc ml-5">
        <li>Provide and maintain our services</li>
        <li>Store and manage files linked to QR codes</li>
        <li>Enable file sharing and downloading</li>
        <li>Improve platform performance and user experience</li>
        <li>Process subscription payments</li>
        <li>Communicate updates, notifications, or support responses</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">3. Cookies and Tracking Technologies</h2>
      <p>QR Vault may use cookies and similar tracking technologies to:</p>
      <ul className="list-disc ml-5">
        <li>Keep users logged in</li>
        <li>Analyze website traffic</li>
        <li>Improve user experience</li>
        <li>Display relevant advertisements through Google AdSense</li>
      </ul>
      <p className="mt-2">Users can disable cookies through their browser settings, though some features may not function properly.</p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">4. Third-Party Services</h2>
      <p>QR Vault uses trusted third-party services to operate the platform:</p>
      <ul className="list-disc ml-5">
        <li>Supabase – database, authentication, and storage</li>
        <li>Google OAuth – for secure login</li>
        <li>Google Drive – optional file storage integration</li>
        <li>Google AdSense – advertisement services</li>
        <li>Razorpay – payment processing</li>
      </ul>
      <p className="mt-2 text-sm italic">These services may collect limited data according to their own privacy policies.</p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Storage and Security</h2>
      <p>QR Vault stores user data using secure cloud infrastructure. We implement reasonable technical measures to protect stored data from unauthorized access, alteration, or loss.</p>
      <p className="mt-2">However, no internet service is completely secure, and users should avoid uploading sensitive personal or confidential data.</p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
      <p>Files and data may remain stored until:</p>
      <ul className="list-disc ml-5">
        <li>The user deletes them</li>
        <li>The account is terminated</li>
        <li>Storage limits are exceeded</li>
        <li>The user cancels the service</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact Information</h2>
      <p>If you have questions about this Privacy Policy, you may contact us at:</p>
      <p className="font-semibold text-primary-600">support@qrvault.app</p>
    </section>
  </LegalLayout>
);

export const Terms: React.FC = () => (
  <LegalLayout title="Terms & Conditions">
    <p>Welcome to QR Vault. By using this service, you agree to the following terms and conditions.</p>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
      <p>By accessing or using QR Vault, you confirm that you agree to comply with these terms.</p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">2. User Responsibilities</h2>
      <p>Users are responsible for:</p>
      <ul className="list-disc ml-5">
        <li>Maintaining account security</li>
        <li>Ensuring uploaded content is legal</li>
        <li>Managing QR codes and shared files properly</li>
        <li>Protecting access credentials</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">3. Acceptable Usage</h2>
      <p>Users may use QR Vault to:</p>
      <ul className="list-disc ml-5">
        <li>Upload files</li>
        <li>Share content using QR codes</li>
        <li>Store documents or links</li>
      </ul>
      <p className="mt-2">The platform should not be used for illegal, harmful, or malicious purposes.</p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">4. Prohibited Content</h2>
      <p>Users are not allowed to upload or distribute:</p>
      <ul className="list-disc ml-5">
        <li>Illegal files</li>
        <li>Malware or harmful software</li>
        <li>Copyright-violating content</li>
        <li>Offensive or abusive material</li>
        <li>Content intended for phishing or scams</li>
      </ul>
      <p className="mt-2 font-semibold text-red-600">Accounts violating these rules may be suspended.</p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">5. Subscription Terms</h2>
      <p>QR Vault offers subscription plans with different storage limits.</p>
      <p>Subscriptions may:</p>
      <ul className="list-disc ml-5">
        <li>Renew periodically</li>
        <li>Require payment through Razorpay</li>
        <li>Be canceled by the user at any time</li>
      </ul>
      <p className="mt-2">Features and pricing may change without prior notice.</p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">6. Account Suspension or Termination</h2>
      <p>QR Vault reserves the right to suspend or terminate accounts that:</p>
      <ul className="list-disc ml-5">
        <li>Violate these terms</li>
        <li>Abuse platform resources</li>
        <li>Attempt unauthorized access or misuse services</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">7. Service Availability</h2>
      <p>While we aim to maintain high uptime, QR Vault does not guarantee uninterrupted service and may perform maintenance or upgrades when necessary.</p>
    </section>
  </LegalLayout>
);

export const RefundPolicy: React.FC = () => (
  <LegalLayout title="Refund & Cancellation Policy">
    <p>QR Vault provides subscription services with defined refund and cancellation conditions.</p>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">1. Refund Eligibility</h2>
      <p>Users may request a refund within 7 days of purchase if the service has not been significantly used.</p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">2. Non-Refundable Situations</h2>
      <p>Refunds may not be issued if:</p>
      <ul className="list-disc ml-5">
        <li>Storage has been substantially used</li>
        <li>The account has violated terms</li>
        <li>The refund request is submitted after the eligible period</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">3. Cancellation</h2>
      <p>Users may cancel their subscription at any time. After cancellation:</p>
      <ul className="list-disc ml-5">
        <li>The plan will remain active until the end of the billing cycle</li>
        <li>No additional charges will be applied</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">4. Refund Processing</h2>
      <p>Approved refunds are processed through Razorpay and may take 5–10 business days to appear in the original payment method.</p>
    </section>
  </LegalLayout>
);
