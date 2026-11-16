# Perbandingan Lima Algoritma Klasifikasi pada Data Latih DFN-DS

Narasi siap tempel ke Bab IV. Semua angka berasal dari
`docs/evidence/perbandingan/metrics.json` dan dapat direproduksi dengan
perintah di bagian akhir.

## 1. Dasar pemilihan lima algoritma

Random Forest dipakai sebagai model produksi karena ringan dieksekusi di
ESP32. Untuk membuktikan bahwa pilihan itu beralasan, lima algoritma
pembanding diambil dari lima jurnal berbeda, bukan dari satu tabel perbandingan
milik penulis lain:

| Algoritma | Jurnal asal | Alasan dipilih |
|---|---|---|
| Decision Tree | Sheikh dkk. (2025) | Pohon tunggal adalah baseline paling jujur terhadap Random Forest: kompleksitas terendah, aturan yang bisa dibaca |
| Artificial Neural Network (MLP) | Darwich dkk. (2023) | Memakai insole FSR untuk mengklasifikasi empat deformitas kaki, perangkat paling mirip dengan penelitian ini |
| Support Vector Machine | Agrawal dkk. (2023) | Salah satu dari enam model yang diuji pada data insole tekanan, dengan hyperplane yang mudah dipindahkan ke perangkat |
| AdaBoost | Agrawal dkk. (2024) | Model terbaik pada jurnal itu (akurasi 0,85), yaitu pesaing ensemble terkuat bagi Random Forest |
| Fuzzy Cognitive Map | Ramirez-Bautista dkk. (2022) | Satu-satunya metode non-ML pada literatur yang dipakai, sekaligus pembanding "aturan yang bisa dibaca pakar" |

Convolutional Neural Network (Veran dkk., 2026) sengaja tidak dipakai. Jurnal
tersebut mengubah segmen sinyal menjadi citra 28×28×3 sebelum masuk ResNet-18,
sedangkan data pada penelitian ini hanya dua fitur tabular (puncak tekanan dan
durasi tumpuan). Memaksakan CNN pada dua fitur akan menghasilkan perbandingan
yang tidak setara.

## 2. Protokol

- Dataset DFN-DS: 135 pasien, 81.000 sampel, 4.347 sampel berlabel waspada
  (5,4 %), rasio kelas 17,6 : 1.
- Fitur: `peak` (kPa) dan `sustained` (jumlah sampel berurutan di atas ambang).
- Label: `waspada` bila `peak ≥ 45 kPa`; durasi bukan bagian dari definisi label.
- Validasi silang berkelompok 5 lipatan per pasien. Lipatan dibuat oleh
  `groupedFolds` di `scripts/train-model.js` dan diekspor ke
  `models/folds.json`, sehingga Random Forest dan kelima pembanding diuji pada
  pasien yang sama.
- Normalisasi `MinMaxScaler` hanya di-*fit* pada lipatan latih.
- Ambang keputusan tiap model dipilih pada lipatan latih dengan memaksimalkan
  macro-F1, lalu diterapkan apa adanya pada lipatan uji. Langkah ini diperlukan
  karena kelas minoritas hanya 5,4 %; model yang terkalibrasi baik menghasilkan
  probabilitas di sekitar prevalensi dan tidak pernah melewati 0,5 sehingga
  seluruh kelas waspada akan terlewat walaupun peringkatnya sempurna.
- Tidak ada tuning hiperparameter. Tuning per model akan membuat perbandingan
  tidak sebanding dan angkanya bias optimis.

## 3. Hasil pada data bersih

Rata-rata ± simpangan baku antar lima lipatan.

| Model | Akurasi | Macro-F1 | Precision (waspada) | Recall (waspada) | Specificity | AUC |
|---|---|---|---|---|---|---|
| Decision Tree | 1,000 ± 0,000 | 1,000 ± 0,000 | 1,000 ± 0,000 | 1,000 ± 0,000 | 1,000 ± 0,000 | 1,000 |
| ANN (MLP) | 0,999 ± 0,001 | 0,995 ± 0,005 | 0,980 ± 0,005 | 1,000 ± 0,001 | 0,999 ± 0,001 | 1,000 |
| SVM (linear) | 0,999 ± 0,001 | 0,995 ± 0,005 | 0,980 ± 0,005 | 1,000 ± 0,001 | 0,999 ± 0,001 | 1,000 |
| AdaBoost | 1,000 ± 0,000 | 1,000 ± 0,000 | 1,000 ± 0,000 | 1,000 ± 0,000 | 1,000 ± 0,000 | 1,000 |
| Fuzzy Cognitive Map | 0,999 ± 0,001 | 0,995 ± 0,005 | 0,980 ± 0,005 | 1,000 ± 0,001 | 0,999 ± 0,001 | 1,000 |
| Aturan murni (baseline) | 1,000 | 1,000 | 1,000 | 1,000 | 1,000 | — |
| Random Forest + SMOTE (produksi) | 1,000 | 1,000 | 1,000 | 1,000 | 1,000 | — |

Angka Random Forest diambil dari `docs/evidence/metrics.json` (pipeline JS) pada
lipatan pasien yang sama, bukan dilatih ulang di Python.

## 4. Mengapa hasilnya nyaris sempurna

Dua penjelasan, dan keduanya harus ditulis apa adanya.

**Pertama, label berasal dari aturan.** Model apa pun yang mampu menemukan satu
potongan pada `peak` akan mencapai macro-F1 mendekati 1. Plot wilayah keputusan
(`charts/03-batas-keputusan.svg`) menunjukkan hal ini: Decision Tree memilih
potongan tegak di 45 kPa, sedangkan ANN, SVM, dan FCM memilih batas miring yang
secara praktis setara.

**Kedua, fitur `sustained` membocorkan label.** Pada seluruh 81.000 sampel,
`sustained ≥ 1` setara dengan `peak ≥ 45 kPa`, karena `sustained` dihitung sebagai
panjang run di atas ambang yang sama. Artinya masalah klasifikasinya efektif satu
dimensi: satu fitur saja sudah cukup untuk sempurna. Ini keterbatasan desain
label, bukan keunggulan algoritma, dan menjadi alasan tabel di atas tidak boleh
dipakai untuk memilih model.

## 5. Ketahanan terhadap galat kalibrasi

Model dilatih pada data bersih, lalu data uji digeser gain 0,9–1,3. Nilai sensor
dikalikan gain dan `sustained` dihitung ulang dari deret tergeser, persis seperti
firmware menghitungnya. Macro-F1 dilaporkan gabungan (pooled) seluruh sampel.

| Model | ×0,9 | ×1,0 | ×1,1 | ×1,2 | ×1,3 |
|---|---|---|---|---|---|
| Decision Tree | 0,784 | 1,000 | 0,823 | 0,696 | 0,609 |
| ANN (MLP) | 0,790 | 0,995 | 0,818 | 0,693 | 0,606 |
| SVM (linear) | 0,790 | 0,995 | 0,818 | 0,693 | 0,606 |
| AdaBoost | 0,784 | 1,000 | 0,824 | 0,697 | 0,609 |
| Fuzzy Cognitive Map | 0,790 | 0,995 | 0,818 | 0,693 | 0,606 |
| Aturan murni | 0,784 | 1,000 | 0,824 | 0,697 | 0,609 |

Tiga hal yang terbaca:

1. Tidak ada satu pun algoritma yang membeli ketahanan terhadap galat
   kalibrasi. Semua turun ke kisaran 0,60–0,70 pada gain ×1,3.
2. Model yang paling "pintar" justru paling rapuh pada gain rendah: ANN, SVM,
   dan FCM turun sedikit di bawah aturan murni pada gain ×0,9 karena batas
   belajarnya bergeser dari 45 kPa.
3. Baseline aturan pada ×0,9 dan ×1,1 mereproduksi 78,41 % dan 82,36 % dari
   paket bukti sebelumnya dengan selisih nol, sehingga porting perhitungan
   `sustained` dapat dipercaya.

## 6. Biaya komputasi

| Model | Parameter efektif | Waktu latih per lipatan (detik) |
|---|---|---|
| SVM (linear) | 3 | 0,055 |
| AdaBoost | 300 | 0,026 |
| Decision Tree | 511 | 0,042 |
| ANN (MLP) | 82 | 5,430 |
| Fuzzy Cognitive Map | 12 | 5,359 |

Waktu latih bukan kendala pada penelitian ini (semua di bawah enam detik).
Yang menentukan kelayakan perangkat adalah biaya inferensi dan ukuran kode.
Model linear paling murah, tetapi memerlukan normalisasi masukan yang harus ikut
dikalibrasi di perangkat, sedangkan Random Forest 20 pohon kedalaman 8 tetap
pilihan yang paling mudah dipindahkan karena inferensinya hanya perbandingan
ambang.

## 7. Kesimpulan

1. Pada data yang labelnya berasal dari aturan, kelima algoritma mencapai
   kinerja setara dan tidak ada yang secara meyakinkan mengalahkan aturan
   ambang sederhana.
2. Keunggulan Random Forest bukan pada akurasi, melainkan pada sifat yang tidak
   dimiliki model lain di sini: inferensi tanpa normalisasi, tanpa perkalian
   matriks, dan mudah diekspor ke C++ untuk ESP32.
3. Perbaikan yang benar-benar menaikkan kinerja bukan penggantian algoritma,
   melainkan kalibrasi FSR. Pada gain ×1,2 seluruh model turun ke sekitar 0,70.
4. Hasil ini konsisten dengan temuan `docs/evidence/hasil-pengujian-model.html`
   bahwa model hanya menyalin aturan label, dan memperkuat alasan memilih
   Bentuk 1 pada laporan.

## 8. Reproduksi

```bash
node scripts/export-folds.js
uv run --with scikit-learn==1.9.1 --with matplotlib==3.10.8 \
  python scripts/compare-models.py
```

Keluaran: `docs/evidence/perbandingan/` (laporan HTML, metrik JSON, konfigurasi,
sebelas gambar). Dua kali jalan menghasilkan JSON identik setelah kolom waktu
latih dikeluarkan, karena waktu bergantung pada mesin.
