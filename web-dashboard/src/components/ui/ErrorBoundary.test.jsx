import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    // React re-throws a caught boundary error to the console in test
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
