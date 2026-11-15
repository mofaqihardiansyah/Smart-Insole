# Draf Bab Metodologi (Fase 6.2)

> Draf untuk Bab III tesis. Angka diambil dari `docs/rf-model-report.md` dan
> `docs/validation-report.md`. Daftar pustaka lengkap ada di
> [`daftar-pustaka.md`](daftar-pustaka.md); tidak ada lagi tanda `[sitasi]`
> yang belum terisi.

## 3.1 Gambaran sistem

Sistem terdiri dari tiga bagian: insole berisi tiga sensor FSR per kaki,
mikrokontroler ESP32 yang membaca sensor dan menjalankan inferensi di
perangkat, serta dashboard web yang menampilkan hasil dan riwayat. Data
mengalir dari sensor ke ESP32 dan dikirim ke Firebase Realtime Database satu
paket per detik (1 Hz), lalu dibaca dashboard. Fitur model dinyatakan dalam
satuan sampel 10 Hz; dashboard mengonversi durasi detik dari perangkat ke
satuan itu sebelum inferensi. Klasifikasi risiko dihitung dua kali dari
model yang sama: di ESP32 untuk alarm lokal, dan di dashboard untuk tampilan
riwayat. Karena keduanya memakai bobot model dan kontrak ambang yang identik,
keduanya tidak dapat memberi kesimpulan berbeda atas pembacaan yang sama.

## 3.2 Data

### 3.2.1 Dataset utama: DFN-DS

Dataset DFN-DS (Zhong dkk., 2025) memuat rekaman tekanan plantar dari 135
pasien, masing-masing 600 sampel, sehingga total 81.000 sampel. Tiap rekaman
mencatat 8 sensor per
kaki pada 6.001 baris waktu. Pasien terbagi menjadi kelompok diabetes tanpa
neuropati (DM) dan diabetes dengan neuropati (DFN).

### 3.2.2 Dataset validasi silang: OptiTrack v2

Dataset insole OptiTrack v2 (Chinarro dkk., 2026) menyediakan tekanan plantar
dan gerak tubuh yang tersinkronisasi dari 15 partisipan, 155 take, 32 sensor
per insole.
Data ini dipakai untuk memeriksa pola tiga region saat gait, bukan untuk
melatih model.

### 3.2.3 Dataset validasi ambang: Figshare DFU

Data Figshare DFU (Ngui dkk., 2025) memuat *peak
plantar pressure* dan *pressure-time integral* dari 22 pasien ulkus kaki
diabetik pada 12 region dan 5 kondisi *offloading*. Dataset ini dipakai untuk
memeriksa apakah ambang klinis model berada di dalam rentang tekanan yang
nyata.

## 3.3 Praproses

Delapan sensor per kaki diagregasi menjadi tiga region yang sesuai dengan
susunan insole: L1-L3 ke *forefoot*, L4-L5 ke *midfoot*, L6-L8 ke *heel*.
Setiap timestep menghasilkan dua fitur: *peak pressure* (kPa) dan `sustained`,
yaitu panjang run berurutan dengan `peak` di atas ambang kalibrasi p75, dalam
satuan sampel 10 Hz.

Kalibrasi jangkar konversi ADC memakai kuantil ke-75 distribusi tekanan
DFN-DS (12,39 kPa mentah) yang diskalakan 2,82x menjadi 35 kPa. Ambang label
merupakan angka terpisah: persentil ke-95 distribusi (45,4 kPa), dibulatkan
menjadi **45 kPa**, setara sekitar 5,7 N pada FSR 402.

Pelabelan **tidak** memakai kelompok pasien. Aturan label di
`scripts/prepare-dataset.py` adalah `peak >= 45 kPa` menjadi `warning`,
selain itu `safe`. Durasi tumpuan tidak menjadi syarat label: DFN-DS adalah
rekaman berjalan dengan run terpanjang di atas 45 kPa hanya 13 sampel
(1,3 detik), sehingga syarat durasi 20 detik tidak pernah tercapai. Kelompok
DFN/DM hanya dipakai untuk memastikan sebaran lipatan seimbang, bukan sebagai
label.

Seluruh 135 pasien dipakai sebagai data latih dengan **validasi silang lima
lipatan yang dikelompokkan per pasien**, bukan pembagian 80/20. Pembagian per
sampel akan membocorkan karakteristik pasien ke kedua sisi; kelompok per
pasien mencegahnya. Data uji eksternal adalah subjek diabetes baru yang
direkam sendiri untuk penelitian ini, sehingga tidak ada bagian dataset publik
yang diklaim sebagai data uji.

## 3.4 Model

Model yang dipakai adalah **Random Forest dua kelas**, `safe` dan `warning`.

Random Forest (Breiman, 2001) mempelajari batas `safe`/`warning`. Alasan
pemilihan Random Forest: batas keputusan dipelajari dari data sehingga tidak
bergantung pada fungsi keanggotaan yang ditentukan manual, model tidak
memerlukan asumsi distribusi, dan hasilnya dapat diekspor ke C++ agar berjalan
di ESP32 tanpa pustaka tambahan. Pada dataset ini batas yang dipelajari
ternyata berimpit dengan ambang label di 3.3, sehingga pohon mereproduksi
aturan; implikasinya dibahas di 3.7 dan 3.8.

Tidak ada tingkat `danger`. Puncak tekanan tertinggi di DFN-DS hanya 87,06 kPa,
sehingga 0 dari 81.000 sampel mencapai 200 kPa dan tidak ada contoh yang bisa
dilatih maupun diuji. FSR 402 juga tidak mampu mengukur 200 kPa: angka itu
setara 25,4 N pada luas aktif 126,7 mm², sedangkan sensor dirating 0,1-10 N
(sekitar 0,8-79 kPa). Secara klinis tingkat ketiga tidak menambah tindakan,
karena pasien neuropati yang melewati batas waspada sudah kehilangan sensasi
pelindung. Kontrak yang dipegang karena itu dua arah:

```
warning : peak >= 45 kPa
safe    : peak <  45 kPa
```

Kontrak ini dijalankan di firmware dan di web; suara pohon hanya menentukan
skor di dalam pita tingkatnya, sehingga angka dan tingkat tidak pernah
bertentangan.

Konfigurasi terpilih dari sapuan hiperparameter ringan: 20 pohon, kedalaman
maksimum 8, dan Gini impurity. Ketidakseimbangan kelas 17,6:1 ditangani SMOTE
(k=5, seed 42) di dalam lipatan latih saja, sehingga data uji tidak pernah
disintesis.

## 3.5 Pelatihan

Pelatihan dijalankan di Node.js (`scripts/train-model.js`) pada
`models/training-data.json` hasil `scripts/prepare-dataset.py`, sehingga
seluruh pipeline dapat direproduksi dari dataset mentah. Sapuan hiperparameter
mencakup 20 dan 50 pohon, kedalaman 8 dan 12, dengan minimum 4 sampel per
daun. Konfigurasi terbaik adalah 20 pohon dan kedalaman 8. Model diekspor ke
JSON untuk web dan ke header C++ untuk firmware.

## 3.6 Evaluasi

Empat evaluasi dijalankan:

1. **Kinerja klasifikasi** dengan validasi silang lima lipatan berkelompok
   per pasien atas 135 pasien: accuracy, precision, recall, dan F1 per kelas,
   dilaporkan untuk tiga skema (aturan murni, RF berbobot kelas, RF + SMOTE).
2. **Kontrak tingkat**: 40 kPa selama 3 detik harus `safe`, 45 kPa selama
   1 detik harus `warning`, 80 kPa selama 2 detik harus `warning`, 210 kPa
   selama 45 detik dan 500 kPa selama 60 detik tetap `warning`, dan 20 kPa
   tanpa durasi harus `safe`.
3. **Konsistensi level dan skor**: sapuan grid seragam 0-120 kPa x 0-60 detik
   memastikan setiap level selalu berada di pita skornya dan tidak ada lompatan
   di luar kontrak klinis.
4. **Validasi silang dan edge case**: pola tiga region pada data OptiTrack,
   ambang tekanan pada data DFU, serta perilaku pada input kosong, `NaN`,
   nilai negatif, dan 500 kPa.

## 3.7 Hasil

| Evaluasi | Hasil |
| --- | --- |
| Accuracy `safe` vs `warning` (5 lipatan) | 100,0% |
| Macro-F1 | 100,0% |
| Kontrak tingkat | 6/6 kasus acuan lolos |
| Ketahanan skala (gain 0,9 / 1,1 / 1,2 / 1,3) | 78,4% / 82,4% / 69,7% / 60,9% macro-F1 |
| Edge case degenerat (kosong, `NaN`, 500 kPa) | Tidak ada galat, skor tetap 0-100 |
| OptiTrack: tumit mendahului forefoot | 99,9% dari 902 fase tumpu |
| Figshare DFU: >= 45 kPa / >= 70 kPa | 9,8% / 1,4% (puncak 123,8 kPa) |
| Uji native firmware | 10/10 lolos |

Akurasi 100% perlu dibaca bersama keterbatasan di 3.8. Kelas yang dievaluasi
hanya `safe` dan `warning`, dan batas antara keduanya berasal dari ambang
`peak >= 45 kPa` yang juga menjadi fitur masukan: hampir semua pohon memisah
pada `sustained > 0`, sisanya pada `peak`. Angka itu mengukur reproduksi
aturan, bukan kemampuan generalisasi. Sinyal yang lebih jujur adalah sapuan
galat penguatan: macro-F1 turun ke 69,7% saat sinyal dikalikan 1,2, sehingga
kalibrasi sensor menjadi prasyarat.

## 3.8 Ancaman validitas

- **Hanya dua kelas.** Dataset tidak memuat contoh yang cukup tinggi untuk
  kelas ketiga (0 dari 81.000 mencapai 200 kPa; puncak DFN-DS 87,06 kPa), dan
  FSR 402 tidak mampu mengukurnya. Konsekuensinya alat ini tidak membedakan
  keparahan di atas Waspada; sekali ambang terlampaui, tindakannya sama.
- **Sirkularitas label.** Label latih adalah ambang `peak >= 45 kPa`, dan
  pohon memisah pada fitur yang sama. Model mereproduksi aturan yang
  melabelinya, sehingga akurasi tinggi tidak membuktikan pola tekanan baru.
  Karena itu tingkat dipegang kontrak dua arah, dan pohon hanya menyumbang
  skor.
- **Populasi.** DFN-DS berisi pasien diabetes, bukan populasi umum. Model
  tidak divalidasi untuk pengguna tanpa riwayat diabetes (lihat 3.9).
- **Jumlah sensor.** Insole memakai 3 sensor per kaki, sedangkan data latih
  memakai 8 sensor per kaki yang diagregasi. Agregasi ini divalidasi pada
  OptiTrack (3.1), tetapi resolusi *midfoot* pada perangkat hanya diwakili
  tiga titik ukur.
- **Durasi tidak menentukan tingkat.** Rekaman berjalan DFN-DS berhenti di
  1,3 detik di atas 45 kPa, jadi syarat durasi panjang tidak dapat diuji pada
  data ini. Perilaku pada tumpu berkepanjangan (rekaman statis) belum diukur.
- **Ketahanan skala.** Macro-F1 turun ke 69,7% saat sinyal dikalikan 1,2.
  Kalibrasi FSR sebelum pemakaian menentukan apakah ambang 45 kPa berarti.
- **Ambang Figshare.** Dataset DFU tidak memuat durasi, sehingga validasi 3.2
  hanya berlaku untuk ambang tekanan.

## 3.9 Indikasi dan batas penggunaan

Sistem ini adalah alat bantu pemantauan, bukan alat diagnosis. Keluaran berupa
tingkat risiko dan alarm lokal, dan tidak menggantikan pemeriksaan klinis.

### 3.9.1 Populasi sasaran

Alat ditujukan untuk **pasien diabetes**, idealnya dengan neuropati perifer
atau riwayat ulkus kaki. Ambang 45 kPa diturunkan dari persentil ke-95
distribusi tekanan pasien diabetes DFN-DS (45,4 kPa) dan masih di dalam rentang
FSR 402; seluruh data latih berasal dari pasien diabetes. Tidak ada subjek
non-diabetes dalam data latih.

### 3.9.2 Arti ambang di luar populasi itu

Pada orang tanpa neuropati, sensasi protektif masih utuh: tekanan tinggi terasa
nyeri dan otomatis di-*offload*, sehingga tidak menimbulkan ulkus. Karena itu
alarm pada pengguna non-diabetes bukan peringatan risiko, melainkan positif
palsu. Angka 45 kPa juga bukan batas cedera, melainkan penanda beban relatif
hasil kalibrasi dataset. Alat ini tidak boleh dipakai sebagai skrining umum
atau untuk orang sehat.

Perlu dicatat bahwa ambang 45 kPa terlampaui pada 5,4% sampel DFN-DS (4.347
dari 81.000, dari 93 pasien) dan 9,8% pengukuran Figshare (127 dari 1.296).
Itu pita yang bekerja sehari-hari: cukup sering untuk memicu tindakan, tidak
begitu sering hingga alarm diabaikan. Puncak data acuan 87,06 kPa, jadi tidak
ada dasar empiris untuk tingkat di atas Waspada.

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
