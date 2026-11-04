# Draf Bab Metodologi (Fase 6.2)

> Draf untuk Bab III tesis. Angka diambil dari `docs/rf-model-report.md` dan
> `docs/validation-report.md`. Tanda `[sitasi]` harus diisi daftar pustaka
> sebelum sidang.

## 3.1 Gambaran sistem

Sistem terdiri dari tiga bagian: insole berisi tiga sensor FSR per kaki,
mikrokontroler ESP32 yang membaca sensor dan menjalankan inferensi di
perangkat, serta dashboard web yang menampilkan hasil dan riwayat. Data
mengalir dari sensor ke ESP32 pada laju 10 Hz, dikirim ke Firebase Realtime
Database, lalu dibaca dashboard. Klasifikasi risiko dihitung dua kali dari
model yang sama: di ESP32 untuk alarm lokal, dan di dashboard untuk tampilan
riwayat. Karena keduanya memakai bobot model dan aturan klinis yang identik,
keduanya tidak dapat memberi kesimpulan berbeda atas pembacaan yang sama.

## 3.2 Data

### 3.2.1 Dataset utama: DFN-DS

DFN-DS `[sitasi]` memuat rekaman tekanan plantar dari 135 pasien, masing-masing
600 sampel, sehingga total 81.000 sampel. Tiap rekaman mencatat 8 sensor per
kaki pada 6.001 baris waktu. Pasien terbagi menjadi kelompok diabetes tanpa
neuropati (DM) dan diabetes dengan neuropati (DFN).

### 3.2.2 Dataset validasi silang: OptiTrack v2

Dataset insole OptiTrack v2 `[sitasi]` menyediakan tekanan plantar dan gerak
tubuh yang tersinkronisasi dari 15 partisipan, 155 take, 32 sensor per insole.
Data ini dipakai untuk memeriksa pola tiga region saat gait, bukan untuk
melatih model.

### 3.2.3 Dataset validasi ambang: Figshare DFU

Data Figshare DFU `[sitasi]` memuat *peak plantar pressure* dan *pressure-time
integral* dari 22 pasien ulkus kaki diabetik pada 12 region dan 5 kondisi
*offloading*. Dataset ini dipakai untuk memeriksa apakah ambang klinis model
berada di dalam rentang tekanan yang nyata.

## 3.3 Praproses

Delapan sensor per kaki diagregasi menjadi tiga region yang sesuai dengan
susunan insole: L1-L3 ke *forefoot*, L4-L5 ke *midfoot*, L6-L8 ke *heel*.
Untuk tiap region diekstrak dua fitur: *peak pressure* (kPa) dan *sustained
duration* (detik), yaitu lama tekanan bertahan di atas ambang.

Kalibrasi ambang peringatan memakai kuantil ke-75 distribusi tekanan DFN-DS,
yang menghasilkan 35 kPa, dengan durasi peringatan 5 detik. Pelabelan mengikuti
kelompok pasien: sampel DFN dilabeli `danger`, sampel DM dipisah menjadi `safe`
dan `warning` berdasarkan durasi tumpu.

Pembagian data dilakukan **per pasien**, bukan per sampel, dengan rasio 80/20:
107 pasien untuk latihan dan 28 pasien untuk validasi. Pembagian per sampel
akan membocorkan karakteristik pasien ke kedua sisi dan membuat akurasi
validasi terlalu optimistis.

## 3.4 Model

Model yang dipakai adalah **hybrid Random Forest dan aturan klinis**.

Random Forest `[sitasi]` menangani batas `safe` dan `warning`. Alasan pemilihan
Random Forest: batas keputusan dipelajari dari data sehingga tidak bergantung
pada fungsi keanggotaan yang ditentukan manual, model tidak memerlukan asumsi
distribusi, dan hasilnya dapat diekspor ke C++ agar berjalan di ESP32 tanpa
pustaka tambahan.

Aturan klinis menangani kelas `danger`:

```
danger  : peak >= 70 kPa dan sustained >= 0,1 detik
safe    : peak < 35 kPa dan sustained < 20 detik
```

Pemisahan ini didasari komposisi dataset: hanya 31 sampel (0,05%) dari 3 pasien
yang berlabel `danger`. Jumlah tersebut tidak cukup bagi Random Forest untuk
mempelajari pola bahaya yang dapat digeneralisasi, sedangkan ambang bahayanya
sudah terdefinisi secara klinis `[sitasi]`. Dengan pembagian ini, 99,95% data
tetap ditangani model data-driven.

Konfigurasi terpilih dari sapuan hiperparameter ringan: 20 pohon, kedalaman
maksimum 8, Gini impurity, dan *bootstrap* berbobot dengan bobot kelas
berbanding terbalik dengan frekuensi, dibatasi maksimum 10x untuk mencegah
kelas minoritas mendominasi.

## 3.5 Pelatihan

Pelatihan dijalankan di Node.js (`scripts/train-model.js`) pada
`models/training-data.json` hasil `scripts/prepare-dataset.py`, sehingga
seluruh pipeline dapat direproduksi dari dataset mentah. Sapuan hiperparameter
mencakup 20 dan 50 pohon, kedalaman 8 dan 12, serta minimum sampel 2 dan 5.
Model terbaik diekspor ke JSON untuk web dan ke header C++ untuk firmware.

## 3.6 Evaluasi

Empat evaluasi dijalankan:

1. **Kinerja klasifikasi** pada 28 pasien yang tidak dipakai melatih:
   accuracy, precision, recall, dan F1 per kelas.
2. **Clinical contract**: kasus acuan 40 kPa harus `warning`, 80 kPa selama
   31 detik harus `danger`, dan 20 kPa tanpa durasi harus `safe`.
3. **Konsistensi level dan skor**: sapuan grid seragam 0-120 kPa x 0-60 detik
   memastikan setiap level selalu berada di pita skornya dan tidak ada lompatan
   di luar kontrak klinis.
4. **Validasi silang dan edge case**: pola tiga region pada data OptiTrack,
   ambang tekanan pada data DFU, serta perilaku pada input kosong, `NaN`,
   nilai negatif, dan 500 kPa.

## 3.7 Hasil

| Evaluasi | Hasil |
| --- | --- |
| Accuracy `safe` vs `warning` (28 pasien) | 100,0% |
| Macro-F1 | 100,0% |
| Clinical contract | 4/4 lolos |
| Edge case degenerat (kosong, `NaN`, 500 kPa) | Tidak ada galat, skor tetap 0-100 |
| OptiTrack: tumit mendahului forefoot | 99,9% dari 902 fase tumpu |
| Figshare DFU: pengukuran >= 70 kPa | 1,4% (puncak 123,8 kPa) |
| Uji native firmware | 13/13 lolos |

Akurasi 100% perlu dibaca bersama keterbatasan di 3.8: kelas yang dievaluasi
hanya `safe` dan `warning`, dan batas antara keduanya ditentukan oleh durasi
tumpu yang juga menjadi fitur masukan.

## 3.8 Ancaman validitas

- **Ketidakseimbangan kelas.** Kelas `danger` hanya 0,05% data, sehingga
  diserahkan ke aturan klinis. Akibatnya akurasi 100% tidak mengukur
  kemampuan mendeteksi bahaya; bagian itu diukur oleh clinical contract.
- **Populasi.** DFN-DS berisi pasien diabetes, bukan populasi umum. Model
  tidak divalidasi untuk pengguna tanpa riwayat diabetes.
- **Jumlah sensor.** Insole memakai 3 sensor per kaki, sedangkan data latih
  memakai 8 sensor per kaki yang diagregasi. Agregasi ini divalidasi pada
  OptiTrack (3.1), tetapi resolusi *midfoot* pada perangkat hanya diwakili
  tiga titik ukur.
- **Jendela durasi.** Pada beban 35-69 kPa yang bertahan lebih dari 20 detik,
  model tetap `warning`, lebih permisif daripada aturan klinis yang menaikkan ke
  `danger`; celah ini hanya muncul pada pemakaian berkepanjangan dan wajib
  disebutkan saat pemakaian alat.
- **Ambang Figshare.** Dataset DFU tidak memuat durasi, sehingga validasi 3.2
  hanya berlaku untuk ambang tekanan.

## 3.9 Batasan penggunaan

Sistem ini adalah alat bantu pemantauan, bukan alat diagnosis. Keluaran berupa
tingkat risiko dan alarm lokal, dan tidak menggantikan pemeriksaan klinis.
