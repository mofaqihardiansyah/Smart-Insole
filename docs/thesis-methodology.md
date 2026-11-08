# Draf Bab Metodologi (Fase 6.2)

> Draf untuk Bab III tesis. Angka diambil dari `docs/rf-model-report.md` dan
> `docs/validation-report.md`. Tanda `[sitasi]` harus diisi daftar pustaka
> sebelum sidang.

## 3.1 Gambaran sistem

Sistem terdiri dari tiga bagian: insole berisi tiga sensor FSR per kaki,
mikrokontroler ESP32 yang membaca sensor dan menjalankan inferensi di
perangkat, serta dashboard web yang menampilkan hasil dan riwayat. Data
mengalir dari sensor ke ESP32 dan dikirim ke Firebase Realtime Database satu
paket per detik (1 Hz), lalu dibaca dashboard. Fitur model dinyatakan dalam
satuan sampel 10 Hz; dashboard mengonversi durasi detik dari perangkat ke
satuan itu sebelum inferensi. Klasifikasi risiko dihitung dua kali dari
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
Setiap timestep menghasilkan dua fitur: *peak pressure* (kPa) dan `sustained`,
yaitu panjang run berurutan dengan `peak` di atas ambang kalibrasi p75, dalam
satuan sampel 10 Hz.

Kalibrasi ambang peringatan memakai kuantil ke-75 distribusi tekanan DFN-DS
(12,39 kPa mentah) yang diskalakan 2,82x menjadi 35 kPa; jendela durasi
peringatan adalah 20 detik.

Pelabelan **tidak** memakai kelompok pasien. Aturan label di
`scripts/prepare-dataset.py` adalah `peak >= 35 kPa` atau `sustained >= 200
sampel` (20 detik pada 10 Hz) menjadi `warning`, selain itu `safe`. Pada
DFN-DS run terpanjang hanya 30 sampel, sehingga klausa `sustained` tidak pernah
tercapai dan label efektifnya adalah `peak >= 35 kPa`. Kelompok DFN/DM hanya
dipakai untuk memastikan pembagian data seimbang, bukan sebagai label.

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
pustaka tambahan. Pada dataset ini batas yang dipelajari ternyata berimpit
dengan ambang label di 3.3, sehingga pohon mereproduksi aturan; implikasinya
dibahas di 3.7 dan 3.8.

Aturan klinis menangani kelas `danger`:

```
danger  : peak >= 200 kPa (satu sampel; tidak ada syarat durasi)
safe    : peak < 35 kPa dan sustained < 20 detik
```

Pemisahan ini didasari komposisi dataset: puncak tekanan tertinggi di DFN-DS
hanya 87,06 kPa, sehingga 0 dari 81.000 sampel mencapai ambang 200 kPa. Tidak
ada contoh `danger` yang bisa dipelajari Random Forest, sedangkan ambangnya
sudah terdefinisi untuk pengukuran in-shoe (Castro-Martins dkk., 2024). Dengan
pembagian ini, model hanya memutuskan `safe`/`warning`; `danger` selalu berasal
dari aturan.

Konfigurasi terpilih dari sapuan hiperparameter ringan: 20 pohon, kedalaman
maksimum 8, Gini impurity, dan *bootstrap* berbobot dengan bobot kelas
berbanding terbalik dengan frekuensi, dibatasi maksimum 10x untuk mencegah
kelas minoritas mendominasi.

## 3.5 Pelatihan

Pelatihan dijalankan di Node.js (`scripts/train-model.js`) pada
`models/training-data.json` hasil `scripts/prepare-dataset.py`, sehingga
seluruh pipeline dapat direproduksi dari dataset mentah. Sapuan hiperparameter
mencakup 20 dan 50 pohon, kedalaman 8 dan 12, dengan minimum 4 sampel per
daun. Konfigurasi terbaik adalah 20 pohon dan kedalaman 8. Model diekspor ke
JSON untuk web dan ke header C++ untuk firmware.

## 3.6 Evaluasi

Empat evaluasi dijalankan:

1. **Kinerja klasifikasi** pada 28 pasien yang tidak dipakai melatih:
   accuracy, precision, recall, dan F1 per kelas.
2. **Clinical contract**: kasus acuan 40 kPa harus `warning`, 199 kPa selama
   31 detik harus tetap `warning`, 210 kPa selama 31 detik harus `danger`,
   dan 20 kPa tanpa durasi harus `safe`.
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
| Clinical contract | 5/5 lolos |
| Edge case degenerat (kosong, `NaN`, 500 kPa) | Tidak ada galat, skor tetap 0-100 |
| OptiTrack: tumit mendahului forefoot | 99,9% dari 902 fase tumpu |
| Figshare DFU: >= 70 kPa / >= 200 kPa | 1,4% / 0,0% (puncak 123,8 kPa) |
| Uji native firmware | 13/13 lolos |

Akurasi 100% perlu dibaca bersama keterbatasan di 3.8. Kelas yang dievaluasi
hanya `safe` dan `warning`, dan batas antara keduanya berasal dari ambang
`peak >= 35 kPa` yang juga menjadi fitur masukan: 19 dari 20 pohon memisah
pada `sustained > 0` dan satu pohon pada `peak` 34,97 kPa. Angka itu mengukur
reproduksi aturan, bukan kemampuan generalisasi.

## 3.8 Ancaman validitas

- **Tidak ada sampel bahaya.** Dataset tidak memuat satu pun sampel `danger`
  (0 dari 81.000; puncak DFN-DS 87,06 kPa), sehingga kelas itu diserahkan ke
  aturan klinis. Akurasi 100% tidak mengukur kemampuan mendeteksi bahaya;
  bagian itu diukur oleh clinical contract.
- **Sirkularitas label.** Label latih adalah ambang `peak >= 35 kPa`, dan
  pohon memisah pada fitur yang sama. Model mereproduksi aturan yang
  melabelinya, sehingga akurasi tinggi tidak membuktikan pola tekanan baru.
- **Populasi.** DFN-DS berisi pasien diabetes, bukan populasi umum. Model
  tidak divalidasi untuk pengguna tanpa riwayat diabetes (lihat 3.9).
- **Jumlah sensor.** Insole memakai 3 sensor per kaki, sedangkan data latih
  memakai 8 sensor per kaki yang diagregasi. Agregasi ini divalidasi pada
  OptiTrack (3.1), tetapi resolusi *midfoot* pada perangkat hanya diwakili
  tiga titik ukur.
- **Jendela durasi.** Beban 35-199 kPa yang bertahan lama tetap `warning`;
  hanya 200 kPa yang menaikkan ke `danger`. Tumpu berkepanjangan di bawah
  200 kPa karena itu tidak pernah menjadi bahaya, dan celah ini wajib
  disebutkan saat pemakaian alat.
- **Ambang Figshare.** Dataset DFU tidak memuat durasi, sehingga validasi 3.2
  hanya berlaku untuk ambang tekanan.

## 3.9 Indikasi dan batas penggunaan

Sistem ini adalah alat bantu pemantauan, bukan alat diagnosis. Keluaran berupa
tingkat risiko dan alarm lokal, dan tidak menggantikan pemeriksaan klinis.

### 3.9.1 Populasi sasaran

Alat ditujukan untuk **pasien diabetes**, idealnya dengan neuropati perifer
atau riwayat ulkus kaki. Ambang 200 kPa adalah ambang *in-shoe* dengan
konsensus terluas untuk populasi itu `[sitasi]`, dan seluruh data latih DFN-DS
berasal dari pasien diabetes. Tidak ada subjek non-diabetes dalam data latih
maupun validasi.

### 3.9.2 Arti ambang di luar populasi itu

Pada orang tanpa neuropati, sensasi protektif masih utuh: tekanan tinggi terasa
nyeri dan otomatis di-*offload*, sehingga tidak menimbulkan ulkus. Karena itu
alarm pada pengguna non-diabetes bukan peringatan risiko, melainkan positif
palsu. Angka 35 kPa juga bukan batas cedera, melainkan penanda beban relatif
hasil kalibrasi dataset. Alat ini tidak boleh dipakai sebagai skrining umum
atau untuk orang sehat.

Perlu dicatat bahwa ambang 200 kPa praktis tidak pernah tercapai pada data
acuan: 0 dari 81.000 sampel DFN-DS dan 0 dari 1.296 pengukuran Figshare
melampauinya. Alarm bahaya berfungsi sebagai plafon untuk kejadian ekstrem,
sedangkan pita yang bekerja sehari-hari adalah 35 kPa selama 20 detik.

### 3.9.3 Risiko negatif palsu

Tekanan hanya satu dari empat faktor risiko ulkus: neuropati, iskemia perifer,
deformitas, dan riwayat ulkus sebelumnya. Bacaan `safe` karena itu tidak
menyingkirkan risiko. Alat ini bersifat *adjunct* terhadap pemeriksaan klinis,
bukan penggantinya, dan tidak boleh menjadi satu-satunya dasar keputusan.

### 3.9.4 Prasyarat pemakaian

1. Diagnosis diabetes sudah terkonfirmasi.
2. Idealnya uji sensasi protektif (monofilamen 10 g) dilakukan sebelum alarm
   ditafsirkan.
3. Pengguna dan pendamping memahami bahwa alarm berarti "geser beban", bukan
   "segera ke dokter".
4. Hasil alarm dicatat dan ditinjau pada kontrol berikutnya, bukan dibaca
   sebagai keputusan tunggal.
