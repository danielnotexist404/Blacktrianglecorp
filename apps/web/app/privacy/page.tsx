import { LegalShell, LegalSection, LegalList } from "@/components/marketing/legal-shell";

export const metadata = {
  title: "Privacy Policy · BTG Trader",
  description:
    "How BTG Trader collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated="14 May 2026">
      <LegalSection number="01" title="Summary">
        <p>
          BTG Trader treats your data with the same discipline as your API
          keys. We collect the minimum needed to run the Service, we
          encrypt sensitive material at rest, and we never sell personal
          data to third parties.
        </p>
        <p>
          This Policy describes what we collect, how it is used, where it
          is stored, and your rights under GDPR and equivalent regimes.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Data we collect">
        <p>
          The Service collects the following categories of data:
        </p>
        <LegalList
          items={[
            <><strong>Account data</strong> — email address, hashed password (if using email auth), authentication provider identifiers (e.g. Google), preferred locale.</>,
            <><strong>Exchange API credentials</strong> — Bybit API key and secret, encrypted via AWS KMS envelope encryption. We also record the mode (demo or live) and the permission set verified at onboarding.</>,
            <><strong>Trading configuration</strong> — your risk caps, LVN focus mode, notification preferences, and other settings you choose in the dashboard.</>,
            <><strong>Execution data</strong> — orders submitted on your behalf, fills, stop-loss events, position lifecycle, and the signal that triggered each action.</>,
            <><strong>Usage and technical data</strong> — IP address, user-agent, page paths, error traces (via Sentry), and timestamps. Used for security, debugging, and rate-limit enforcement.</>,
            <><strong>Billing data</strong> — when paid subscriptions are active, billing is handled by Paddle. We receive subscription state, not full payment instruments.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="03" title="How we use it">
        <LegalList
          items={[
            <><strong>To run the Service</strong> — authenticate you, execute the strategy on your account, surface positions and signals on the dashboard.</>,
            <><strong>To protect your account</strong> — detect unauthorised access, enforce withdraw-permission rejection on key onboarding, monitor for anomalous behaviour.</>,
            <><strong>To communicate with you</strong> — transactional emails (sign-in links, security alerts, order events), service updates, and responses to support requests.</>,
            <><strong>To comply with law</strong> — meet our obligations under applicable financial-software, consumer-protection, tax, and data-protection regulation.</>,
          ]}
        />
        <p>
          We do not use your trading data, your strategy configuration, or
          your fills to train models, sell signals to third parties, or
          create derivative products.
        </p>
      </LegalSection>

      <LegalSection number="04" title="Where it is stored">
        <LegalList
          items={[
            <><strong>Application data</strong> — Supabase Postgres, hosted in a region disclosed at onboarding. Row-level security is applied per user.</>,
            <><strong>Secrets</strong> — encrypted API key material is stored in Supabase, wrapped under an AWS KMS data key. The KMS key is never exported from KMS.</>,
            <><strong>Logs</strong> — operational logs are stored in our log provider with 30-day retention. Logs are scrubbed at write time to remove API keys, secrets, and request bodies that may contain credentials.</>,
            <><strong>Error traces</strong> — captured by Sentry with PII scrubbing rules enabled.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="05" title="Who we share it with">
        <p>
          We share data only with sub-processors required to operate the
          Service:
        </p>
        <LegalList
          items={[
            <><strong>Bybit</strong> — your API key is used to place orders against your Bybit account. Bybit independently processes that data under its own privacy policy.</>,
            <><strong>Supabase</strong> — primary database and authentication provider.</>,
            <><strong>Amazon Web Services</strong> — KMS for envelope encryption of secret material.</>,
            <><strong>Paddle</strong> — Merchant of Record for paid subscriptions, when billing is active.</>,
            <><strong>Sentry</strong> — error and crash telemetry.</>,
            <><strong>Email provider</strong> — transactional email delivery.</>,
          ]}
        />
        <p>
          We do not sell personal data, share it for cross-context
          behavioural advertising, or transfer it for any purpose unrelated
          to operating the Service.
        </p>
      </LegalSection>

      <LegalSection number="06" title="Cookies and similar technologies">
        <p>
          We use a small number of strictly-necessary cookies to keep you
          signed in and to remember preferences such as your selected
          trading mode. We do not use third-party advertising cookies or
          cross-site tracking pixels.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Your rights">
        <p>
          If you are in the European Economic Area, the United Kingdom, or
          a jurisdiction with equivalent rights, you have the right to:
        </p>
        <LegalList
          items={[
            <><strong>Access</strong> the personal data we hold about you.</>,
            <><strong>Correct</strong> data that is inaccurate or incomplete.</>,
            <><strong>Delete</strong> your account and associated personal data, subject to retention obligations.</>,
            <><strong>Restrict</strong> or <strong>object</strong> to certain processing.</>,
            <><strong>Port</strong> your data to another controller in a structured, machine-readable format.</>,
            <><strong>Lodge a complaint</strong> with your local supervisory authority.</>,
          ]}
        />
        <p>
          You can exercise most of these rights from the Settings page. For
          anything not self-serve, email{" "}
          <a href="mailto:privacy@secureops.co.il">privacy@secureops.co.il</a>.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Data retention">
        <LegalList
          items={[
            <>Account and trading data: retained for the lifetime of your account, plus a residual period required by tax and accounting law.</>,
            <>API key encrypted material: retained until you revoke the key, then crypto-shredded.</>,
            <>Operational logs: 30 days.</>,
            <>Backups: 30 days rolling.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="09" title="International transfers">
        <p>
          Where personal data is transferred outside your home jurisdiction,
          we rely on the Standard Contractual Clauses adopted by the
          European Commission, or other lawful transfer mechanism as
          appropriate.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Children">
        <p>
          The Service is not directed to children under 18. We do not
          knowingly collect personal data from minors. If you believe a
          minor has provided personal data, email us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Changes to this Policy">
        <p>
          We may revise this Policy from time to time. Material changes
          will be notified by email and in the dashboard at least fifteen
          days before they take effect.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Contact">
        <p>
          Privacy enquiries:{" "}
          <a href="mailto:privacy@secureops.co.il">privacy@secureops.co.il</a>.
          Data Protection contact:{" "}
          <a href="mailto:dpo@secureops.co.il">dpo@secureops.co.il</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
