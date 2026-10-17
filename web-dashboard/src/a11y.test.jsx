import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';

/**
 * Accessibility lock for FIX-02 (a visible focus indicator on every interactive
 * element) and FIX-03 (every touch target at least 44x44px).
 *
 * The 01-UI-REVIEW audit found the app register already held both floors but had
 * no automated coverage at all: nothing existed that would notice a 40px target,
 * or a focused element whose outline had been nulled with no ring put back.
 * This file is that coverage. It asserts the rendered DOM for the landing
 * controls (a source grep cannot prove a class reached an element) and scans the
 * source for the two shapes that silently remove a floor.
 */

/**
 * Firebase Auth and the Realtime Database are both mocked, mirroring
 * `App.test.jsx`. Tests must not open a socket, and the auth listener would
 * otherwise never resolve.
 */
const mockAuth = {
  user: null,
  loading: false,
  displayName: '',
  logout: vi.fn(),
};

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => mockAuth,
}));

vi.mock('./services/firebaseRealtime', () => ({
  subscribeToReadings: () => () => {},
  subscribeToHistory: () => () => {},
  mapReadingPacket: () => null,
  mapHistory: () => [],
}));

const App = (await import('./App')).default;

/** This file lives in `src`, so the sources under test are right here. */
const SRC = path.dirname(fileURLToPath(import.meta.url));

/** Every `.jsx` under a directory, following `designTokens.test.js`. */
const collectSources = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectSources(full));
    } else if (entry.name.endsWith('.jsx')) {
      out.push(full);
    }
  }
  return out;
};

/** A class list read as an array, so every assertion is a membership check. */
const classesOf = (element) =>
  (element.getAttribute('class') || '').split(/\s+/).filter(Boolean);

describe('landing presence on touch targets and focus rings', () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom keeps window.location across tests in a file, so every test starts
    // from the landing route rather than wherever the previous one navigated.
    window.history.pushState({}, '', '/');
    mockAuth.user = null;
    mockAuth.loading = false;
    mockAuth.displayName = '';
  });

  it('measures every landing nav anchor at 44px tall with an explicit focus ring', () => {
    const { container } = render(<App />);

    // The landing renders exactly two `<nav>` elements: the floating pill nav
    // and the footer nav. The count is asserted first so a locator that
    // silently matches nothing fails loudly instead of passing vacuously.
    const anchors = container.querySelectorAll('nav a');
    expect(anchors).toHaveLength(9);

    anchors.forEach((anchor, index) => {
      const classes = classesOf(anchor);
      expect(classes, `nav anchor ${index} lost its 44px floor`).toContain(
        'min-h-[44px]'
      );
      expect(classes, `nav anchor ${index} lost its focus ring`).toContain(
        'focus-visible:ring-2'
      );
      expect(classes, `nav anchor ${index} lost its ring offset`).toContain(
        'focus-visible:ring-offset-2'
      );
    });
  });

  it('measures the icon-only drawer trigger at 44x44 with an explicit focus ring', () => {
    const { container } = render(<App />);

    const trigger = container.querySelector(
      'button[aria-controls="landing-menu"]'
    );
    expect(trigger).not.toBeNull();

    const classes = classesOf(trigger);
    expect(classes, 'trigger lost its 44px width').toContain('w-11');
    expect(classes, 'trigger lost its 44px height').toContain('h-11');
    expect(classes, 'trigger lost its focus ring').toContain(
      'focus-visible:ring-2'
    );

    // The trigger keeps the semantics it shipped with: it is a disclosure
    // button for the drawer, it is phone-only, and its label is screen-reader
    // only (the licensed `X` / `Menu` glyph carries no text).
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls', 'landing-menu');
    expect(trigger).toHaveClass('md:hidden');
  });
});

describe('focus indicator source lock', () => {
  it('pairs every outline reset with a ring, and keeps the global floor alive', () => {
    /**
     * The global `:focus-visible` rule in `index.css` is the floor for elements
     * that carry no ring utility. It is a floor, not a pass: an element that
     * nulls that outline with the shared utility and supplies no ring has
     * deleted its only focus indicator, and that is the FIX-02 defect class.
     * Every shipped site today pairs the two, so the mismatch list is empty and
     * a future edit that drops a ring fails `npm test` instead of shipping.
     *
     * Comment lines are skipped: the file headers in this codebase discuss the
     * pattern, and discussing it is not shipping it.
     */
    const offenders = [];

    for (const file of collectSources(SRC)) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((raw, index) => {
        const line = raw.trim();
        if (line.startsWith('*') || line.startsWith('//')) return;
        if (line.includes('outline-none') && !line.includes('ring-2')) {
          offenders.push(`${path.relative(SRC, file)}:${index + 1}`);
        }
      });
    }

    expect(offenders).toEqual([]);

    // The floor itself must survive: a non-`none` outline on the global rule,
    // and `color-scheme: light` in both scopes. The two scope spellings are the
    // exact literals `designTokens.test.js` already slices on.
    const css = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');
    const focusRule = css.slice(css.indexOf(':focus-visible'));
    expect(focusRule).toMatch(/outline:\s*2px\s+solid/);
    expect(focusRule).not.toMatch(/outline:\s*none/);

    expect(css.slice(css.indexOf(':root {'))).toMatch(/color-scheme:\s*light/);
    expect(css.slice(css.indexOf('.landing-scope {'))).toMatch(
      /color-scheme:\s*light/
    );
  });
});
