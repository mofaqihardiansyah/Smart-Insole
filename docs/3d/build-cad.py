#!/usr/bin/env python3
"""Gambar kerja 2D insole & pouch, dibuat lewat CADCraft.

Menjalankan `cadcraft-cli` (mesin CADCraft tanpa jendela) dan menulis
DXF/DWG/SVG/PDF/PNG ke `docs/3d/cadcraft/out/`. Skrip ini juga menulis
`docs/3d/gen/*.scad` supaya model OpenSCAD memakai outline dan jalur channel
yang sama persis dengan gambar kerja.

Pakai: python3 docs/3d/build-cad.py
"""

import json
import math
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "cadcraft" / "out"
GEN = ROOT / "gen"

# ---------------------------------------------------------------- parameter
# Lihat params.md. x = 0 di tumit, y positif ke lateral.
L = 270.0
# (x, y pusat, radius) — rantai lingkaran; union-nya membentuk tapak.
# Lingkaran ujung dibuat tangent pada x = 0 (tumit) dan x = 270 (ujung jari),
# sehingga panjang tapak tepat 270 mm. Pusat digeser sedikit ke lateral pada
# daerah midfoot supaya sisi medial punya lengkungan (arch), bukan simetris.
PROFILE = [
    (20, 0, 20), (30, 0, 26), (42, 0, 30), (55, 0, 31),
    (70, 0, 31.5), (85, 0, 32), (100, 2, 33.5), (115, 2.5, 36),
    (130, 3, 39), (145, 2.5, 41), (160, 1.5, 42.5), (175, 0.5, 43.5),
    (190, 0, 45), (200, 0, 46.5), (210, 0, 47.5), (220, 0, 46),
    (230, 0, 40), (240, 0, 30), (248, 0, 22), (256, 0, 14), (260, 0, 10),
]
SENSOR_R = 6.35
POCKET = 14.0
CHANNEL_W = 3.5
CHANNEL_D = 1.5
BASE_T = 5.0
COVER_T = 2.0
FABRIC_T = 0.5
# 22,5 / 52,5 / 82,5 % diukur dari ujung depan (x = L)
SENSOR_X = {"F": L * 0.775, "M": L * 0.475, "H": L * 0.175}

POUCH_O = (70.0, 85.0)          # panel / dimensi luar
POUCH_I = (65.0, 80.0)          # rongga
POUCH_D = 26.0                  # tebal luar
POUCH_DI = 20.0                 # tebal rongga
SEAM = 5.0
PORT = (12.0, 8.0)


# ---------------------------------------------------------------- geometri
def boundary(x):
    """Tepi atas dan bawah tapak pada koordinat x (union lingkaran PROFILE)."""
    top, bot = -1e9, 1e9
    for cx, cy, r in PROFILE:
        dx = x - cx
        if abs(dx) >= r:
            continue
        h = math.sqrt(r * r - dx * dx)
        top = max(top, cy + h)
        bot = min(bot, cy - h)
    return top, bot


def control_points():
    """Titik kendali tepi tapak: ujung tumit, sisi lateral, ujung jari, sisi medial.

    Union lingkaran PROFILE punya lekukan kecil di setiap titik potong dua
    lingkaran. Titik kendali diambil dari tepi union itu, lalu dihaluskan
    dengan spline supaya garis tepi tidak bergerigi.
    """
    top, bot = [], []
    for x in range(5, 266, 10):
        t, b = boundary(float(x))
        if t > -1e8:
            top.append((float(x), t))
            bot.append((float(x), b))
    return [(0.0, 0.0)] + top + [(L, 0.0)] + list(reversed(bot))


def smooth_outline(step=0.4):
    """Tepi tapak sebagai satu kurva tertutup Catmull-Rom, tanpa lekuk.

    Hasilnya dipakai untuk gambar kerja 2D dan untuk extruded 3D, jadi kedua
    keluaran memakai garis tepi yang sama persis. Skala akhir dinormalkan agar
    panjang tepat L dan lebar bola kaki tepat 95 mm.
    """
    pts = control_points()
    n = len(pts)
    poly = []
    for i in range(n):
        p0 = pts[(i - 1) % n]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n]
        seg = math.dist(p1, p2)
        k = max(2, int(seg / step))
        for j in range(k):
            t = j / k
            t2, t3 = t * t, t * t * t
            def cr(a0, a1, a2, a3):
                return 0.5 * (2 * a1 + (-a0 + a2) * t
                              + (2 * a0 - 5 * a1 + 4 * a2 - a3) * t2
                              + (-a0 + 3 * a1 - 3 * a2 + a3) * t3)
            poly.append((cr(p0[0], p1[0], p2[0], p3[0]),
                         cr(p0[1], p1[1], p2[1], p3[1])))

    xs = [p[0] for p in poly]
    ys = [p[1] for p in poly]
    sx = L / (max(xs) - min(xs))
    sy = 95.0 / (max(ys) - min(ys))
    sy0 = (max(ys) + min(ys)) / 2
    return [(round((x - min(xs)) * sx, 3), round((y - sy0) * sy, 3))
            for x, y in poly]


def outline(step=0.4):
    """Poligon tepi tapak yang sudah dihaluskan."""
    return smooth_outline(step)


def spine():
    """Jalur channel di sisi medial, 7 mm di dalam tepi."""
    pts = []
    for x in range(210, 24, -10):
        _, b = boundary(x)
        pts.append((float(x), round(b + 7.0, 3)))
    pts.append((12.0, -14.0))
    return pts


def branch(name):
    """Sambungan pendek dari sensor ke jalur channel."""
    sx = SENSOR_X[name]
    _, b = boundary(sx)
    y = b + 7.0
    return [(sx, 0.0), (sx - 3, round(y * 0.55, 3)), (sx - 6, round(y, 3))]


# ---------------------------------------------------------------- CADCraft
class Drawing:
    def __init__(self, name):
        self.name = name
        self.cmds = ["units {\"insunits\": 4}"]
        for lt in ("HIDDEN", "CENTER"):
            self.cmds.append(f'linetype {{"load": "{lt}"}}')
        self.cmds.append('ltscale {"scale": 0.5}')
        for layer, color, lt in [
            ("OUTLINE", 7, None), ("SENSOR", 4, None), ("CHANNEL", 8, None),
            ("DIM", 3, None), ("NOTES", 2, None), ("HIDDEN", 1, "HIDDEN"),
        ]:
            body = {"name": layer, "color": color}
            if lt:
                body["linetype"] = lt
            self.cmds.append("layer.new " + json.dumps(body))

    def layer(self, name):
        self.cmds.append(f'layer.current {{"name": "{name}"}}')
        return self

    def poly(self, pts, closed=False, width=None):
        body = {"vertices": [[round(x, 3), round(y, 3)] for x, y in pts], "closed": closed}
        if width:
            body["width"] = width
        self.cmds.append("pline " + json.dumps(body))
        return self

    def line(self, pts):
        self.cmds.append("line " + json.dumps(
            {"points": [[round(x, 3), round(y, 3)] for x, y in pts]}))
        return self

    def rect(self, p1, p2, fillet=None):
        body = {"p1": p1, "p2": p2}
        if fillet:
            body["fillet"] = fillet
        self.cmds.append("rectang " + json.dumps(body))
        return self

    def circle(self, c, r):
        self.cmds.append("circle " + json.dumps({"center": list(c), "radius": r}))
        return self

    def text(self, at, s, height=5.0, justify="L"):
        self.cmds.append("text " + json.dumps(
            {"at": list(at), "text": s, "height": height, "justify": justify}))
        return self

    def dim(self, p1, p2, at, text=None):
        body = {"p1": list(p1), "p2": list(p2), "at": list(at)}
        if text:
            body["text"] = text
        self.cmds.append("dimlinear " + json.dumps(body))
        return self

    def dimd(self, center, point, at):
        self.cmds.append("dimdiameter " + json.dumps(
            {"center": list(center), "point": list(point), "at": list(at)}))
        return self

    def save(self):
        OUT.mkdir(parents=True, exist_ok=True)
        argv = ["cadcraft-cli", "run", "--metric"]
        for c in self.cmds:
            argv += ["--cmd", c]
        dxf = OUT / f"{self.name}.dxf"
        argv += ["--save", str(dxf)]
        res = subprocess.run(argv, capture_output=True, text=True)
        if res.returncode != 0:
            print(res.stdout, res.stderr, file=sys.stderr)
            raise SystemExit(f"{self.name}: cadcraft-cli gagal")
        for ext in ("svg", "pdf", "png"):
            subprocess.run(["cadcraft-cli", "convert", str(dxf),
                            str(dxf.with_suffix("." + ext))], check=True,
                           capture_output=True)
        print(f"{self.name}: {len(self.cmds)} perintah -> {dxf.name} + svg/pdf/png")


# ---------------------------------------------------------------- gambar 1
def insole_plan():
    d = Drawing("insole-plan").layer("OUTLINE")
    d.poly(outline(), closed=True)

    d.layer("SENSOR")
    for name, x in SENSOR_X.items():
        d.rect([x - POCKET / 2, -POCKET / 2], [x + POCKET / 2, POCKET / 2], fillet=2)
        d.circle((x, 0), SENSOR_R)
        d.text((x, 12), name, 7, "C")

    d.layer("CHANNEL")
    d.poly(spine(), width=CHANNEL_W)
    for name in SENSOR_X:
        d.poly(branch(name), width=CHANNEL_W)

    d.layer("HIDDEN")
    t, b = boundary(30)
    d.poly([(30, b), (30, t)])

    d.layer("NOTES")
    d.text((20, -56), "di belakang garis putus-putus: zona tumit, tanpa elektronik", 4.5)
    d.text((135, 68), "INSOLE 270 mm (EU 42)", 8, "C")
    d.text((135, 59), "tampak atas, skala 1:1 (mm)", 5, "C")
    d.text((135, 51), "F forefoot - M midfoot - H heel", 4, "C")
    d.text((150, -66), "kabel keluar di sisi tumit menuju pouch pergelangan", 4.5, "C")
    d.text((78, 14), "channel 3,5 x 1,5", 4.5)

    d.layer("DIM")
    d.dim((0, 0), (L, 0), (135, -74))
    d.dim((210, -47.5), (210, 47.5), (300, 0))
    d.dim((55, -31), (55, 31), (-20, 0))
    d.dimd((SENSOR_X["F"], 0), (SENSOR_X["F"] + SENSOR_R * 0.7, -SENSOR_R * 0.7),
           (SENSOR_X["F"] + 30, -32))
    d.save()


# ---------------------------------------------------------------- gambar 2
def insole_section():
    d = Drawing("insole-section").layer("OUTLINE")
    base = [(0, 0), (80, 0), (80, BASE_T), (63, BASE_T), (63, BASE_T - CHANNEL_D),
            (63 - CHANNEL_W, BASE_T - CHANNEL_D), (63 - CHANNEL_W, BASE_T),
            (44, BASE_T), (44, BASE_T - 2), (30, BASE_T - 2), (30, BASE_T), (0, BASE_T)]
    d.poly(base, closed=True)
    d.poly([(0, BASE_T), (80, BASE_T), (80, BASE_T + COVER_T), (0, BASE_T + COVER_T)],
           closed=True)
    d.poly([(0, BASE_T + COVER_T), (80, BASE_T + COVER_T),
            (80, BASE_T + COVER_T + FABRIC_T), (0, BASE_T + COVER_T + FABRIC_T)],
           closed=True)

    d.layer("SENSOR")
    d.rect([30, BASE_T - 2], [44, BASE_T - 1.5])

    d.layer("CHANNEL")
    d.circle((63 - CHANNEL_W / 2, BASE_T - CHANNEL_D + 1.6), 1.6)

    # label bertingkat di kanan, masing-masing dengan garis penunjuk
    d.layer("NOTES")
    for y, target, isi in [
        (17.0, (70, BASE_T + COVER_T + FABRIC_T), "kain 0,5 (opsional)"),
        (13.0, (60, BASE_T + 1), "cover EVA 2 mm — penutup"),
        (9.0, (40, BASE_T - 1.75), "FSR 402 0,5 — dalam pocket"),
        (5.0, (14, 2.5), "alas EVA 5 mm"),
    ]:
        d.line([(81, target[1]), (86, y), (94, y)])
        d.text((95, y - 1.4), isi, 3.5)
    d.text((40, 24), "POTONGAN MELINTANG — skala 2:1 (mm)", 6, "C")
    d.text((40, 18), "tebal total 7,5-8", 4, "C")
    d.text((40, -20), "pocket sensor ditanam di alas, channel kabel menyusul ke tumit",
           3.5, "C")

    d.layer("DIM")
    d.dim((0, 0), (0, BASE_T + COVER_T + FABRIC_T), (-14, 3.75), "7,5-8")
    d.dim((30, BASE_T - 2), (44, BASE_T - 2), (37, -8), "14")
    d.dim((63 - CHANNEL_W, BASE_T - CHANNEL_D), (63, BASE_T - CHANNEL_D),
          (61.25, -14), "3,5")
    d.save()


# ---------------------------------------------------------------- gambar 3
def pouch_pattern():
    w, h = POUCH_O
    d = Drawing("pouch-pattern").layer("OUTLINE")
    d.rect([0, 0], [w, h])
    d.layer("HIDDEN")
    d.rect([SEAM, SEAM], [w - SEAM, h - SEAM])
    d.layer("OUTLINE")
    d.rect([28, 7], [28 + PORT[0], 7 + PORT[1]], fillet=2)
    d.layer("NOTES")
    d.text((w / 2, h + 16), "POLA POUCH — TAMPILAN DATAR", 6, "C")
    d.text((w / 2, h + 9), "satu panel 70 x 85, jahit 3 sisi + kampuh 5", 4, "C")
    d.text((w / 2, 46), "garis jahit, kampuh 5 mm", 3.5, "C")
    d.text((w / 2, 26), "lubang port USB 12 x 8", 3.5, "C")

    # varian satu lembar 70 x 170 dilipat
    x0 = w + 70
    d.rect([x0, 0], [x0 + w, 2 * h])
    d.layer("HIDDEN")
    d.poly([(x0, h), (x0 + w, h)])
    d.layer("NOTES")
    d.text((x0 + w / 2, 2 * h + 16), "VARIAN 70 x 170, DILIPAT", 5, "C")
    d.text((x0 + w / 2, 2 * h + 9), "lipat di tengah, jahit 2 sisi", 4, "C")

    d.layer("DIM")
    d.dim((0, 0), (w, 0), (w / 2, -14))
    d.dim((w, 0), (w, h), (w + 14, h / 2))
    d.dim((x0, 0), (x0, 2 * h), (x0 - 14, h))
    d.save()


# ---------------------------------------------------------------- gambar 4
def pouch_assembly():
    w, h = POUCH_O
    d = Drawing("pouch-assembly").layer("OUTLINE")
    d.rect([0, 0], [w, h])
    d.layer("HIDDEN")
    d.rect([2.5, 2.5], [w - 2.5, h - 2.5])           # rongga 65 x 80
    for cx in (14, 35, 56):
        d.circle((cx, 17), 10)                       # velcro 3 x Ø 20
    d.layer("OUTLINE")
    d.rect([29, 50], [29 + PORT[0], 50 + PORT[1]], fillet=1.5)   # port USB

    # tampak samping
    x0 = 110
    d.poly([(x0, 0), (x0 + POUCH_D, 0), (x0 + POUCH_D, h), (x0, h)], closed=True)
    d.layer("HIDDEN")
    d.poly([(x0 + 3, 2.5), (x0 + 3 + POUCH_DI, 2.5),
            (x0 + 3 + POUCH_DI, h - 2.5), (x0 + 3, h - 2.5)], closed=True)
    d.layer("NOTES")
    d.line([(x0 - 14, 30), (x0, 30)])                # strap, kiri
    d.line([(x0 + POUCH_D, 30), (x0 + POUCH_D + 14, 30)])   # strap, kanan

    d.layer("NOTES")
    d.text((w / 2, h + 16), "POUCH — TAMPAK DEPAN", 6, "C")
    d.text((w / 2, h + 9), "dimensi luar 70 x 85, skala 1:1 (mm)", 4, "C")
    d.text((w / 2, 74), "rongga 65 x 80 x 20 (garis putus-putus)", 3.5, "C")
    d.text((w / 2, 66), "ESP32 + TP4056 + LiPo + buzzer", 3.5, "C")
    d.text((w / 2, 42), "lubang port USB 12 x 8", 3.5, "C")
    d.text((x0 - 8, -30), "tampak samping — tebal 26", 3.5)
    d.text((x0 + 13, 34), "strap", 3.5, "C")
    d.text((w / 2 - 45, -30), "velcro 3 x Ø 20 di sisi belakang", 3.5)

    d.layer("DIM")
    d.dim((0, 0), (w, 0), (w / 2, -14))
    d.dim((w, 0), (w, h), (w + 14, h / 2))
    d.dim((x0, 0), (x0 + POUCH_D, 0), (x0 + 13, -14))
    d.dim((x0 + 3, 2.5), (x0 + 3 + POUCH_DI, 2.5), (x0 + 13, -6), "20")
    d.save()


# ---------------------------------------------------------------- SCAD data
def write_scad_data():
    GEN.mkdir(parents=True, exist_ok=True)
    pts = ",\n  ".join(f"[{x}, {y}]" for x, y in outline())
    paths = [spine()] + [branch(n) for n in SENSOR_X]
    pathstr = ",\n  ".join(
        "[" + ", ".join(f"[{x}, {y}]" for x, y in p) + "]" for p in paths)
    sensor = ",\n  ".join(f'["{n}", {x}]' for n, x in SENSOR_X.items())
    (GEN / "insole-data.scad").write_text(f"""// Dibuat oleh build-cad.py — jangan diedit tangan.
// Garis tepi tapak, jalur channel, dan angka yang sama dengan gambar kerja 2D.
OUTLINE = [
  {pts}
];
CHANNEL_PATHS = [
  {pathstr}
];
SENSORS = [
  {sensor}
];
// Angka dari blok parameter build-cad.py (lihat params.md)
BASE_T = {BASE_T};
COVER_T = {COVER_T};
FABRIC_T = {FABRIC_T};
SENSOR_R = {SENSOR_R};
POCKET = {POCKET};
CH_W = {CHANNEL_W};
CH_D = {CHANNEL_D};
""")
    print(f"gen/insole-data.scad: tepi tapak ({len(outline())} titik) + channel")


def main():
    insole_plan()
    insole_section()
    pouch_pattern()
    pouch_assembly()
    write_scad_data()


if __name__ == "__main__":
    main()
