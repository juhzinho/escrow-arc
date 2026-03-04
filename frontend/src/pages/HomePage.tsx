import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { WalletConnect } from "../components/WalletConnect";
import { useI18n } from "../i18n/I18nProvider";

export default function HomePage() {
  const { t } = useI18n();
  const exampleHash = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const [currentGuideStep, setCurrentGuideStep] = useState(0);

  const guideSteps = [
    {
      title: t.tutorialGuideConnectTitle,
      body: t.tutorialGuideConnectBody,
      href: "#top",
      cta: t.connect
    },
    {
      title: t.tutorialGuideFundTitle,
      body: t.tutorialGuideFundBody,
      href: "#tutorial",
      cta: t.tutorialNeedTitle
    },
    {
      title: t.tutorialGuideCreateTitle,
      body: t.tutorialGuideCreateBody,
      href: "/create",
      cta: t.tutorialGuideOpenCreate
    },
    {
      title: t.tutorialGuideManageTitle,
      body: t.tutorialGuideManageBody,
      href: "/escrows",
      cta: t.tutorialGuideOpenEscrows
    }
  ];

  const copyExampleHash = async () => {
    await navigator.clipboard.writeText(exampleHash);
    toast.success(t.copied);
  };

  return (
    <div id="top" className="grid gap-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="panel overflow-hidden p-8">
          <div className="inline-flex rounded-full bg-sea/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sea">
            Arc Testnet + USDC escrow
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{t.heroBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/create" className="primary-btn">
              {t.heroPrimaryCta}
            </Link>
            <a href="#tutorial" className="secondary-btn">
              {t.heroSecondaryCta}
            </a>
          </div>
        </div>

        <div className="grid gap-6">
          <WalletConnect />

          <div className="panel p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sea">{t.tutorialGuideTitle}</div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-500">
                  {t.tutorialGuideStep} {currentGuideStep + 1}/{guideSteps.length}
                </div>
                <div className="mt-2 text-2xl font-semibold text-ink">{guideSteps[currentGuideStep].title}</div>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                {currentGuideStep + 1}
              </div>
            </div>
            <p className="mt-4 text-base leading-8 text-slate-600">{guideSteps[currentGuideStep].body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {guideSteps[currentGuideStep].href.startsWith("/") ? (
                <Link to={guideSteps[currentGuideStep].href} className="primary-btn">
                  {guideSteps[currentGuideStep].cta}
                </Link>
              ) : (
                <a href={guideSteps[currentGuideStep].href} className="primary-btn">
                  {guideSteps[currentGuideStep].cta}
                </a>
              )}
              <button
                type="button"
                className="secondary-btn"
                disabled={currentGuideStep === 0}
                onClick={() => setCurrentGuideStep((step) => Math.max(0, step - 1))}
              >
                {t.tutorialGuidePrev}
              </button>
              <button
                type="button"
                className="secondary-btn"
                disabled={currentGuideStep === guideSteps.length - 1}
                onClick={() => setCurrentGuideStep((step) => Math.min(guideSteps.length - 1, step + 1))}
              >
                {t.tutorialGuideNext}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          {t.quickTitle}
        </div>
        {[t.quickStep1, t.quickStep2, t.quickStep3].map((item) => (
          <div key={item} className="panel p-6 text-sm leading-7 text-slate-600">
            {item}
          </div>
        ))}
      </section>

      <section id="tutorial" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sea">{t.tutorialTitle}</div>
          <h2 className="mt-4 text-3xl font-semibold text-ink">{t.tutorialIntro}</h2>

          <div className="mt-8 grid gap-4">
            <div>
              <div className="text-base font-semibold text-ink">{t.tutorialNeedTitle}</div>
              <ul className="mt-3 grid gap-3 text-base text-slate-600">
                {[t.tutorialNeed1, t.tutorialNeed2, t.tutorialNeed3].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-base font-semibold text-ink">{t.tutorialExampleTitle}</div>
              <ul className="mt-3 grid gap-3 text-base text-slate-600">
                {[t.tutorialExampleRecipient, t.tutorialExampleAmount, t.tutorialExampleHash].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button type="button" onClick={() => void copyExampleHash()} className="secondary-btn mt-4">
                {t.copyExampleHash}
              </button>
            </div>
          </div>
        </div>

        <div className="panel p-8">
          <div className="text-base font-semibold text-ink">{t.tutorialFlowTitle}</div>
          <ol className="mt-4 grid gap-4 text-base leading-8 text-slate-600">
            {[
              t.tutorialFlow1,
              t.tutorialFlow2,
              t.tutorialFlow3,
              t.tutorialFlow4,
              t.tutorialFlow5,
              t.tutorialFlow6,
              t.tutorialFlow7
            ].map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="text-base font-semibold text-ink">{t.tutorialTipsTitle}</div>
            <ul className="mt-3 grid gap-3 text-base text-slate-600">
              {[t.tutorialTip1, t.tutorialTip2, t.tutorialTip3].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="panel grid gap-4 p-8">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t.faqTitle}</div>
        {[
          [t.faqQuestion1, t.faqAnswer1],
          [t.faqQuestion2, t.faqAnswer2],
          [t.faqQuestion3, t.faqAnswer3]
        ].map(([question, answer]) => (
          <div key={question} className="rounded-2xl border border-slate-200 p-4">
            <div className="text-base font-semibold text-ink">{question}</div>
            <div className="mt-2 text-base leading-8 text-slate-600">{answer}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
