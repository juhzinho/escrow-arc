import { WalletConnect } from "../components/WalletConnect";
import { useI18n } from "../i18n/I18nProvider";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="grid gap-8">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="panel overflow-hidden p-8">
          <div className="inline-flex rounded-full bg-sea/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sea">
            Arc Testnet + USDC escrow
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{t.heroBody}</p>
        </div>

        <WalletConnect />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          "1. Approve and deposit testnet USDC into a dedicated escrow.",
          "2. Recipient proves delivery with the agreed bytes32 hash.",
          "3. Creator can release manually, or anyone can trigger refund after timeout."
        ].map((item) => (
          <div key={item} className="panel p-6 text-sm leading-7 text-slate-600">
            {item}
          </div>
        ))}
      </section>
    </div>
  );
}
