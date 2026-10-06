import { describe, it, expect } from 'vitest';
import { DICTIONARY, t } from './i18n.js';

describe('i18n Translation Dictionary', () => {
  const REQUIRED_KEYS = [
    // Navigation
    'nav.command',
    'nav.signals',
    'nav.settings',
    'nav.docs',
    'nav.support',
    // Status & Risk
    'risk.safe',
    'risk.warning',
    'risk.danger',
    'risk.score',
    'risk.status',
    // Metrics
    'metrics.peakPressure',
    'metrics.sustainedDuration',
    'metrics.balance',
    'metrics.activeSensor',
    // Anatomical
    'anatomy.forefoot',
    'anatomy.midfoot',
    'anatomy.heel',
    // Simulator
    'sim.title',
    'sim.mode',
    'sim.scenarios.normal',
    'sim.scenarios.forefoot',
    'sim.scenarios.danger',
    'sim.scenarios.resting',
    // Alerts
    'alert.title',
    'alert.sustainedWarning',
    'alert.dangerAdvice',
    'alert.dismiss',
    'alert.mute',
    // General UI
    'app.title',
    'app.subtitle',
    'source.live',
    'source.sim',
    'battery',
  ];

  it('contains all required terminology keys in ID dictionary', () => {
    expect(DICTIONARY).toBeDefined();
    expect(DICTIONARY.id).toBeDefined();
    for (const key of REQUIRED_KEYS) {
      expect(DICTIONARY.id[key], `Missing ID key: ${key}`).toBeDefined();
      expect(typeof DICTIONARY.id[key]).toBe('string');
      expect(DICTIONARY.id[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('contains all required terminology keys in EN dictionary', () => {
    expect(DICTIONARY.en).toBeDefined();
    for (const key of REQUIRED_KEYS) {
      expect(DICTIONARY.en[key], `Missing EN key: ${key}`).toBeDefined();
      expect(typeof DICTIONARY.en[key]).toBe('string');
      expect(DICTIONARY.en[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('exhibits exact key symmetry between ID and EN dictionaries', () => {
    const idKeys = Object.keys(DICTIONARY.id).sort();
    const enKeys = Object.keys(DICTIONARY.en).sort();
    expect(idKeys).toEqual(enKeys);
  });

  describe('t(key, lang) helper function', () => {
    it('translates correctly to Indonesian (id)', () => {
      expect(t('nav.command', 'id')).toBe('Beranda');
      expect(t('risk.safe', 'id')).toBe('Aman');
      expect(t('risk.danger', 'id')).toBe('Bahaya');
      expect(t('anatomy.forefoot', 'id')).toBe('Kaki Depan (Metatarsal)');
      expect(t('alert.title', 'id')).toBe('PERINGATAN DINI TEKANAN TINGGI');
      expect(t('source.live', 'id')).toBe('TERHUBUNG FIREBASE');
    });

    it('translates correctly to English (en)', () => {
      expect(t('nav.command', 'en')).toBe('Command');
      expect(t('risk.safe', 'en')).toBe('Safe');
      expect(t('risk.danger', 'en')).toBe('Danger');
      expect(t('anatomy.forefoot', 'en')).toBe('Forefoot (Metatarsal)');
      expect(t('alert.title', 'en')).toBe('EARLY WARNING: HIGH PRESSURE');
      expect(t('source.live', 'en')).toBe('FIREBASE LIVE');
    });

    it('defaults to Indonesian (id) when lang is omitted', () => {
      expect(t('nav.command')).toBe('Beranda');
      expect(t('metrics.peakPressure')).toBe('Tekanan Puncak');
      expect(t('battery')).toBe('Baterai');
    });

    it('falls back to id when an unknown language is passed', () => {
      expect(t('nav.command', 'fr')).toBe('Beranda');
      expect(t('risk.warning', 'de')).toBe('Waspada');
      expect(t('battery', null)).toBe('Baterai');
      expect(t('battery', undefined)).toBe('Baterai');
    });

    it('falls back to Indonesian if key is missing in requested language', () => {
      // Temporarily test fallback by checking DICTIONARY.id lookup when target is en but key missing in en
      const tempKey = '__test_id_only_key__';
      DICTIONARY.id[tempKey] = 'Hanya ID';
      expect(t(tempKey, 'en')).toBe('Hanya ID');
      delete DICTIONARY.id[tempKey];
    });

    it('returns the key as fallback when the key is unknown', () => {
      expect(t('unknown.key.name', 'id')).toBe('unknown.key.name');
      expect(t('unknown.key.name', 'en')).toBe('unknown.key.name');
      expect(t('unknown.key.name')).toBe('unknown.key.name');
    });

    it('handles non-string keys gracefully', () => {
      expect(t(null)).toBe('');
      expect(t(undefined)).toBe('');
      expect(t('')).toBe('');
    });
  });
});
