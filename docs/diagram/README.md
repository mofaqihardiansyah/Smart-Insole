# Diagram Bab III — Indeks

Kumpulan kode Mermaid untuk gambar Bab III (Kegiatan Pelaksanaan) laporan
Tugas Akhir *Rancang Bangun Smart Insole Berbasis IoT Menggunakan Metode
Algoritma Random Forest untuk Monitoring Tekanan Plantar Pasien Diabetes
Mellitus Menggunakan Platform Web*.

Setiap berkas `.mmd` berisi kode Mermaid murni tanpa pagar kode, sehingga bisa
langsung dirender atau diekspor menjadi PNG/SVG.

## Indeks gambar

| Gambar | Berkas | Bagian laporan | Jenis |
| --- | --- | --- | --- |
| 3.2 | `gambar-3-2-usecase.mmd` | 3.3.1.1 | Use case diagram |
| 3.3 | `gambar-3-3-activity-monitoring.mmd` | 3.3.1.2 | Activity diagram |
| 3.4 | `gambar-3-4-activity-login.mmd` | 3.3.1.2 | Activity diagram |
| 3.5 | `gambar-3-5-sequence-realtime.mmd` | 3.3.1.3 | Sequence diagram |
| 3.6 | `gambar-3-6-sequence-login.mmd` | 3.3.1.3 | Sequence diagram |
| 3.7 | `gambar-3-7-class.mmd` | 3.3.1.4 | Class diagram |
| 3.8 | `gambar-3-8-state-machine.mmd` | 3.3.1.5 | State machine diagram |
| 3.9 | `gambar-3-9-component.mmd` | 3.3.2 | Component diagram |
| 3.10 | `gambar-3-10-deployment.mmd` | 3.3.2 | Deployment diagram |
| 3.11 | `gambar-3-11-erd.mmd` | 3.3.3 | ERD |

Gambar 3.1 (CRISP-DM) sudah ada di laporan. Gambar 3.12 ke atas (diagram blok,
flowchart, wiring, desain 3D, wireframe) belum dibuat karena menunggu
keputusan desain.

## Cara merender

Pilihan termudah, tanpa memasang apa pun:

1. Buka <https://mermaid.live>.
2. Salin isi berkas `.mmd`.
3. Tempel ke panel kiri, lalu klik **Actions → PNG** atau **SVG**.
4. Unduh dan sisipkan ke dokumen Word.

Alternatif lewat terminal, bila Mermaid CLI tersedia:

```bash
mmdc -i gambar-3-2-usecase.mmd -o gambar-3-2-usecase.png -b white -w 2000
```

Untuk semua berkas sekaligus:

```bash
for f in *.mmd; do mmdc -i "$f" -o "${f%.mmd}.png" -b white -w 2000; done
```

## Catatan notasi

- **Use case diagram** memakai `flowchart`, bukan notasi UML asli, karena
  Mermaid belum menyediakan tipe diagram use case. Aktor digambar sebagai node
  bulat, use case sebagai stadium, dan relasi `include`/`extend` sebagai panah
  putus-putus berlabel. Bila pembimbing menuntut bentuk stick-man, gambar ulang
  di draw.io dengan isi yang sama.
- **Component dan deployment diagram** juga memakai `flowchart` dengan
  `subgraph` sebagai node. Notasi `«component»` ditulis di judul tiap kotak.
- **ERD** adalah model konseptual. Implementasi fisik memakai Firebase
  Realtime Database (pohon JSON) dan Cloud Firestore (koleksi dokumen), jadi
  ERD perlu disertai tabel pemetaan ke node/collection. Tabel itu ada di draf
  Bab III, bagian 3.3.3.
- **State machine** memakai ambang versi firmware (`src/RandomForest.cpp`):
  bahaya pada 200 kPa satu sampel, aman di bawah 35 kPa dan durasi di bawah
  20 detik. Ambang Tabel 2.4 laporan (70 kPa) belum diselaraskan.

## Verifikasi

Seluruh kode sudah diuji render melalui layanan Kroki (`kroki.io/mermaid/svg`)
dan tidak menghasilkan galat parse. Kalau ada yang berubah, uji ulang dengan
perintah `mmdc` di atas.
