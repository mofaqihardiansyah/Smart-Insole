# Dokumentasi Proyek

Folder ini menampung aset visual dan dokumen pendukung Tugas Akhir.

## Struktur Folder

| Path | Keterangan |
| --- | --- |
| `schematics/` | Skematik rangkaian (FSR 402, ESP32, TP4056, pinout) |
| `3d-enclosure/` | File desain 3D (.STL / CAD) wadah pergelangan kaki |
| `diagrams/` | Diagram blok & flowchart sistem |
| `block-diagram.png` | Diagram blok sistem (sensor → ESP32 → Firebase → web) |
| `schematic.png` | Skematik wiring ESP32 + 3x FSR 402 + power management |
| `fuzzy-rule-base.png` | Visualisasi *rule base* Fuzzy Logic |
| `literature-review.md` | Rangkuman dari paper acuan (lihat folder induk `Tugas Akhir/`) |

## Daftar Paper Acuan

Berkas PDF paper acuan disimpan di folder induk (`Tugas Akhir/`) dan
**sengaja tidak** dimasukkan ke repositori GitHub karena besar & berhak cipta.

| Paper | Topik |
| --- | --- |
| `Ahmadinia_Arash.pdf` | Pressure distribution in diabetic foot |
| `dst-07-1113.pdf` | Diabetic foot ulcer prevention |
| `JHE2022-2437831.pdf` | Health monitoring |
| `cln64_2p0113.pdf` | Clinical review |
| `IJPVM-12-88.pdf` | Pressure sensor overview |
| `ijerph-20-03688.pdf` | Health telemetry |
| `12891_2023_Article_6851.pdf` | Plantar pressure analysis |
| `main.pdf` | Main reference |

## Git LFS

 Berkas gambar besar sebaiknya di-*track* dengan [Git LFS](https://git-lfs.com/):

```bash
git lfs install
git lfs track "*.png"
```
