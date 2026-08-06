import * as Dialog from "@radix-ui/react-dialog";
import {
  Buildings,
  Moon,
  Sun,
  ChartLineUp,
  ChartPieSlice,
  ClipboardText,
  CreditCard,
  Scroll,
  Door,
  GearSix,
  IdentificationBadge,
  List,
  Megaphone,
  EnvelopeSimple,
  Crown,
  Receipt,
  Storefront,
  UsersThree,
  X,
  type Icon,
} from "@phosphor-icons/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { NavLink } from "react-router-dom";
import { useJeerahTheme } from "../app/theme";
import { BrandIcon } from "../design/BrandIcon";
import { JeerahLogo } from "../design/JeerahLogo";
import { useI18n } from "../i18n/I18nProvider";
import type { MessageKey } from "../i18n/messages";

export interface AdminNavItem {
  path: string;
  labelKey: MessageKey;
  icon: Icon;
  end?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { path: "/", labelKey: "nav.dashboard", icon: ChartPieSlice, end: true },
  { path: "/properties", labelKey: "nav.properties", icon: Buildings },
  { path: "/units", labelKey: "nav.units", icon: Door },
  { path: "/residents", labelKey: "nav.residents", icon: UsersThree },
  { path: "/expenses", labelKey: "nav.finance", icon: Receipt },
  { path: "/payments", labelKey: "nav.payments", icon: CreditCard },
  { path: "/orders", labelKey: "nav.orders", icon: ClipboardText },
  { path: "/marketplace", labelKey: "nav.marketplace", icon: Storefront },
  { path: "/announcements", labelKey: "nav.announcements", icon: Megaphone },
  { path: "/messages", labelKey: "admin.contact_messages", icon: EnvelopeSimple },
  { path: "/subscriptions", labelKey: "admin.subscriptions", icon: Crown },
  { path: "/visitors-amenities", labelKey: "admin.visitors_amenities", icon: IdentificationBadge },
  { path: "/analytics", labelKey: "nav.analytics", icon: ChartLineUp },
  { path: "/audit", labelKey: "nav.audit", icon: Scroll },
  { path: "/settings", labelKey: "nav.settings", icon: GearSix },
];

function useViewportWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

const AnnounceContext = createContext<((message: string) => void) | null>(null);

/** Announces admin action results through the shell's single aria-live region. */
export function useAdminAnnounce() {
  const announce = useContext(AnnounceContext);
  if (!announce) throw new Error("useAdminAnnounce must be used inside AdminShell");
  return announce;
}

function NavLinks({ onNavigate, compact }: { onNavigate?: () => void; compact?: boolean }) {
  const { t } = useI18n();
  return (
    <ul className="admin-nav__list">
      {ADMIN_NAV_ITEMS.map((item) => (
        <li key={item.path}>
          <NavLink
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) => `admin-nav__link${isActive ? " admin-nav__link--active" : ""}`}
            title={compact ? t(item.labelKey) : undefined}
          >
            <span aria-hidden="true">
              <BrandIcon icon={item.icon} label="" />
            </span>
            <span className={compact ? "admin-visually-hidden" : undefined}>{t(item.labelKey)}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function AdminShell({ children, extraNav }: PropsWithChildren<{ extraNav?: ReactNode }>) {
  const { t, dir, locale, setLocale } = useI18n();
  const { resolve, toggle } = useJeerahTheme();
  const adminTheme = resolve("light");
  const width = useViewportWidth();
  const layout = width >= 1024 ? "desktop" : width >= 768 ? "rail" : "compact";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");

  const announce = useCallback((next: string) => setMessage(next), []);
  const value = useMemo(() => announce, [announce]);

  useEffect(() => {
    if (layout !== "compact") setDrawerOpen(false);
  }, [layout]);

  return (
    <AnnounceContext value={value}>
      <div className="admin-shell" data-layout={layout} data-testid="admin-root" dir={dir} lang={locale}>
        {layout === "compact" ? (
          <header className="admin-topbar">
            <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
              <Dialog.Trigger asChild>
                <button type="button" className="admin-button admin-button--icon" aria-label={t("admin.open_navigation")}>
                  <BrandIcon icon={List} label="" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="admin-drawer__overlay" />
                <Dialog.Content className="admin-drawer" aria-label={t("admin.navigation")} aria-describedby={undefined}>
                  <Dialog.Title className="admin-visually-hidden">{t("admin.navigation")}</Dialog.Title>
                  <div className="admin-drawer__header">
                    <JeerahLogo locale={locale} background="dark" height={30} />
                    <Dialog.Close asChild>
                      <button type="button" className="admin-button admin-button--icon" aria-label={t("admin.close_navigation")}>
                        <BrandIcon icon={X} label="" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <nav aria-label={t("admin.navigation")}>
                    <NavLinks onNavigate={() => setDrawerOpen(false)} />
                    {extraNav}
                  </nav>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <JeerahLogo locale={locale} background="dark" height={28} />
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => void setLocale(locale === "ar" ? "en" : "ar")}
            >
              {locale === "ar" ? "English" : "العربية"}
            </button>
          </header>
        ) : (
          <aside className="admin-sidebar">
            <div className="admin-sidebar__brand">
              <JeerahLogo locale={locale} background="dark" height={layout === "rail" ? 26 : 34} />
            </div>
            <nav aria-label={t("admin.navigation")}>
              <NavLinks compact={layout === "rail"} />
              {extraNav}
            </nav>
            <div className="admin-sidebar__footer">
              <button
                type="button"
                className="admin-button admin-button--ghost"
                data-testid="admin-theme-toggle"
                onClick={() => toggle("light")}
              >
                {adminTheme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                {t(adminTheme === "dark" ? "theme.light" : "theme.dark")}
              </button>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => void setLocale(locale === "ar" ? "en" : "ar")}
              >
                {locale === "ar" ? "English" : "العربية"}
              </button>
              <div className="admin-sidebar__user">
                <span className="admin-sidebar__avatar" aria-hidden="true">A</span>
                <span className="admin-sidebar__user-copy">
                  <strong>Admin</strong>
                  <small>{t("admin.role_platform")}</small>
                </span>
              </div>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                data-testid="admin-sign-out"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.search = "";
                  window.location.assign(url.toString());
                }}
              >
                {t("profile.sign_out")}
              </button>
              <p className="admin-sidebar__note">{t("label.demo_only")}</p>
            </div>
          </aside>
        )}
        <main className="admin-main">{children}</main>
        <div aria-live="polite" className="admin-visually-hidden" data-testid="admin-live-region">
          {message}
        </div>
      </div>
    </AnnounceContext>
  );
}
