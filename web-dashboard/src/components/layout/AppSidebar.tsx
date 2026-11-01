import React from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Activity,
  History,
  Smartphone,
  Settings,
  User,
  Bell,
  Radio,
  Shield,
} from "lucide-react";
import { t } from "../../utils/i18n";

/**
 * Shared shell helpers.
 *
 * This file used to own the 288px product rail. The Cadra light restyle
 * replaces the rail with the `AppNavPill` header, so the rail component itself
 * is gone; what survives here is what the shell still needs: the icon registry
 * the pill and the drawer share, the initials helper the avatar controls share,
 * and the account card the mobile drawer pins to its foot.
 */

const ICONS = {
  Home: LayoutDashboard,
  Chart: Activity,
  History,
  Device: Smartphone,
  Settings,
  User,
  Bell,
  Shield,
};

/**
 * One shell destination: where it goes, what it says, and its icon.
 *
 * `icon` is an `ICONS` registry key ("Home", "Chart", ...) or a ready element;
 * `accessibilityLabel` replaces the visible label for assistive technology.
 */
export interface NavItem {
  id: string;
  to: string;
  label: string;
  icon?: ReactNode;
  accessibilityLabel?: string;
}

export const renderIcon = (
  icon: ReactNode,
  className = "h-5 w-5"
): ReactNode => {
  if (React.isValidElement(icon)) return icon;
  const Icon = ICONS[icon as keyof typeof ICONS] || LayoutDashboard;
  return <Icon className={className} aria-hidden="true" />;
};

/** Initials for the avatar. Falls back to the product mark, never a stock face. */
export const initialsOf = (
  value: string | null | undefined
): string | null => {
  const source = String(value || "").trim();
  if (!source) return null;
  const words = source.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  if (words.length === 0) return null;
  const letters = words.slice(0, 2).map((word) => word[0]);
  return letters.join("").toUpperCase();
};

/** The account card at the foot of the mobile drawer. */
export interface AccountCardProps {
  name?: string;
  email?: string;
  onSignOut: () => void;
  language?: string;
  className?: string;
}

export const AccountCard = ({
  name,
  email,
  onSignOut,
  language,
  className = "",
}: AccountCardProps) => {
  const initials = initialsOf(name) || initialsOf(email);

  return (
    <div className={`rounded-tile bg-surface-2 p-3 ${className}`.trim()}>
      <div className="flex items-center gap-3">
        {initials ? (
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-btn text-body-sm font-bold text-primary-on"
          >
            {initials}
          </span>
        ) : (
          <img src="/icon.svg" alt="" className="h-11 w-11 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="truncate text-body-sm font-bold text-fg">
            {name || email || t("common.notAvailable", language)}
          </p>
          {email && (
            <p className="truncate text-caption text-muted" title={email}>
              {email}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-control border border-border-strong bg-surface text-body-sm font-bold text-danger transition-colors duration-150 hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2"
      >
        {t("common.signOut", language)}
      </button>
    </div>
  );
};
