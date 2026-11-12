#!/usr/bin/env bash
# Bangun ulang semua aset 3D smart insole dalam satu perintah.
#
# Alur: aset turunan (palet, penunjuk, isi pouch) -> gambar kerja 2D CADCraft
#       -> render 3D mentah -> anotasi (badge, nama, dimensi) -> STL -> cek.
#
# Pakai:  ./docs/3d/build-3d.sh
# Prasyarat: cadcraft-cli, openscad, python3 + numpy + Pillow.

set -euo pipefail
cd "$(dirname "$0")"

IMG_W=3200
IMG_H=2400

say() { printf '\n== %s\n' "$1"; }

# ------------------------------------------------------------ 1. aset turunan
say "aset turunan (palet, penunjuk, isi pouch)"
python3 annotate.py emit
python3 annotate.py check

# ------------------------------------------------------------ 2. gambar 2D
say "gambar kerja 2D (CADCraft)"
python3 build-cad.py

# ------------------------------------------------------------ 3. render 3D
say "render 3D"
mkdir -p render/raw stl
while IFS='|' read -r id scad cam defines flags; do
  [ -n "${id:-}" ] || continue
  cp "gen/anchors-$id.scad" gen/anchors.scad
  # Semua render memakai preview (bukan --render=true): pada OpenSCAD 2021.01
  # F6 membuang semua color(), sehingga material kehilangan warnanya. Preview
  # tetap memberi bayangan, dan compose menambahkan latar lembut untuk hq.
  args=(--imgsize="$IMG_W,$IMG_H" --projection=o --viewall --autocenter
        --colorscheme=Tomorrow --camera="$cam")
  if [ -n "${defines:-}" ]; then
    IFS=',' read -ra defs <<< "$defines"
    for d in "${defs[@]}"; do args+=(-D "$d"); done
  fi
  if [ -n "${flags:-}" ]; then
    # shellcheck disable=SC2206
    args+=($flags)
  fi
  printf '  %-20s %s\n' "$id" "$scad"
  openscad -o "render/raw/$id.png" "${args[@]}" "$scad"
done < gen/render-plan.tsv

# ------------------------------------------------------------ 4. anotasi
say "anotasi gambar"
python3 annotate.py compose

# ------------------------------------------------------------ 5. STL
say "STL"
printf 'CALLOUTS = [];\n' > gen/anchors.scad
openscad -o stl/insole.stl -D 'EXPORT=true' insole.scad
openscad -o stl/pouch-shell.stl -D 'EXPORT=true' pouch.scad

# ------------------------------------------------------------ 6. cek hasil
say "hasil"
for f in render/*.png stl/*.stl; do
  [ -s "$f" ] || { echo "GAGAL: $f kosong" >&2; exit 1; }
  printf '  %-34s %8s\n' "$f" "$(du -h "$f" | cut -f1)"
done
python3 - <<'PY'
import subprocess
for stl in ("stl/insole.stl", "stl/pouch-shell.stl"):
    out = subprocess.run(["openscad", "--info", stl],
                         capture_output=True, text=True)
    txt = out.stdout + out.stderr
    print(f"  {stl}: {'Simple: yes' if 'Simple: yes' in txt else 'PERIKSA MANUAL'}")
print("\nSelesai. Render berlabel di render/, gambar kerja di cadcraft/out/, "
      "STL di stl/.")
PY
