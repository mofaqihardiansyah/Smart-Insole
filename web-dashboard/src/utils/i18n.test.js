import { describe, it, expect } from 'vitest';
import { DICTIONARY, t, hasKey, dictionaryKeys } from './i18n.js';

describe('i18n dictionary', () => {
  const keys = dictionaryKeys();

  it('covers every page of the application', () => {
    // One representative key per surface. If a page is added without strings,
    // this fails before the page ships with hardcoded Indonesian.
    const required = [
      'app.title',
      'nav.dashboard',
      'nav.monitoring',
      'nav.history',
      'nav.device',
      'nav.settings',
      'nav.profile',
      'nav.notifications',
      'risk.safe',
      'risk.warning',
      'risk.danger',
      'risk.score',
      'risk.status',
      'anatomy.forefoot',
      'anatomy.midfoot',
      'anatomy.heel',
      'metrics.peakPressure',
      'metrics.sustainedDuration',
      'metrics.balance',
      'source.simulator',
      'source.firebase',
      'dashboard.title',
      'monitoring.title',
      'monitoring.threshold',
      'history.title',
      'history.export',
      'history.empty',
      'device.title',
      'device.battery',
      'device.firmware',
      'settings.title',
      'settings.warningKpa',
      'settings.dangerKpa',
      'profile.title',
      'profile.language',
      'notifications.title',
      'notifications.permission',
      'alert.dismiss',
      'sim.title',
      'auth.login.title',
      'auth.register.title',
      'landing.hero.title',
      'common.retry',
    ];

    for (const key of required) {
      expect(keys, `missing key: ${key}`).toContain(key);
    }
  });

  it('has exactly the same key set in both languages', () => {
    // This is the assertion that stops English from silently falling back to
    // Indonesian one string at a time.
    const idKeys = Object.keys(DICTIONARY.id).sort();
    const enKeys = Object.keys(DICTIONARY.en).sort();

    expect(idKeys.length).toBeGreaterThan(150);
    expect(enKeys).toEqual(idKeys);
  });

  it('has no empty values', () => {
    for (const lang of ['id', 'en']) {
      for (const [key, value] of Object.entries(DICTIONARY[lang])) {
        if (key === 'auth.register.subtitle') continue; // intentionally blank
        expect(String(value).trim(), `${lang}:${key} is empty`).not.toBe('');
      }
    }
  });

  it('ships no em dashes or en dashes', () => {
    // antislop R-02 is a hard gate: no em dash in any shipped string.
    for (const lang of ['id', 'en']) {
      for (const [key, value] of Object.entries(DICTIONARY[lang])) {
        expect(
          /[\u2014\u2013]/.test(String(value)),
          `${lang}:${key} contains a dash`
        ).toBe(false);
      }
    }
  });

  it('actually translates the high traffic strings rather than copying them', () => {
    // Catches copy-paste-without-translating, which is the real risk. Keys where
    // the same token is correct in both languages are excluded by using an
    // explicit list rather than a blanket rule.
    const mustDiffer = [
      'nav.dashboard',
      'nav.settings',
      'risk.safe',
      'risk.warning',
      'risk.danger',
      'risk.status',
      'metrics.peakPressure',
      'metrics.sustainedDuration',
      'anatomy.forefoot',
      'dashboard.title',
      'monitoring.title',
      'history.title',
      'device.title',
      'device.battery',
      'settings.title',
      'profile.title',
      'notifications.title',
      'landing.hero.title',
      'alert.dismiss',
      'common.retry',
    ];

    for (const key of mustDiffer) {
      expect(
        DICTIONARY.en[key],
        `${key} was not translated`
      ).not.toBe(DICTIONARY.id[key]);
    }
  });
});

describe('t(key, lang)', () => {
  it('translates to Indonesian', () => {
    expect(t('nav.dashboard', 'id')).toBe('Dasbor');
    expect(t('risk.safe', 'id')).toBe('Aman');
    expect(t('risk.danger', 'id')).toBe('Bahaya');
    expect(t('anatomy.heel', 'id')).toBe('Tumit (Heel)');
  });

  it('translates to English', () => {
    expect(t('nav.dashboard', 'en')).toBe('Dashboard');
    expect(t('risk.safe', 'en')).toBe('Safe');
    expect(t('risk.danger', 'en')).toBe('Danger');
    expect(t('anatomy.heel', 'en')).toBe('Heel (Calcaneus)');
  });

  it('defaults to Indonesian when lang is omitted', () => {
    expect(t('nav.dashboard')).toBe('Dasbor');
    expect(t('metrics.peakPressure')).toBe('Tekanan puncak');
  });

  it('falls back to Indonesian for an unknown language', () => {
    expect(t('nav.dashboard', 'fr')).toBe('Dasbor');
    expect(t('risk.warning', 'de')).toBe('Waspada');
    expect(t('risk.warning', null)).toBe('Waspada');
  });

  it('returns the key when a translation is missing, rather than blank', () => {
    // A visible key is a bug you can see; an empty string is a bug you cannot.
    expect(t('does.not.exist', 'id')).toBe('does.not.exist');
    expect(t('does.not.exist', 'en')).toBe('does.not.exist');
  });

  it('handles invalid keys without throwing', () => {
    expect(t(undefined, 'id')).toBe('');
    expect(t(null, 'id')).toBe('');
    expect(t('', 'id')).toBe('');
  });

  it('reports key existence for both languages', () => {
    expect(hasKey('risk.safe')).toBe(true);
    expect(hasKey('nope.nope')).toBe(false);
  });
});
