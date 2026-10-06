/**
 * Bilingual Translation Dictionary (ID / EN)
 * for Smart Insole Plantar Pressure Monitoring Dashboard.
 */

export const DICTIONARY = {
  id: {
    // Navigation
    'nav.command': 'Beranda',
    'nav.signals': 'Sinyal & Riwayat',
    'nav.settings': 'Klinis & Pengaturan',
    'nav.docs': 'Dokumentasi',
    'nav.support': 'Bantuan & Kontak',

    // Status & Risk
    'risk.safe': 'Aman',
    'risk.warning': 'Waspada',
    'risk.danger': 'Bahaya',
    'risk.score': 'Skor Risiko',
    'risk.status': 'Status Risiko',
    'risk.advice.safe': 'Tekanan plantar normal, aman untuk beraktivitas.',
    'risk.advice.warning': 'Tekanan meningkat. Pertimbangkan untuk berganti tumpuan kaki.',
    'risk.advice.danger': 'Segera kurangi tumpuan pada kaki untuk mencegah cedera jaringan/ulkus.',

    // Metrics
    'metrics.peakPressure': 'Tekanan Puncak',
    'metrics.sustainedDuration': 'Durasi Tumpuan',
    'metrics.balance': 'Distribusi Beban',
    'metrics.activeSensor': 'Sensor Aktif',

    // Anatomical
    'anatomy.forefoot': 'Kaki Depan (Metatarsal)',
    'anatomy.midfoot': 'Kaki Tengah (Arch)',
    'anatomy.heel': 'Tumit (Heel)',

    // Simulator
    'sim.title': 'Simulator Insole',
    'sim.mode': 'Mode Skenario',
    'sim.scenarios.normal': 'Berjalan Normal',
    'sim.scenarios.forefoot': 'Beban Kaki Depan',
    'sim.scenarios.danger': 'Tumpuan Bahaya Lama',
    'sim.scenarios.resting': 'Istirahat (Tanpa Beban)',

    // Alerts
    'alert.title': 'PERINGATAN DINI TEKANAN TINGGI',
    'alert.sustainedWarning': 'Tumpuan bertekanan tinggi terdeteksi melebihi batas aman.',
    'alert.dangerAdvice': 'Segera kurangi tumpuan atau istirahatkan kaki untuk mencegah luka ulkus diabetikum.',
    'alert.dismiss': 'Tutup Peringatan',
    'alert.mute': 'Bungkam Suara',

    // General UI & Topbar
    'app.title': 'SMART INSOLE IoT',
    'app.subtitle': 'Plantar Pressure Monitoring',
    'source.live': 'TERHUBUNG FIREBASE',
    'source.sim': 'MODE SIMULATOR',
    'battery': 'Baterai',

    // Telemetry Waveform
    'telemetry.title': 'Grafik Tekanan Waktu Nyata',
    'telemetry.threshold': 'Batas Bahaya (70 kPa)',

    // History & Incident Logs
    'history.title': 'Riwayat Sinyal & Insiden',
    'history.empty': 'Belum ada catatan insiden tercatat.',
    'history.timestamp': 'Waktu',
    'history.sensor': 'Titik Tekanan',
    'history.pressure': 'Tekanan',
    'history.duration': 'Durasi',
    'history.riskLevel': 'Tingkat Risiko',

    // Clinical Guidelines & Settings
    'settings.title': 'Pedoman Klinis & Pengaturan',
    'settings.dfuGuide': 'Pedoman Pencegahan Ulkus Kaki Diabetikum (DFU)',
    'settings.firebaseStatus': 'Status Koneksi Firebase',
    'settings.language': 'Bahasa Antarmuka',
  },

  en: {
    // Navigation
    'nav.command': 'Command',
    'nav.signals': 'Signals & History',
    'nav.settings': 'Clinical & Settings',
    'nav.docs': 'Documentation',
    'nav.support': 'Support',

    // Status & Risk
    'risk.safe': 'Safe',
    'risk.warning': 'Warning',
    'risk.danger': 'Danger',
    'risk.score': 'Risk Score',
    'risk.status': 'Risk Status',
    'risk.advice.safe': 'Plantar pressure normal, safe to continue activity.',
    'risk.advice.warning': 'Elevated pressure. Consider alternating foot pressure.',
    'risk.advice.danger': 'Immediately relieve foot pressure to prevent tissue injury or ulceration.',

    // Metrics
    'metrics.peakPressure': 'Peak Pressure',
    'metrics.sustainedDuration': 'Sustained Duration',
    'metrics.balance': 'Load Distribution',
    'metrics.activeSensor': 'Active Sensor',

    // Anatomical
    'anatomy.forefoot': 'Forefoot (Metatarsal)',
    'anatomy.midfoot': 'Midfoot (Arch)',
    'anatomy.heel': 'Heel (Calcaneus)',

    // Simulator
    'sim.title': 'Insole Simulator',
    'sim.mode': 'Scenario Mode',
    'sim.scenarios.normal': 'Normal Gait',
    'sim.scenarios.forefoot': 'Forefoot Overload',
    'sim.scenarios.danger': 'Prolonged Standing Danger',
    'sim.scenarios.resting': 'Resting / Unloaded',

    // Alerts
    'alert.title': 'EARLY WARNING: HIGH PRESSURE',
    'alert.sustainedWarning': 'Sustained high pressure detected exceeding safe threshold.',
    'alert.dangerAdvice': 'Immediately relieve weight or rest the foot to prevent diabetic foot ulceration.',
    'alert.dismiss': 'Dismiss Alert',
    'alert.mute': 'Mute Alarm',

    // General UI & Topbar
    'app.title': 'SMART INSOLE IoT',
    'app.subtitle': 'Plantar Pressure Monitoring',
    'source.live': 'FIREBASE LIVE',
    'source.sim': 'SIMULATOR MODE',
    'battery': 'Battery',

    // Telemetry Waveform
    'telemetry.title': 'Real-Time Pressure Telemetry',
    'telemetry.threshold': 'Danger Threshold (70 kPa)',

    // History & Incident Logs
    'history.title': 'Signal History & Incidents',
    'history.empty': 'No incidents recorded yet.',
    'history.timestamp': 'Timestamp',
    'history.sensor': 'Pressure Point',
    'history.pressure': 'Pressure',
    'history.duration': 'Duration',
    'history.riskLevel': 'Risk Level',

    // Clinical Guidelines & Settings
    'settings.title': 'Clinical Guidelines & Settings',
    'settings.dfuGuide': 'Diabetic Foot Ulcer (DFU) Prevention Guidelines',
    'settings.firebaseStatus': 'Firebase Connection Status',
    'settings.language': 'Interface Language',
  },
};

/**
 * Translate a key into the chosen language (defaults to 'id').
 *
 * @param {string} key - Dictionary key in dot notation
 * @param {'id' | 'en' | string} [lang='id'] - Target language
 * @returns {string} Translated string or fallback
 */
export function t(key, lang = 'id') {
  if (!key || typeof key !== 'string') {
    return '';
  }

  const targetLang = DICTIONARY[lang] ? lang : 'id';
  const targetDict = DICTIONARY[targetLang];

  if (targetDict && targetDict[key] !== undefined) {
    return targetDict[key];
  }

  // Fallback to Indonesian if missing in current language
  if (targetLang !== 'id' && DICTIONARY.id && DICTIONARY.id[key] !== undefined) {
    return DICTIONARY.id[key];
  }

  // Fallback to English if missing in ID
  if (DICTIONARY.en && DICTIONARY.en[key] !== undefined) {
    return DICTIONARY.en[key];
  }

  return key;
}

export default {
  DICTIONARY,
  t,
};
