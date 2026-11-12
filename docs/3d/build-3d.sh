#!/usr/bin/env bash
# Bangun ulang semua aset 3D: gambar kerja 2D (CADCraft), render OpenSCAD,
# dan STL untuk cek cetak.
#
# Pakai:  ./docs/3d/build-3d.sh
#
# Prasyarat: cadcraft-cli, openscad, python3. Semua jalur relatif ke folder ini.

set -euo pipefail
cd "$(dirname "$0")"

IMG="--imgsize=1400,1000 --projection=o --viewall --autocenter"
mkdir -p render stl cadcraft/out gen

say() { printf '\n== %s\n' "$1"; }

# ---------------------------------------------------------------- 1. gambar 2D
say "gambar kerja 2D (CADCraft)"
python3 build-cad.py

# ---------------------------------------------------------------- 2. render 3D
say "render OpenSCAD"
# insole terakit: cover dan kain tembus pandang, sensor dan kabel terlihat
openscad -o render/insole-assembled.png $IMG \
  --camera=0,0,0,58,0,25,0 -D 'GHOST=true' insole.scad
# insole ledak: cover dan kain diangkat
openscad -o render/insole-exploded.png $IMG \
  --camera=0,0,0,52,0,25,0 -D 'LIFT=35' insole.scad
# pouch tampak depan: dinding dengan lubang port USB
openscad -o render/pouch.png --imgsize=900,1000 --projection=o --viewall --autocenter \
  --camera=0,0,0,180,0,180,0 pouch.scad
# pouch tampak belakang: tiga titik velcro
openscad -o render/pouch-back.png --imgsize=1000,900 --projection=o --viewall --autocenter \
  --camera=0,0,0,60,0,30,0 pouch.scad
# tata letak isi pouch di dalam bingkai rongga 65 x 80
openscad -o render/pouch-contents.png --imgsize=1100,950 --projection=o --viewall --autocenter \
  --camera=0,0,0,10,0,0,0 pouch-contents.scad
# posisi pakai: insole + harness + pouch di pergelangan
openscad -o render/assembly.png --imgsize=1500,1060 --projection=o --viewall --autocenter \
  --camera=0,0,60,52,0,205,0 assembly.scad

# ---------------------------------------------------------------- 3. STL
say "STL"
# insole: alas + cover saja (sensor/kabel tidak dicetak)
openscad -o stl/insole.stl -D 'EXPORT=true' insole.scad
# pouch: cangkang saja
openscad -o stl/pouch-shell.stl -D 'EXPORT=true' pouch.scad

# ---------------------------------------------------------------- 4. cek hasil
say "hasil"
for f in render/*.png stl/*.stl; do
  [ -s "$f" ] || { echo "GAGAL: $f kosong" >&2; exit 1; }
  printf '  %-32s %8s\n' "$f" "$(du -h "$f" | cut -f1)"
done
echo
echo "Selesai. Gambar kerja 2D ada di cadcraft/out/, render di render/, STL di stl/."
