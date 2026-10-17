---
phase: "02"
slug: "defect-fixes"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-17"
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
>
> Register authored at plan time (all six plans carry a `<threat_model>` block), so this
> run is **verify-the-mitigation-exists**, not retroactive STRIDE. `workflow.security_asvs_level: 1`
> and `workflow.security_block_on: high`; the L1 short-circuit applies (Step 3 → Step 6), so the
> `gsd-security-auditor` subagent was not spawned.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| source → generated CSS | `tailwind.config.js` + `index.css` are the only source of every colour/shadow utility; a literal that bypasses the token layer ships unmeasured | undeclared colour / shadow literals |
| source → build gate | `designTokens.test.js` is the sole automated control that can catch an undeclared value; it runs on `npm test`, not at runtime | gate verdict |
| pointer/keyboard → interactive element | an element below 44x44px or without a visible focus indicator is unusable for a motor-impaired or keyboard user | focus order, target size |
| source → rendered DOM | only a rendered-DOM assertion proves the landing anchors actually carry the classes; a source grep cannot | rendered class lists |
| data source → data view | a view that misreports "no data" as "loading" tells a clinician to wait for something that is not coming | clinical session state |
| colour → risk meaning | if colour is the only channel, a colour-blind or forced-colors reader loses the risk level entirely | risk level (safe/warning/danger) |
| component → caller | the tile tone is chosen by the page, so a decorative tint at the caller bypasses every visual review of the component | tile tone key |
| device → clinician | an unmeasured value presented without the Simulation label is a fabricated reading | measured vs simulated reading |
| dictionary → shipped screen | strings that bypass `t(key, language)` are outside the reach of every existing dictionary gate | shipped copy strings |
| source comment → shipped copy | a dash in JSDoc prose is legitimate; a dash in shipped JSX is not, so the guard must distinguish them | comment vs copy text |
| browser storage → first render | a value the app did not write is read during the provider's first render; if trusted, the user sees an interface the product decision says does not exist | stored language preference (untrusted) |
| design authority → later phases | `DESIGN.md` is read as the source of truth by Phases 3–5; a stale clause there is a defect that propagates into code | design clauses |
| render throw → user | an unhandled render throw unmounts the whole React tree, so the user's only signal is a blank page | React tree lifetime |
| thrown error → operator | a boundary that renders a fallback and reports nothing converts a visible failure into an invisible one | error object + component stack |
| dictionary → fallback copy | the crash surface ships strings like any other screen, so it must sit inside the same parity and dash gates | crash-surface copy |
| npm registry → repo | no packages are installed by this phase; retained as the phase's reserved supply-chain row | dependency graph |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Tampering | `src/designTokens.test.js` gate | high | mitigate | Gate inverted to assert the *declared* ink positively (`expect(boxShadow.card).toMatch(/23 23 25/)`) **and** scan for the undeclared literal negatively (`expect(text).not.toMatch(/35 36 39/)`), so deleting the positive assertion or emptying the value fails rather than silently blessing the defect. Re-run: 5/5 pass. | closed |
| T-02-02 | Tampering | `tailwind.config.js` `boxShadow` + `index.css` `.nav-scrolled` | medium | mitigate | The negative scan iterates `["../tailwind.config.js", "index.css"]` and reads each file whole (`fs.readFileSync`), so fixing four of five sites cannot pass. Re-run: 5/5 pass; `grep -c "35 36 39"` returns 0 in both files. | closed |
| T-02-03 | Repudiation | `token-inventory.md` audit trail | low | mitigate | Inventory carries the four `tailwind.config.js` shadow rows at the post-fix `23 23 25` value (status `matched`), the missing `--inner-glow-a` row, and a closing paragraph stating five shipping sites, not one — the false closing claim that would re-derive a one-site fix. The `.nav-scrolled` row intentionally retains its Phase 1 `flagged` status as the finding that opened FIX-01 (Phase 1 D-06 kept it unfixed there). | closed |
| T-02-04 | Repudiation | keyboard operability of every interactive element | high | mitigate | `a11y.test.jsx` scans `src/` for `outline-none` lines and requires a paired `ring-2` (:155), asserts the global `:focus-visible` floor survives (:167), and asserts explicit ring utilities on the landing anchors, drawer trigger, `GlassButton` sizes, the shared input and the retry control. | closed |
| T-02-05 | Tampering | `LandingPage.jsx` touch targets | medium | mitigate | Rendered-DOM assertions on the measured class list: nav anchors `min-h-[44px]` (:99), drawer trigger `h-11 w-11` (:120-121), `GlassButton` 44px floor held on every size and released only at `lg` (:204-213). Any later edit that shrinks them fails `npm test`. | closed |
| T-02-06 | Repudiation | DOM focus order | low | mitigate | `a11y.test.jsx` asserts no positive `tabIndex` appears under `src/` (:179) while the menu's roving `tabIndex={-1}` keeps working. | closed |
| T-02-07 | Repudiation | `DashboardPage.jsx` trend panel and activity feed | high | mitigate | `DashboardPage.states.test.jsx` asserts a settled-empty session renders no `role="status"` in the trend region plus `monitoring.empty` / `monitoring.emptyBody` (:121-131), and that the feed's empty region sits inside a panel that also holds the cause rather than being a bare child of the feed card (:134-138). Loading is asserted separately (:150-153). | closed |
| T-02-08 | Information disclosure | `StatusChip.jsx` risk channels | high | mitigate | `components/ui/StatusChip.test.jsx` builds its assertions from the module's own `STATUS_LEVELS` and asserts distinct tone strings, distinct `Icon` shapes and a non-colour label per level (:48-57), so a level cannot ship with colour as its only differentiator. 18 of 18 shipped call sites pass a `label`. | closed |
| T-02-09 | Tampering | `BentoGrid.jsx` tile tone at the caller | medium | mitigate | `DashboardPage.states.test.jsx` asserts per reachable verdict that the score tile carries `RISK_TONE[verdict]` and **not** the neutral fallback (:175-199), and a source lock over the `tiles` slice rejects a decorative value, a raw colour literal, an unknown tone key and a raw verdict passed through as the tone. | closed |
| T-02-10 | Spoofing | `DashboardPage.jsx` `sourceBanner` | high | mitigate | `DashboardPage.test.jsx` asserts the Simulation banner is present on the simulator (:307-319) and that it is the `warning` (`role="status"`) variant, not the `danger` one. The banner wording is read from the dictionary (:337-351). | closed |
| T-02-11 | Tampering | shipped JSX copy | medium | mitigate | `copy.test.js` walks every `.jsx` under `src/` with comments stripped (`stripComments`, two-stage: block then line) and asserts a non-vacuous file count (`expect(files.length).toBeGreaterThan(40)`, :72) before any per-file verdict. The scratch page is excluded by directory constant (:31), so the exclusion cannot widen as files are added. | closed |
| T-02-12 | Repudiation | dashboard header actions | low | mitigate | `DashboardPage.test.jsx` asserts the rendered header exposes exactly two standing actions, re-asserts the count after the reading state changes (:243, :263), and scans every module under `src` for the two named dead-control labels (:280-293). | closed |
| T-02-13 | Spoofing | `InsoleContext.jsx` `readStoredLanguage` | medium | mitigate | The reader forces the contract value and writes it back. `InsoleContext.test.jsx` proves a seeded `'en'` renders `id` and is corrected in storage (:118-129), that an invalid value (`'fr'`) falls back (:133-138), that a write-refusing storage still forces `id` (:141-167), and that a second mount does not depend on the first (:178-184). | closed |
| T-02-14 | Repudiation | `DESIGN.md` language clauses | low | mitigate | Both stale clauses reconciled to the actual state with the removing phase named: the language section now reads "the stored-preference reader now forces Indonesian … removing the switch is the Indonesian-only requirement owned by Phase 5 (LANG-01)", and the "in either language" clause is corrected alongside. | closed |
| T-02-15 | Denial of service | the whole view tree (`App.jsx`) | high | mitigate | `ErrorBoundary` is mounted at `App.jsx:64-66`, **above** `AppShell`, so it catches a throw from the auth hook, both providers and every page. `App.errorBoundary.test.jsx` mocks the dashboard route to throw and asserts the console is replaced rather than blanked (:75), that the shell is replaced rather than the fallback nested inside a broken one (:89), and that recovery restores the view (:100). | closed |
| T-02-16 | Repudiation | `ErrorBoundary.jsx` `componentDidCatch` | medium | mitigate | `ErrorBoundary.jsx:36-44` reports `error` and `info.componentStack` under the stable label `[ErrorBoundary] render error`. `ErrorBoundary.test.jsx:166-181` locates that call in `console.error` and asserts it receives an `Error` with the fixture message and a stack containing `Thrower` — a silent-failure boundary fails the suite. | closed |
| T-02-17 | Tampering | `utils/i18n.js` boundary keys | low | mitigate | `error.boundary.title` / `.body` / `.action` are present in both dictionaries (`i18n.js:479-482` id, `:941-943` en), so the crash surface cannot fall back to a raw key string; `i18n.test.js` re-run as part of this phase's verification covers key parity and the no-dash copy rule. | closed |
| T-02-SC | Tampering | npm/pip/cargo installs | high | mitigate | No packages are installed by this phase. `git diff --stat 54ae72a7..HEAD -- web-dashboard/package.json web-dashboard/package-lock.json` is empty, so the package-legitimacy checkpoint does not fire. Retained as the phase's reserved supply-chain row; any future install here must pass the package-legitimacy gate and a blocking human checkpoint. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-17 | 18 | 18 | 0 | orchestrator — L1 grep-depth mitigation verification (ASVS L1 short-circuit, auditor not spawned) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-17

---

## Notes

- **Threshold.** `workflow.security_block_on: high`. Six rows are `high` (T-02-01, T-02-04,
  T-02-07, T-02-08, T-02-10, T-02-15) plus the reserved T-02-SC; every one classified
  CLOSED on evidence, so no below-threshold row needed the non-blocking exemption.
- **Depth.** This is an L1 classification: each mitigation was located in the implementation
  and, where a test carries it, the assertion was read directly. No L2 boundary-placement or
  L3 end-to-end trace pass was performed, which is why the step plans for `asvs_level >= 2`
  deliberately do not take this short-circuit.
- **Out of scope here.** The code review's CR-01 (pre-existing `AdminPage` hook-order throw on
  the `/admin` deep link) is a real defect but is **not** a threat-register row for this phase —
  no plan claimed it, and it is recorded `open` in `02-REVIEW-DISPOSITION.md`. It is an
  availability defect on a route Phase 2 did not touch, not an unmapped threat.
