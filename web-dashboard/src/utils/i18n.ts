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

/**
 * The dictionary as two flat key->string maps, indexed by language code.
 * Typed loosely on purpose: a per-key literal union across ~340 keys per
 * language would slow every consumer's typecheck for autocomplete that the
 * `t`-key parity test already guarantees.
 */
export const DICTIONARY: Record<string, Record<string, string>> = {
  id: {
    /* ------------------------------ Brand ------------------------------ */
    'app.title': 'SOLE',
    'app.tagline': 'Pemantauan Tekanan Telapak Kaki',
    'app.taglineShort': 'Analitik plantar',
    'app.loading': 'Memuat data',
    'app.skipToContent': 'Lewati ke konten utama',
    'app.footer': 'Pemantauan tekanan plantar dari insole Anda',

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
    'admin.accessDeniedNext': 'Hubungi administrator bila Anda memerlukan akses.',
    'admin.retryNext': 'Muat ulang halaman untuk mencoba lagi.',
    'admin.actionError': 'Tindakan gagal.',
    'admin.users.title': 'Pengguna',
    'admin.users.loading': 'Memuat daftar pengguna…',
    'admin.users.error': 'Gagal memuat pengguna',
    'admin.users.empty': 'Belum ada pengguna terdaftar.',
    'admin.users.emptyNext': 'Minta pengguna mendaftar akun agar muncul di daftar ini.',
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
    'admin.devices.emptyNext': 'Periksa sambungan perangkat, atau tunggu kiriman data pertama.',
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
    'admin.config.hint':
      'Nilai ini menjadi ambang bawaan untuk semua dashboard; preferensi yang disimpan di halaman Pengaturan tetap menimpa.',
    'admin.config.invalidOrder':
      'Batas bahaya harus lebih tinggi daripada batas aman, dan keduanya harus lebih besar dari nol.',
    'admin.config.forbidden':
      'Peran admin tercatat di basis data pengguna, tetapi mirror admin di Realtime Database belum ada. Tulis users/<uid>/role = "admin" di Realtime Database, lalu coba lagi.',
    'nav.main': 'Navigasi utama',
    'nav.openMenu': 'Buka menu navigasi',
    'nav.closeMenu': 'Tutup menu navigasi',
    'nav.hideRail': 'Sembunyikan navigasi',
    'nav.showRail': 'Tampilkan navigasi',
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
    'source.idle': 'Menunggu perangkat',
    'source.firebase': 'Firebase langsung',
    'source.live': 'Terhubung',
    'source.connecting': 'Menghubungkan',
    'source.error': 'Gagal terhubung',
    'source.errorTitle': 'Koneksi Firebase gagal',
    'source.errorBody':
      'Halaman ini tidak menampilkan data apa pun sampai perangkat terhubung kembali.',
    'source.noDeviceTitle': 'Belum ada data dari perangkat',
    'source.noDeviceBody':
      'Insole belum mengirim data ke Firebase. Setelah terkirim, halaman ini akan memperbarui sendiri.',
    'source.noDeviceNext': 'Pasang insole dan sambungkan ke jaringan; status muncul begitu data terkirim.',

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
    // Greeting header
    'dashboard.greeting.morning': 'Selamat pagi',
    'dashboard.greeting.afternoon': 'Selamat siang',
    'dashboard.greeting.evening': 'Selamat malam',
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
    // Funnel empty state (zero readings) and hero timeline labels
    'dashboard.funnel.empty': 'Belum ada bacaan yang datang',
    'dashboard.timeline.now': 'Sekarang',
    'dashboard.timeline.notes': 'catatan terakhir',
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
    'monitoring.emptyNext': 'Sambungkan perangkat untuk mulai melihat tren.',
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
    'history.emptyNext': 'Lanjutkan pemantauan seperti biasa; tidak ada yang perlu diperbaiki.',
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
      'Batas kPa dipakai langsung oleh mesin risiko; nilai durasi mengatur tampilan batas durasi di dasbor.',
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
    'settings.previewNext': 'Tekan Coba lagi untuk memuat ulang pratinjau.',
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
    'profile.emptyNext':
      'Pasang insole dan mulai sesi pemantauan; statistik terisi dari pembacaan nyata.',
    'profile.accountNext': 'Muat ulang halaman; jika masih belum tersedia, masuk kembali.',

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

    /* ------------------------------- Auth ------------------------------ */
    'auth.login.title': 'Masuk ke akun',
    'auth.login.subtitle': 'Lanjutkan pemantauan tekanan telapak kaki Anda.',
    'auth.login.submit': 'Masuk',
    'auth.login.submitting': 'Memeriksa',
    'auth.login.noAccount': 'Belum punya akun?',
    'auth.login.register': 'Daftar sekarang',
    'auth.login.secure':
      'Kata sandi dikirim melalui koneksi terenkripsi dan tidak disimpan di peramban.',
    'auth.register.title': 'Buat akun',
    'auth.register.subtitle': 'Satu akun untuk menyimpan sesi dan peringatan.',
    'auth.register.submit': 'Buat akun',
    'auth.register.submitting': 'Membuat akun',
    'auth.register.haveAccount': 'Sudah punya akun?',
    'auth.register.login': 'Masuk',
    'auth.register.verification':
      'Email verifikasi dikirim ke alamat Anda. Periksa kotak masuk setelah mendaftar.',
    'auth.register.secure':
      'Pendaftaran diamankan oleh Firebase Authentication.',

    /* ------------------------ Email verification ----------------------- */
    'auth.verify.title': 'Verifikasi email Anda',
    'auth.verify.subtitle': 'Kami mengirim tautan verifikasi ke {email}.',
    'auth.verify.sentTo': 'Tautan verifikasi dikirim ke {email}.',
    'auth.verify.checking': 'Memeriksa status verifikasi.',
    'auth.verify.checkingNote':
      'Kami menanyakan Firebase apakah tautan sudah dibuka.',
    'auth.verify.openEmail':
      'Buka kotak masuk email Anda, lalu klik tautan verifikasi.',
    'auth.verify.spam': 'Periksa folder spam bila email belum terlihat.',
    'auth.verify.resend': 'Kirim ulang email',
    'auth.verify.resending': 'Mengirim email',
    'auth.verify.resendIn': 'Kirim ulang dalam {seconds} detik',
    'auth.verify.sent': 'Email verifikasi baru sudah dikirim.',
    'auth.verify.tooMany': 'Terlalu banyak permintaan. Coba lagi nanti.',
    'auth.verify.checkAgain': 'Periksa lagi',
    'auth.verify.signIn': 'Masuk ke akun',
    'auth.verify.backToLogin': 'Kembali ke halaman masuk',
    'auth.verify.signedOutTitle': 'Verifikasi email',
    'auth.verify.signedOutBody':
      'Buka tautan verifikasi dari email Anda. Untuk meminta tautan baru, masuk ke akun Anda.',
    'auth.verify.secure':
      'Tautan verifikasi hanya berlaku sekali dan dikirim oleh Firebase.',
    'auth.verify.invalidTitle': 'Tautan verifikasi tidak valid',
    'auth.verify.invalidBody':
      'Tautan mungkin sudah dipakai atau kedaluwarsa.',
    'auth.verify.invalidBanner': 'Kami tidak dapat memakai tautan ini.',
    'auth.verify.invalidNext':
      'Masuk ke akun Anda, lalu minta tautan verifikasi baru.',
    'auth.verify.successTitle': 'Email terverifikasi',
    'auth.verify.successBody': 'Alamat email Anda sudah dikonfirmasi.',
    'auth.verify.successNote': 'Akun Anda siap digunakan.',
    'auth.verify.successCta': 'Buka dasbor',
    'auth.verify.successLogin': 'Masuk ke akun',

    /* --------------------------- Forgot password ----------------------- */
    'auth.forgot.title': 'Lupa kata sandi',
    'auth.forgot.subtitle':
      'Masukkan email akun. Kami akan mengirim tautan untuk membuat kata sandi baru.',
    'auth.forgot.sendLink': 'Kirim tautan reset',
    'auth.forgot.changeEmail': 'Ganti email',
    'auth.forgot.secure':
      'Kami tidak mengungkapkan apakah sebuah alamat email terdaftar.',
    'auth.forgot.linkTitle': 'Cek email Anda',
    'auth.forgot.linkBody':
      'Jika alamat ini terdaftar, tautan untuk membuat kata sandi baru sudah dikirim ke {email}.',
    'auth.forgot.linkNote':
      'Tautan berlaku 1 jam. Periksa folder spam bila belum terlihat.',
    'auth.forgot.resendLink': 'Kirim ulang tautan',
    'auth.forgot.resendingLink': 'Mengirim tautan',
    'auth.forgot.linkSent': 'Tautan baru sudah dikirim.',
    'auth.forgot.restart': 'Mulai ulang',
    'auth.forgot.haveAccount': 'Ingat kata sandi Anda?',
    'auth.forgot.login': 'Masuk',
    'auth.forgot.backToLogin': 'Kembali ke halaman masuk',
    'auth.forgot.resetTitle': 'Buat kata sandi baru',
    'auth.forgot.resetSubtitle': 'Kata sandi baru untuk {email}.',
    'auth.forgot.resetChecking': 'Memeriksa tautan reset.',
    'auth.forgot.resetPreparing': 'Menyiapkan formulir kata sandi baru.',
    'auth.forgot.resetInvalid':
      'Tautan reset tidak valid atau sudah kedaluwarsa.',
    'auth.forgot.resetInvalidNext':
      'Minta tautan baru dari halaman lupa kata sandi.',
    'auth.forgot.resetSubmit': 'Simpan kata sandi',
    'auth.forgot.resetting': 'Menyimpan kata sandi',
    'auth.forgot.resetSuccessTitle': 'Kata sandi diperbarui',
    'auth.forgot.resetSuccessBody': 'Masuk dengan kata sandi baru Anda.',
    'auth.forgot.step.email': 'Email',
    'auth.forgot.step.password': 'Kata sandi',
    'auth.footerNote':
      'SOLE membantu memantau tekanan, bukan menggantikan pemeriksaan tenaga kesehatan.',
    'auth.field.name': 'Nama lengkap',
    'auth.field.email': 'Alamat email',
    'auth.field.password': 'Kata sandi',
    'auth.field.confirmPassword': 'Konfirmasi kata sandi',
    'auth.field.passwordHint':
      'Minimal 8 karakter. Panjang lebih penting daripada simbol rumit.',
    'auth.field.showPassword': 'Tampilkan kata sandi',
    'auth.field.hidePassword': 'Sembunyikan kata sandi',
    'auth.password.label': 'Kekuatan kata sandi',
    'auth.password.empty': 'Belum diisi',
    'auth.password.weak': 'Lemah',
    'auth.password.fair': 'Cukup',
    'auth.password.good': 'Kuat',
    'auth.password.strong': 'Sangat kuat',
    'auth.password.caps': 'Caps Lock aktif.',
    'auth.password.match': 'Kata sandi cocok.',
    'auth.password.hint.length': 'Tambah {count} karakter lagi.',
    'auth.password.hint.variety': 'Campur huruf besar dan kecil.',
    'auth.password.hint.number': 'Tambahkan angka atau simbol.',
    'auth.password.hint.common': 'Hindari kata yang mudah ditebak.',
    'auth.password.hint.repeat': 'Hindari karakter atau pola berulang.',
    'auth.error.required': 'Semua kolom harus diisi.',
    'auth.error.email': 'Masukkan alamat email yang valid.',
    'auth.error.emailNext': 'Periksa kembali alamat email Anda.',
    'auth.error.nameLength': 'Nama maksimal 80 karakter.',
    'auth.error.passwordLength': 'Kata sandi minimal 8 karakter.',
    'auth.error.passwordMismatch': 'Konfirmasi kata sandi tidak cocok.',
    'auth.error.passwordNext':
      'Gunakan minimal 8 karakter dengan campuran huruf dan angka.',
    'auth.error.credentials': 'Email atau kata sandi salah.',
    'auth.error.credentialsNext': 'Periksa email dan kata sandi, lalu coba lagi.',
    'auth.error.emailInUse': 'Email ini sudah terdaftar.',
    'auth.error.emailInUseNext':
      'Masuk dengan akun tersebut atau gunakan alamat lain.',
    'auth.error.weakPassword': 'Kata sandi terlalu lemah.',
    'auth.error.disabled': 'Akun ini dinonaktifkan.',
    'auth.error.disabledNext':
      'Hubungi administrator bila akses masih diperlukan.',
    'auth.error.tooManyRequests': 'Terlalu banyak percobaan.',
    'auth.error.tooManyNext': 'Tunggu beberapa menit sebelum mencoba lagi.',
    'auth.error.network': 'Tidak dapat terhubung ke layanan masuk.',
    'auth.error.generic': 'Proses gagal. Periksa kembali data Anda.',
    'common.nextStepCheckConnection': 'Periksa koneksi, lalu coba lagi.',

    /* ------------------------------ Landing ---------------------------- */
    /* The landing leads with the patient, not the hardware. What the product
       does for a person at risk of a foot ulcer comes first; the one dense
       technical subsection sits inside "Cara kerja" for readers who want the
       model. */
    'landing.hero.eyebrow': 'Insole pintar untuk kaki diabetes',
    'landing.hero.title': 'Jaga telapak kaki sebelum luka muncul',
    'landing.hero.subtitle':
      'Untuk penderita diabetes dan keluarga yang merawatnya. Tiga sensor membaca tekanan sepuluh kali per detik, lalu Random Forest menandai titik yang perlu diistirahatkan sebelum nyeri terasa.',
    'landing.hero.ctaRegister': 'Buat akun gratis',
    'landing.hero.ctaLogin': 'Masuk',
    'landing.hero.demoNote':
      'Contoh peta tekanan. Komponen ini sama dengan yang ada di dasbor.',
    'landing.problem.title': 'Luka kaki sering muncul tanpa rasa sakit',
    'landing.problem.body':
      'Neuropati diabetik melemahkan sensasi nyeri di telapak kaki. Tekanan tinggi yang bertahan dapat melukai kulit tanpa Anda sadari. Memantau tekanan membuat titik rawan terlihat lebih awal, saat masih cukup diistirahatkan.',
    'landing.problem.signs.title': 'Tanda yang perlu diperhatikan',
    'landing.problem.signs.1': 'Kesemutan atau mati rasa di kaki',
    'landing.problem.signs.2': 'Kulit kering, kapalan, atau pecah-pecah',
    'landing.problem.signs.3': 'Bekas merah setelah melepas sepatu',
    'landing.problem.signs.note':
      'Segera hubungi tenaga kesehatan bila ada luka terbuka atau perubahan warna yang menetap.',
    'landing.spec.sensor.title': '3',
    'landing.spec.sensor.body': 'Titik ukur: kaki depan, tengah, tumit',
    'landing.spec.rate.title': '10x',
    'landing.spec.rate.body': 'Pembacaan sensor per detik',
    'landing.spec.risk.title': '3',
    'landing.spec.risk.body': 'Tingkat risiko: aman, waspada, bahaya',
    'landing.feature.title': 'Yang bisa Anda lakukan',
    'landing.feature.body':
      'Dari melihat titik tekanan sampai membawa riwayat saat kontrol.',
    'landing.feature.1.title': 'Peta tekanan',
    'landing.feature.1.body':
      'Lihat kaki depan, tengah, dan tumit dalam satu peta warna. Titik paling terang adalah yang paling perlu diistirahatkan.',
    'landing.feature.2.title': 'Skor yang bisa dijelaskan',
    'landing.feature.2.body':
      'Random Forest memberi skor 0 sampai 100. Anda cukup memahami tiga tingkatnya, bukan cara model bekerja.',
    'landing.feature.3.title': 'Peringatan dini',
    'landing.feature.3.body':
      'Saat tekanan tinggi bertahan, layar, suara, dan notifikasi meminta Anda mengubah posisi kaki.',
    'landing.feature.4.title': 'Riwayat sesi',
    'landing.feature.4.body':
      'Setiap peringatan tersimpan. Bawa riwayat atau ekspor CSV saat kontrol ke tenaga kesehatan.',
    'landing.feature.5.title': 'Status perangkat',
    'landing.feature.5.body':
      'Baterai dan koneksi insole terlihat, sehingga pemantauan tidak berhenti tanpa kabar.',
    'landing.feature.6.title': 'Batas yang bisa diatur',
    'landing.feature.6.body':
      'Ambang tekanan dan durasi dapat disesuaikan bersama tenaga kesehatan.',
    'landing.audience.eyebrow': 'Untuk siapa',
    'landing.audience.title': 'Satu alur, tiga peran',
    'landing.audience.1.title': 'Penderita diabetes',
    'landing.audience.1.body':
      'Melihat tekanan dan peringatan dalam bahasa sehari-hari, tanpa perlu membaca grafik teknis.',
    'landing.audience.2.title': 'Keluarga dan perawat',
    'landing.audience.2.body':
      'Menerima peringatan yang sama dan membantu mengatur posisi kaki saat tekanan tinggi.',
    'landing.audience.3.title': 'Kader dan tenaga kesehatan',
    'landing.audience.3.body':
      'Membuka riwayat sesi dan menyesuaikan ambang sesuai kondisi pasien.',
    'landing.how.title': 'Dari langkah ke peringatan',
    'landing.step.sense.title': 'Ukur',
    'landing.step.sense.body':
      'Tiga sensor di sol membaca kaki depan, tengah, dan tumit sepuluh kali per detik.',
    'landing.step.judge.title': 'Nilai',
    'landing.step.judge.body':
      'Random Forest membaca tekanan puncak dan lama tumpuan, lalu memilih tingkat risiko. Aturan klinis menangani tekanan di atas 70 kPa.',
    'landing.step.warn.title': 'Peringatkan',
    'landing.step.warn.body':
      'Saat waspada atau bahaya, layar menandai titik yang perlu diistirahatkan dan alarm berbunyi.',
    'landing.step.number': 'Langkah',
    'landing.step.demoNote': 'Contoh angka dan status dari dasbor.',
    'landing.sensors.title': 'Tiga titik pengukuran',
    'landing.risk.title': 'Tiga tingkat risiko',
    'landing.tech.eyebrow': 'Di balik layar',
    'landing.tech.title': 'Dari sensor ke skor risiko',
    'landing.tech.body':
      'Model yang sama berjalan di perangkat dan di dasbor. Bagian ini merangkum jalurnya dalam satu layar.',
    'landing.tech.pipeline.1.title': 'Sensor',
    'landing.tech.pipeline.1.body':
      'Tiga titik tekanan dibaca 10 kali per detik oleh ESP32.',
    'landing.tech.pipeline.2.title': 'Fitur',
    'landing.tech.pipeline.2.body':
      'Tekanan puncak (kPa) dan durasi tumpuan (detik) menjadi dua masukan model.',
    'landing.tech.pipeline.3.title': 'Model',
    'landing.tech.pipeline.3.body':
      '20 pohon keputusan, kedalaman maksimum 8, dilatih pada 135 pasien dan 81.000 sampel.',
    'landing.tech.pipeline.4.title': 'Keputusan',
    'landing.tech.pipeline.4.body':
      'Random Forest memilih aman atau waspada. Aturan klinis menetapkan bahaya.',
    'landing.tech.facts.1.label': 'Pasien',
    'landing.tech.facts.1.value': '135',
    'landing.tech.facts.2.label': 'Sampel',
    'landing.tech.facts.2.value': '81.000',
    'landing.tech.facts.3.label': 'Pohon',
    'landing.tech.facts.3.value': '20',
    'landing.tech.facts.4.label': 'Kedalaman',
    'landing.tech.facts.4.value': '8',
    'landing.tech.sim.title': 'Coba ambangnya',
    'landing.tech.sim.body':
      'Geser tekanan dan durasi untuk melihat keputusan model.',
    'landing.tech.sim.pressure': 'Tekanan puncak',
    'landing.tech.sim.duration': 'Lama tumpuan',
    'landing.tech.sim.result': 'Hasil',
    'landing.tech.sim.score': 'Skor risiko',
    'landing.tech.sim.whySafe':
      'Tekanan di bawah 35 kPa dan tidak bertahan lama.',
    'landing.tech.sim.whyWarning':
      'Tekanan mencapai 35 kPa atau tumpuan melewati 20 detik.',
    'landing.tech.sim.whyDanger':
      'Tekanan mencapai 70 kPa dan bertahan setidaknya 0,1 detik.',
    'landing.tech.sim.preset': 'Contoh cepat',
    'landing.tech.sim.presetWalk': 'Berjalan',
    'landing.tech.sim.presetStand': 'Berdiri lama',
    'landing.tech.sim.presetHigh': 'Tekanan tinggi',
    'landing.tech.sim.disclaimer':
      'Hitungan memakai model yang sama dengan dasbor. Ini bukan diagnosis.',
    'landing.flow.title': 'Tiga langkah memulai',
    'landing.flow.1.title': 'Buat akun',
    'landing.flow.1.body':
      'Daftar dengan email. Tautan verifikasi dikirim ke kotak masuk.',
    'landing.flow.2.title': 'Pasang insole',
    'landing.flow.2.body':
      'Letakkan sol di sepatu dan sambungkan ke Wi-Fi rumah.',
    'landing.flow.3.title': 'Mulai pantau',
    'landing.flow.3.body':
      'Buka dasbor. Tekanan dan peringatan muncul saat Anda melangkah.',
    'landing.faq.eyebrow': 'Pertanyaan umum',
    'landing.faq.title': 'Hal yang sering ditanyakan',
    'landing.faq.1.q': 'Apakah SOLE menggantikan pemeriksaan dokter?',
    'landing.faq.1.a':
      'Tidak. SOLE membantu memantau tekanan dan memberi peringatan. Pemeriksaan dan diagnosis tetap dilakukan tenaga kesehatan.',
    'landing.faq.2.q': 'Apakah aman dipakai setiap hari?',
    'landing.faq.2.a':
      'Ya. Sol dirancang untuk dipakai di dalam sepatu seperti insole biasa. Lepaskan dan periksa kulit setiap kali melepas sepatu.',
    'landing.faq.3.q': 'Bagaimana peringatan disampaikan?',
    'landing.faq.3.a':
      'Layar menampilkan status dan titik tekanan. Anda juga dapat mengaktifkan suara, getaran, dan notifikasi peramban di pengaturan.',
    'landing.faq.4.q': 'Siapa yang bisa melihat data saya?',
    'landing.faq.4.a':
      'Data tersimpan di akun Anda dan dikirim melalui koneksi terenkripsi. Anda dapat keluar dari perangkat kapan saja.',
    'landing.cta.title': 'Mulai dari satu langkah hari ini',
    'landing.cta.body':
      'Buat akun gratis, pasang insole, dan lihat titik tekanan pertama Anda dalam beberapa menit.',
    'landing.footerNote':
      'Data sensor dikirim ke dasbor melalui koneksi terenkripsi Firebase.',
    'landing.footerDisclaimer':
      'SOLE membantu memantau tekanan, bukan menggantikan pemeriksaan tenaga kesehatan.',
    'landing.nav.how': 'Cara kerja',
    'landing.nav.why': 'Mengapa',
    'landing.nav.menu': 'Menu',
    'landing.nav.features': 'Fitur',
    'landing.nav.start': 'Mulai',

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
    'topbar.accountMenu': 'Menu akun',
    'topbar.unread': '{count} peringatan belum dibaca',

    /* ------------------------------ Common ----------------------------- */
    'common.retry': 'Coba lagi',
    'common.dismiss': 'Tutup',
    'common.close': 'Tutup',
    'common.nextStep': 'Langkah berikutnya',
    'common.notAvailable': 'Tidak tersedia',
    'common.language': 'Bahasa',
    'common.signOut': 'Keluar',
    'common.copyReading': 'Salin pembacaan',
    'common.copied': 'Tersalin',
    'common.menu': 'Menu',
    'common.loading': 'Memuat',

    /* -------------------------- Error boundary ------------------------- */
    'error.boundary.title': 'Tampilan gagal dimuat',
    'error.boundary.body':
      'Tekan tombol di bawah untuk memuat ulang tampilan ini.',
    'error.boundary.action': 'Muat ulang tampilan',
  },

  en: {
    /* ------------------------------ Brand ------------------------------ */
    'app.title': 'SOLE',
    'app.tagline': 'Plantar Pressure Monitoring',
    'app.taglineShort': 'Plantar analytics',
    'app.loading': 'Loading data',
    'app.skipToContent': 'Skip to main content',
    'app.footer': 'Plantar pressure monitoring from your insole',

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
    'admin.accessDeniedNext': 'Contact an administrator if you need access.',
    'admin.retryNext': 'Reload the page to try again.',
    'admin.actionError': 'The action failed.',
    'admin.users.title': 'Users',
    'admin.users.loading': 'Loading users…',
    'admin.users.error': 'Failed to load users',
    'admin.users.empty': 'No users registered yet.',
    'admin.users.emptyNext': 'Ask a user to register an account so they appear in this list.',
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
    'admin.devices.emptyNext': 'Check the device connection, or wait for the first data to arrive.',
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
    'admin.config.hint':
      'These values seed the default thresholds for every dashboard; preferences saved on the Settings page still override them.',
    'admin.config.invalidOrder':
      'The danger threshold must be higher than the safe threshold, and both must be greater than zero.',
    'admin.config.forbidden':
      'Your admin role is on file, but the admin mirror in the Realtime Database is missing. Write users/<uid>/role = "admin" in the Realtime Database, then try again.',
    'nav.main': 'Main navigation',
    'nav.openMenu': 'Open navigation menu',
    'nav.closeMenu': 'Close navigation menu',
    'nav.hideRail': 'Hide navigation',
    'nav.showRail': 'Show navigation',
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
    'source.idle': 'Waiting for device',
    'source.firebase': 'Firebase live',
    'source.live': 'Connected',
    'source.connecting': 'Connecting',
    'source.error': 'Connection failed',
    'source.errorTitle': 'Firebase connection failed',
    'source.errorBody':
      'This page shows no data at all until the device reconnects.',
    'source.noDeviceTitle': 'No data from the device yet',
    'source.noDeviceBody':
      'The insole has not published to Firebase. This page updates on its own once it does.',
    'source.noDeviceNext':
      'Attach the insole and connect it to the network; status appears once data arrives.',

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
    // Greeting header
    'dashboard.greeting.morning': 'Good morning',
    'dashboard.greeting.afternoon': 'Good afternoon',
    'dashboard.greeting.evening': 'Good evening',
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
    // Funnel empty state (zero readings) and hero timeline labels
    'dashboard.funnel.empty': 'No readings have arrived',
    'dashboard.timeline.now': 'Now',
    'dashboard.timeline.notes': 'recent records',
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
    'monitoring.emptyNext': 'Connect the device to start seeing a trend.',
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
    'history.emptyNext':
      'Keep monitoring as usual; nothing here needs fixing.',
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
      'The kPa limits feed the risk engine directly; the duration values drive the duration-limit display on the dashboard.',
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
    'settings.previewNext': 'Press Retry to reload the preview.',
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
    'profile.emptyNext':
      'Wear the insole and start a monitoring session; these figures fill from real readings.',
    'profile.accountNext':
      'Reload the page; if it is still unavailable, sign in again.',

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

    /* ------------------------------- Auth ------------------------------ */
    'auth.login.title': 'Sign in',
    'auth.login.subtitle': 'Continue monitoring your plantar pressure.',
    'auth.login.submit': 'Sign in',
    'auth.login.submitting': 'Checking',
    'auth.login.noAccount': 'No account yet?',
    'auth.login.register': 'Create one',
    'auth.login.secure':
      'Your password travels over an encrypted connection and is not stored in the browser.',
    'auth.register.title': 'Create an account',
    'auth.register.subtitle': 'One account for your sessions and alerts.',
    'auth.register.submit': 'Create account',
    'auth.register.submitting': 'Creating account',
    'auth.register.haveAccount': 'Already have an account?',
    'auth.register.login': 'Sign in',
    'auth.register.verification':
      'A verification email is sent to your address. Check your inbox after registering.',
    'auth.register.secure':
      'Registration is protected by Firebase Authentication.',

    /* ------------------------ Email verification ----------------------- */
    'auth.verify.title': 'Verify your email',
    'auth.verify.subtitle': 'We sent a verification link to {email}.',
    'auth.verify.sentTo': 'A verification link was sent to {email}.',
    'auth.verify.checking': 'Checking the verification status.',
    'auth.verify.checkingNote':
      'We are asking Firebase whether the link has been opened.',
    'auth.verify.openEmail': 'Open your inbox, then click the verification link.',
    'auth.verify.spam': 'Check the spam folder if the email is not there.',
    'auth.verify.resend': 'Resend email',
    'auth.verify.resending': 'Sending email',
    'auth.verify.resendIn': 'Resend in {seconds} seconds',
    'auth.verify.sent': 'A new verification email was sent.',
    'auth.verify.tooMany': 'Too many requests. Try again later.',
    'auth.verify.checkAgain': 'Check again',
    'auth.verify.signIn': 'Sign in to your account',
    'auth.verify.backToLogin': 'Back to sign in',
    'auth.verify.signedOutTitle': 'Verify email',
    'auth.verify.signedOutBody':
      'Open the verification link from your email. To request a new link, sign in to your account.',
    'auth.verify.secure':
      'The verification link works once and is sent by Firebase.',
    'auth.verify.invalidTitle': 'This verification link is not valid',
    'auth.verify.invalidBody':
      'The link may have been used already or it may have expired.',
    'auth.verify.invalidBanner': 'We could not use this link.',
    'auth.verify.invalidNext':
      'Sign in to your account, then request a new verification link.',
    'auth.verify.successTitle': 'Email verified',
    'auth.verify.successBody': 'Your email address is confirmed.',
    'auth.verify.successNote': 'Your account is ready to use.',
    'auth.verify.successCta': 'Open the dashboard',
    'auth.verify.successLogin': 'Sign in to your account',

    /* --------------------------- Forgot password ----------------------- */
    'auth.forgot.title': 'Forgot password',
    'auth.forgot.subtitle':
      'Enter the account email. We will send a link to create a new password.',
    'auth.forgot.sendLink': 'Send reset link',
    'auth.forgot.changeEmail': 'Change email',
    'auth.forgot.secure':
      'We do not reveal whether an email address is registered.',
    'auth.forgot.linkTitle': 'Check your email',
    'auth.forgot.linkBody':
      'If this address is registered, a link to create a new password was sent to {email}.',
    'auth.forgot.linkNote':
      'The link is valid for 1 hour. Check the spam folder if it is missing.',
    'auth.forgot.resendLink': 'Resend the link',
    'auth.forgot.resendingLink': 'Sending the link',
    'auth.forgot.linkSent': 'A new link was sent.',
    'auth.forgot.restart': 'Start over',
    'auth.forgot.haveAccount': 'Remember your password?',
    'auth.forgot.login': 'Sign in',
    'auth.forgot.backToLogin': 'Back to sign in',
    'auth.forgot.resetTitle': 'Create a new password',
    'auth.forgot.resetSubtitle': 'A new password for {email}.',
    'auth.forgot.resetChecking': 'Checking the reset link.',
    'auth.forgot.resetPreparing': 'Preparing the new password form.',
    'auth.forgot.resetInvalid': 'The reset link is invalid or expired.',
    'auth.forgot.resetInvalidNext':
      'Request a new link from the forgot password page.',
    'auth.forgot.resetSubmit': 'Save password',
    'auth.forgot.resetting': 'Saving the password',
    'auth.forgot.resetSuccessTitle': 'Password updated',
    'auth.forgot.resetSuccessBody': 'Sign in with your new password.',
    'auth.forgot.step.email': 'Email',
    'auth.forgot.step.password': 'Password',
    'auth.footerNote':
      'SOLE helps monitor pressure. It does not replace care from a health professional.',
    'auth.field.name': 'Full name',
    'auth.field.email': 'Email address',
    'auth.field.password': 'Password',
    'auth.field.confirmPassword': 'Confirm password',
    'auth.field.passwordHint':
      'At least 8 characters. Length matters more than complicated symbols.',
    'auth.field.showPassword': 'Show password',
    'auth.field.hidePassword': 'Hide password',
    'auth.password.label': 'Password strength',
    'auth.password.empty': 'Not set',
    'auth.password.weak': 'Weak',
    'auth.password.fair': 'Fair',
    'auth.password.good': 'Good',
    'auth.password.strong': 'Strong',
    'auth.password.caps': 'Caps Lock is on.',
    'auth.password.match': 'Passwords match.',
    'auth.password.hint.length': 'Add {count} more characters.',
    'auth.password.hint.variety': 'Mix upper and lower case.',
    'auth.password.hint.number': 'Add a number or symbol.',
    'auth.password.hint.common': 'Avoid words that are easy to guess.',
    'auth.password.hint.repeat': 'Avoid repeated characters or patterns.',
    'auth.error.required': 'All fields are required.',
    'auth.error.email': 'Enter a valid email address.',
    'auth.error.emailNext': 'Check the address, then try again.',
    'auth.error.nameLength': 'The name must be 80 characters or fewer.',
    'auth.error.passwordLength': 'The password must be at least 8 characters.',
    'auth.error.passwordMismatch': 'The passwords do not match.',
    'auth.error.passwordNext':
      'Use at least 8 characters with a mix of letters and numbers.',
    'auth.error.credentials': 'Email or password is incorrect.',
    'auth.error.credentialsNext': 'Check both fields, then try again.',
    'auth.error.emailInUse': 'That email is already registered.',
    'auth.error.emailInUseNext':
      'Sign in with that account or use another address.',
    'auth.error.weakPassword': 'That password is too weak.',
    'auth.error.disabled': 'This account is disabled.',
    'auth.error.disabledNext':
      'Contact an administrator if you still need access.',
    'auth.error.tooManyRequests': 'Too many attempts.',
    'auth.error.tooManyNext': 'Wait a few minutes before trying again.',
    'auth.error.network': 'Could not reach the sign-in service.',
    'auth.error.generic': 'That did not work. Please check your details.',
    'common.nextStepCheckConnection': 'Check your connection, then try again.',

    /* ------------------------------ Landing ---------------------------- */
    /* The landing leads with the patient, not the hardware. What the product
       does for a person at risk of a foot ulcer comes first; the one dense
       technical subsection sits inside "How it works" for readers who want the
       model. */
    'landing.hero.eyebrow': 'A smart insole for diabetic feet',
    'landing.hero.title': 'Protect your soles before a wound starts',
    'landing.hero.subtitle':
      'For people living with diabetes and the family who care for them. Three sensors read pressure ten times a second, and a Random Forest marks the points that need rest before pain sets in.',
    'landing.hero.ctaRegister': 'Create a free account',
    'landing.hero.ctaLogin': 'Sign in',
    'landing.hero.demoNote':
      'Example pressure map. This is the same component the dashboard uses.',
    'landing.problem.title': 'Foot wounds often start without pain',
    'landing.problem.body':
      'Diabetic neuropathy dulls pain in the sole. Pressure that stays high can damage the skin without you noticing. Monitoring makes those points visible earlier, while rest is still enough.',
    'landing.problem.signs.title': 'Signs worth checking',
    'landing.problem.signs.1': 'Tingling or numbness in the feet',
    'landing.problem.signs.2': 'Dry skin, calluses, or cracks',
    'landing.problem.signs.3': 'Red marks after taking off shoes',
    'landing.problem.signs.note':
      'Contact a clinician promptly if there is an open wound or colour that does not fade.',
    'landing.spec.sensor.title': '3',
    'landing.spec.sensor.body': 'Measuring points: forefoot, midfoot, heel',
    'landing.spec.rate.title': '10x',
    'landing.spec.rate.body': 'Sensor readings per second',
    'landing.spec.risk.title': '3',
    'landing.spec.risk.body': 'Risk levels: safe, warning, danger',
    'landing.feature.title': 'What you can do',
    'landing.feature.body':
      'From seeing the pressure points to taking the history to an appointment.',
    'landing.feature.1.title': 'Pressure map',
    'landing.feature.1.body':
      'See the forefoot, midfoot, and heel in one colour map. The brightest point is the one that needs rest first.',
    'landing.feature.2.title': 'A score you can explain',
    'landing.feature.2.body':
      'The Random Forest gives a score from 0 to 100. You only need the three levels, not how the model works.',
    'landing.feature.3.title': 'Early warning',
    'landing.feature.3.body':
      'When high pressure lasts, the screen, a sound, and a notification ask you to shift your foot.',
    'landing.feature.4.title': 'Session history',
    'landing.feature.4.body':
      'Every alert is stored. Take the history or a CSV export to your next appointment.',
    'landing.feature.5.title': 'Device status',
    'landing.feature.5.body':
      'Battery and insole connection stay visible, so monitoring does not stop without word.',
    'landing.feature.6.title': 'Limits you can adjust',
    'landing.feature.6.body':
      'Pressure and duration thresholds can be set together with your care team.',
    'landing.audience.eyebrow': 'Who it is for',
    'landing.audience.title': 'One flow, three roles',
    'landing.audience.1.title': 'People with diabetes',
    'landing.audience.1.body':
      'See pressure and warnings in everyday language, without reading a technical chart.',
    'landing.audience.2.title': 'Family and carers',
    'landing.audience.2.body':
      'Receive the same warnings and help shift the foot when pressure is high.',
    'landing.audience.3.title': 'Community health workers',
    'landing.audience.3.body':
      'Open the session history and adjust the limits to the patient condition.',
    'landing.how.title': 'From a step to a warning',
    'landing.step.sense.title': 'Measure',
    'landing.step.sense.body':
      'Three sensors in the sole read the forefoot, midfoot, and heel ten times a second.',
    'landing.step.judge.title': 'Judge',
    'landing.step.judge.body':
      'A Random Forest reads peak pressure and load duration, then picks the risk level. Clinical rules handle pressure above 70 kPa.',
    'landing.step.warn.title': 'Warn',
    'landing.step.warn.body':
      'At warning or danger, the screen marks the point to rest and the alarm sounds.',
    'landing.step.number': 'Step',
    'landing.step.demoNote': 'Example readings and statuses from the dashboard.',
    'landing.sensors.title': 'Three measurement points',
    'landing.risk.title': 'Three risk levels',
    'landing.tech.eyebrow': 'Behind the scenes',
    'landing.tech.title': 'From sensor to risk score',
    'landing.tech.body':
      'The same model runs on the device and in the dashboard. This section condenses the path into one screen.',
    'landing.tech.pipeline.1.title': 'Sensor',
    'landing.tech.pipeline.1.body':
      'Three pressure points, read 10 times a second by the ESP32.',
    'landing.tech.pipeline.2.title': 'Features',
    'landing.tech.pipeline.2.body':
      'Peak pressure (kPa) and load duration (seconds) are the two model inputs.',
    'landing.tech.pipeline.3.title': 'Model',
    'landing.tech.pipeline.3.body':
      '20 decision trees, maximum depth 8, trained on 135 patients and 81,000 samples.',
    'landing.tech.pipeline.4.title': 'Decision',
    'landing.tech.pipeline.4.body':
      'The Random Forest chooses safe or warning. Clinical rules set danger.',
    'landing.tech.facts.1.label': 'Patients',
    'landing.tech.facts.1.value': '135',
    'landing.tech.facts.2.label': 'Samples',
    'landing.tech.facts.2.value': '81,000',
    'landing.tech.facts.3.label': 'Trees',
    'landing.tech.facts.3.value': '20',
    'landing.tech.facts.4.label': 'Depth',
    'landing.tech.facts.4.value': '8',
    'landing.tech.sim.title': 'Try the thresholds',
    'landing.tech.sim.body':
      'Move pressure and duration to see the model decide.',
    'landing.tech.sim.pressure': 'Peak pressure',
    'landing.tech.sim.duration': 'Load duration',
    'landing.tech.sim.result': 'Result',
    'landing.tech.sim.score': 'Risk score',
    'landing.tech.sim.whySafe':
      'Pressure is below 35 kPa and does not last long.',
    'landing.tech.sim.whyWarning':
      'Pressure reaches 35 kPa or the load passes 20 seconds.',
    'landing.tech.sim.whyDanger':
      'Pressure reaches 70 kPa and lasts at least 0.1 seconds.',
    'landing.tech.sim.preset': 'Quick examples',
    'landing.tech.sim.presetWalk': 'Walking',
    'landing.tech.sim.presetStand': 'Standing long',
    'landing.tech.sim.presetHigh': 'High pressure',
    'landing.tech.sim.disclaimer':
      'This uses the same model as the dashboard. It is not a diagnosis.',
    'landing.flow.title': 'Three steps to start',
    'landing.flow.1.title': 'Create an account',
    'landing.flow.1.body':
      'Register with your email. A verification link is sent to your inbox.',
    'landing.flow.2.title': 'Set up the insole',
    'landing.flow.2.body':
      'Put the sole in your shoe and connect it to the home Wi-Fi.',
    'landing.flow.3.title': 'Start monitoring',
    'landing.flow.3.body':
      'Open the dashboard. Pressure and warnings appear as you walk.',
    'landing.faq.eyebrow': 'Common questions',
    'landing.faq.title': 'Questions people ask',
    'landing.faq.1.q': 'Does SOLE replace a doctor?',
    'landing.faq.1.a':
      'No. SOLE helps monitor pressure and gives warnings. Examination and diagnosis stay with a health professional.',
    'landing.faq.2.q': 'Is it safe to wear every day?',
    'landing.faq.2.a':
      'Yes. The sole is made to sit inside a shoe like a regular insole. Take it out and check the skin each time you remove your shoes.',
    'landing.faq.3.q': 'How are warnings delivered?',
    'landing.faq.3.a':
      'The screen shows the status and the pressure point. You can also turn on sound, vibration, and browser notifications in settings.',
    'landing.faq.4.q': 'Who can see my data?',
    'landing.faq.4.a':
      'Data stays in your account and travels over an encrypted connection. You can sign out of a device at any time.',
    'landing.cta.title': 'Start with one step today',
    'landing.cta.body':
      'Create a free account, put the insole in, and see your first pressure point in minutes.',
    'landing.footerNote':
      'Sensor data reaches the dashboard through an encrypted Firebase connection.',
    'landing.footerDisclaimer':
      'SOLE helps monitor pressure. It does not replace care from a health professional.',
    'landing.nav.how': 'How it works',
    'landing.nav.why': 'Why',
    'landing.nav.menu': 'Menu',
    'landing.nav.features': 'Features',
    'landing.nav.start': 'Start',

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
    'topbar.accountMenu': 'Account menu',
    'topbar.unread': '{count} unread alerts',

    /* ------------------------------ Common ----------------------------- */
    'common.retry': 'Try again',
    'common.dismiss': 'Dismiss',
    'common.close': 'Close',
    'common.nextStep': 'Next step',
    'common.notAvailable': 'Not available',
    'common.language': 'Language',
    'common.signOut': 'Sign Out',
    'common.copyReading': 'Copy reading',
    'common.copied': 'Copied',
    'common.menu': 'Menu',
    'common.loading': 'Loading',

    /* -------------------------- Error boundary ------------------------- */
    'error.boundary.title': 'The view failed to load',
    'error.boundary.body': 'Use the button below to reload this view.',
    'error.boundary.action': 'Reload the view',
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
export function t(
  key: string,
  lang = 'id',
  vars?: Record<string, string | number>
): string {
  if (!key || typeof key !== 'string') return '';

  const target = DICTIONARY[lang] ? lang : 'id';
  const dict = DICTIONARY[target];

  let value: string | undefined = dict[key];
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
export const hasKey = (key: string): boolean =>
  DICTIONARY.id[key] !== undefined && DICTIONARY.en[key] !== undefined;

/** Every key in the dictionary, in declaration order. */
export const dictionaryKeys = (): string[] => Object.keys(DICTIONARY.id);

/**
 * The language registry. LANG-01 makes Indonesian the only shipped surface, but
 * the two-column dictionary and this registry stay: `DICTIONARY.en` is dead
 * weight by decision, and the `lang` context parameter keeps its 'id' value
 * everywhere without a second sweep of every page.
 */
export const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'id', label: 'Bahasa Indonesia' },
];

export default { DICTIONARY, t, hasKey, dictionaryKeys, LANGUAGES };
