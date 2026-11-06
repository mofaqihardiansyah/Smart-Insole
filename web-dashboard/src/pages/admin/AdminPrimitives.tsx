import React from "react";
import type { ReactNode } from "react";

/**
 * The console's two structural pieces, so all five tabs share one rhythm.
 *
 * A page opens with a large sentence-case title over a rule; sections follow
 * with a smaller heading over open canvas. No box wraps a section: on a work
 * surface the rule does the grouping, and nested cards were what made the
 * console read like the patient dashboard.
 */
export const AdminPageHeader = ({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-strong pb-5">
    <div className="min-w-0">
      <h1 className="font-heading text-h2 font-bold tracking-tight text-fg">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 max-w-prose text-body-sm text-muted">{subtitle}</p>
      )}
    </div>
    {actions}
  </div>
);

/**
 * The console's empty state: a band of canvas, not a card. A white rounded card
 * dropped into an open layout is exactly the patient-app grammar the console
 * avoids, and on an empty page it reads as a stray component rather than as a
 * state.
 */
export const AdminEmpty = ({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) => (
  <div className="border-y border-border-strong px-6 py-14 text-center">
    {icon}
    <p className="mt-3 font-medium text-fg">{title}</p>
    {body && (
      <p className="mx-auto mt-1 max-w-prose text-body-sm text-muted">{body}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const AdminSection = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}) => (
  <section className="pt-7">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-heading text-h4 font-semibold text-fg">{title}</h2>
        {description && (
          <p className="mt-1 max-w-prose text-body-sm text-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);
