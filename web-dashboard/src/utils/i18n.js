/**
 * Bilingual dictionary (Bahasa Indonesia / English) for the Smart Insole
 * plantar pressure dashboard.
 *
 * Two rules govern this file:
 *
 *   1. `id` and `en` must have exactly the same key set. `i18n.test.js`
 *      asserts that parity, which is what stops English from silently falling
 *      back to Indonesian one string at a time.
 *   2. Values are the strings that ship, so no em dashes (antislop R-02) and no
 *      marketing vocabulary. Clinical, specific, short.
 *
 * English strings run roughly 30 percent longer than Indonesian. The layout is
 * built to survive that, and the string lengths here are chosen with it in
 * mind rather than translated word for word.
 */

export const DICTIONARY = {
  id: {
    /* ------------------------------ Brand ------------------------------ */
    'app.title': 'Smart Insole IoT',
    'app.tagline': 'Pemantauan Tekanan Telapak Kaki',
    'app.taglineShort': 'Analitik plantar',
    'app.loading': 'Memuat data',
    'app.skipToContent': 'Lewati ke konten utama',
    'app.footer': 'Tugas Akhir, pemantauan tekanan plantar berbasis IoT',

    /* --------------------------- Navigation ---------------------------- */
    'nav.dashboard': 'Dasbor',
    'nav.monitoring': 'Monitoring',
    'nav.history': 'Riwayat',
    'nav.device': 'Perangkat',
    'nav.settings': 'Pengaturan',
    'nav.profile': 'Profil',
    'nav.admin': 'Admin',
    'admin.title': 'Konsol Admin',
    'admin.subtitle': 'Kelola pengguna, perangkat, dan konfigurasi global.',
    'admin.accessDenied': 'Akses ditolak',
    'admin.accessDeniedBody': 'Halaman ini hanya untuk administrator.',
    'admin.users.title': 'Pengguna',
    'admin.users.loading': 'Memuat daftar pengguna…',
    'admin.users.error': 'Gagal memuat pengguna',
    'admin.users.empty': 'Belum ada pengguna terdaftar.',
    'admin.users.name': 'Nama',
    'admin.users.email': 'Email',
    'admin.users.status': 'Status',
    'admin.users.active': 'Aktif',
    'admin.users.inactive': 'Nonaktif',
    'admin.users.actions': 'Aksi',
    'admin.users.activate': 'Aktifkan',
    'admin.users.deactivate': 'Nonaktifkan',
    'admin.users.delete': 'Hapus',
    'admin.confirmActivate': 'Aktifkan akun ini?',
    'admin.confirmDeactivate': 'Nonaktifkan akun ini? Pengguna tidak bisa login selama dinonaktifkan.',
    'admin.confirmDelete': 'Hapus akun ini permanen? Data pengguna akan dihapus dari Firestore.',
    'admin.devices.title': 'Perangkat',
    'admin.devices.error': 'Gagal membaca status perangkat',
    'admin.devices.empty': 'Belum ada perangkat yang melaporkan data.',
    'admin.devices.deviceId': 'ID Perangkat',
    'admin.devices.battery': 'Baterai',
    'admin.devices.status': 'Status',
    'admin.devices.online': 'Online',
    'admin.devices.offline': 'Offline',
    'admin.devices.lastSeen': 'Terakhir terlihat',
    'admin.config.title': 'Konfigurasi Global',
    'admin.config.safe': 'Batas Aman (kPa)',
    'admin.config.danger': 'Batas Bahaya (kPa)',
    'admin.config.save': 'Simpan',
    'admin.config.saving': 'Menyimpan…',
    'admin.config.saved': 'Tersimpan',
    'nav.main': 'Navigasi utama',
    'nav.openMenu': 'Buka menu navigasi',
    'nav.closeMenu': 'Tutup menu navigasi',
    // Short forms for the mobile bottom bar, where seven items share a 360px
    // row. Desktop uses the full labels above.
    'nav.dashboard.short': 'Dasbor',
    'nav.monitoring.short': 'Pantau',
    'nav.history.short': 'Riwayat',
    'nav.device.short': 'Alat',
    'nav.settings.short': 'Atur',
    'nav.profile.short': 'Profil',
    'nav.notifications': 'Notifikasi',
    'nav.notifications.short': 'Notif',

    /* ------------------------------ Risk ------------------------------- */
    'risk.safe': 'Aman',
    'risk.warning': 'Waspada',
    'risk.danger': 'Bahaya',
    'risk.unknown': 'Belum diketahui',
    'risk.status': 'Status risiko',
    'risk.score': 'Skor risiko',
    'risk.advice.safe':
      'Tekanan dalam batas aman. Lanjutkan aktivitas seperti biasa.',
    'risk.advice.warning':
      'Tekanan meningkat. Ganti tumpuan kaki dan kurangi durasi berdiri.',
    'risk.advice.danger':
      'Kurangi tumpuan pada kaki sekarang. Istirahatkan kaki untuk mencegah luka.',

    /* ---------------------------- Sensors ------------------------------ */
    'anatomy.forefoot': 'Kaki Depan (Metatarsal)',
    'anatomy.midfoot': 'Kaki Tengah (Arch)',
    'anatomy.heel': 'Tumit (Heel)',
    'anatomy.forefoot.short': 'Depan',
    'anatomy.midfoot.short': 'Tengah',
    'anatomy.heel.short': 'Tumit',

    /* ----------------------------- Metrics ----------------------------- */
    'metrics.peakPressure': 'Tekanan puncak',
    'metrics.sustainedDuration': 'Durasi tumpuan',
    'metrics.balance': 'Distribusi beban',
    'metrics.unit.kpa': 'kPa',
    'metrics.unit.seconds': 'detik',
    'metrics.unit.percent': '%',

    /* ------------------------- Data source state ----------------------- */
    'source.simulator': 'Mode simulasi',
    'source.firebase': 'Firebase langsung',
    'source.live': 'Terhubung',
    'source.connecting': 'Menghubungkan',
    'source.error': 'Gagal terhubung',
    'source.simTitle': 'Data contoh dari simulator',
    'source.simBody':
      'Insole belum terhubung ke Firebase. Angka di halaman ini dihasilkan simulator, bukan dari sensor.',
    'source.errorTitle': 'Koneksi Firebase gagal',
    'source.errorBody':
      'Aplikasi tetap menampilkan data simulator sampai perangkat terhubung kembali.',
    'source.noDeviceTitle': 'Belum ada data dari perangkat',
    'source.noDeviceBody':
      'Insole belum mengirim data ke Firebase. Setelah terkirim, halaman ini akan memperbarui sendiri.',

    /* --------------------------- Dashboard ----------------------------- */
    'dashboard.title': 'Dasbor tekanan plantar',
    'dashboard.subtitle':
      'Tiga titik sensor, satu pembacaan per detik, diperbarui langsung.',
    'dashboard.plantarView': 'Peta tekanan telapak kaki',
    'dashboard.riskSummary': 'Ringkasan risiko',
    'dashboard.legend': 'Skala warna tekanan',
    'dashboard.legendLow': 'Rendah',
    'dashboard.legendHigh': 'Tinggi',
    'dashboard.recentIncidents': 'Insiden terakhir',
    'dashboard.simulator': 'Simulator insole',
    // Greeting header
    'dashboard.greeting.morning': 'Selamat pagi',
    'dashboard.greeting.afternoon': 'Selamat siang',
    'dashboard.greeting.evening': 'Selamat malam',
    'dashboard.statusLabel': 'Status',
    'dashboard.statusSafe': 'terkendali',
    'dashboard.statusWarning': 'perlu perhatian',
    'dashboard.statusDanger': 'butuh tindakan',
    'dashboard.exportCsv': 'Ekspor CSV',
    'dashboard.acknowledge': 'Tandai dibaca',
    'dashboard.acknowledged': 'Semua peringatan sudah dibaca',
    // Trend card
    'dashboard.trendTitle': 'Tren tekanan',
    'dashboard.trendBody': 'Tekanan puncak tiap detik pada sesi berjalan',
    'dashboard.meanPeak': 'Rata-rata puncak',
    'dashboard.window': '30 detik terakhir',
    // Load distribution card
    'dashboard.loadTitle': 'Distribusi beban',
    'dashboard.loadBody': 'Bagian setiap titik sensor',
    'dashboard.totalLoad': 'Total kPa',
    // Activity table
    'dashboard.activityTitle': 'Aktivitas terbaru',
    'dashboard.activityBody': 'Aliran pembacaan langsung dari insole',
    'dashboard.viewAll': 'Lihat semua riwayat',
    'dashboard.loadMore': 'Muat lebih banyak',
    'dashboard.noMatch': 'Belum ada pembacaan masuk',
    'dashboard.col.zone': 'Titik sensor',
    'dashboard.col.time': 'Waktu',
    'dashboard.col.pressure': 'Tekanan',
    'dashboard.col.status': 'Status',
    'dashboard.col.actions': 'Aksi',
    'dashboard.rowMenu': 'Buka di riwayat',
    'dashboard.heatmapTitle': 'Peta tekanan telapak kaki',
    'dashboard.heatmapBody':
      'Tiga titik sensor dipetakan ke bentuk telapak kaki kiri.',
    // Stat card captions
    'dashboard.caption.threshold': 'Ambang bahaya {value} kPa',
    'dashboard.caption.durationLimit': 'Batas durasi {value} detik',
    'dashboard.caption.battery': 'Sumber data: {value}',
    'dashboard.caption.scoreRange': 'Skala 0 sampai 100',
    'dashboard.deltaSteady': 'stabil',
    'dashboard.withinLimit': 'Dalam batas',
    'dashboard.overLimit': 'Lewat batas',

    /* ---------------------------- Monitoring --------------------------- */
    'monitoring.title': 'Tren tekanan',
    'monitoring.subtitle':
      'Tiga sensor selama 30 detik terakhir pada sesi yang sedang berjalan.',
    'monitoring.chartTitle': 'Grafik tekanan waktu nyata',
    'monitoring.threshold': 'Batas bahaya',
    'monitoring.axisTime': 'Waktu',
    'monitoring.axisPressure': 'Tekanan (kPa)',
    'monitoring.empty': 'Belum ada data grafik',
    'monitoring.emptyBody':
      'Grafik terisi setelah sensor mengirim pembacaan pertama.',
    'monitoring.loading': 'Memuat grafik',
    'monitoring.summary': 'Ringkasan sesi',
    'monitoring.average': 'Rata-rata',
    'monitoring.maximum': 'Tertinggi',

    /* ----------------------------- History ----------------------------- */
    'history.title': 'Riwayat sesi',
    'history.subtitle':
      'Catatan insiden yang tercatat selama pemantauan berlangsung.',
    'history.totalIncidents': 'Total insiden',
    'history.dangerCount': 'Insiden bahaya',
    'history.warningCount': 'Insiden waspada',
    'history.export': 'Ekspor CSV',
    'history.refresh': 'Muat ulang',
    'history.refreshing': 'Memuat ulang',
    'history.loading': 'Memuat riwayat',
    'history.errorTitle': 'Riwayat gagal dimuat',
    'history.empty': 'Belum ada insiden tercatat',
    'history.emptyBody':
      'Insiden muncul di sini saat tekanan melewati batas aman. Riwayat kosong berarti tidak ada peringatan tercatat, bukan data yang hilang.',
    'history.col.time': 'Waktu',
    'history.col.risk': 'Risiko',
    'history.col.peak': 'Puncak',
    'history.col.score': 'Skor',
    'history.col.duration': 'Durasi',
    'history.col.forefoot': 'Depan',
    'history.col.midfoot': 'Tengah',
    'history.col.heel': 'Tumit',

    /* ----------------------------- Device ------------------------------ */
    'device.title': 'Status perangkat',
    'device.subtitle': 'Kondisi insole dan koneksi terakhir ke Firebase.',
    'device.status': 'Status koneksi',
    'device.online': 'Tersambung',
    'device.offline': 'Tidak tersambung',
    'device.battery': 'Baterai',
    'device.batteryLow': 'Baterai lemah',
    'device.firmware': 'Versi firmware',
    'device.lastSeen': 'Terakhir terlihat',
    'device.deviceId': 'ID perangkat',
    'device.unavailable': 'Tidak tersedia',
    'device.notYet': 'Belum pernah',
    'device.loading': 'Memuat status perangkat',
    'device.errorTitle': 'Status perangkat gagal dimuat',
    'device.reconnect': 'Sambungkan ulang',
    'device.reconnecting': 'Menyambungkan',
    'device.tips': 'Pemeriksaan koneksi',
    'device.tip1': 'Pastikan insole menyala dan baterai di atas 20 persen.',
    'device.tip2': 'Pastikan jaringan Wi-Fi di sekitar perangkat stabil.',
    'device.tip3':
      'Jika data tetap kosong, periksa alamat Realtime Database pada konfigurasi Firebase.',
    'device.simulatedNote':
      'Perangkat fisik belum terhubung, sehingga kolom baterai dan firmware belum dapat dibaca.',

    /* ---------------------------- Settings ----------------------------- */
    'settings.title': 'Ambang batas dan preferensi',
    'settings.subtitle':
      'Nilai ini dipakai langsung oleh perhitungan risiko fuzzy.',
    'settings.thresholds': 'Ambang batas risiko',
    'settings.thresholdsBody':
      'Ubah nilai kPa untuk menyesuaikan kapan status naik dari aman ke waspada dan dari waspada ke bahaya.',
    'settings.warningKpa': 'Batas aman (kPa)',
    'settings.dangerKpa': 'Batas bahaya (kPa)',
    'settings.warningSeconds': 'Durasi waspada (detik)',
    'settings.dangerSeconds': 'Durasi bahaya (detik)',
    'settings.invalidOrder':
      'Batas bahaya harus lebih tinggi daripada batas aman.',
    'settings.save': 'Simpan pengaturan',
    'settings.saving': 'Menyimpan',
    'settings.saved': 'Pengaturan tersimpan. Ambang batas berlaku langsung.',
    'settings.reset': 'Kembalikan ke nilai awal',
    'settings.resetDone': 'Ambang batas dikembalikan ke nilai awal.',
    'settings.preview': 'Pratinjau klasifikasi',
    'settings.previewBody':
      'Contoh hasil perhitungan pada beberapa kombinasi tekanan dan durasi:',
    'settings.notifications': 'Notifikasi',
    'settings.sound': 'Suara alarm',
    'settings.soundBody':
      'Nada peringatan dibuat langsung oleh peramban, tanpa berkas audio.',
    'settings.vibration': 'Getaran',
    'settings.vibrationBody':
      'Getaran hanya berfungsi pada peramban dan perangkat yang mendukung.',
    'settings.on': 'Aktif',
    'settings.off': 'Nonaktif',

    /* ----------------------------- Profile ----------------------------- */
    'profile.title': 'Profil pengguna',
    'profile.subtitle': 'Identitas akun dan bahasa antarmuka.',
    'profile.name': 'Nama lengkap',
    'profile.email': 'Alamat email',
    'profile.emailLocked':
      'Alamat email terhubung ke akun dan tidak dapat diubah di sini.',
    'profile.save': 'Simpan profil',
    'profile.saving': 'Menyimpan',
    'profile.saved': 'Profil tersimpan.',
    'profile.language': 'Bahasa antarmuka',
    'profile.stats': 'Statistik pemantauan',
    'profile.memberSince': 'Terdaftar sejak',
    'profile.unavailable': 'Belum tersedia',

    /* -------------------------- Notifications -------------------------- */
    'notifications.title': 'Notifikasi dan alarm',
    'notifications.subtitle':
      'Atur bagaimana peringatan risiko disampaikan kepada Anda.',
    'notifications.permission': 'Izin notifikasi peramban',
    'notifications.permissionBody':
      'Izin diperlukan agar peringatan dapat muncul saat halaman tidak aktif.',
    'notifications.granted': 'Izin diberikan',
    'notifications.denied': 'Izin ditolak',
    'notifications.default': 'Belum diminta',
    'notifications.unsupported':
      'Peramban ini tidak mendukung notifikasi. Peringatan tetap tampil di dalam halaman.',
    'notifications.request': 'Minta izin',
    'notifications.connection': 'Koneksi Firebase',
    'notifications.connected': 'Terhubung',
    'notifications.disconnected': 'Tidak terhubung',
    'notifications.save': 'Simpan preferensi',
    'notifications.saved': 'Preferensi notifikasi tersimpan.',

    /* ------------------------------ Alert ------------------------------ */
    'alert.warningTitle': 'Tekanan meningkat',
    'alert.dangerTitle': 'Tekanan berbahaya terdeteksi',
    'alert.warningBody':
      'Tumpuan bertekanan tinggi terdeteksi. Ganti posisi kaki untuk mengurangi beban.',
    'alert.dangerBody':
      'Tumpuan bertekanan tinggi sudah berlangsung terlalu lama. Istirahatkan kaki sekarang.',
    'alert.dismiss': 'Mengerti, tutup peringatan',
    'alert.mute': 'Bungkam suara alarm',
    'alert.unmute': 'Nyalakan suara alarm',

    /* ---------------------------- Simulator ---------------------------- */
    'sim.title': 'Simulator insole',
    'sim.body':
      'Pilih skenario untuk melihat bagaimana dasbor bereaksi. Data ini simulasi, bukan pengukuran sensor.',
    'sim.scenario': 'Skenario',
    'sim.NORMAL_GAIT': 'Berjalan normal',
    'sim.FOREFOOT_OVERLOAD': 'Beban kaki depan',
    'sim.PROLONGED_STANDING': 'Berdiri lama',
    'sim.RESTING': 'Tanpa beban',

    /* ------------------------------- Auth ------------------------------ */
    'auth.login.title': 'Masuk ke akun',
    'auth.login.subtitle': 'Pantau tekanan telapak kaki pasien.',
    'auth.login.submit': 'Masuk',
    'auth.login.submitting': 'Memproses',
    'auth.login.noAccount': 'Belum punya akun?',
    'auth.login.register': 'Daftar sekarang',
    'auth.login.guest': 'Masuk sebagai tamu',
    'auth.login.guestFailed':
      'Tamu belum diaktifkan di proyek Firebase ini. Silakan daftar dengan email.',
    'auth.register.title': 'Daftar akun baru',
    'auth.register.subtitle': '',
    'auth.register.submit': 'Daftar',
    'auth.register.submitting': 'Memproses',
    'auth.register.haveAccount': 'Sudah punya akun?',
    'auth.register.login': 'Masuk',
    'auth.register.verification':
      'Email verifikasi dikirim ke alamat Anda. Periksa kotak masuk setelah mendaftar.',
    'auth.field.name': 'Nama lengkap',
    'auth.field.email': 'Alamat email',
    'auth.field.password': 'Kata sandi',
    'auth.field.confirmPassword': 'Konfirmasi kata sandi',
    'auth.error.required': 'Semua kolom harus diisi.',
    'auth.error.email': 'Masukkan alamat email yang valid.',
    'auth.error.passwordLength': 'Kata sandi minimal 6 karakter.',
    'auth.error.passwordMismatch': 'Konfirmasi kata sandi tidak cocok.',
    'auth.error.generic': 'Proses gagal. Periksa kembali data Anda.',

    /* ------------------------------ Landing ---------------------------- */
    'landing.hero.eyebrow': 'Alat bantu pencegahan ulkus kaki diabetik',
    'landing.hero.title': 'Deteksi dini tekanan tinggi pada telapak kaki',
    'landing.hero.subtitle':
      'Tiga sensor pada sol sepatu mengirim tekanan plantar ke dasbor ini setiap detik. Nilai risiko dihitung dengan logika fuzzy untuk memperingatkan sebelum terjadi luka.',
    'landing.hero.ctaPrimary': 'Masuk ke dasbor',
    'landing.hero.ctaSecondary': 'Buat akun',
    'landing.hero.demoNote':
      'Peta di samping menampilkan komponen yang sama dengan yang dipakai di dasbor.',
    'landing.problem.title': 'Mengapa tekanan plantar perlu dipantau',
    'landing.problem.body':
      'Neuropati diabetik menurunkan kemampuan merasakan nyeri pada telapak kaki. Tekanan tinggi yang berlangsung lama dapat menimbulkan luka tanpa disadari. Pemantauan berkelanjutan membantu mengenali titik tekanan sebelum berkembang menjadi ulkus.',
    'landing.how.title': 'Cara kerja pemantauan',
    'landing.step.sense.title': 'Ukur',
    'landing.step.sense.body':
      'Insole membaca tiga titik: kaki depan, kaki tengah, dan tumit.',
    'landing.step.judge.title': 'Nilai',
    'landing.step.judge.body':
      'Logika fuzzy menggabungkan besar tekanan dan lamanya tumpuan menjadi skor risiko.',
    'landing.step.warn.title': 'Peringatkan',
    'landing.step.warn.body':
      'Status waspada dan bahaya memicu peringatan visual serta suara alarm.',
    'landing.sensors.title': 'Tiga titik pengukuran',
    'landing.sensors.body':
      'Setiap sensor melaporkan tekanan dalam kilopascal. Titik dengan tekanan tertinggi menentukan status risiko keseluruhan.',
    'landing.risk.title': 'Tiga tingkat risiko',
    'landing.risk.safeBody': 'Tekanan berada di bawah batas aman.',
    'landing.risk.warningBody':
      'Tekanan melewati batas aman, atau tumpuan berlangsung terlalu lama.',
    'landing.risk.dangerBody':
      'Tekanan tinggi berlangsung lebih dari 30 detik berturut-turut.',
    'landing.footerNote':
      'Purwarupa tugas akhir. Data berasal dari simulator selama perangkat fisik belum terhubung.',
    'landing.nav.how': 'Cara kerja',
    'landing.nav.sensors': 'Sensor',
    'landing.nav.risk': 'Risiko',
    'landing.nav.why': 'Mengapa',
    'landing.nav.menu': 'Menu',
    'landing.nav.features': 'Fitur',
    'landing.nav.start': 'Mulai',
    'landing.feature.1.title': 'Pantau Real-time',
    'landing.feature.1.body': 'Tekanan telapak kaki tiga sensor tampil langsung di HP.',
    'landing.feature.2.title': 'Risiko Fuzzy Logic',
    'landing.feature.2.body': 'Logika fuzzy menilai Aman, Waspada, atau Bahaya seketika.',
    'landing.feature.3.title': 'Early Warning',
    'landing.feature.3.body': 'Alarm dan notifikasi saat tekanan berlebih terlalu lama.',
    'landing.feature.4.title': 'Riwayat & Ekspor',
    'landing.feature.4.body': 'Sesi pemantauan tersimpan dan bisa diekspor ke CSV.',
    'landing.feature.5.title': 'Status Perangkat',
    'landing.feature.5.body': 'Baterai, firmware, dan koneksi insole selalu terpantau.',
    'landing.feature.6.title': 'Pengaturan Fleksibel',
    'landing.feature.6.body': 'Batas risiko dan notifikasi disesuaikan kebutuhan.',
    'landing.spec.sensor.title': '3',
    'landing.spec.sensor.body': 'Titik pengukuran di telapak kaki',
    'landing.spec.risk.title': '3',
    'landing.spec.risk.body': 'Tingkat risiko fuzzy logic',
    'landing.spec.rate.title': 'Tiap detik',
    'landing.spec.rate.body': 'Pembaruan tekanan secara berkala',
    'landing.cap.1.title': 'Pengukuran 3 sensor',
    'landing.cap.1.body': 'Forefoot, midfoot, dan heel dibaca terus oleh ESP32.',
    'landing.cap.2.title': 'Fuzzy Logic Assessment',
    'landing.cap.2.body': 'Risiko dihitung di perangkat, tanpa menunggu server.',
    'landing.cap.3.title': 'Peringatan Dini',
    'landing.cap.3.body': 'Alarm suara dan notifikasi saat risiko naik.',
    'landing.flow.1.title': 'Daftar akun',
    'landing.flow.1.body': 'Buat akun gratis dengan email.',
    'landing.flow.2.title': 'Pasang insole',
    'landing.flow.2.body': 'Hubungkan insole ke Wi-Fi rumah.',
    'landing.flow.3.title': 'Mulai pantau',
    'landing.flow.3.body': 'Tekanan dan risiko tampil di dashboard.',
    'landing.stack.1.title': 'ESP32',
    'landing.stack.1.body': 'Mikrokontroler pengukur tiga sensor tekanan dan konektivitas Wi-Fi.',
    'landing.stack.2.title': 'Firebase',
    'landing.stack.2.body': 'Realtime Database menyalurkan data ke dashboard dengan aman.',
    'landing.stack.3.title': 'React',
    'landing.stack.3.body': 'Dashboard PWA yang jalan di HP dan desktop.',
    'landing.feature.title': 'Enam kemampuan, satu alur',
    'landing.feature.body':
      'Semua yang dibutuhkan dari sensor sampai layar, tanpa konfigurasi rumit.',
    'landing.cap.eyebrow': 'Kemampuan',
    'landing.cap.title': 'Dari sensor sampai layar.',
    'landing.step.number': 'Langkah',
    'landing.flow.title': 'Tiga langkah memulai.',
    'landing.stack.eyebrow': 'Teknologi',
    'landing.stack.title': 'Tiga lapis, satu sistem.',
    'landing.cta.title': 'Mulai pantau kaki Anda',
    'landing.cta.body':
      'Buat akun gratis dan lihat tekanan telapak kaki dalam satu dashboard.',

    /* ---------------------------- Top bar ------------------------------- */
    'search.label': 'Cari halaman atau catatan',
    'search.placeholder': 'Cari halaman, titik sensor, atau status...',
    'search.pages': 'Halaman',
    'search.records': 'Catatan terakhir',
    'search.empty': 'Tidak ada yang cocok dengan',
    'search.clear': 'Bersihkan pencarian',
    'search.hint': 'Tekan Enter untuk membuka hasil teratas',
    'topbar.notifications': 'Notifikasi',
    'topbar.account': 'Buka profil',
    'topbar.unread': '{count} peringatan belum dibaca',

    /* ------------------------------ Common ----------------------------- */
    'common.retry': 'Coba lagi',
    'common.dismiss': 'Tutup',
    'common.close': 'Tutup',
    'common.notAvailable': 'Tidak tersedia',
    'common.language': 'Bahasa',
    'common.signOut': 'Keluar',
    'common.copyReading': 'Salin pembacaan',
    'common.copied': 'Tersalin',
    'common.menu': 'Menu',
    'common.loading': 'Memuat',
  },

  en: {
    /* ------------------------------ Brand ------------------------------ */
    'app.title': 'Smart Insole IoT',
    'app.tagline': 'Plantar Pressure Monitoring',
    'app.taglineShort': 'Plantar analytics',
    'app.loading': 'Loading data',
    'app.skipToContent': 'Skip to main content',
    'app.footer': 'Final year project, IoT based plantar pressure monitoring',

    /* --------------------------- Navigation ---------------------------- */
    'nav.dashboard': 'Dashboard',
    'nav.monitoring': 'Monitoring',
    'nav.history': 'History',
    'nav.device': 'Device',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',
    'admin.title': 'Admin Console',
    'admin.subtitle': 'Manage users, devices, and global configuration.',
    'admin.accessDenied': 'Access denied',
    'admin.accessDeniedBody': 'This page is for administrators only.',
    'admin.users.title': 'Users',
    'admin.users.loading': 'Loading users…',
    'admin.users.error': 'Failed to load users',
    'admin.users.empty': 'No users registered yet.',
    'admin.users.name': 'Name',
    'admin.users.email': 'Email',
    'admin.users.status': 'Status',
    'admin.users.active': 'Active',
    'admin.users.inactive': 'Inactive',
    'admin.users.actions': 'Actions',
    'admin.users.activate': 'Activate',
    'admin.users.deactivate': 'Deactivate',
    'admin.users.delete': 'Delete',
    'admin.confirmActivate': 'Activate this account?',
    'admin.confirmDeactivate': 'Deactivate this account? The user cannot log in while deactivated.',
    'admin.confirmDelete': 'Permanently delete this account? User data will be removed from Firestore.',
    'admin.devices.title': 'Devices',
    'admin.devices.error': 'Failed to read device status',
    'admin.devices.empty': 'No devices reporting yet.',
    'admin.devices.deviceId': 'Device ID',
    'admin.devices.battery': 'Battery',
    'admin.devices.status': 'Status',
    'admin.devices.online': 'Online',
    'admin.devices.offline': 'Offline',
    'admin.devices.lastSeen': 'Last seen',
    'admin.config.title': 'Global Configuration',
    'admin.config.safe': 'Safe Threshold (kPa)',
    'admin.config.danger': 'Danger Threshold (kPa)',
    'admin.config.save': 'Save',
    'admin.config.saving': 'Saving…',
    'admin.config.saved': 'Saved',
    'nav.main': 'Main navigation',
    'nav.openMenu': 'Open navigation menu',
    'nav.closeMenu': 'Close navigation menu',
    // Short forms for the mobile bottom bar, where seven items share a 360px
    // row. Desktop uses the full labels above.
    'nav.dashboard.short': 'Home',
    'nav.monitoring.short': 'Trend',
    'nav.history.short': 'Log',
    'nav.device.short': 'Device',
    'nav.settings.short': 'Setup',
    'nav.profile.short': 'Profile',
    'nav.notifications': 'Notifications',
    'nav.notifications.short': 'Alerts',

    /* ------------------------------ Risk ------------------------------- */
    'risk.safe': 'Safe',
    'risk.warning': 'Warning',
    'risk.danger': 'Danger',
    'risk.unknown': 'Unknown',
    'risk.status': 'Risk status',
    'risk.score': 'Risk score',
    'risk.advice.safe': 'Pressure is within the safe range. Continue as normal.',
    'risk.advice.warning':
      'Pressure is rising. Shift your weight and stand for less time.',
    'risk.advice.danger':
      'Relieve weight from the foot now. Rest it to prevent tissue damage.',

    /* ---------------------------- Sensors ------------------------------ */
    'anatomy.forefoot': 'Forefoot (Metatarsal)',
    'anatomy.midfoot': 'Midfoot (Arch)',
    'anatomy.heel': 'Heel (Calcaneus)',
    'anatomy.forefoot.short': 'Fore',
    'anatomy.midfoot.short': 'Mid',
    'anatomy.heel.short': 'Heel',

    /* ----------------------------- Metrics ----------------------------- */
    'metrics.peakPressure': 'Peak pressure',
    'metrics.sustainedDuration': 'Sustained load',
    'metrics.balance': 'Load distribution',
    'metrics.unit.kpa': 'kPa',
    'metrics.unit.seconds': 's',
    'metrics.unit.percent': '%',

    /* ------------------------- Data source state ----------------------- */
    'source.simulator': 'Simulation mode',
    'source.firebase': 'Firebase live',
    'source.live': 'Connected',
    'source.connecting': 'Connecting',
    'source.error': 'Connection failed',
    'source.simTitle': 'Sample data from the simulator',
    'source.simBody':
      'The insole is not connected to Firebase. The figures on this page come from the simulator, not from the sensors.',
    'source.errorTitle': 'Firebase connection failed',
    'source.errorBody':
      'The app keeps showing simulator data until the device reconnects.',
    'source.noDeviceTitle': 'No data from the device yet',
    'source.noDeviceBody':
      'The insole has not published to Firebase. This page updates on its own once it does.',

    /* --------------------------- Dashboard ----------------------------- */
    'dashboard.title': 'Plantar pressure dashboard',
    'dashboard.subtitle':
      'Three sensor points, one reading per second, updated live.',
    'dashboard.plantarView': 'Foot pressure map',
    'dashboard.riskSummary': 'Risk summary',
    'dashboard.legend': 'Pressure colour scale',
    'dashboard.legendLow': 'Low',
    'dashboard.legendHigh': 'High',
    'dashboard.recentIncidents': 'Recent incidents',
    'dashboard.simulator': 'Insole simulator',
    // Greeting header
    'dashboard.greeting.morning': 'Good morning',
    'dashboard.greeting.afternoon': 'Good afternoon',
    'dashboard.greeting.evening': 'Good evening',
    'dashboard.statusLabel': 'Status',
    'dashboard.statusSafe': 'under control',
    'dashboard.statusWarning': 'needs attention',
    'dashboard.statusDanger': 'needs action',
    'dashboard.exportCsv': 'Export CSV',
    'dashboard.acknowledge': 'Mark as read',
    'dashboard.acknowledged': 'All alerts read',
    // Trend card
    'dashboard.trendTitle': 'Pressure trend',
    'dashboard.trendBody': 'Peak pressure per second in the running session',
    'dashboard.meanPeak': 'Mean peak',
    'dashboard.window': 'last 30 seconds',
    // Load distribution card
    'dashboard.loadTitle': 'Load distribution',
    'dashboard.loadBody': 'Share of each sensor point',
    'dashboard.totalLoad': 'Total kPa',
    // Activity table
    'dashboard.activityTitle': 'Recent activity',
    'dashboard.activityBody': 'Live feed of readings from the insole',
    'dashboard.viewAll': 'View all history',
    'dashboard.loadMore': 'Load more activity',
    'dashboard.noMatch': 'No readings yet',
    'dashboard.col.zone': 'Sensor point',
    'dashboard.col.time': 'Date/time',
    'dashboard.col.pressure': 'Pressure',
    'dashboard.col.status': 'Status',
    'dashboard.col.actions': 'Actions',
    'dashboard.rowMenu': 'Open in history',
    'dashboard.heatmapTitle': 'Plantar pressure map',
    'dashboard.heatmapBody': 'Three sensor points mapped onto the left sole shape.',
    // Stat card captions
    'dashboard.caption.threshold': 'Danger limit {value} kPa',
    'dashboard.caption.durationLimit': 'Duration limit {value} seconds',
    'dashboard.caption.battery': 'Data source: {value}',
    'dashboard.caption.scoreRange': 'Scale 0 to 100',
    'dashboard.deltaSteady': 'steady',
    'dashboard.withinLimit': 'Within limit',
    'dashboard.overLimit': 'Over limit',

    /* ---------------------------- Monitoring --------------------------- */
    'monitoring.title': 'Pressure trend',
    'monitoring.subtitle':
      'Three sensors over the last 30 seconds of the current session.',
    'monitoring.chartTitle': 'Real time pressure chart',
    'monitoring.threshold': 'Danger threshold',
    'monitoring.axisTime': 'Time',
    'monitoring.axisPressure': 'Pressure (kPa)',
    'monitoring.empty': 'No chart data yet',
    'monitoring.emptyBody':
      'The chart fills once the sensor sends its first reading.',
    'monitoring.loading': 'Loading chart',
    'monitoring.summary': 'Session summary',
    'monitoring.average': 'Average',
    'monitoring.maximum': 'Peak',

    /* ----------------------------- History ----------------------------- */
    'history.title': 'Session history',
    'history.subtitle': 'Incidents recorded while monitoring was running.',
    'history.totalIncidents': 'Total incidents',
    'history.dangerCount': 'Danger incidents',
    'history.warningCount': 'Warning incidents',
    'history.export': 'Export CSV',
    'history.refresh': 'Refresh',
    'history.refreshing': 'Refreshing',
    'history.loading': 'Loading history',
    'history.errorTitle': 'History failed to load',
    'history.empty': 'No incidents recorded',
    'history.emptyBody':
      'Incidents appear here when pressure crosses a safe limit. An empty list means no warning was recorded, not that data was lost.',
    'history.col.time': 'Time',
    'history.col.risk': 'Risk',
    'history.col.peak': 'Peak',
    'history.col.score': 'Score',
    'history.col.duration': 'Duration',
    'history.col.forefoot': 'Fore',
    'history.col.midfoot': 'Mid',
    'history.col.heel': 'Heel',

    /* ----------------------------- Device ------------------------------ */
    'device.title': 'Device status',
    'device.subtitle': 'Insole condition and last Firebase connection.',
    'device.status': 'Connection status',
    'device.online': 'Connected',
    'device.offline': 'Not connected',
    'device.battery': 'Battery',
    'device.batteryLow': 'Battery low',
    'device.firmware': 'Firmware version',
    'device.lastSeen': 'Last seen',
    'device.deviceId': 'Device ID',
    'device.unavailable': 'Unavailable',
    'device.notYet': 'Never',
    'device.loading': 'Loading device status',
    'device.errorTitle': 'Device status failed to load',
    'device.reconnect': 'Reconnect',
    'device.reconnecting': 'Connecting',
    'device.tips': 'Connection checks',
    'device.tip1': 'Make sure the insole is on and the battery is above 20 percent.',
    'device.tip2': 'Check that Wi-Fi around the device is stable.',
    'device.tip3':
      'If data stays empty, check the Realtime Database URL in the Firebase configuration.',
    'device.simulatedNote':
      'No physical device is connected, so battery and firmware cannot be read.',

    /* ---------------------------- Settings ----------------------------- */
    'settings.title': 'Thresholds and preferences',
    'settings.subtitle':
      'These values feed directly into the fuzzy risk calculation.',
    'settings.thresholds': 'Risk thresholds',
    'settings.thresholdsBody':
      'Adjust the kPa values that decide when status moves from safe to warning, and from warning to danger.',
    'settings.warningKpa': 'Safe limit (kPa)',
    'settings.dangerKpa': 'Danger limit (kPa)',
    'settings.warningSeconds': 'Warning duration (seconds)',
    'settings.dangerSeconds': 'Danger duration (seconds)',
    'settings.invalidOrder': 'The danger limit must be higher than the safe limit.',
    'settings.save': 'Save settings',
    'settings.saving': 'Saving',
    'settings.saved': 'Settings saved. Thresholds apply immediately.',
    'settings.reset': 'Restore defaults',
    'settings.resetDone': 'Thresholds restored to their default values.',
    'settings.preview': 'Classification preview',
    'settings.previewBody':
      'Example results for a few pressure and duration combinations:',
    'settings.notifications': 'Notifications',
    'settings.sound': 'Alarm sound',
    'settings.soundBody':
      'The alert tone is generated by the browser, with no audio file.',
    'settings.vibration': 'Vibration',
    'settings.vibrationBody':
      'Vibration works only on browsers and devices that support it.',
    'settings.on': 'On',
    'settings.off': 'Off',

    /* ----------------------------- Profile ----------------------------- */
    'profile.title': 'User profile',
    'profile.subtitle': 'Account identity and interface language.',
    'profile.name': 'Full name',
    'profile.email': 'Email address',
    'profile.emailLocked':
      'The email is tied to the account and cannot be changed here.',
    'profile.save': 'Save profile',
    'profile.saving': 'Saving',
    'profile.saved': 'Profile saved.',
    'profile.language': 'Interface language',
    'profile.stats': 'Monitoring statistics',
    'profile.memberSince': 'Member since',
    'profile.unavailable': 'Not available yet',

    /* -------------------------- Notifications -------------------------- */
    'notifications.title': 'Notifications and alarms',
    'notifications.subtitle':
      'Decide how risk warnings reach you.',
    'notifications.permission': 'Browser notification permission',
    'notifications.permissionBody':
      'Permission lets warnings appear while the page is in the background.',
    'notifications.granted': 'Permission granted',
    'notifications.denied': 'Permission denied',
    'notifications.default': 'Not requested yet',
    'notifications.unsupported':
      'This browser does not support notifications. Warnings still appear inside the page.',
    'notifications.request': 'Request permission',
    'notifications.connection': 'Firebase connection',
    'notifications.connected': 'Connected',
    'notifications.disconnected': 'Not connected',
    'notifications.save': 'Save preferences',
    'notifications.saved': 'Notification preferences saved.',

    /* ------------------------------ Alert ------------------------------ */
    'alert.warningTitle': 'Pressure is rising',
    'alert.dangerTitle': 'Dangerous pressure detected',
    'alert.warningBody':
      'Sustained high pressure was detected. Shift your foot to reduce the load.',
    'alert.dangerBody':
      'High pressure has been sustained for too long. Rest the foot now.',
    'alert.dismiss': 'Understood, dismiss warning',
    'alert.mute': 'Mute alarm',
    'alert.unmute': 'Unmute alarm',

    /* ---------------------------- Simulator ---------------------------- */
    'sim.title': 'Insole simulator',
    'sim.body':
      'Choose a scenario to see how the dashboard reacts. This is simulated data, not a sensor measurement.',
    'sim.scenario': 'Scenario',
    'sim.NORMAL_GAIT': 'Normal walking',
    'sim.FOREFOOT_OVERLOAD': 'Forefoot overload',
    'sim.PROLONGED_STANDING': 'Prolonged standing',
    'sim.RESTING': 'Resting, unloaded',

    /* ------------------------------- Auth ------------------------------ */
    'auth.login.title': 'Sign in',
    'auth.login.subtitle': 'Monitor a patient plantar pressure.',
    'auth.login.submit': 'Sign in',
    'auth.login.submitting': 'Working',
    'auth.login.noAccount': 'No account yet?',
    'auth.login.register': 'Create one',
    'auth.login.guest': 'Continue as guest',
    'auth.login.guestFailed':
      'Guest access is not enabled on this Firebase project. Please register with an email.',
    'auth.register.title': 'Create an account',
    'auth.register.subtitle': '',
    'auth.register.submit': 'Create account',
    'auth.register.submitting': 'Working',
    'auth.register.haveAccount': 'Already have an account?',
    'auth.register.login': 'Sign in',
    'auth.register.verification':
      'A verification email is sent to your address. Check your inbox after registering.',
    'auth.field.name': 'Full name',
    'auth.field.email': 'Email address',
    'auth.field.password': 'Password',
    'auth.field.confirmPassword': 'Confirm password',
    'auth.error.required': 'All fields are required.',
    'auth.error.email': 'Enter a valid email address.',
    'auth.error.passwordLength': 'The password must be at least 6 characters.',
    'auth.error.passwordMismatch': 'The passwords do not match.',
    'auth.error.generic': 'That did not work. Please check your details.',

    /* ------------------------------ Landing ---------------------------- */
    'landing.hero.eyebrow': 'Diabetic foot ulcer prevention aid',
    'landing.hero.title': 'Catch high plantar pressure early',
    'landing.hero.subtitle':
      'Three sensors in a shoe insole send plantar pressure to this dashboard every second. A fuzzy rule base scores the risk so a warning arrives before a wound does.',
    'landing.hero.ctaPrimary': 'Open the dashboard',
    'landing.hero.ctaSecondary': 'Create an account',
    'landing.hero.demoNote':
      'The map beside this text is the same component the dashboard uses.',
    'landing.problem.title': 'Why plantar pressure needs watching',
    'landing.problem.body':
      'Diabetic neuropathy reduces the ability to feel pain in the sole. Pressure that stays high for long enough can cause an injury the patient never notices. Continuous monitoring makes those pressure points visible before they become an ulcer.',
    'landing.how.title': 'How monitoring works',
    'landing.step.sense.title': 'Measure',
    'landing.step.sense.body':
      'The insole reads three points: forefoot, midfoot and heel.',
    'landing.step.judge.title': 'Judge',
    'landing.step.judge.body':
      'A fuzzy rule base combines pressure magnitude and load duration into a risk score.',
    'landing.step.warn.title': 'Warn',
    'landing.step.warn.body':
      'Warning and danger states raise a visual alert and a synthesised alarm tone.',
    'landing.sensors.title': 'Three measurement points',
    'landing.sensors.body':
      'Each sensor reports pressure in kilopascals. The highest point decides the overall risk status.',
    'landing.risk.title': 'Three risk levels',
    'landing.risk.safeBody': 'Pressure sits below the safe limit.',
    'landing.risk.warningBody':
      'Pressure crossed the safe limit, or the load has lasted too long.',
    'landing.risk.dangerBody':
      'High pressure has lasted more than 30 seconds in a row.',
    'landing.footerNote':
      'Final year project prototype. Data comes from the simulator while no physical device is connected.',
    'landing.nav.how': 'How it works',
    'landing.nav.sensors': 'Sensors',
    'landing.nav.risk': 'Risk',
    'landing.nav.why': 'Why',
    'landing.nav.menu': 'Menu',
    'landing.nav.features': 'Features',
    'landing.nav.start': 'Start',
    'landing.feature.1.title': 'Real-time Monitoring',
    'landing.feature.1.body': 'Plantar pressure from three sensors appears on your phone instantly.',
    'landing.feature.2.title': 'Fuzzy Logic Risk',
    'landing.feature.2.body': 'Fuzzy logic judges Safe, Caution, or Danger instantly.',
    'landing.feature.3.title': 'Early Warning',
    'landing.feature.3.body': 'Alarm and notifications when pressure stays too long.',
    'landing.feature.4.title': 'History & Export',
    'landing.feature.4.body': 'Monitoring sessions stored and exportable to CSV.',
    'landing.feature.5.title': 'Device Status',
    'landing.feature.5.body': 'Battery, firmware, and insole connection always monitored.',
    'landing.feature.6.title': 'Flexible Settings',
    'landing.feature.6.body': 'Risk thresholds and notifications tailored to needs.',
    'landing.spec.sensor.title': '3',
    'landing.spec.sensor.body': 'Measurement points on the sole',
    'landing.spec.risk.title': '3',
    'landing.spec.risk.body': 'Fuzzy logic risk levels',
    'landing.spec.rate.title': 'Every second',
    'landing.spec.rate.body': 'Regular pressure updates',
    'landing.cap.1.title': '3-sensor Measurement',
    'landing.cap.1.body': 'Forefoot, midfoot, and heel read continuously by the ESP32.',
    'landing.cap.2.title': 'Fuzzy Logic Assessment',
    'landing.cap.2.body': 'Risk computed on the device, no server round-trip.',
    'landing.cap.3.title': 'Early Warning',
    'landing.cap.3.body': 'Sound alarm and notifications when risk rises.',
    'landing.flow.1.title': 'Create an account',
    'landing.flow.1.body': 'Free account with your email.',
    'landing.flow.2.title': 'Set up the insole',
    'landing.flow.2.body': 'Connect the insole to your home Wi-Fi.',
    'landing.flow.3.title': 'Start monitoring',
    'landing.flow.3.body': 'Pressure and risk appear in the dashboard.',
    'landing.stack.1.title': 'ESP32',
    'landing.stack.1.body': 'Microcontroller measuring three pressure sensors with Wi-Fi.',
    'landing.stack.2.title': 'Firebase',
    'landing.stack.2.body': 'Realtime Database streams data securely to the dashboard.',
    'landing.stack.3.title': 'React',
    'landing.stack.3.body': 'PWA dashboard that runs on phone and desktop.',
    'landing.feature.title': 'Six capabilities, one flow',
    'landing.feature.body':
      'Everything needed from sensor to screen, without complex setup.',
    'landing.cap.eyebrow': 'Capabilities',
    'landing.cap.title': 'From sensor to screen.',
    'landing.step.number': 'Step',
    'landing.flow.title': 'Three steps to start.',
    'landing.stack.eyebrow': 'Technology',
    'landing.stack.title': 'Three layers, one system.',
    'landing.cta.title': 'Start monitoring your feet',
    'landing.cta.body':
      'Create a free account and see plantar pressure in one dashboard.',

    /* ---------------------------- Top bar ------------------------------- */
    'search.label': 'Search pages or records',
    'search.placeholder': 'Search pages, sensor points, or status...',
    'search.pages': 'Pages',
    'search.records': 'Recent records',
    'search.empty': 'Nothing matches',
    'search.clear': 'Clear search',
    'search.hint': 'Press Enter to open the top result',
    'topbar.notifications': 'Notifications',
    'topbar.account': 'Open profile',
    'topbar.unread': '{count} unread alerts',

    /* ------------------------------ Common ----------------------------- */
    'common.retry': 'Try again',
    'common.dismiss': 'Dismiss',
    'common.close': 'Close',
    'common.notAvailable': 'Not available',
    'common.language': 'Language',
    'common.signOut': 'Sign Out',
    'common.copyReading': 'Copy reading',
    'common.copied': 'Copied',
    'common.menu': 'Menu',
    'common.loading': 'Loading',
  },
};

/**
 * Translate a key.
 *
 * @param {string} key dot-notation key
 * @param {'id'|'en'|string} [lang='id'] target language, unknown falls back to 'id'
 * @param {Record<string, string|number>} [vars] values for `{placeholder}` slots
 * @returns {string} the translation, or the key itself if it is missing
 */
export function t(key, lang = 'id', vars) {
  if (!key || typeof key !== 'string') return '';

  const target = DICTIONARY[lang] ? lang : 'id';
  const dict = DICTIONARY[target];

  let value = dict[key];
  if (value === undefined && target !== 'id') value = DICTIONARY.id[key];
  if (value === undefined) value = key;

  if (vars) {
    return value.replace(/\{(\w+)\}/g, (match, name) =>
      vars[name] !== undefined ? String(vars[name]) : match
    );
  }

  return value;
}

/** Does the dictionary know this key? Used by the key-parity test and tooling. */
export const hasKey = (key) =>
  DICTIONARY.id[key] !== undefined && DICTIONARY.en[key] !== undefined;

/** Every key in the dictionary, in declaration order. */
export const dictionaryKeys = () => Object.keys(DICTIONARY.id);

export const LANGUAGES = [
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'en', label: 'English' },
];

export default { DICTIONARY, t, hasKey, dictionaryKeys, LANGUAGES };
