# Referensi Eksternal Perakitan Smart Insole

Kumpulan panduan luar yang dipakai untuk mendampingi
[`hardware-build-guide.html`](hardware-build-guide.html). Tujuannya bukan
menggantikan panduan proyek, tapi menjawab pertanyaan "kenapa langkahnya
begitu" ketika penjelasan internal terasa terlalu singkat.

Cara pakai: cari fase yang sedang dikerjakan di tabel peta cepat, buka satu
sumber saja, lalu kembali ke panduan. Membuka lima sumber sekaligus biasanya
malah menambah bingung karena angka dan istilahnya berbeda-beda.

> **Status tautan.** Semua tautan di dokumen ini diperiksa pada 19 November
> 2026 dan menjawab HTTP 200. Sumber web bisa berubah tanpa pemberitahuan;
> kalau satu tautan mati, pakai judulnya sebagai kata kunci pencarian.

## Peta cepat: fase → sumber

| Fase di panduan | Kalau macet di sini | Sumber utama |
| --- | --- | --- |
| 1 · Alur kabel & celah ekor | kupas kabel, kawat putus di pangkal | [SparkFun · Working with Wire](#4-sparkfun--working-with-wire) |
| 2 · Solder & uji ekor sensor | timah tidak menempel, sambungan dingin | [Adafruit · Excellent Soldering](#5-adafruit--guide-to-excellent-soldering) |
| 2 · Solder & uji ekor sensor | ragu apakah filmnya rusak | [Interlink · FSR 400](#3-interlink--pabrikan-fsr) |
| 3–4 · Tanam sensor & cover | sensor bergeser, hasil bacaan naik-turun | [Adafruit · FSR](#1-adafruit--force-sensitive-resistor-fsr) |
| 5 · Isi kotak (A / B) | tidak paham fungsi resistor 10 kΩ | [SparkFun · Voltage Dividers](#6-sparkfun--voltage-dividers) |
| 5 · Isi kotak (A / B) | nilai ADC mentok 4095 | [Random Nerd · ESP32 ADC](#7-random-nerd-tutorials--esp32-adc) |
| 6 · Tutup & band | kotak terasa longgar, kabel terjepit | [Simplify3D · PETG](#10-simplify3d--petg) |
| 7 · Flash, pairing, kalibrasi | board manager / port tidak muncul | [Espressif · Instalasi](#9-espressif--instalasi-arduino-esp32) |
| 7 · Flash, pairing, kalibrasi | bacaan macet setelah WiFi nyala | [Random Nerd · Pinout](#8-random-nerd-tutorials--esp32-pinout) |
| Daya & cas | ragu arus cas TP4056 | [SparkFun · LiPo Charger](#11-sparkfun--lipo-usb-charger) |

---

## 1. Adafruit · Force Sensitive Resistor (FSR)

- **Tautan:** <https://learn.adafruit.com/force-sensitive-resistor-fsr>
- **Bentuk:** tutorial web bergambar, bahasa Inggris, gratis.
- **Isi:** cara kerja FSR (dua lapis film dipisah spacer, makin ditekan makin
  banyak titik kontak), rangkaian pembagi tegangan dengan resistor 10 kΩ, kode
  Arduino, kurva gaya terhadap resistansi, dan bagian keterbatasan.
- **Yang diambil untuk proyek ini:** alasan resistor 10 kΩ, dan kalimat kunci
  bahwa FSR hanya layak dibaca sebagai **rentang**, bukan angka berat yang
  presisi — variasinya antar unit sekitar 10 %. Karena itu kalibrasi
  `ADC_OFFSET` / `ADC_TO_KPA` harus dilakukan per alat, bukan disalin dari
  alat lain.
- **Batas:** contohnya FSR 402 versi bulat 1/2 inci untuk pemakaian tangan;
  tidak membahas ekor film yang disolder berulang atau ditanam di dalam alas
  kaki.

## 2. SparkFun · Force Sensitive Resistor Hookup Guide

- **Tautan:** <https://learn.sparkfun.com/tutorials/force-sensitive-resistor-hookup-guide>
- **Bentuk:** tutorial web + kode contoh.
- **Isi:** rangkaian dasar FSR, pemilihan resistor pull-down, contoh pembacaan,
  dan peringatan bahwa FSR bukan sensor berat.
- **Yang diambil:** angka 10 kΩ sebagai nilai awal yang aman, serta kebiasaan
  mengukur beberapa kali lalu mengambil nilai tengah — berguna saat mengisi
  tabel QC di Fase 8.
- **Batas:** tidak ada panduan mekanis; tidak relevan untuk urusan cetak.

## 3. Interlink · Pabrikan FSR

- **Tautan produk:** <https://www.interlinkelectronics.com/fsr-400-series>
- **Tautan unduhan:** <https://www.interlinkelectronics.com/integration-guides>
- **Bentuk:** halaman resmi pabrikan + PDF datasheet dan integration guide.
- **Isi:** spesifikasi FSR 400 series (gaya aktivasi, gaya maksimum, rentang
  resistansi, repeatability), plus panduan integrasi mekanis: cara merekatkan,
  cara menekuk ekor, dan batas perlakuan panas saat menyolder.
- **Yang diambil:** satu-satunya sumber yang boleh dipakai sebagai **sumber
  primer** kalau dosen menanyakan dasar teknis sensor. Aturan "jangan menekuk
  di dekat area aktif" dan batas panas solder di dokumen ini adalah asal dari
  aturan 2 detik di Fase 2.
- **Batas:** bahasa Inggris, angka gaya dalam gram dan newton; tidak ada
  contoh untuk alas kaki.

## 4. SparkFun · Working with Wire

- **Tautan:** <https://learn.sparkfun.com/tutorials/working-with-wire>
- **Bentuk:** tutorial web bergambar.
- **Isi:** perbedaan kawat solid dan stranded, cara mengupas tanpa memotong
  serat, cara tin ujung kawat sebelum disambung, dan strain relief.
- **Yang diambil:** alasan memakai kabel silikon AWG 30 stranded (lentur,
  tahan tekukan berulang) dan alasan mengupas hanya 3 mm — kupasan panjang
  membuat serat mudah patah tepat di batas isolasi.
- **Batas:** tidak membahas penyambungan ke pad film tipis.

## 5. Adafruit · Guide to Excellent Soldering

- **Tautan:** <https://learn.adafruit.com/adafruit-guide-excellent-soldering>
- **Tautan masalah umum:** <https://learn.adafruit.com/adafruit-guide-excellent-soldering/common-problems>
- **Bentuk:** tutorial web dengan banyak foto close-up.
- **Isi:** suhu dan bentuk mata solder, jumlah timah, penggunaan flux, dan
  halaman khusus berisi galeri kegagalan: sambungan dingin, timah
  menggumpal seperti bola, pad terbakar, timah berjembatan.
- **Yang diambil:** halaman "common problems" adalah pembanding visual terbaik
  untuk QC Fase 2. Prinsipnya juga menjelaskan aturan panduan: panas yang
  lambat dan pemanasan berulang membuat oksida terbentuk dan menghasilkan
  sambungan dingin — karena itu solder 30–60 W, bukan solder pemantik rokok,
  dan maksimal 2 detik per pad.
- **Batas:** contohnya komponen through-hole; pad ekor FSR jauh lebih tipis,
  jadi waktu kontak harus lebih pendek daripada contoh di sana.

## 6. SparkFun · Voltage Dividers

- **Tautan:** <https://learn.sparkfun.com/tutorials/voltage-dividers>
- **Bentuk:** tutorial web, ada kalkulator.
- **Isi:** rumus pembagi tegangan `Vout = Vin × R2 / (R1 + R2)`, contoh dengan
  resistor variabel, dan akibat mengganti nilai resistor.
- **Yang diambil:** dasar untuk memeriksa ulang Lampiran A saat resistor
  diganti. Kalau 10 kΩ diganti 4,7 kΩ, tegangan keluaran naik dan bisa
  menabrak batas atas ADC — rumus ini yang dipakai untuk memutuskan.
- **Batas:** tidak membahas noise atau impedansi masukan ADC.

## 7. Random Nerd Tutorials · ESP32 ADC

- **Tautan:** <https://randomnerdtutorials.com/esp32-adc-analog-read-arduino-ide/>
- **Bentuk:** tutorial web dengan sketsa siap tempel.
- **Isi:** `analogRead` pada ESP32, pilihan atenuasi, pemetaan 0–3,3 V ke
  0–4095, dan grafik yang menunjukkan bahwa di ujung atas pembacaan mentok:
  tegangan 3,3 V dan 3,2 V sama-sama terbaca 4095.
- **Yang diambil:** penjelasan kenapa bacaan bisa "diam" di 4095 saat
  menekan kuat, dan kenapa keluaran pembagi sebaiknya dijaga di bawah 3,2 V.
  Ini juga alasan nilai kalibrasi tidak boleh dihitung dari asumsi 3,3 V
  linier penuh.
- **Batas:** memakai papan devkit; angka absolutnya bisa berbeda sedikit di
  modul ESP32 yang dipakai proyek ini.

## 8. Random Nerd Tutorials · ESP32 Pinout

- **Tautan:** <https://randomnerdtutorials.com/esp32-pinout-reference-gpios/>
- **Bentuk:** referensi tabel pin.
- **Isi:** fungsi tiap GPIO, mana yang punya ADC, mana yang strapping pin,
  dan catatan bahwa **ADC2 tidak bisa dipakai saat WiFi aktif**.
- **Yang diambil:** daftar periksa Fase 7. Kalau setelah WiFi tersambung salah
  satu kanal FSR diam di nol atau nilai aneh, kemungkinan besar pin-nya di
  ADC2 — pindahkan ke ADC1, bukan mengutak-atik kalibrasi.
- **Batas:** tabel mengikuti varian devkit umum; cocokkan dengan silkscreen
  papan yang benar-benar dipakai.

## 9. Espressif · Instalasi arduino-esp32

- **Tautan:** <https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html>
- **Bentuk:** dokumentasi resmi.
- **Isi:** cara memasang core Arduino-ESP32 lewat Board Manager, URL paket
  resmi, dan pilihan versi core.
- **Yang diambil:** rujukan saat Fase 7 gagal di tahap paling awal (papan tidak
  muncul di daftar). Banyak tutorial lama masih menyuruh URL paket yang sudah
  tidak dipakai — halaman ini yang benar.
- **Batas:** tidak membahas driver USB-serial per papan; kalau port tidak
  terdeteksi, itu masalah driver, bukan core.

## 10. Simplify3D · PETG

- **Tautan:** <https://www.simplify3d.com/resources/materials-guide/petg/>
- **Bentuk:** panduan material, bahasa Inggris.
- **Isi:** karakter PETG, suhu nozzle dan bed, pentingnya bed panas untuk
  lapisan pertama, pengaturan cooling, dan cara mengurangi stringing.
- **Yang diambil:** pembanding kalau kotak hasil cetak melengkung, lapisan
  pertama tidak menempel, atau ada rambut plastik di dalam rongga. Pengaturan
  slicer proyek ini ada di [`3d/params.md`](3d/params.md), jadi halaman ini
  dipakai untuk memahami gejalanya, bukan untuk menyalin angkanya.
- **Batas:** berorientasi printer dan slicer tertentu; nilai suhu harus
  disesuaikan dengan filamen yang dipakai.

## 11. SparkFun · LiPo USB Charger

- **Tautan:** <https://learn.sparkfun.com/tutorials/lipo-usb-charger-hookup-guide>
- **Bentuk:** tutorial web.
- **Isi:** modul charger LiPo satu sel, cara memilih arus cas, kebutuhan arus
  adaptor USB, dan arti lampu indikator.
- **Yang diambil:** logika yang sama berlaku untuk TP4056: arus cas diatur
  resistor, dan adaptor USB harus sanggup menyuplai arus itu. Ini dasar dari
  pilihan resistor 2 kΩ (arus sedang) di daftar bahan.
- **Batas:** modulnya berbeda; untuk TP4056 tetap ikuti tabel arus pada
  datasheet modul.

## 12. Adafruit · Li-Ion & LiPoly Batteries

- **Tautan:** <https://learn.adafruit.com/li-ion-and-lipoly-batteries>
- **Bentuk:** artikel edukasi.
- **Isi:** jenis sel, tegangan nominal dan penuh, aturan keselamatan, akibat
  pengisian berlebih dan panas, serta cara menyimpan.
- **Yang diambil:** dasar aturan Lampiran D — jangan mencas tanpa diawasi,
  jangan menutup rapat baterai yang sedang bermasalah, dan hentikan pemakaian
  kalau sel menggembung. Karena baterai berada di dalam kotak PETG tertutup,
  pemeriksaan suhu setelah cas pertama wajib.
- **Batas:** bukan panduan hukum atau sertifikasi; untuk klaim keselamatan
  formal tetap perlu standar.

## 13. Wikipedia · Force-sensing resistor

- **Tautan:** <https://en.wikipedia.org/wiki/Force-sensing_resistor>
- **Bentuk:** ensiklopedia.
- **Isi:** definisi, konstruksi, sejarah, kelemahan (histeresis, drift,
  ketergantungan pada luas kontak), dan perbandingan dengan sensor lain.
- **Yang diambil:** bahan Bab II untuk menjelaskan keterbatasan sensor tanpa
  harus mengutip blog. Jangan dikutip sebagai sumber utama di skripsi; pakai
  untuk menemukan istilah lalu telusuri ke paper aslinya.
- **Batas:** tidak ada angka spesifik yang bisa dipertanggungjawabkan.

---

## Video

Tautan video individual tidak dicantumkan karena tidak bisa diperiksa isinya
dari sini — video bisa dihapus atau diganti. Pencarian berikut selalu hidup,
dan hasil teratasnya biasanya tepat:

| Topik | Pencarian |
| --- | --- |
| Solder kabel ke pad FSR | <https://www.youtube.com/results?search_query=solder+wire+to+fsr+402+pads> |
| Pembagi tegangan dengan FSR | <https://www.youtube.com/results?search_query=fsr+voltage+divider+arduino+explained> |
| Setelan PETG | <https://www.youtube.com/results?search_query=petg+first+layer+settings> |

Cara memilih: durasi 5–15 menit, ada gambar close-up ke sambungan atau ke
lapisan pertama, dan penuturnya menjelaskan angka yang dipakai — bukan sekadar
"ini berhasil untuk saya". Hindari video yang memakai FSR untuk mengukur berat
badan secara presisi; itu di luar kemampuan sensornya.

---

## Sumber yang sengaja tidak dipakai

| Sumber | Alasan |
| --- | --- |
| Blog yang menjanjikan FSR bisa mengukur berat dalam kilogram | Bertentangan dengan datasheet: FSR hanya memberi rentang |
| Tutorial ESP32 yang memakai URL board manager lama | Sering gagal di Fase 7 dan membuat bingung |
| Skema "FSR langsung ke ADC tanpa resistor" | Tidak ada jalur arus; pembacaan tidak berarti |
| Video tanpa penjelasan angka setelan | Tidak bisa dipakai ulang saat hasil cetak gagal |

## Cara mengutip

Untuk skripsi, sumber web tetap perlu dicantumkan dengan tanggal akses karena
isinya bisa berubah. Format APA 7:

> Adafruit. (n.d.). *Force sensitive resistor (FSR)*. Diakses 19 November 2026,
> dari https://learn.adafruit.com/force-sensitive-resistor-fsr

Sumber yang lebih kuat untuk klaim teknis: datasheet Interlink (sumber primer),
dokumentasi Espressif (perilaku ADC dan pin), dan paper acuan di
[`refs/`](refs/). Catatan sitasi proyek ada di
[`daftar-pustaka.md`](daftar-pustaka.md).
