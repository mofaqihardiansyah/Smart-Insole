#!/usr/bin/env bash
# Bangun kotak elektronik cetak 3D dan periksa hasilnya.
#
# Alur: gerbang dimensi -> ekspor STL -> periksa mesh -> ringkasan berat
#       -> render tampak untuk pemeriksaan mata.
#
# Pakai:  ./docs/3d/build-case.sh [fdm|sla]
# Hasil:  docs/3d/cetak/*.stl  dan  docs/3d/render/case-*.png

set -euo pipefail
cd "$(dirname "$0")"

PROFILE="${1:-fdm}"
PART_LIST=(body-kanan body-kiri lid test)

say() { printf '\n== %s\n' "$1"; }

# Gerbang harus menolak: kalau openscad berhasil, berarti penjaganya bocor.
check_gate() {
  if openscad -o /dev/null -D 'EXPORT=true' -D 'PART="body-kanan"' -D "$1" \
       case.scad >/dev/null 2>&1; then
    echo "GAGAL: gerbang tidak menangkap $1" >&2
    exit 1
  fi
  printf '  gerbang menolak %-18s (%s)\n' "$1" "$2"
}

# ------------------------------------------------------------ 1. gerbang
say "gerbang dimensi dan parameter"
# Buktikan gerbangnya hidup: ukuran komponen yang kosong harus ditolak.
if openscad -o /dev/null -D 'EXPORT=true' -D 'PART="body-kanan"' -D 'ESP_T=0' \
     case.scad >/dev/null 2>&1; then
  echo "GAGAL: gerbang dimensi tidak menangkap ESP_T = 0" >&2
  exit 1
fi
echo "  gerbang dimensi bekerja (ESP_T = 0 ditolak)"

if openscad -o /dev/null -D 'EXPORT=true' -D 'PART="body-kanan"' -D 'BOSS_Y=30' \
     case.scad >/dev/null 2>&1; then
  echo "GAGAL: gerbang tata letak tidak menangkap bos yang bertabrakan" >&2
  exit 1
fi
echo "  gerbang tata letak bekerja (bos bertabrakan dengan lidah ditolak)"

# Gerbang fitur dalam: setiap cacat yang pernah ditemukan punya penjaganya.
check_gate "ESP_LIP_H=2"   "bibir ESP32 lebih rendah dari alas board"
check_gate "TP_LIP_H=1"    "bibir TP4056 lebih rendah dari alas board"
check_gate "GROOVE_D=1.2"  "alur band memotong dinding terlalu tipis"
check_gate "CBORE_D=2.8"   "reses sekrup menyisakan pelat terlalu tipis"
check_gate "TP_USB_Z=4"    "soket TP4056 menembus lantai"
check_gate "VENT_Y=[12,4,4]" "ventilasi tertutup band elastis"

# ------------------------------------------------------------ 2. ekspor STL
say "ekspor STL (profil $PROFILE)"
mkdir -p cetak render
EXPORT_FORMAT=binstl
if ! openscad -o /tmp/.probe.stl --export-format binstl -D 'EXPORT=true' \
      -D 'PART="test"' case.scad >/dev/null 2>&1; then
  echo "  catatan: --export-format binstl tidak didukung, memakai ASCII"
  EXPORT_FORMAT=asciistl
fi
rm -f /tmp/.probe.stl

for part in "${PART_LIST[@]}"; do
  out="cetak/case-$part.stl"
  openscad -o "$out" --export-format "$EXPORT_FORMAT" \
    -D 'EXPORT=true' -D "PART=\"$part\"" -D "PROFILE=\"$PROFILE\"" case.scad \
    >/dev/null 2>&1
  printf '  %-28s %8s\n' "$out" "$(du -h "$out" | cut -f1)"
done

# Gambar kerja 2D untuk dikirim bersama STL
for view in denah potong; do
  openscad -o "cetak/case-$view.dxf" -D 'EXPORT=true' -D "PART=\"$view\"" \
    case.scad >/dev/null 2>&1
  printf '  %-28s %8s\n' "cetak/case-$view.dxf" "$(du -h "cetak/case-$view.dxf" | cut -f1)"
done

# ------------------------------------------------------------ 3. periksa mesh
say "periksa mesh"
EXPECT_BBOX="73,73,20.5"
python3 check-stl.py \
  --expect-bbox "$EXPECT_BBOX" \
  cetak/case-body-kanan.stl cetak/case-body-kiri.stl

# Tutup dan kupon punya dimensi luar sendiri
python3 check-stl.py --expect-bbox 73,73,4.5 cetak/case-lid.stl
python3 check-stl.py --expect-bbox 60,40,17 cetak/case-test.stl

# ------------------------------------------------------------ 4. berat
say "perkiraan berat (PETG 1,27 g/cm3)"
python3 - <<'PY'
import re, subprocess
DENSITY = 1.27
# Dinding 2,5 mm dan pelat 3 mm tercetak hampir pejal pada 3 perimeter,
# jadi faktor isi 0,9 lebih dekat daripada 0,6.
FILL = 0.90
# Jumlah potong nyata: tutup dicetak DUA kali dari berkas yang sama.
COUNT = {"body-kanan": 1, "body-kiri": 1, "lid": 2, "test": 1}
gram = {}
for part, count in COUNT.items():
    out = subprocess.run(["python3", "check-stl.py", f"cetak/case-{part}.stl"],
                         capture_output=True, text=True).stdout
    vol = float(re.search(r"volume ([\d.]+) cm3", out).group(1))
    gram[part] = vol * DENSITY * FILL
    print(f"  {part:<10} {vol:7.2f} cm3 pejal  ->  {gram[part]:5.1f} g  x{count}")
dua_kotak = gram["body-kanan"] + gram["body-kiri"] + 2 * gram["lid"]
print(f"  {'2 kotak':<10} {'2 badan + 2 tutup':>26}  ->  {dua_kotak:5.1f} g")
print(f"  {'+ kupon':<10} {'2 kotak + 1 kupon':>26}  ->  {dua_kotak + gram['test']:5.1f} g")
PY

# ------------------------------------------------------------ 5. render
say "render tampak"
render() {
  local name="$1"; shift
  openscad -o "render/case-$name.png" --imgsize=1400,1100 --projection=o \
    --viewall --autocenter --colorscheme=Tomorrow "$@" case.scad >/dev/null 2>&1
  printf '  %-34s %8s\n' "render/case-$name.png" "$(du -h "render/case-$name.png" | cut -f1)"
}

render iso      --camera=0,0,0,55,0,25,0 -D 'PART="body-kanan"'
render atas     --camera=0,0,0,30,0,0,0 -D 'PART="body-kanan"'
render serong   --camera=0,0,0,55,0,205,0 -D 'PART="body-kanan"'
render potong-y --camera=0,0,0,55,0,25,0 -D 'PART="body-kanan"' -D 'SECTION="y"'
render potong-x --camera=0,0,0,55,0,25,0 -D 'PART="body-kanan"' -D 'SECTION="x"'
render lid      --camera=0,0,0,55,0,25,0 -D 'PART="lid"'
render kiri     --camera=0,0,0,55,0,25,0 -D 'PART="body-kiri"'
render uji      --camera=0,0,0,55,0,25,0 -D 'PART="test"'
# Takik congkel: kamera dekat, tanpa viewall, supaya lekukannya terlihat jelas
openscad -o render/case-congkel.png --imgsize=1400,1000 --projection=o \
  --colorscheme=Tomorrow --camera=-19,-36.5,18,62,0,180,58 \
  -D 'PART="detail-congkel"' case.scad >/dev/null 2>&1
printf '  %-34s %8s\n' "render/case-congkel.png" "$(du -h render/case-congkel.png | cut -f1)"

say "selesai"
echo "  STL siap kirim: docs/3d/cetak/"
echo "  Render periksa: docs/3d/render/case-*.png"
echo "  Cetak case-test.stl dulu sebelum kotak penuh."
