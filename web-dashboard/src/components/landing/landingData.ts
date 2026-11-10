import {
  Activity,
  BatteryCharging,
  BellRing,
  BrainCircuit,
  Footprints,
  History,
  SlidersHorizontal,
  Stethoscope,
  Users,
} from "lucide-react";

/**
 * The landing's content model: i18n keys, icon references and the fixed example
 * numbers the page renders.
 *
 * These arrays are data, not markup — the page and its sections read them, so
 * they live here rather than at the top of a nine-hundred-line component. Every
 * string is a dictionary key: nothing on this page is written in the component,
 * because the landing ships Indonesian only and the dictionary is the one place
 * that decides that.
 */

/** Fixed, clearly labelled example values: one per pressure zone. */
export const EXAMPLE_READINGS = { forefoot: 24, midfoot: 46, heel: 82 };

/** The three sensor points of the example strip, in display order. */
export interface ZoneRow {
  key: keyof typeof EXAMPLE_READINGS;
  label: string;
}

export const ZONE_ROWS: ZoneRow[] = [
  { key: "forefoot", label: "anatomy.forefoot.short" },
  { key: "midfoot", label: "anatomy.midfoot.short" },
  { key: "heel", label: "anatomy.heel.short" },
];

export const FEATURES = [
  { icon: Activity, title: "landing.feature.1.title", body: "landing.feature.1.body" },
  { icon: BrainCircuit, title: "landing.feature.2.title", body: "landing.feature.2.body" },
  { icon: BellRing, title: "landing.feature.3.title", body: "landing.feature.3.body" },
  { icon: History, title: "landing.feature.4.title", body: "landing.feature.4.body" },
  { icon: BatteryCharging, title: "landing.feature.5.title", body: "landing.feature.5.body" },
  { icon: SlidersHorizontal, title: "landing.feature.6.title", body: "landing.feature.6.body" },
];

export const SPECS = [
  { title: "landing.spec.sensor.title", body: "landing.spec.sensor.body" },
  { title: "landing.spec.risk.title", body: "landing.spec.risk.body" },
  { title: "landing.spec.rate.title", body: "landing.spec.rate.body" },
];

export const AUDIENCE = [
  { icon: Footprints, title: "landing.audience.1.title", body: "landing.audience.1.body" },
  { icon: Users, title: "landing.audience.2.title", body: "landing.audience.2.body" },
  { icon: Stethoscope, title: "landing.audience.3.title", body: "landing.audience.3.body" },
];

export const SIGNS = [
  "landing.problem.signs.1",
  "landing.problem.signs.2",
  "landing.problem.signs.3",
];

export const STEPS = [
  { icon: Footprints, title: "landing.step.sense.title", body: "landing.step.sense.body", vignette: "zones" },
  { icon: Activity, title: "landing.step.judge.title", body: "landing.step.judge.body", vignette: "levels" },
  { icon: BellRing, title: "landing.step.warn.title", body: "landing.step.warn.body", vignette: "alarm" },
];

export const FLOW = [
  { title: "landing.flow.1.title", body: "landing.flow.1.body" },
  { title: "landing.flow.2.title", body: "landing.flow.2.body" },
  { title: "landing.flow.3.title", body: "landing.flow.3.body" },
];

export const PIPELINE = [
  { title: "landing.tech.pipeline.1.title", body: "landing.tech.pipeline.1.body" },
  { title: "landing.tech.pipeline.2.title", body: "landing.tech.pipeline.2.body" },
  { title: "landing.tech.pipeline.3.title", body: "landing.tech.pipeline.3.body" },
  { title: "landing.tech.pipeline.4.title", body: "landing.tech.pipeline.4.body" },
];

export const FACTS = [
  { label: "landing.tech.facts.1.label", value: "landing.tech.facts.1.value" },
  { label: "landing.tech.facts.2.label", value: "landing.tech.facts.2.value" },
  { label: "landing.tech.facts.3.label", value: "landing.tech.facts.3.value" },
  { label: "landing.tech.facts.4.label", value: "landing.tech.facts.4.value" },
];

export const FAQ = [
  { q: "landing.faq.1.q", a: "landing.faq.1.a" },
  { q: "landing.faq.2.q", a: "landing.faq.2.a" },
  { q: "landing.faq.3.q", a: "landing.faq.3.a" },
  { q: "landing.faq.4.q", a: "landing.faq.4.a" },
];
