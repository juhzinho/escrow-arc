import { memo } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useI18n } from "../i18n/I18nProvider";

export const ThemeToggle = memo(() => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  return (
    <button type="button" onClick={toggleTheme} className="secondary-btn">
      {theme === "light" ? t.darkMode : t.lightMode}
    </button>
  );
});
