import React from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "../ui/GlassCard";
import { t } from "../../utils/i18n";

/**
 * AuthShell: the shared frame for sign in and create account.
 *
 * One column, one card, one task. The earlier split panel answered "what is
 * this product" beside the form, but on these two routes the reader has already
 * decided to sign in or register, so a second column competed with the only
 * thing the page exists to do. The ornament is a single offset panel behind the
 * card: it separates the card from the canvas without adding a second surface
 * of copy.
 *
 * The mark sits above the card and links home, and the page keeps exactly one
 * h1: the form title.
 */
const AuthShell = ({ language, title, subtitle, children, footer }) => (
  <main
    id="main-content"
    className="flex min-h-[100dvh] flex-col bg-bg px-4 py-10 sm:px-6"
  >
    <div className="m-auto w-full max-w-md">
      <div className="flex flex-col items-center text-center">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center gap-2.5 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <img src="/icon.svg" alt="" className="h-11 w-11 shrink-0" />
          <span className="font-heading text-h2 font-semibold text-fg">
            {t("app.title", language)}
          </span>
        </Link>
        <p className="text-body-sm text-muted">{t("app.tagline", language)}</p>
      </div>

      <div className="relative mt-7">
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-2 translate-y-2 rounded-card border border-border bg-surface-2"
        />
        <GlassCard className="relative p-6 sm:p-8">
          <h1 className="font-heading text-h2 text-fg">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-body leading-relaxed text-muted">
              {subtitle}
            </p>
          )}
          {children}
        </GlassCard>
      </div>

      {footer}

      <p className="mx-auto mt-7 max-w-sm text-center text-caption leading-relaxed text-muted">
        {t("auth.footerNote", language)}
      </p>
    </div>
  </main>
);

export default AuthShell;
