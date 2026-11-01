import '@testing-library/jest-dom';

/**
 * Deterministic storage for the test environment.
 *
 * On newer Node versions (>= 22) `globalThis.localStorage` is an experimental
 * getter that returns `undefined` unless Node is started with
 * `--localstorage-file`. Because Vitest does not overwrite existing globals
 * when populating the jsdom window, that shadowing getter wins and the bare
 * `localStorage` identifier is unusable in tests. Install a fresh
 * Storage-compatible in-memory object on every test file instead of probing
 * (probing would emit an ExperimentalWarning per file).
 */
const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem(key: string): string | null {
      const k = String(key);
      return store.has(k) ? (store.get(k) ?? null) : null;
    },
    setItem(key: string, value: string): void {
      store.set(String(key), String(value));
    },
    removeItem(key: string): void {
      store.delete(String(key));
    },
    clear(): void {
      store.clear();
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    get length(): number {
      return store.size;
    },
  },
  configurable: true,
  writable: true,
});
