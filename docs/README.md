# Dokumentasi Proyek

Folder ini berisi dokumen pendukung Tugas Akhir **Smart Insole IoT**:
spesifikasi hardware, arah desain, roadmap pelatihan model, dan laporan hasil
pelatihan.

## Daftar Dokumen

| Dokumen | Keterangan |
| --- | --- |
| [`HARDWARE-SPEC.md`](HARDWARE-SPEC.md) | Spesifikasi hardware, daftar bahan (BOM), skema wiring, dan panduan perakitan smart insole |
| [`ROADMAP-RF.md`](ROADMAP-RF.md) | Roadmap pelatihan model Random Forest: mulai dari persiapan data hingga integrasi firmware |
| [`rf-model-report.md`](rf-model-report.md) | Laporan hasil pelatihan model: metrik evaluasi, clinical contract, dan rasional desain hybrid |
| [`DESIGN-BRIEF.md`](DESIGN-BRIEF.md) | Brief desain web dashboard — dokumen **historis**, digantikan oleh [`../DESIGN.md`](../DESIGN.md) sebagai otoritas desain |

## Struktur Folder

| Path | Keterangan |
| --- | --- |
| `diagrams/` | Diagram blok & flowchart sistem (saat ini placeholder) |
| `schematics/` | Skematik rangkaian: FSR 402, ESP32, TP4056, pinout (saat ini placeholder) |
| `reference-design/` | Referensi visual dashboard (ekspor Figma) yang menjadi acuan `DESIGN.md` |

## Daftar Paper Acuan

Berkas PDF paper acuan disimpan di folder induk di luar repositori dan
**sengaja tidak** dimasukkan ke repositori GitHub karena ukurannya dan hak
ciptanya.

| Paper | Topik |
| --- | --- |
| `Ahmadinia_Arash.pdf` | _Pressure distribution in diabetic foot_ |
| `dst-07-1113.pdf` | _Diabetic foot ulcer prevention_ |
| `JHE2022-2437831.pdf` | _Health monitoring_ |
| `cln64_2p0113.pdf` | _Clinical review_ |
| `IJPVM-12-88.pdf` | _Pressure sensor overview_ |
| `ijerph-20-03688.pdf` | _Health telemetry_ |
| `12891_2023_Article_6851.pdf` | _Plantar pressure analysis_ |
| `main.pdf` | Referensi utama |

## Git LFS

Berkas gambar besar sebaiknya di-_track_ dengan [Git LFS](https://git-lfs.com/):

```bash
git lfs install
git lfs track "*.png"
```
