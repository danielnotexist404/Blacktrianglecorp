import { LegalShell, LegalSection, LegalList } from "@/components/marketing/legal-shell";

export const metadata = {
  title: "Risk Disclosure · BTG Trader",
  description:
    "The risks of trading crypto perpetual futures with automated software.",
};

export default function RiskDisclosurePage() {
  return (
    <LegalShell title="Risk Disclosure" lastUpdated="14 May 2026">
      <LegalSection number="01" title="Read this first">
        <p>
          Trading cryptocurrency derivatives with automated software is{" "}
          <strong>high-risk</strong>. You can lose your entire deposit, and
          in some cases more than your deposit, in a short period. This
          page summarises the material risks of using BTG Trader. If any
          of it is unclear, do not use the Service until it is.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Software, not advice">
        <p>
          BTG Trader is a software tool. It executes a deterministic rule
          set against market data on your behalf. It is{" "}
          <strong>not</strong> investment advice, a recommendation, a
          portfolio service, or a managed account. We are not registered
          as a financial advisor, broker, or asset manager in any
          jurisdiction.
        </p>
        <p>
          Every order placed is your decision, expressed through the
          configuration you set in the dashboard and the API key you
          provide. You are solely responsible for the outcomes.
        </p>
      </LegalSection>

      <LegalSection number="03" title="Market risk">
        <LegalList
          items={[
            <><strong>Volatility</strong> — crypto perpetuals can move tens of percent within hours. Stops can be skipped on illiquid wicks. Slippage on entries and exits is real and can be material.</>,
            <><strong>Leverage</strong> — perpetual futures use leverage. A small adverse move can liquidate a position entirely. The Service caps leverage at your chosen ceiling, but a cap is not a guarantee of safety.</>,
            <><strong>Funding rates</strong> — perpetuals charge or pay funding every eight hours. Accumulated funding can erode an otherwise profitable position.</>,
            <><strong>Gaps and stop-skipping</strong> — during fast moves, stop orders may fill at materially worse prices than the trigger level, or not fill at all until liquidity returns.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="04" title="Strategy risk">
        <LegalList
          items={[
            <><strong>Backtest decay</strong> — historical results are not future results. Real-world performance typically degrades 20–40% from backtest, due to slippage, funding, latency, and regime change.</>,
            <><strong>Win rate is not edge</strong> — a strategy can hold a 60% win rate and still lose money if the average loser is larger than the average winner. Focus on Sharpe and expectancy, not win rate.</>,
            <><strong>Regime change</strong> — strategies that worked in trending markets can underperform in chop, and vice versa. The Service does not promise that the strategy will continue to be profitable in any future regime.</>,
            <><strong>Paper trading is not live trading</strong> — paper fills are simulated. Live fills face slippage, latency, and rejection that paper does not.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="05" title="Counterparty risk">
        <p>
          Your funds are held on Bybit, not by us. The Service depends on
          Bybit being operational, solvent, and accessible. If Bybit
          suspends withdrawals, becomes insolvent, restricts your
          jurisdiction, or experiences extended downtime, you may lose
          access to your funds or to the ability to manage open positions.
        </p>
        <p>
          BTG Trader has no control over Bybit and is not responsible for
          Bybit&apos;s conduct, outages, or solvency.
        </p>
      </LegalSection>

      <LegalSection number="06" title="Technical and operational risk">
        <LegalList
          items={[
            <><strong>Service downtime</strong> — the strategy engine, API workers, or dashboard may experience outages. During downtime, signals may be missed and open positions may not be managed as designed.</>,
            <><strong>Heartbeat fail-safe</strong> — if the strategy engine misses its heartbeat for more than sixty seconds, execution workers refuse to act on new signals. This protects you from acting on stale state, but it does not unwind positions that are already open.</>,
            <><strong>API key compromise</strong> — we use envelope encryption and never log secret material, but no system is impervious. If your API key is compromised on Bybit&apos;s side, the limited Read+Trade permissions prevent withdrawal but cannot prevent trading losses.</>,
            <><strong>Bug risk</strong> — the strategy engine is software. Bugs can result in unintended orders. We pre-test, but we cannot warrant the absence of bugs.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="07" title="Regulatory risk">
        <p>
          Cryptocurrency derivative regulation is evolving rapidly. A
          change in your jurisdiction may make use of the Service illegal,
          require Bybit to delist your account, or otherwise constrain
          your ability to trade.
        </p>
        <p>
          You are responsible for confirming that your use of the Service
          is lawful in your jurisdiction.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Tax">
        <p>
          You are responsible for reporting and paying any tax on trading
          gains in your jurisdiction. The Service provides exportable
          trade history; it does not provide tax advice.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Personal responsibility">
        <p>
          By using the Service, you confirm that:
        </p>
        <LegalList
          items={[
            <>You understand the risks described above.</>,
            <>You are using funds you can afford to lose entirely.</>,
            <>You have read the locked strategy specification and are willing to accept its drawdowns, losing streaks, and regime sensitivity.</>,
            <>You will not blame BTG, its operators, or its contractors for trading losses that result from the Service performing as designed.</>,
          ]}
        />
      </LegalSection>

      <LegalSection number="10" title="If in doubt, stop">
        <p>
          If at any point you find yourself trading more than you can
          afford to lose, chasing losses, or making emotional changes to
          your configuration, <strong>stop</strong>. Revoke your API key,
          close your positions on Bybit, and step away. The Service will
          still be here later.
        </p>
        <p>
          For problem-gambling support, see{" "}
          <a
            href="https://www.begambleaware.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            BeGambleAware
          </a>{" "}
          or your local equivalent.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
