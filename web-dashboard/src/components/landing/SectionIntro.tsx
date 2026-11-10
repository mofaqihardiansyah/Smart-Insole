import React from "react";
import { t } from "../../utils/i18n";

/**
 * The landing's repeated section opening: a hairline, an eyebrow, the heading,
 * and — when the section has a lead — one sentence under it.
 *
 * Six sections open this way, so the shape lives here instead of six times in
 * the page. Each part is its own reveal target on a short delay, which is why
 * the intro settles in order rather than arriving as one block: the rule draws
 * itself, then the eyebrow, then the heading, then the lead.
 *
 * `level` is the distinction the page already makes, not a style switch: a
 * section opens at `landing-h2` with a `body-lg` lead, a technical sub-block
 * inside a section opens at the app's `h2` step with a `body` lead.
 */
export const SectionIntro = ({
  eyebrowKey,
  titleKey,
  bodyKey,
  language,
  level = 2,
}: {
  eyebrowKey: string;
  titleKey: string;
  bodyKey?: string;
  language?: string;
  level?: 2 | 3;
}) => {
  const Heading = level === 3 ? "h3" : "h2";

  return (
    <div className="max-w-2xl">
      <span
        aria-hidden="true"
        data-reveal
        className="landing-rule block h-px w-12 bg-warm-line"
      />
      <p
        data-reveal
        style={{ transitionDelay: "80ms" }}
        className="mt-5 text-body-sm font-semibold text-warm-accent-deep"
      >
        {t(eyebrowKey, language)}
      </p>
      <Heading
        data-reveal
        style={{ transitionDelay: "160ms" }}
        className={`mt-3 font-heading leading-tight text-warm-ink ${
          level === 3 ? "text-h2" : "text-landing-h2"
        }`}
      >
        {t(titleKey, language)}
      </Heading>
      {bodyKey && (
        <p
          data-reveal
          style={{ transitionDelay: "240ms" }}
          className={`mt-4 leading-relaxed text-warm-body ${
            level === 3 ? "text-body" : "text-body-lg"
          }`}
        >
          {t(bodyKey, language)}
        </p>
      )}
    </div>
  );
};
