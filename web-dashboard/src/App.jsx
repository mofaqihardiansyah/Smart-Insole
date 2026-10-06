import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-background text-on-background p-6 font-sans">
      <header className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div>
          <h1 className="font-h1 text-2xl font-bold tracking-tight text-on-background">
            Smart Insole IoT Dashboard
          </h1>
          <p className="text-sm text-textSecondary font-mono-data">
            Cinematic Precision Telemetry System
          </p>
        </div>
        <span className="material-symbols-outlined text-secondary text-3xl">
          sensors
        </span>
      </header>
      <main>
        <div className="bg-surface rounded-xl p-6 border border-border">
          <p className="text-textSecondary">System initializing...</p>
        </div>
      </main>
    </div>
  );
}
