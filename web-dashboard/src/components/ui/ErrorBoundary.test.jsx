import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ErrorBoundary, { ErrorBoundary as NamedBoundary } from './ErrorBoundary';

/**
 * A thrower that only throws while the module flag is set, so the recovery case
 * can clear the flag and assert a successful re-render of the same subtree.
 */
let shouldThrow = true;

const Thrower = () => {
  if (shouldThrow) throw new Error('fixture: the child failed to render');
  return <p>isi yang pulih</p>;
};

describe('ErrorBoundary', () => {
  let errorSpy;

  beforeEach(() => {
    shouldThrow = true;
    // React re-throws a caught boundary error to console.error in test
    // environments, and an unstubbed spy makes the run unreadable.
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('exports the same class under both the named and the default binding', () => {
    // React catches a render throw only through a class component, and the two
    // lifecycle halves are the whole contract: one derives the fallback for the
    // render, the other reports. Both are class-only APIs, so the export must
    // be a class that carries them.
    expect(NamedBoundary).toBe(ErrorBoundary);
    expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function');
    expect(typeof ErrorBoundary.prototype.componentDidCatch).toBe('function');
  });

  it('renders the fallback, not the child, when a child throws during render', () => {
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.queryByText('isi yang pulih')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('names the cause and the next action in the shipped copy', () => {
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.getByText('Tampilan gagal dimuat')).toBeInTheDocument();
    expect(
      screen.getByText('Tekan tombol di bawah untuk memuat ulang tampilan ini.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Muat ulang tampilan' })
    ).toBeInTheDocument();
  });

  it('draws the fallback icon as decoration for assistive technology', () => {
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );

    const icon = screen.getByRole('alert').querySelector('svg');
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});

/**
 * The four halves of the contract that rendering the fallback once does not
 * prove: that it is a page rather than a strip, that its recovery control is a
 * real operable button, that the caught error is reported, and that the
 * boundary is neither disarmed by its own recovery nor wider than its subtree.
 */
describe('ErrorBoundary crash surface', () => {
  let errorSpy;

  beforeEach(() => {
    shouldThrow = true;
    // React re-throws a caught boundary error to console.error here too, so the
    // spy is installed before every case in this block.
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  /**
   * The ring utilities that must travel with a 44px target. A target without a
   * visible focus ring fails FIX-02, and a ring on a sub-44px target fails
   * FIX-03, so the two are asserted on the same element rather than apart.
   */
  const RING = ['focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-primary', 'focus-visible:ring-offset-2'];

  const renderFallback = () =>
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );

  it('fills the viewport the way a page does, rather than a strip above a blank document', () => {
    const { container } = renderFallback();

    const shell = container.firstChild;
    expect(shell).toHaveClass('min-h-[100dvh]');
    expect(shell).toHaveClass('bg-bg');

    const title = screen.getByText('Tampilan gagal dimuat');
    const body = screen.getByText(
      'Tekan tombol di bawah untuk memuat ulang tampilan ini.'
    );
    // The body is its own node at a measure a carer can read, rather than a
    // continuation of the cause line.
    expect(body).not.toBe(title);
    expect(body).toHaveClass('max-w-prose');
  });

  it('recovers the wrapped subtree through a real, keyboard-operable button', async () => {
    const user = userEvent.setup();
    renderFallback();

    const recovery = screen.getByRole('button', {
      name: 'Muat ulang tampilan',
    });

    // It must be a real <button type="button">: an anchor styled as a button
    // would reload the document and discard the recovery, and a <div> with an
    // onClick is not keyboard operable at all.
    expect(recovery.tagName).toBe('BUTTON');
    expect(recovery).toHaveAttribute('type', 'button');
    expect(recovery).toHaveClass('min-h-[44px]');
    for (const token of RING) expect(recovery).toHaveClass(token);
    // The offset colour completes the ring, so the two complete tokens are
    // probed by name rather than matched as a pattern: a partial token here
    // would itself be read as a Tailwind class and fail the token gate.
    const offsetColour = [
      'focus-visible:ring-offset-bg',
      'focus-visible:ring-offset-surface',
    ].find((token) => recovery.className.includes(token));
    expect(offsetColour).toBeDefined();

    // The throw was transient, so the boundary's own recovery is enough: the
    // subtree renders again with no document reload.
    shouldThrow = false;
    await user.click(recovery);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('isi yang pulih')).toBeInTheDocument();
  });

  it('reports the caught error and its component stack instead of swallowing it', () => {
    renderFallback();

    // React's own re-throw also reaches console.error, so the boundary's report
    // is located by the stable label it logs under rather than by call order.
    const report = errorSpy.mock.calls.find(
      (call) => call[0] === '[ErrorBoundary] render error'
    );

    expect(report).toBeDefined();
    const [, error, stack] = report;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('fixture: the child failed to render');
    expect(typeof stack).toBe('string');
    expect(stack).toContain('Thrower');
  });

  it('is armed again after a recovery, so a second throw is still caught', async () => {
    const user = userEvent.setup();
    const { rerender } = renderFallback();

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: 'Muat ulang tampilan' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // The fault comes back: the recovery must not have disarmed the boundary.
    shouldThrow = true;
    rerender(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('isi yang pulih')).not.toBeInTheDocument();
  });

  it('contains the blast radius to its own subtree', () => {
    render(
      <ErrorBoundary>
        <p>shell yang utuh</p>
        <ErrorBoundary>
          <Thrower />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // The inner boundary renders the fallback for its own child, and the
    // sibling beside it is untouched: a view that throws does not dismantle
    // the shell around it.
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('shell yang utuh')).toBeInTheDocument();
  });
});
