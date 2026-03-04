import { Suspense, lazy } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { LanguageToggle } from "./components/LanguageToggle";
import { ThemeToggle } from "./components/ThemeToggle";
import { useI18n } from "./i18n/I18nProvider";

const HomePage = lazy(() => import("./pages/HomePage"));
const CreateEscrowPage = lazy(() => import("./pages/CreateEscrowPage"));
const MyEscrowsPage = lazy(() => import("./pages/MyEscrowsPage"));
const EscrowDetailsPage = lazy(() => import("./pages/EscrowDetailsPage"));

export default function App() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav className="panel flex flex-wrap items-center gap-2 p-2">
            {[
              ["/", t.navHome],
              ["/create", t.navCreate],
              ["/escrows", t.navMyEscrows]
            ].map(([href, label]) => (
              <NavLink
                key={href}
                to={href}
                end={href === "/"}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>

        <main className="flex-1">
          <Suspense fallback={<div className="panel p-6 text-sm text-slate-500">Loading...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateEscrowPage />} />
              <Route path="/escrows" element={<MyEscrowsPage />} />
              <Route path="/escrows/:escrowId" element={<EscrowDetailsPage />} />
            </Routes>
          </Suspense>
        </main>

        <footer className="mt-8 text-center text-sm text-slate-500">{t.footer}</footer>
      </div>
    </div>
  );
}
