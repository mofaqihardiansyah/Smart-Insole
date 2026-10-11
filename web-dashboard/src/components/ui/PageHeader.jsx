import React from "react";

/**
 * PageHeader — the standard top of every page.
 *
 * Centralised so all ten pages share one rhythm: title, then a short
 * monospace-styled subtitle that states what the page measures, then optional
 * actions pinned to the right on wide screens. Without this each page drifts
 * into its own spacing and type size.
 */
const PageHeader = ({ title, subtitle, actions, meta, className = "" }) => (
  <header
    className={`flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between ${className}`.trim()}
  >
    <div className="min-w-0">
      <h1 className="font-heading text-h2 text-fg">{title}</h1>
      {subtitle && (
        <p className="mt-1.5 max-w-prose text-body-sm text-muted">{subtitle}</p>
      )}
      {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
    </div>

    {actions && (
      <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
    )}
  </header>
);

export { PageHeader };
export default PageHeader;
