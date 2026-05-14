import { LegalShell, LegalSection, LegalList } from "@/components/marketing/legal-shell";

export const metadata = {
  title: "Terms of Service · BTG Trader",
  description:
    "Terms of Service for BTG Trader — a non-custodial automated trading software for Bybit perpetual futures.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" lastUpdated="14 May 2026">
      <LegalSection number="01" title="Acceptance">
        <p>
          These Terms govern your use of the BTG Trader website, dashboard,
          and strategy execution software (collectively, the{" "}
          <strong>Service</strong>) operated by Black Triangle Group{" "}
          (<strong>BTG</strong>, <strong>we</strong>, <strong>us</strong>).
          By creating an account or using any part of the Service, you agree
          to be bound by these Terms.
        </p>
        <p>
          If you do not agree, do not use the Service.
        </p>
      </LegalSection>

      <LegalSection number="02" title="What the Service is">
        <p>
          BTG Trader is <strong>non-custodial trading software</strong>. We
          do not hold your funds, your private keys, or your exchange
          balances at any point. The Service connects to your own Bybit
          account via API keys that you provide, with Read and Trade
          permissions only — never Withdraw.
        </p>
        <p>
          The Service is not investment advice, a recommendation, or a
          solicitation to buy or sell any asset. It is a software tool that
          executes a deterministic rule set against market data.
        </p>
      </LegalSection>

      <LegalSection number="03" title="Eligibility">
        <LegalList
          items={[
            <>You are at least 18 years old.</>,
            <>You are not a resident of the United States, or any jurisdiction in which automated trading software or crypto derivative products are restricted by local law.</>,
            <>You have full legal capacity to enter into a binding agreement.</>,
            <>You are using the Service for your own account, not as a regulated investment advisor or fund manager.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="04" title="Accounts and credentials">
        <p>
          You are responsible for keeping your account credentials secure.
          You agree to notify us promptly if you believe your account has
          been accessed without your authorisation.
        </p>
        <p>
          You may create only one account per natural person. We reserve the
          right to suspend accounts that appear to be duplicates, automated,
          or used in violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Exchange API keys">
        <p>
          When you connect a Bybit API key:
        </p>
        <LegalList
          items={[
            <>You grant us a limited authority to place orders on your behalf, restricted to the symbols and risk caps you configure in the dashboard.</>,
            <>We verify, on every key onboarding, that the key does not carry Withdraw permission. Keys with Withdraw enabled are rejected and never stored.</>,
            <>Keys are encrypted with AWS KMS envelope encryption at rest, and decrypted in memory only at the moment of order submission.</>,
            <>You may revoke a key at any time from the dashboard. On revoke, the encrypted material is crypto-shredded.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="06" title="Demo mode versus live mode">
        <p>
          The Service offers two modes:
        </p>
        <LegalList
          items={[
            <><strong>Demo mode</strong> — connects to Bybit testnet (<code>api-testnet.bybit.com</code>) using your testnet API key. No real funds are at risk. Use this to evaluate the strategy and the platform.</>,
            <><strong>Live mode</strong> — connects to Bybit mainnet using a mainnet API key. Real orders, real funds. Live mode unlocks per user after sixty consecutive days of successful paper or demo execution.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="07" title="Subscriptions and billing">
        <p>
          Paid subscription tiers will be introduced at public beta. Until
          then, the Service is provided free of charge in pre-MVP form.
          When billing is active, payments will be processed by{" "}
          <strong>Paddle</strong> as Merchant of Record, who collects
          applicable taxes on our behalf.
        </p>
        <p>
          Subscriptions renew automatically unless cancelled. Refunds are
          handled per Paddle&apos;s policy. Cancelling a subscription does not
          retroactively refund prior periods.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Acceptable use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            <>Reverse-engineer, decompile, or attempt to extract the strategy logic from compiled artefacts.</>,
            <>Use the Service to provide trading signals or automated execution to third parties without our written agreement.</>,
            <>Attempt to bypass the Withdraw-permission check on API key onboarding.</>,
            <>Interfere with the Service, attempt to gain unauthorised access, or use the API outside of its documented rate limits.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="09" title="Disclaimer of warranties">
        <p>
          The Service is provided <strong>as-is</strong> and{" "}
          <strong>as-available</strong> without warranties of any kind, express
          or implied, including merchantability, fitness for a particular
          purpose, accuracy of market data, or non-infringement.
        </p>
        <p>
          We do not warrant that the Service will be uninterrupted,
          error-free, or that any particular trading outcome will result from
          its use. Past performance is not indicative of future results.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, BTG, its affiliates,
          officers, and contractors will not be liable for any indirect,
          incidental, consequential, special, or exemplary damages, including
          loss of profits, trading losses, or data loss, arising from your
          use of the Service.
        </p>
        <p>
          Our aggregate liability for any direct damages will not exceed the
          amount you paid us in the twelve months immediately preceding the
          event giving rise to the claim, or one hundred United States
          dollars, whichever is greater.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Indemnification">
        <p>
          You agree to indemnify and hold harmless BTG and its affiliates
          from any claims, damages, or expenses arising from your use of the
          Service, your breach of these Terms, or your violation of any
          third-party rights.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Termination">
        <p>
          We may suspend or terminate your access to the Service at any time
          for breach of these Terms, suspected fraud, or regulatory
          requirement. You may close your account at any time from the
          Settings page; on closure, your API keys are crypto-shredded and
          your data is deleted per our Privacy Policy retention schedule.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Changes to these Terms">
        <p>
          We may revise these Terms from time to time. Material changes will
          be notified via the dashboard and by email at least fifteen days
          before they take effect. Continued use after the effective date
          constitutes acceptance of the revised Terms.
        </p>
      </LegalSection>

      <LegalSection number="14" title="Governing law">
        <p>
          These Terms are governed by the laws of the State of Israel,
          excluding its conflict of laws provisions. Any dispute will be
          resolved in the competent courts of Tel Aviv-Yafo, Israel, unless
          otherwise required by mandatory consumer protection law in your
          place of residence.
        </p>
      </LegalSection>

      <LegalSection number="15" title="Contact">
        <p>
          Questions about these Terms can be sent to{" "}
          <a href="mailto:support@secureops.co.il">support@secureops.co.il</a>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
