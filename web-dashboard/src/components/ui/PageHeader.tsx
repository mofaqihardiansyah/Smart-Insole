import React from "react";

/**
 * PageHeader — the standard top of every page.
 *
 * Centralised so all pages share one rhythm: a 30px heading, then one line that
 * states what the page measures, then optional actions pinned right on wide
 * screens. There is no rule under it: the reference console separates the
 * heading from the panels with space, not with a line, and an extra hairline
 * there competes with the card edges directly below it.
 *
 * `title` may be a node, which is how the dashboard renders its greeting
 * together with the account name.
 */
/** Props: `title` may be a node (the dashboard renders greeting + name). */
interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

const PageHeader = ({
  title,
  subtitle,
  actions,
  meta,
  className = "",
}: PageHeaderProps) => (
  <header
    className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`.trim()}
  >
    <div className="min-w-0">
      <h1 className="font-heading text-h1 text-fg">{title}</h1>
      {subtitle && (
        <p className="mt-1.5 max-w-prose text-body-base text-muted">{subtitle}</p>
      )}
      {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
    </div>

    {actions && (
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
        {actions}
      </div>
    )}
  </header>
);

export { PageHeader };
export default PageHeader;
