import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Activity,
  Footprints,
  BellRing,
  Radio,
  Menu,
  X,
  BrainCircuit,
  History,
  BatteryCharging,
  SlidersHorizontal,
  Cpu,
  Users,
  Stethoscope,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { GlassButton } from "../components/ui/GlassButton";
import { PanelHeader } from "../components/ui/GlassCard";
import { Chip } from "../components/ui/Chip";
import { StatusChip } from "../components/ui/StatusChip";
import PlantarHeatmap from "../components/PlantarHeatmap";
import RiskExplorer from "../components/landing/RiskExplorer";
import { useInsole } from "../context/InsoleContext";
import { t } from "../utils/i18n";

/**
 * LandingPage — the public entry point.
 *
 * Visual language: the SprintForge landing page, section for section.
 * Same shell, same section order, same card grammar, same motion
 * budget (rise-in, scroll reveal, hover lift, drifting tiles). The
 * copy is this product's real content: no studio branding, no
 * fabricated testimonials, no sample pricing, no fake customer
 * logos. The hero shows the REAL heatmap component driven by fixed
 * example values, so a visitor sees the actual product.
 *
 * Light-only by design. `.landing-scope` re-declares the light
 * semantic tokens so in-app components render in their measured
 * light form on the warm surface, whatever theme was picked
 * elsewhere. There is no theme switch here: on a light-only page
 * it would be a dead control.
 */

/** Fixed, clearly labelled example values: one per pressure zone. */
const EXAMPLE_READINGS = { forefoot: 24, midfoot: 46, heel: 82 };

const FEATURES = [
  { icon: Activity, title: "landing.feature.1.title", body: "landing.feature.1.body" },
  { icon: BrainCircuit, title: "landing.feature.2.title", body: "landing.feature.2.body" },
  { icon: BellRing, title: "landing.feature.3.title", body: "landing.feature.3.body" },
  { icon: History, title: "landing.feature.4.title", body: "landing.feature.4.body" },
  { icon: BatteryCharging, title: "landing.feature.5.title", body: "landing.feature.5.body" },
  { icon: SlidersHorizontal, title: "landing.feature.6.title", body: "landing.feature.6.body" },
];

const SPECS = [
  { title: "landing.spec.sensor.title", body: "landing.spec.sensor.body" },
  { title: "landing.spec.risk.title", body: "landing.spec.risk.body" },
  { title: "landing.spec.rate.title", body: "landing.spec.rate.body" },
];

const AUDIENCE = [
  { icon: Footprints, title: "landing.audience.1.title", body: "landing.audience.1.body" },
  { icon: Users, title: "landing.audience.2.title", body: "landing.audience.2.body" },
  { icon: Stethoscope, title: "landing.audience.3.title", body: "landing.audience.3.body" },
];

const SIGNS = [
  "landing.problem.signs.1",
  "landing.problem.signs.2",
  "landing.problem.signs.3",
];

const STEPS = [
  { icon: Footprints, title: "landing.step.sense.title", body: "landing.step.sense.body", vignette: "zones" },
  { icon: Activity, title: "landing.step.judge.title", body: "landing.step.judge.body", vignette: "levels" },
  { icon: BellRing, title: "landing.step.warn.title", body: "landing.step.warn.body", vignette: "alarm" },
];

/* The three sensor points of the example strip, in display order. The labels
   reuse the app's own anatomy vocabulary; the SHORT labels are the ones the
   dashboard's own tables use. */
const ZONE_ROWS = [
  { key: "forefoot", label: "anatomy.forefoot.short" },
  { key: "midfoot", label: "anatomy.midfoot.short" },
  { key: "heel", label: "anatomy.heel.short" },
];

const FLOW = [
  { title: "landing.flow.1.title", body: "landing.flow.1.body" },
  { title: "landing.flow.2.title", body: "landing.flow.2.body" },
  { title: "landing.flow.3.title", body: "landing.flow.3.body" },
];

const PIPELINE = [
  { title: "landing.tech.pipeline.1.title", body: "landing.tech.pipeline.1.body" },
  { title: "landing.tech.pipeline.2.title", body: "landing.tech.pipeline.2.body" },
  { title: "landing.tech.pipeline.3.title", body: "landing.tech.pipeline.3.body" },
  { title: "landing.tech.pipeline.4.title", body: "landing.tech.pipeline.4.body" },
];

const FACTS = [
  { label: "landing.tech.facts.1.label", value: "landing.tech.facts.1.value" },
  { label: "landing.tech.facts.2.label", value: "landing.tech.facts.2.value" },
  { label: "landing.tech.facts.3.label", value: "landing.tech.facts.3.value" },
  { label: "landing.tech.facts.4.label", value: "landing.tech.facts.4.value" },
];

const FAQ = [
  { q: "landing.faq.1.q", a: "landing.faq.1.a" },
  { q: "landing.faq.2.q", a: "landing.faq.2.a" },
  { q: "landing.faq.3.q", a: "landing.faq.3.a" },
  { q: "landing.faq.4.q", a: "landing.faq.4.a" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { language } = useInsole();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navFloating, setNavFloating] = useState(false);
  const rootRef = useRef(null);
  const [reducedMotion] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const navLinks = [
    { href: "#mengapa", label: t("landing.nav.why", language) },
    { href: "#fitur", label: t("landing.nav.features", language) },
    { href: "#cara-kerja", label: t("landing.nav.how", language) },
    { href: "#alur", label: t("landing.nav.start", language) },
  ];

  /* Scroll reveal: one IntersectionObserver, reveal once, unobserve.
     Under reduced motion everything is visible immediately. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll("[data-reveal]");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("revealed"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reducedMotion]);

  /* Drifting headline tiles: a single rAF loop, skipped entirely
     when the visitor asked for reduced motion. */
  useEffect(() => {
    if (reducedMotion) return;
    const tiles = rootRef.current?.querySelectorAll("[data-drift]");
    if (!tiles || tiles.length === 0) return;
    const bases = Array.from(tiles).map((el) =>
      parseFloat(el.dataset.rot || "0")
    );
    let raf;
    let t = 0;
    const loop = () => {
      t += 0.008;
      tiles.forEach((el, i) => {
        el.style.transform = `translateY(${Math.sin(t + i * 2) * 6}px) rotate(${
          bases[i] + Math.sin(t * 0.7 + i) * 2
        }deg)`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  /* The nav bar sits flush on the page edge at the top and lifts into a
     floating bar once the page scrolls. It is a state change, not a
     transition: MOTION 1 keeps the movement budget for the content. */
  useEffect(() => {
    const onScroll = () => setNavFloating(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const scrollTop = () => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      ref={rootRef}
      className="landing-scope min-h-[100dvh] bg-warm-canvas font-sans text-warm-ink"
    >
      {/* The app shell already renders the skip link as the first
          focusable element; do not duplicate it here. */}

      {/* ================= NAV ================= */}
      {/* Flush on the page edge at the top, a floating bar once the visitor
          scrolls: the nav is part of the page until the page moves. The two
          states differ only in max-width, radius, shadow and the wrapper's
          inset, so the change interpolates instead of jumping. */}
      <div
        className={[
          "sticky z-50 flex justify-center",
          "transition-[padding,top] duration-300 ease-out motion-reduce:transition-none",
          navFloating
            ? "top-3 px-3 pt-4 sm:top-5 sm:px-4 sm:pt-6"
            : "top-0 px-0 pt-0",
        ].join(" ")}
      >
        <nav
          aria-label={t("app.title", language)}
          className={[
            "flex w-full items-center justify-between gap-2 border border-warm-line bg-warm-card py-2.5 pl-5 pr-2.5",
            "transition-[max-width,border-radius,box-shadow] duration-300 ease-out motion-reduce:transition-none",
            navFloating
              ? "max-w-[880px] rounded-tile shadow-nav"
              : "max-w-[100vw] rounded-none shadow-none",
          ].join(" ")}
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollTop();
            }}
            className="flex min-h-[44px] min-w-0 items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-warm-card"
          >
            <img src="/icon.svg" alt="" className="h-7 w-7 shrink-0" />
            <span className="truncate text-body font-semibold leading-tight">
              {t("app.title", language)}
            </span>
          </a>

          <div className="hidden items-center gap-1 text-body-sm font-medium text-warm-body md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-[44px] items-center rounded-tile px-3.5 py-2 transition-colors duration-150 hover:bg-warm-dark/5 hover:text-warm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-warm-card"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <GlassButton
              variant="warmOutline"
              size="sm"
              className="hidden rounded-tile sm:inline-flex"
              onClick={() => go("/login")}
            >
              {t("auth.login.submit", language)}
            </GlassButton>
            <GlassButton
              variant="warm"
              size="sm"
              className="rounded-tile"
              onClick={() => go("/register")}
            >
              {t("auth.register.submit", language)}
            </GlassButton>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-tile border border-warm-line bg-warm-card text-warm-ink transition-colors duration-150 hover:bg-warm-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-warm-card md:hidden"
              aria-expanded={menuOpen}
              aria-controls="landing-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
              <span className="sr-only">{t("landing.nav.menu", language)}</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu sheet */}
      {menuOpen && (
        <div
          id="landing-menu"
          className="relative z-40 mx-4 mt-3 rounded-panel border border-warm-line bg-warm-card p-4 shadow-lift md:hidden"
        >
          <div className="flex flex-col text-body font-medium">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center rounded-tile px-4 py-3 text-warm-ink transition-colors duration-150 hover:bg-warm-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-warm-card"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex gap-2">
              <GlassButton
                variant="warmOutline"
                className="flex-1 rounded-tile"
                onClick={() => go("/login")}
              >
                {t("auth.login.submit", language)}
              </GlassButton>
              <GlassButton
                variant="warm"
                className="flex-1 rounded-tile"
                onClick={() => go("/register")}
              >
                {t("auth.register.submit", language)}
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      <main id="main-content" className="mx-auto max-w-[1440px] px-2 pt-0 sm:px-4">
        {/* ================= HERO ================= */}
        {/* Two columns from lg: the fold answers its four questions in the
            text column, and the real heatmap stands BESIDE it instead of in
            its own narrow centred row, which left both page margins and the
            fold empty. The measured numbers are still NOT repeated here: they
            live once in the Mengapa band. */}
        <section className="rise relative mt-2 flex min-h-[100svh] items-center overflow-hidden rounded-hero bg-warm-raised shadow-card sm:rounded-hero-lg">
          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-12 pt-16 text-center sm:pb-14 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-16 lg:text-left">
            {/* Column one: eyebrow, headline, who it is for, next step. */}
            <div className="flex flex-col items-center lg:items-start">
              {/* Eyebrow tag: squared, matching every status tag in the app. */}
              <p
                className="rise inline-flex items-center gap-2 rounded-sm border border-warm-line bg-warm-card/80 px-4 py-2 text-body-sm font-medium text-warm-accent-deep shadow-card"
                style={{ animationDelay: "150ms" }}
              >
                <Footprints className="h-4 w-4" aria-hidden="true" />
                {t("landing.hero.eyebrow", language)}
              </p>

              {/* Headline with drifting tiles. The tiles carry the product's
                  own instrument icons - live reading, ESP32, battery - not
                  generic studio glyphs. */}
              <div className="relative mt-5 w-full">
                <h1
                  className="rise mx-auto max-w-3xl font-heading text-display text-warm-ink"
                  style={{ animationDelay: "300ms" }}
                >
                  {t("landing.hero.title", language)}
                </h1>

                <div
                  data-drift
                  data-rot="6"
                  aria-hidden="true"
                  className="absolute -top-10 right-0 hidden h-16 w-16 rotate-6 items-center justify-center rounded-panel border border-warm-line bg-warm-card shadow-glow md:flex"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-warm-accent text-white">
                    <Activity className="h-5 w-5" />
                  </span>
                </div>
                <div
                  data-drift
                  data-rot="-6"
                  aria-hidden="true"
                  className="absolute -left-10 top-8 hidden h-16 w-16 -rotate-6 items-center justify-center rounded-panel border border-warm-line bg-warm-card shadow-glow lg:flex"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-warm-dark text-white">
                    <Cpu className="h-5 w-5" />
                  </span>
                </div>
                <div
                  data-drift
                  data-rot="3"
                  aria-hidden="true"
                  className="absolute -bottom-12 right-4 hidden h-16 w-16 rotate-3 items-center justify-center rounded-panel border border-warm-line bg-warm-card shadow-glow md:flex"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-warm-raised text-warm-accent-deep">
                    <BatteryCharging className="h-5 w-5" />
                  </span>
                </div>
              </div>

              <p
                className="rise mt-6 max-w-xl text-body-lg leading-relaxed text-warm-body"
                style={{ animationDelay: "450ms" }}
              >
                {t("landing.hero.subtitle", language)}
              </p>

              {/* CTAs: the next step, register first. */}
              <div
                className="rise mt-7 flex flex-col items-center gap-3 sm:flex-row"
                style={{ animationDelay: "600ms" }}
              >
                <GlassButton
                  variant="warm"
                  size="lg"
                  className="rounded-tile"
                  onClick={() => go("/register")}
                >
                  {t("landing.hero.ctaRegister", language)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </GlassButton>
                <GlassButton
                  variant="warmOutline"
                  size="lg"
                  className="rounded-tile"
                  onClick={() => go("/login")}
                >
                  {t("landing.hero.ctaLogin", language)}
                </GlassButton>
              </div>
            </div>

            {/* Column two: the real heatmap, filling the fold's right half
                instead of a 448px centred card. */}
            <div
              className="rise mx-auto w-full max-w-md lg:max-w-none"
              style={{ animationDelay: "900ms" }}
            >
              <div className="rounded-panel border border-warm-line bg-warm-card p-4 shadow-lift transition-transform duration-150 hover:-translate-y-1 sm:p-5">
                <PanelHeader
                  label={t("dashboard.plantarView", language)}
                  icon={<Activity className="h-4 w-4" />}
                  padded={false}
                />
                <div className="plot-surface p-2">
                  <PlantarHeatmap
                    readingsOverride={EXAMPLE_READINGS}
                    className="mx-auto max-h-[360px] lg:max-h-[420px]"
                  />
                </div>
                <p className="border-t border-warm-line px-1 pt-3 text-body-sm text-warm-caption">
                  {t("landing.hero.demoNote", language)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= MENGAPA + SPEC BAND ================= */}
        <section
          id="mengapa"
          className="scroll-mt-28 px-4 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24"
        >
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="max-w-2xl" data-reveal>
              <p className="text-body-sm font-semibold text-warm-accent-deep">
                {t("landing.nav.why", language)}
              </p>
              <h2 className="mt-3 font-heading text-landing-h2 leading-tight text-warm-ink">
                {t("landing.problem.title", language)}
              </h2>
              <p className="mt-4 text-body-lg leading-relaxed text-warm-body">
                {t("landing.problem.body", language)}
              </p>
            </div>

            <div
              data-reveal
              className="rounded-section border border-warm-line bg-warm-card p-6 shadow-card sm:p-8"
            >
              <p className="text-body-sm font-semibold text-warm-accent-deep">
                {t("landing.problem.signs.title", language)}
              </p>
              <ul className="mt-4 divide-y divide-warm-line border-y border-warm-line">
                {SIGNS.map((key) => (
                  <li key={key} className="flex items-start gap-3 py-3">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-warm-accent-deep"
                      aria-hidden="true"
                    />
                    <span className="text-body leading-relaxed text-warm-body">
                      {t(key, language)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-body-sm leading-relaxed text-warm-caption">
                {t("landing.problem.signs.note", language)}
              </p>
            </div>
          </div>

          {/* One ruled strip, not three pill-shaped cards: three rounded-full
              stat capsules was the exact shape language the product drops.
              The numbers sit in one band, divided by hairlines. */}
          <div
            data-reveal
            className="relative mt-10 rounded-section border border-warm-line bg-warm-raised shadow-card sm:px-12"
          >
            <div className="grid gap-6 px-6 py-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-warm-line sm:px-0 sm:py-10">
              {SPECS.map((spec) => (
                <div key={spec.title} className="text-center sm:px-8">
                  <p className="font-heading text-landing-h2 tabular-data text-warm-ink">
                    {t(spec.title, language)}
                  </p>
                  <p className="mt-1.5 text-body text-warm-body">
                    {t(spec.body, language)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= FITUR ================= */}
        <section
          id="fitur"
          className="scroll-mt-28 px-4 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24"
        >
          <div className="max-w-2xl" data-reveal>
            <p className="text-body-sm font-semibold text-warm-accent-deep">
              {t("landing.nav.features", language)}
            </p>
            <h2 className="mt-3 font-heading text-landing-h2 leading-tight text-warm-ink">
              {t("landing.feature.title", language)}
            </h2>
            <p className="mt-4 text-body-lg leading-relaxed text-warm-body">
              {t("landing.feature.body", language)}
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, index) => (
              <article
                key={title}
                data-reveal
                style={{ transitionDelay: `${index * 80}ms` }}
                className="group rounded-3xl border border-warm-line bg-warm-card p-7 shadow-card transition-all duration-150 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-panel border border-warm-line bg-warm-raised text-warm-accent-deep">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-body-lg font-semibold text-warm-ink">
                  {t(title, language)}
                </h3>
                <p className="mt-2 text-body leading-relaxed text-warm-body">
                  {t(body, language)}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ================= KEMAMPUAN (dark panel) ================= */}
        <section className="px-4 pb-16 sm:px-10 lg:px-16 lg:pb-24">
          <div className="max-w-2xl" data-reveal>
            <p className="text-body-sm font-semibold text-warm-accent-deep">
              {t("landing.audience.eyebrow", language)}
            </p>
            <h2 className="mt-3 font-heading text-landing-h2 leading-tight text-warm-ink">
              {t("landing.audience.title", language)}
            </h2>
          </div>

          <div
            data-reveal
            className="mt-10 rounded-section-lg bg-warm-dark p-4 shadow-glow sm:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {AUDIENCE.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-cell border border-white/5 bg-warm-panel p-6 sm:p-8"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-panel bg-white/10 text-warm-accent-2">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-h2 font-semibold text-white">
                    {t(title, language)}
                  </h3>
                  <p className="mt-3 max-w-md text-body leading-relaxed text-white/55">
                    {t(body, language)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CARA KERJA ================= */}
        <section
          id="cara-kerja"
          className="scroll-mt-28 px-4 pb-16 sm:px-10 lg:px-16 lg:pb-24"
        >
          <div className="max-w-2xl" data-reveal>
            <p className="text-body-sm font-semibold text-warm-accent-deep">
              {t("landing.nav.how", language)}
            </p>
            <h2 className="mt-3 font-heading text-landing-h2 leading-tight text-warm-ink">
              {t("landing.how.title", language)}
            </h2>
          </div>

          <div className="mt-10 space-y-6">
            {STEPS.map(({ icon: Icon, title, body, vignette }, index) => (
              <div
                key={title}
                data-reveal
                className="grid overflow-hidden rounded-cell border border-warm-line bg-warm-card shadow-card lg:grid-cols-5"
              >
                <div className="p-6 sm:p-8 lg:col-span-3">
                  <span className="inline-flex items-center gap-1.5 rounded-sm border border-warm-line bg-warm-raised px-3 py-1.5 text-caption text-warm-body">
                    {t("landing.step.number", language)} {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-h2 font-semibold text-warm-ink">
                    {t(title, language)}
                  </h3>
                  <p className="mt-4 max-w-prose text-body leading-relaxed text-warm-body">
                    {t(body, language)}
                  </p>
                </div>
                {/* The band beside every step shows what the app actually
                    renders at that step, in the app's own vocabulary - not a
                    lone decorative icon adrift in an empty panel. */}
                <div className="relative flex min-h-[220px] items-center justify-center bg-warm-raised p-6 sm:p-8 lg:col-span-2">
                  {vignette === "zones" && (
                    <div className="w-full max-w-xs text-left">
                      <p className="text-caption text-warm-caption">
                        {t("landing.sensors.title", language)}
                      </p>
                      <div className="mt-1 divide-y divide-warm-line border-y border-warm-line">
                        {ZONE_ROWS.map(({ key, label }) => (
                          <div
                            key={key}
                            className="flex items-baseline justify-between gap-3 py-3"
                          >
                            <span className="text-body text-warm-body">
                              {t(label, language)}
                            </span>
                            <span className="font-heading text-stat tabular-data text-warm-ink">
                              {EXAMPLE_READINGS[key]}
                              <span className="ml-1 text-caption font-normal text-warm-caption">
                                {t("metrics.unit.kpa", language)}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-caption text-warm-caption">
                        {t("landing.step.demoNote", language)}
                      </p>
                    </div>
                  )}
                  {vignette === "levels" && (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <p className="text-caption text-warm-caption">
                        {t("landing.risk.title", language)}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <StatusChip
                          level="safe"
                          label={t("risk.safe", language)}
                          size="lg"
                        />
                        <StatusChip
                          level="warning"
                          label={t("risk.warning", language)}
                          size="lg"
                        />
                        <StatusChip
                          level="danger"
                          label={t("risk.danger", language)}
                          size="lg"
                        />
                      </div>
                      <p className="text-caption text-warm-caption">
                        {t("landing.step.demoNote", language)}
                      </p>
                    </div>
                  )}
                  {vignette === "alarm" && (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Chip tone="danger" aria-hidden="true" className="px-3 py-2">
                          <Icon className="h-5 w-5" />
                        </Chip>
                        <StatusChip
                          level="warning"
                          label={t("risk.warning", language)}
                          size="lg"
                        />
                        <StatusChip
                          level="danger"
                          label={t("risk.danger", language)}
                          size="lg"
                        />
                      </div>
                      <p className="text-caption text-warm-caption">
                        {t("landing.step.demoNote", language)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* The one dense technical block: the pipeline, the model facts, and
              a simulator that runs the real inference module. It sits inside
              "Cara kerja" because that is the question a technical reader is
              already asking, and it keeps the rest of the page patient-facing. */}
          <div
            id="teknologi"
            className="mt-16 scroll-mt-28 border-t border-warm-line pt-12 sm:mt-20 sm:pt-16"
          >
            <div className="max-w-2xl" data-reveal>
              <p className="text-body-sm font-semibold text-warm-accent-deep">
                {t("landing.tech.eyebrow", language)}
              </p>
              <h3 className="mt-3 font-heading text-h2 leading-tight text-warm-ink">
                {t("landing.tech.title", language)}
              </h3>
              <p className="mt-3 text-body leading-relaxed text-warm-body">
                {t("landing.tech.body", language)}
              </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div data-reveal className="space-y-6">
                <ol className="grid gap-3 sm:grid-cols-2">
                  {PIPELINE.map((item, index) => (
                    <li
                      key={item.title}
                      className="rounded-cell border border-warm-line bg-warm-card p-5"
                    >
                      <span className="tabular-data text-caption text-warm-caption">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h4 className="mt-2 text-body-lg font-semibold text-warm-ink">
                        {t(item.title, language)}
                      </h4>
                      <p className="mt-1.5 text-body-sm leading-relaxed text-warm-body">
                        {t(item.body, language)}
                      </p>
                    </li>
                  ))}
                </ol>

                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {FACTS.map((fact) => (
                    <div
                      key={fact.label}
                      className="rounded-cell border border-warm-line bg-warm-raised p-4"
                    >
                      <dt className="text-caption text-warm-caption">
                        {t(fact.label, language)}
                      </dt>
                      <dd className="mt-1 font-heading text-h4 tabular-data text-warm-ink">
                        {t(fact.value, language)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div data-reveal>
                <RiskExplorer language={language} />
              </div>
            </div>
          </div>
        </section>

        {/* ================= ALUR ================= */}
        <section
          id="alur"
          className="scroll-mt-28 px-4 pb-16 sm:px-10 lg:px-16 lg:pb-24"
        >
          <div className="max-w-2xl" data-reveal>
            <p className="text-body-sm font-semibold text-warm-accent-deep">
              {t("landing.nav.start", language)}
            </p>
            <h2 className="mt-3 font-heading text-landing-h2 leading-tight text-warm-ink">
              {t("landing.flow.title", language)}
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3 lg:items-center">
            {FLOW.map((flow, index) => {
              const featured = index === 1;
              return (
                <div
                  key={flow.title}
                  data-reveal
                  style={{ transitionDelay: `${index * 80}ms` }}
                  className={`rounded-cell p-6 sm:p-7 shadow-card ${
                    featured
                      ? "bg-warm-dark text-white lg:scale-[1.04]"
                      : "border border-warm-line bg-warm-card"
                  }`}
                >
                  <span
                    className={`text-body-sm font-semibold ${
                      featured ? "text-warm-accent-2" : "text-warm-accent-deep"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className={`mt-4 text-body-lg font-semibold ${
                      featured ? "text-white" : "text-warm-ink"
                    }`}
                  >
                    {t(flow.title, language)}
                  </h3>
                  <p
                    className={`mt-2 text-body leading-relaxed ${
                      featured ? "text-white/70" : "text-warm-body"
                    }`}
                  >
                    {t(flow.body, language)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 border-t border-warm-line pt-12 sm:mt-20">
            <div className="max-w-2xl" data-reveal>
              <p className="text-body-sm font-semibold text-warm-accent-deep">
                {t("landing.faq.eyebrow", language)}
              </p>
              <h3 className="mt-3 font-heading text-h2 leading-tight text-warm-ink">
                {t("landing.faq.title", language)}
              </h3>
            </div>

            <div className="mt-6 divide-y divide-warm-line border-y border-warm-line">
              {FAQ.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-body-lg font-medium text-warm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-warm-canvas">
                    <span>{t(item.q, language)}</span>
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-warm-caption transition-transform duration-150 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="max-w-prose pb-5 text-body leading-relaxed text-warm-body">
                    {t(item.a, language)}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ================= FOOTER CTA ================= */}
        <footer className="px-2 pb-2 sm:px-0 sm:pb-4">
          <div
            data-reveal
            className="overflow-hidden rounded-hero bg-warm-raised px-6 py-16 text-center shadow-card sm:px-12 lg:py-24"
          >
            <div className="mx-auto max-w-3xl">
              <h2 className="font-heading text-landing-h2 leading-tight text-warm-ink">
                {t("landing.cta.title", language)}
              </h2>
              <p className="mt-6 text-body-lg leading-relaxed text-warm-body">
                {t("landing.cta.body", language)}
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <GlassButton
                  variant="warm"
                  size="lg"
                  className="rounded-tile"
                  onClick={() => go("/register")}
                >
                  {t("auth.register.submit", language)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </GlassButton>
                <GlassButton
                  variant="warmOutline"
                  size="lg"
                  className="rounded-tile"
                  onClick={() => go("/login")}
                >
                  {t("auth.login.submit", language)}
                </GlassButton>
              </div>
            </div>

            <div className="relative mx-auto mt-12 flex max-w-5xl flex-col items-center justify-between gap-6 border-t border-warm-line pt-8 text-center sm:flex-row sm:text-left">
              <span className="flex items-center gap-2.5">
                <img src="/icon.svg" alt="" className="h-6 w-6 shrink-0" />
                <span className="text-body font-semibold">{t("app.title", language)}</span>
              </span>
              <nav
                aria-label={t("app.title", language)}
                className="flex flex-wrap items-center justify-center gap-6 text-body-sm font-medium text-warm-body"
              >
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="inline-flex min-h-[44px] items-center transition-colors duration-150 hover:text-warm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-warm-card"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <p className="flex items-center gap-2 text-caption text-warm-caption">
                <Radio className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t("landing.footerNote", language)}
              </p>
            </div>

            <p className="mx-auto mt-4 max-w-5xl text-caption leading-relaxed text-warm-caption">
              {t("landing.footerDisclaimer", language)}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
