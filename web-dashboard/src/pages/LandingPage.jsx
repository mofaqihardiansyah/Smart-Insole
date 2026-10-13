import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Activity,
  Footprints,
  BellRing,
  BookOpen,
  Radio,
  Menu,
  X,
  Workflow,
  Bot,
  Sparkles,
  BrainCircuit,
  History,
  BatteryCharging,
  SlidersHorizontal,
  Cpu,
  Database,
  MonitorSmartphone,
} from "lucide-react";
import { GlassButton } from "../components/ui/GlassButton";
import { PanelHeader } from "../components/ui/GlassCard";
import { LanguageToggle } from "../components/layout/LanguageToggle";
import PlantarHeatmap from "../components/PlantarHeatmap";
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

const CAPABILITIES = [
  { icon: Footprints, title: "landing.cap.1.title", body: "landing.cap.1.body" },
  { icon: BrainCircuit, title: "landing.cap.2.title", body: "landing.cap.2.body" },
  { icon: BellRing, title: "landing.cap.3.title", body: "landing.cap.3.body" },
];

const STEPS = [
  { icon: Footprints, title: "landing.step.sense.title", body: "landing.step.sense.body" },
  { icon: Activity, title: "landing.step.judge.title", body: "landing.step.judge.body" },
  { icon: BellRing, title: "landing.step.warn.title", body: "landing.step.warn.body" },
];

const FLOW = [
  { title: "landing.flow.1.title", body: "landing.flow.1.body" },
  { title: "landing.flow.2.title", body: "landing.flow.2.body" },
  { title: "landing.flow.3.title", body: "landing.flow.3.body" },
];

const STACK = [
  { icon: Cpu, title: "landing.stack.1.title", body: "landing.stack.1.body" },
  { icon: Database, title: "landing.stack.2.title", body: "landing.stack.2.body" },
  { icon: MonitorSmartphone, title: "landing.stack.3.title", body: "landing.stack.3.body" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { language } = useInsole();
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef(null);
  const navRef = useRef(null);
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

  /* The nav pill deepens its shadow once the page scrolls. */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () =>
      nav.classList.toggle("nav-scrolled", window.scrollY > 24);
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

      {/* ================= FLOATING PILL NAV ================= */}
      <div className="sticky top-3 z-50 flex justify-center px-3 pt-4 sm:top-5 sm:px-4 sm:pt-6">
        <nav
          ref={navRef}
          aria-label={t("app.title", language)}
          className="flex w-full max-w-[880px] items-center justify-between gap-2 rounded-pill border border-warm-line bg-warm-card/75 py-2.5 pl-5 pr-2.5 shadow-nav backdrop-blur-xl"
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollTop();
            }}
            className="flex min-w-0 items-center gap-2.5"
          >
            <span className="relative flex h-6 w-9 shrink-0 items-center" aria-hidden="true">
              <span className="absolute left-0 h-6 w-6 rounded-full bg-warm-dark" />
              <span className="absolute left-3.5 h-6 w-6 rounded-full bg-warm-accent" />
            </span>
            <span className="truncate text-base font-semibold leading-tight">
              {t("app.title", language)}
            </span>
          </a>

          <div className="hidden items-center gap-1 text-sm font-medium text-warm-body md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-pill px-3.5 py-2 transition-colors duration-150 hover:bg-warm-dark/5 hover:text-warm-ink"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <GlassButton
              variant="warmOutline"
              size="sm"
              className="hidden rounded-pill sm:inline-flex"
              onClick={() => go("/login")}
            >
              {t("auth.login.submit", language)}
            </GlassButton>
            <GlassButton
              variant="warm"
              size="sm"
              className="rounded-pill"
              onClick={() => go("/register")}
            >
              {t("auth.register.submit", language)}
            </GlassButton>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-warm-line bg-warm-card text-warm-ink transition-colors duration-150 hover:bg-warm-raised md:hidden"
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
          <div className="flex flex-col text-base font-medium">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-tile px-4 py-3 text-warm-ink transition-colors duration-150 hover:bg-warm-raised"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex gap-2">
              <GlassButton
                variant="warmOutline"
                className="flex-1 rounded-pill"
                onClick={() => go("/login")}
              >
                {t("auth.login.submit", language)}
              </GlassButton>
              <GlassButton
                variant="warm"
                className="flex-1 rounded-pill"
                onClick={() => go("/register")}
              >
                {t("auth.register.submit", language)}
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      <main id="main-content" className="mx-auto max-w-[1440px] px-2 pt-2 sm:px-4 sm:pt-4">
        {/* ================= HERO ================= */}
        <section className="rise relative mt-2 flex min-h-[100svh] flex-col overflow-hidden rounded-hero bg-warm-raised shadow-card sm:mt-4 sm:rounded-hero-lg">
          {/* Decorative glows: static gradients, aria-hidden. No WebGL,
              no parallax, no animation loop. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 top-0 h-[720px] w-[720px] rounded-full opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 55% 45%, rgb(var(--warm-accent) / 0.55), rgb(var(--warm-accent-2) / 0.28) 40%, transparent 70%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-52 top-24 h-[640px] w-[640px] rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgb(var(--warm-dark) / 0.35), rgb(var(--warm-caption) / 0.15) 45%, transparent 72%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 right-1/4 h-[420px] w-[560px] rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgb(var(--warm-accent) / 0.25), transparent 70%)",
            }}
          />

          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-28 pt-16 text-center sm:pt-24 lg:pb-36">
            {/* Badge */}
            <p
              className="rise inline-flex items-center gap-2 rounded-pill border border-warm-line bg-warm-card/80 px-4 py-2 text-sm font-medium text-warm-accent-deep shadow-card backdrop-blur"
              style={{ animationDelay: "150ms" }}
            >
              <Footprints className="h-4 w-4" aria-hidden="true" />
              {t("landing.hero.eyebrow", language)}
            </p>

            {/* Headline with drifting tiles */}
            <div className="relative mt-7 w-full">
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
                className="absolute -right-8 -top-10 hidden h-16 w-16 rotate-6 items-center justify-center rounded-2xl border border-warm-line bg-warm-card shadow-glow md:flex"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-accent text-white">
                  <Workflow className="h-5 w-5" />
                </span>
              </div>
              <div
                data-drift
                data-rot="-6"
                aria-hidden="true"
                className="absolute -right-24 top-16 hidden h-16 w-16 -rotate-6 items-center justify-center rounded-2xl border border-warm-line bg-warm-card shadow-glow lg:flex"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-dark text-white">
                  <Bot className="h-5 w-5" />
                </span>
              </div>
              <div
                data-drift
                data-rot="3"
                aria-hidden="true"
                className="absolute -bottom-14 right-6 hidden h-16 w-16 rotate-3 items-center justify-center rounded-2xl border border-warm-line bg-warm-card shadow-glow md:flex"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-raised text-warm-accent-deep">
                  <Sparkles className="h-5 w-5" />
                </span>
              </div>
            </div>

            <p
              className="rise mt-10 max-w-xl text-lg leading-relaxed text-warm-body"
              style={{ animationDelay: "450ms" }}
            >
              {t("landing.hero.subtitle", language)}
            </p>

            {/* CTAs */}
            <div
              className="rise mt-9 flex flex-col items-center gap-3 sm:flex-row"
              style={{ animationDelay: "600ms" }}
            >
              <GlassButton
                variant="warm"
                size="lg"
                className="rounded-pill"
                onClick={() => go("/register")}
              >
                {t("landing.hero.ctaSecondary", language)}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </GlassButton>
              <GlassButton
                variant="warmOutline"
                size="lg"
                className="rounded-pill"
                onClick={() => go("/login")}
              >
                {t("landing.hero.ctaPrimary", language)}
              </GlassButton>
            </div>

            {/* Real product spec row: measured product facts, not
                invented statistics. */}
            <div
              className="rise mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
              style={{ animationDelay: "750ms" }}
            >
              {SPECS.map((spec) => (
                <div key={spec.title} className="text-center">
                  <p className="font-heading text-2xl font-semibold text-warm-ink">
                    {t(spec.title, language)}
                  </p>
                  <p className="mt-1 text-xs text-warm-caption">
                    {t(spec.body, language)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* The real heatmap, running with fixed example values. */}
          <div
            className="rise relative z-10 mx-auto w-full max-w-md px-6 pb-10 sm:px-0"
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
                  className="mx-auto max-h-[400px]"
                />
              </div>
              <p className="border-t border-warm-line px-1 pt-3 text-body-sm text-warm-caption">
                {t("landing.hero.demoNote", language)}
              </p>
            </div>
          </div>
        </section>

        {/* ================= MENGAPA + SPEC BAND ================= */}
        <section
          id="mengapa"
          className="scroll-mt-28 px-4 py-24 sm:px-10 lg:px-16 lg:py-32"
        >
          <div className="max-w-2xl" data-reveal>
            <p className="text-sm font-semibold text-warm-accent-deep">
              {t("landing.nav.why", language)}
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight text-warm-ink sm:text-5xl">
              {t("landing.problem.title", language)}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-warm-body">
              {t("landing.problem.body", language)}
            </p>
          </div>

          <div
            data-reveal
            className="relative mt-14 rounded-[32px] border border-warm-line bg-warm-raised p-8 shadow-card sm:p-12"
          >
            <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:-space-x-6">
              {SPECS.map((spec) => (
                <div
                  key={spec.title}
                  className="flex-1 rounded-full border border-warm-line bg-warm-card px-8 py-7 text-center shadow-card"
                >
                  <p className="font-heading text-4xl font-semibold text-warm-ink sm:text-5xl">
                    {t(spec.title, language)}
                  </p>
                  <p className="mt-1.5 text-base text-warm-body">
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
          className="scroll-mt-28 px-4 py-24 sm:px-10 lg:px-16 lg:py-32"
        >
          <div className="max-w-2xl" data-reveal>
            <p className="text-sm font-semibold text-warm-accent-deep">
              {t("landing.nav.features", language)}
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight text-warm-ink sm:text-5xl">
              {t("landing.feature.title", language)}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-warm-body">
              {t("landing.feature.body", language)}
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }, index) => (
              <article
                key={title}
                data-reveal
                style={{ transitionDelay: `${index * 80}ms` }}
                className="group rounded-3xl border border-warm-line bg-warm-card p-7 shadow-card transition-all duration-150 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-warm-line bg-warm-raised text-warm-accent-deep">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-warm-ink">
                  {t(title, language)}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-warm-body">
                  {t(body, language)}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ================= KEMAMPUAN (dark panel) ================= */}
        <section className="px-4 pb-24 sm:px-10 lg:px-16 lg:pb-32">
          <div className="max-w-2xl" data-reveal>
            <p className="text-sm font-semibold text-warm-accent-deep">
              {t("landing.cap.eyebrow", language)}
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight text-warm-ink sm:text-5xl">
              {t("landing.cap.title", language)}
            </h2>
          </div>

          <div
            data-reveal
            className="mt-14 rounded-[36px] bg-warm-dark p-4 shadow-glow sm:p-5"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {CAPABILITIES.map(({ icon: Icon, title, body }, index) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-white/5 bg-warm-panel p-8 sm:p-10"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-warm-accent-2">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-2xl font-semibold text-white">
                    {t(title, language)}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-white/55">
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
          className="scroll-mt-28 px-4 pb-24 sm:px-10 lg:px-16 lg:pb-32"
        >
          <div className="max-w-2xl" data-reveal>
            <p className="text-sm font-semibold text-warm-accent-deep">
              {t("landing.nav.how", language)}
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight text-warm-ink sm:text-5xl">
              {t("landing.how.title", language)}
            </h2>
          </div>

          <div className="mt-14 space-y-6">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <div
                key={title}
                data-reveal
                className="grid overflow-hidden rounded-[28px] border border-warm-line bg-warm-card shadow-card lg:grid-cols-5"
              >
                <div className="p-8 sm:p-10 lg:col-span-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warm-raised px-3 py-1.5 text-xs font-medium text-warm-body">
                    {t("landing.step.number", language)} {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold text-warm-ink sm:text-3xl">
                    {t(title, language)}
                  </h3>
                  <p className="mt-4 max-w-prose text-base leading-relaxed text-warm-body">
                    {t(body, language)}
                  </p>
                </div>
                <div className="relative flex min-h-[220px] items-center justify-center bg-warm-raised lg:col-span-2">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-warm-line bg-warm-card text-warm-accent-deep shadow-card">
                    <Icon className="h-8 w-8" aria-hidden="true" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= ALUR ================= */}
        <section
          id="alur"
          className="scroll-mt-28 px-4 pb-24 sm:px-10 lg:px-16 lg:pb-32"
        >
          <div className="max-w-2xl" data-reveal>
            <p className="text-sm font-semibold text-warm-accent-deep">
              {t("landing.nav.start", language)}
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight text-warm-ink sm:text-5xl">
              {t("landing.flow.title", language)}
            </h2>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3 lg:items-center">
            {FLOW.map((flow, index) => {
              const featured = index === 1;
              return (
                <div
                  key={flow.title}
                  data-reveal
                  style={{ transitionDelay: `${index * 80}ms` }}
                  className={`rounded-[26px] p-8 shadow-card ${
                    featured
                      ? "bg-warm-dark text-white lg:scale-[1.04]"
                      : "border border-warm-line bg-warm-card"
                  }`}
                >
                  <span
                    className={`text-sm font-semibold ${
                      featured ? "text-warm-accent-2" : "text-warm-accent-deep"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className={`mt-4 text-lg font-semibold ${
                      featured ? "text-white" : "text-warm-ink"
                    }`}
                  >
                    {t(flow.title, language)}
                  </h3>
                  <p
                    className={`mt-2 text-base leading-relaxed ${
                      featured ? "text-white/70" : "text-warm-body"
                    }`}
                  >
                    {t(flow.body, language)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= TEKNOLOGI ================= */}
        <section className="px-4 pb-24 sm:px-10 lg:px-16 lg:pb-32">
          <div className="max-w-2xl" data-reveal>
            <p className="text-sm font-semibold text-warm-accent-deep">
              {t("landing.stack.eyebrow", language)}
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight text-warm-ink sm:text-5xl">
              {t("landing.stack.title", language)}
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
            {STACK.map(({ icon: Icon, title, body }, index) => (
              <div
                key={title}
                data-reveal
                style={{ transitionDelay: `${index * 80}ms` }}
                className="flex min-h-[360px] flex-col justify-between rounded-[26px] bg-gradient-to-br from-warm-panel to-warm-dark p-6 shadow-card"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {t(title, language)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {t(body, language)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= FOOTER CTA ================= */}
        <footer className="px-2 pb-2 sm:px-0 sm:pb-4">
          <div
            data-reveal
            className="relative overflow-hidden rounded-hero bg-warm-raised px-6 py-20 text-center shadow-card sm:px-12 lg:py-28"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgb(var(--warm-accent) / 0.4), transparent 70%)",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-40 -top-20 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgb(var(--warm-dark) / 0.3), transparent 70%)",
              }}
            />

            <div className="relative mx-auto max-w-3xl">
              <h2 className="font-heading text-4xl font-semibold leading-tight text-warm-ink sm:text-6xl">
                {t("landing.cta.title", language)}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-warm-body">
                {t("landing.cta.body", language)}
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <GlassButton
                  variant="warm"
                  size="lg"
                  className="rounded-pill"
                  onClick={() => go("/register")}
                >
                  {t("auth.register.submit", language)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </GlassButton>
                <GlassButton
                  variant="warmOutline"
                  size="lg"
                  className="rounded-pill"
                  onClick={() => go("/login")}
                >
                  {t("auth.login.submit", language)}
                </GlassButton>
              </div>
            </div>

            <div className="relative mx-auto mt-16 flex max-w-5xl flex-col items-center justify-between gap-6 border-t border-warm-line pt-8 text-center sm:flex-row sm:text-left">
              <span className="flex items-center gap-2.5">
                <span className="relative flex h-5 w-8 items-center" aria-hidden="true">
                  <span className="absolute left-0 h-5 w-5 rounded-full bg-warm-dark" />
                  <span className="absolute left-3 h-5 w-5 rounded-full bg-warm-accent" />
                </span>
                <span className="text-base font-semibold">{t("app.title", language)}</span>
              </span>
              <nav
                aria-label={t("app.title", language)}
                className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-warm-body"
              >
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="transition-colors duration-150 hover:text-warm-ink"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <p className="flex items-center gap-2 text-xs text-warm-caption">
                <Radio className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t("landing.footerNote", language)}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
