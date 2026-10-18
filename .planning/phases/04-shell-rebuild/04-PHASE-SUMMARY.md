# Phase 4 — Shell rebuild: phase summary

Closed 2026-10-18. Five commits. **35 test files, 338 tests, all passing.
`npm run build` exits 0.**

## What this phase actually turned out to be

The shell was already standing: `AppLayout` had the 288px rail, the 72px bar and the 1400px cap;
`AppSearch` was a real combobox; the drawer already moved focus in, locked the page and returned
focus. What the phase found instead was that **nothing about any of it was tested.** Not one test
file touched `AppLayout`, `AppSidebar`, `AppTopbar` or `AppSearch` — the six SHELL requirements
were six sentences in a roadmap with no gate behind them, which is the same shape as every defect
Phase 3 spent its time removing.

So the phase inverted: write the gate first, then fix what the gate exposed. It exposed four
defects and one stale comment.

## The four defects

1. **The first paint span forever.** `App.jsx`'s splash was a `animate-spin` ring. MOTION 1's
   permitted list is exhaustive — hover, focus, value transitions, the heatmap's danger pulse, one
   reduced-motion-aware scroll — and a ring that turns on its own is none of them; it is motion
   competing with numbers that start updating a second later. It is now the product mark, holding
   still, above the same announced sentence. *(recorded as N-05 in Phase 3, owned here)*
2. **An admin saw the dashboard icon twice.** `buildNavLinks` gives the admin destination
   `icon: "Shield"`, and `ICONS` had no `Shield` entry, so `renderIcon` fell back to
   `LayoutDashboard` — this codebase's signature silent fallback, in the rail. `Shield` is now
   registered.
3. **The drawer claimed to be modal and behaved like a box.** It carried
   `role="dialog" aria-modal="true"`, which tells assistive technology everything behind it is
   inert, and Tab walked straight out into the content it had just declared unreachable. The
   drawer now clamps Tab at both ends, and pulls focus back in if it is somehow standing outside.
4. **The search pointed `aria-controls` at nothing.** In the no-match state the listbox is not
   rendered, so the id the combobox named did not exist while `aria-expanded` said `true`. The
   popup now owns that id, so the reference resolves whether or not there are options, and the
   attribute is dropped when no popup is shown at all.

Plus one stale comment: `AppSearch` described "the seven destinations in the rail" when the rail
has six (seven for an admin).

## The gate

`src/components/layout/shell.test.jsx` — 24 tests, one describe per requirement:

| | locked by |
|---|---|
| SHELL-01 | the four measured classes, and the rail's position before the content column |
| SHELL-02 | the six hrefs in order, no bell target in the rail, the unread name changing with state, the admin glyph not being the dashboard's |
| SHELL-03 | the combobox, bell and account control on the 72px bar, and no destination repeated there |
| SHELL-04 | arrow keys wrapping in both directions with `aria-activedescendant` in step, Enter navigating, outside-click closing, `aria-controls` resolvable, and every nav target declared as a route |
| SHELL-05 | focus in, page locked, focus back; Tab clamped at both ends; ordinary tabbing untouched; the scrim closing it; a destination closing it |
| SHELL-06 | every control named, the rail and the dialog labelled, and no `animate-` utility anywhere in the shipped sources |

Each new gate was **proved failing before it was trusted**: re-adding `animate-spin` failed with
`App.jsx: animate-spin`; removing `Shield` failed with `lucide lucide-layout-dashboard`; disabling
the trap failed both clamp cases. All three were reverted and the suite returned to green.

## Deliberately not done

- **`aria-live="off"` was not added** (SHELL-06's wording). It exists nowhere under `src/`; the
  live numbers are simply outside every live region, which is the stronger form of the same rule.
  `liveRegion.test.js` asserts the absence, so both adding the attribute and adding a real region
  fail. Recorded in Phase 3 and still standing.
- **`unreadLabel` on the mobile bell and `unreadIncidentCount` on the desktop bell** remain two
  sources for one fact. Both are correct today; the duplication is not a defect, and collapsing it
  is a refactor rather than a fix.
- **The mobile header and `AppTopbar` duplicate the bell markup.** Same reasoning.

## Not verifiable here

The three-viewport click-through (360 / 768 / 1280 px) was not run: **this environment has no
browser.** jsdom applies no stylesheets, so this phase can prove the class that carries a width
and cannot prove the width. Recorded in `WINDOWS.md`; the visual half needs a human pass.

## What Phase 5 inherits

A shell that is gated rather than assumed: the rail's six destinations, the combobox's keyboard
contract and the drawer's dialog behaviour now fail a test if they regress. Phase 5's ten pages
can be rebuilt against it, and the eight feedback panels that name a cause with no next step
(`DashboardPage.jsx:515`, `:557`, `DevicePage.jsx:142`, `HistoryPage.jsx:305`,
`MonitoringPage.jsx:137`, `ProfilePage.jsx:82`, `:185`, `SettingsPage.jsx:303`) are the first
thing waiting there.
