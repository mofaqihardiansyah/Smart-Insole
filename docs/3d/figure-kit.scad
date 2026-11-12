// Perlengkapan gambar: penanda penunjuk + palet material.
//
// Palet berasal dari gen/palette.scad, yang dibuat annotate.py dari
// legend.json. Jadi warna di render, warna di tabel legenda, dan nomor
// komponen selalu satu sumber.
//
// gen/anchors.scad diisi build-3d.sh dengan titik penunjuk gambar yang sedang
// dirender (dari annotations.json). Kalau kamu memanggil openscad langsung,
// berkas itu berisi penunjuk gambar terakhir — atau kosong.

include <gen/palette.scad>
include <gen/anchors.scad>

module markers(p) {
  for (i = [0 : len(p) - 1])
    color(MARKER_COLORS[i % len(MARKER_COLORS)])
      translate(p[i]) sphere(3, $fn = 24);
}
