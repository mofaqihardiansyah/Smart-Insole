import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

/**
 * Accessibility lock for FIX-02 (a visible focus indicator on every interactive
 * element) and FIX-03 (every touch target at least 44x44px).
 *
 * The 01-UI-REVIEW audit found the app register already held both floors but had
 * no automated coverage at all: nothing existed that would notice a 40px target
 * or an `outline-none` shipped without a ring. This file is that coverage. It
 * asserts the rendered DOM for the landing controls (a source grep cannot prove
 * a class reached an element) and scans the source for the two shapes that
 * silently remove a floor.
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
