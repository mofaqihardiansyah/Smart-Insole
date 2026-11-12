# datasets/ — data mentah pihak ketiga

Folder ini menyimpan data mentah yang **tidak di-commit** (lihat `.gitignore`:
`*.zip`, `*.rar`, `*.xls`, `*.xlsx`). Yang di-commit hanyalah README ini dan
skrip pengolahnya.

Tujuan: satu tempat untuk menjawab "file ini dari mana, lisensinya apa, dan
dipakai untuk apa" tanpa membuka arsip 360 MB.

| Folder | Asal | Dipakai untuk | Ukuran |
|---|---|---|---|
| `dfn-ds/` | Zenodo — MSSDA, AAAI 2025 (DOI `10.1609/aaai.v39i21.34451`) | Latih model RF (`models/training-data.json`) | 273 MB |
| `figshare-dfu/` | Figshare Univ. Adelaide — Ngui dkk. 2025 (DOI `10.25954/e6yc-n159`) | Validasi ambang klinis (3.2) | 32 KB |
| `optitrack/` | Zenodo — Insoles OptiTrack v2 (DOI `10.5281/zenodo.22936249`) | Validasi fase gait (3.1) | 84 MB |

---

## 1. `dfn-ds/` — DFN-DS (MSSDA)

Diabetes foot neuropathy + diabetes mellitus, 8 FSR per kaki, 100 Hz.

| File | Isi |
|---|---|
| `DFN-DS/total_plantar_dataset/*.xls` | 135 file, satu per pasien; kolom `Time` + `L1..L8`/`R1..R8` |
| `final_135_5_total_info.xlsx` | Metadata 135 pasien: `label` (DFN/DM), `age`, `sex`, `duration_min`, `bmi` |
| `MSSDA-master.zip` | Arsip repo upstream: `DFN-DS.rar` (24,5 MB), `LICENSE`, `README.md`, `supplement.pdf`, `MSSDA_demo.ipynb` |

**Lisensi:** MIT, © 2024 Guilliman (`LICENSE` di dalam `MSSDA-master.zip`).

**Sitasi:** MSSDA — *Multi-Sub-Source Domain Adaptation for Diabetic Foot
Neuropathy Recognition*, AAAI 2025 (Zhong dkk., DOI `10.1609/aaai.v39i21.34451`;
Prosiding AAAI 39(21), 22893–22901). Repo upstream masih berstatus "coming
soon", jadi sitasi formal merujuk ke paper-nya.

**Dipakai oleh:** `scripts/prepare-dataset.py` → `models/training-data.json`
(135 pasien × 600 sampel = 81.000 sampel).

Pemetaan 8 sensor → 3 region (dipakai di skrip, bukan di data mentah):

```
L1-L3 / R1-R3 -> forefoot    (hallux + metatarsal)
L4-L5 / R4-R5 -> midfoot     (arch)
L6-L8 / R6-R8 -> heel        (calcaneus + lateral)
```

Catatan:
- Metadata pasien berasal dari `final_135_5_total_info.xlsx`, bukan dari nama
  file `.xls` — ID pasien di data adalah nomor urut, bukan identitas.
- Urutan nama pasien di repo upstream berbeda dari nomor urut yang dibagikan
  (lihat `README.md` upstream); nomor urut inilah yang dipakai di sini.
- Nama pasien tidak pernah disalin ke repo ini.

---

## 2. `figshare-dfu/` — DFU plantar pressure

Satu file: `Data Sheets.xlsx`. 22 pasien ulkus kaki diabetik, 12 region, 5
kondisi *offloading* (control, post-op shoe, post-op shoe + wool felt, RCW,
RCW + Even-Up) → 1.296 pengukuran *peak plantar pressure*.

**Dipakai untuk:** validasi 3.2 — memeriksa berapa persen pengukuran nyata
melewati ambang 35 kPa, 70 kPa, dan 200 kPa (hasil: 19,3%, 1,4%, dan 0%; lihat
`docs/validation-report.md`).

**Batasan:** buku kerja tidak memuat kolom durasi, jadi dataset ini hanya
memvalidasi **tekanan**. Puncaknya 123,8 kPa, di bawah ambang danger 200 kPa,
sehingga jalur danger tidak dapat diuji di sini.

**Sumber:** Ngui, I. R. Y., Causby, R., Jones, S., Bowden, J., & Daebeler, R.
(2025). *Measurement of plantar pressure differences in the contralateral limb
when using offloading modalities for diabetic foot ulcerations* [Data set].
University of Adelaide (Figshare). DOI `10.25954/e6yc-n159`,
<https://adelaide.figshare.com/articles/dataset/30930809>. Berkas yang diunduh
adalah `Data Sheets.xlsx` (lembar "Sheet 1", "Table 1"): 22 partisipan × 12
region = 264 baris data, cocok dengan isi berkas.

**Lisensi:** CC BY 4.0 (tercantum di halaman Figshare).

**Artikel pendamping:** Ngui dkk. (2025), *Journal of Foot and Ankle Research*
18(1), e70028, DOI `10.1002/jfa2.70028` — studi yang menerbitkan tabel ini.
Belum dibaca; sitasi 3.2 memakai entri dataset-nya.

---

## 3. `optitrack/` — Insoles OptiTrack v2

Satu file: `InsolesOpitrackDataset_v2.zip` (83,5 MB). 15 partisipan, 155
*take*, 310 rekaman tekanan (kiri dan kanan terpisah), 32 sensor per insole,
disinkronkan dengan motion capture.

**Dipakai untuk:** validasi 3.1 — urutan fase tumpu per region (tumit memuncak
sebelum forefoot pada 99,9% fase tumpu).

**Batasan:** arsip tidak memuat peta sensor dalam bentuk mesin. Nomor sensor
1–32 dibaca manual dari `insoles-number.jpeg` di dalam arsip, jadi pemetaan
tersebut adalah asumsi yang didokumentasikan, bukan data resmi vendor.

**Sumber:** Chinarro, M., Redondo-Madruga, M., Dobrescu, C. C., &
Carneros-Prado, D. (2026). *Multimodal gait dataset: Synchronized
sensorized-insole (pressure + IMU) and OptiTrack motion capture recordings*
[Data set]. Zenodo. DOI `10.5281/zenodo.22936249`,
<https://zenodo.org/records/22936249>. Arsipnya berisi
`InsolesOpitrackDataset_v2.zip` dengan `info.txt` dan `CHANGELOG.md`.

**Lisensi:** CC BY 4.0 (tercantum di catatan Zenodo).

---

## Reproduksi

Dari root repo:

```bash
python3 scripts/prepare-dataset.py   # dfn-ds/     -> models/training-data.json
node    scripts/train-model.js       # training-data -> models/rf-model.json
node    scripts/export-model-cpp.js  # rf-model.json -> firmware/include/rf-model-data.h
python3 scripts/validate-datasets.py # optitrack/ + figshare-dfu/ -> docs/validation-report.md
```

`prepare-dataset.py` butuh `openpyxl` dan `xlrd`; `validate-datasets.py` butuh
`openpyxl`. Keduanya butuh file mentah di folder ini — kalau file hilang,
skrip berhenti dengan pesan error, bukan diam-diam memakai data lama.

Setelah `train-model.js`, salin model ke web (salinan harus identik; ada tes
yang menjaganya):

```bash
cp models/rf-model.json web-dashboard/src/utils/rf-model.json
```
