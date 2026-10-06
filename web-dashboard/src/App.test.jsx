import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import App from './App';

describe('App Scaffolding & Stitch Theme', () => {
  it('renders the application title and telemetry header', () => {
    render(<App />);
    expect(screen.getByText(/Smart Insole IoT Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Cinematic Precision Telemetry System/i)).toBeInTheDocument();
  });

  it('contains Stitch theme container with dark background class', () => {
    const { container } = render(<App />);
    const rootElement = container.firstChild;
    expect(rootElement).toHaveClass('bg-background');
    expect(rootElement).toHaveClass('text-on-background');
  });

  it('verifies Stitch color and font utility classes exist in DOM hierarchy', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('font-h1');
    expect(heading).toHaveClass('text-on-background');

    const subtitle = screen.getByText(/Cinematic Precision Telemetry System/i);
    expect(subtitle).toHaveClass('font-mono-data');
    expect(subtitle).toHaveClass('text-textSecondary');
  });
});
