import { memo } from "react";
import { useI18n } from "../i18n/I18nProvider";

export const LanguageToggle = memo(() => {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
      {(["pt", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase transition ${
            locale === item ? "bg-ink text-white" : "text-slate-500"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
});
