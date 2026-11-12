#!/usr/bin/env python3
"""Aset turunan dan anotasi render 3D smart insole.

Tiga tugas, semuanya dijalankan oleh build-3d.sh:

  emit     menulis gen/palette.scad (warna material dari legend.json),
           gen/anchors-<gambar>.scad (titik penunjuk), gen/render-plan.tsv
           (daftar render untuk build-3d.sh), gen/pouch-contents.scad (tata
           letak isi pouch dari contents.json), dan tabel legenda di
           docs/hardware-build-guide.html di antara penanda legend:*.
  check    memastikan nomor legenda cocok dengan badge, dan memastikan tidak
           ada komponen pouch yang keluar dari rongga. Gagal = build gagal.
  compose  mencari bola penanda berwarna di render mentah, lalu menggambar
           badge bernomor, nama komponen, garis penunjuk, judul gambar, dan
           (untuk tampak atas) garis dimensi di atasnya.

Bola penanda diletakkan oleh model OpenSCAD di koordinat yang tercatat di
annotations.json. annotate.py menemukannya kembali lewat warna, jadi badge
tidak perlu dikalibrasi tangan: kalau geometri bergerak, badge ikut bergerak.

Pakai: python3 docs/3d/annotate.py [emit|check|compose|all]
"""

import html
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
GUIDE = ROOT.parent / "hardware-build-guide.html"
GEN = ROOT / "gen"
RAW = ROOT / "render" / "raw"
RENDER = ROOT / "render"

# Warna penanda: harus pekat (saturasi tinggi) dan tidak dipakai material mana
# pun di legend.json, supaya mudah dikenali di render.
MARKER_HEX = ["#FF0000", "#00C000", "#0000FF", "#FF00FF", "#00FFFF",
              "#FF7F00", "#7F00FF", "#FFFF00", "#00FF7F", "#FF0080"]
MAX_CALLOUTS = len(MARKER_HEX)

FONT_REG = "/usr/share/fonts/TTF/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"

DEBUG = bool(os.environ.get("ANNOTATE_DEBUG"))
INK = (24, 32, 44)
RULE = (206, 214, 224)
BADGE_FILL = (24, 32, 44)


def load(name):
    return json.loads((ROOT / name).read_text())


LEGEND = load("legend.json")
FIGS = load("annotations.json")
CONTENTS = load("contents.json")
NUM = {c["id"]: i + 1 for i, c in enumerate(LEGEND["components"])}
BY_ID = {c["id"]: c for c in LEGEND["components"]}


def rgb(hexstr):
    h = hexstr.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb01(hexstr):
    return tuple(v / 255 for v in rgb(hexstr))


# ------------------------------------------------------------------ emit
def emit():
    GEN.mkdir(parents=True, exist_ok=True)
    lines = ["// Dibuat oleh annotate.py dari legend.json — jangan diedit tangan.",
             "// mat(id) mengembalikan warna material sebagai [r, g, b] 0..1.",
             "function mat(id) ="]
    for c in LEGEND["components"]:
        r, g, b = rgb01(c["color"])
        lines.append(f'  id == "{c["id"]}" ? [{r:.4f}, {g:.4f}, {b:.4f}] :')
    lines.append("  [0.60, 0.60, 0.62];")
    lines.append("")
    lines.append("MARKER_COLORS = [" + ", ".join(
        "[{:.4f}, {:.4f}, {:.4f}]".format(*rgb01(h)) for h in MARKER_HEX) + "];")
    (GEN / "palette.scad").write_text("\n".join(lines) + "\n")

    plan = []
    for f in FIGS["figures"]:
        pts = ", ".join("[{}, {}, {}]".format(*c["at"]) for c in f["callouts"])
        (GEN / f"anchors-{f['id']}.scad").write_text(
            f"// Dibuat oleh annotate.py dari annotations.json.\n"
            f"CALLOUTS = [{pts}];\n")
        defines = ",".join(f"{k}={v}" for k, v in f["defines"].items())
        cam = ",".join(str(v) for v in f["camera"])
        flags = ""
        plan.append("|".join([f["id"], f["scad"], cam, defines, flags]))
    (GEN / "render-plan.tsv").write_text("\n".join(plan) + "\n")
    # Penunjuk gambar terakhir: build-3d.sh menimpanya sebelum tiap render,
    # jadi memanggil openscad langsung tetap bisa tanpa berkas yang hilang.
    (GEN / "anchors.scad").write_text(
        "// Diisi build-3d.sh dengan ancang-<gambar>.scad sebelum tiap render.\n"
        "CALLOUTS = [];\n")

    cav = CONTENTS["cavity"]
    parts = []
    for p in CONTENTS["parts"]:
        z = CONTENTS["floor"] + p["size"][2] / 2
        parts.append(
            '  ["{}", [{}, {}, {}], [{}, {}, {}], "{}"]'.format(
                p["id"], *p["size"], p["pos"][0], p["pos"][1], z, p["shape"]))
    (GEN / "pouch-contents.scad").write_text(
        "// Dibuat oleh annotate.py dari contents.json — jangan diedit tangan.\n"
        f"CAVITY = [{cav[0]}, {cav[1]}, {cav[2]}];\n"
        "PARTS = [\n" + ",\n".join(parts) + "\n];\n")
    write_legend_table()
    print(f"emit: palet {len(LEGEND['components'])} material, "
          f"{len(FIGS['figures'])} gambar, {len(CONTENTS['parts'])} komponen pouch")


LEGEND_A = "<!-- legend:start -->"
LEGEND_B = "<!-- legend:end -->"


def write_legend_table():
    """Salin legend.json ke tabel guidebook di antara penanda legend:*.

    Nomor badge di render dan nomor di tabel harus sama; menulis tabel dari
    sumber yang sama menghapus kemungkinan keduanya melenceng. Kalau penanda
    tidak ada, lewati saja — annotate.py tetap bisa dipakai sendiri.
    """
    if not GUIDE.exists():
        return
    doc = GUIDE.read_text()
    if LEGEND_A not in doc or LEGEND_B not in doc:
        return
    rows = []
    for i, c in enumerate(LEGEND["components"], 1):
        cells = [str(i), c["name"], c["spec"], c["material"], c["note"]]
        rows.append("                <tr>" + "".join(
            f"<td>{html.escape(v)}</td>" for v in cells) + "</tr>")
    head, _, rest = doc.partition(LEGEND_A)
    _, _, tail = rest.partition(LEGEND_B)
    out = head + LEGEND_A + "\n" + "\n".join(rows) + "\n                " + LEGEND_B + tail
    if out != doc:
        GUIDE.write_text(out)


# ------------------------------------------------------------------ check
def check():
    bad = []
    if len(LEGEND["components"]) != len(set(NUM)):
        bad.append("legend.json: id komponen ada yang kembar")

    for f in FIGS["figures"]:
        n = len(f["callouts"])
        if n > MAX_CALLOUTS:
            bad.append(f"{f['id']}: {n} penunjuk, maksimum {MAX_CALLOUTS}")
        for c in f["callouts"]:
            if c["c"] not in NUM:
                bad.append(f"{f['id']}: komponen '{c['c']}' tidak ada di legend.json")
            x, y, z = c["at"]
            if not all(-2000 < v < 2000 for v in (x, y, z)):
                bad.append(f"{f['id']}: koordinat penunjuk '{c['c']}' di luar akal")

    # isi pouch harus masuk rongga dengan sisa margin
    cx, cy, cz = CONTENTS["cavity"]
    m = CONTENTS["margin"]
    floor = CONTENTS["floor"]
    for p in CONTENTS["parts"]:
        sx, sy, sz = p["size"]
        px, py = p["pos"]
        left, right = px - sx / 2, px + sx / 2
        bottom, top = py - sy / 2, py + sy / 2
        if left < -cx / 2 + m or right > cx / 2 - m:
            bad.append(f"isi pouch '{p['id']}': lebar {left:.1f}..{right:.1f} "
                       f"keluar dari rongga ±{cx / 2:.1f} (sisa minimum {m})")
        if bottom < -cy / 2 + m or top > cy / 2 - m:
            bad.append(f"isi pouch '{p['id']}': tinggi {bottom:.1f}..{top:.1f} "
                       f"keluar dari rongga ±{cy / 2:.1f} (sisa minimum {m})")
        if floor + sz > cz:
            bad.append(f"isi pouch '{p['id']}': tebal {floor + sz:.1f} "
                       f"melebihi rongga {cz}")
    for i, a in enumerate(CONTENTS["parts"]):
        for b in CONTENTS["parts"][i + 1:]:
            ax, ay = a["pos"], a["size"]
            bx, by = b["pos"], b["size"]
            gapx = abs(ax[0] - bx[0]) - (ax[0] / 2 + bx[0] / 2)
            gapy = abs(ax[1] - bx[1]) - (ax[1] / 2 + bx[1] / 2)
            if gapx < 0 and gapy < 0:
                bad.append(f"isi pouch '{a['id']}' dan '{b['id']}' bertumpuk "
                           f"(sisa {gapx:.1f} × {gapy:.1f} mm)")

    if bad:
        for b in bad:
            print("GAGAL: " + b, file=sys.stderr)
        raise SystemExit(1)
    print(f"check: {len(FIGS['figures'])} gambar, {len(CONTENTS['parts'])} "
          f"komponen pouch, semua penunjuk cocok dengan legenda")


# ------------------------------------------------------------------ compose
def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def hsv_arrays(arr):
    """Kembalikan (hue 0..1, sat 0..1, val 0..1) dari array RGB uint8."""
    f = arr.astype("float32") / 255.0
    mx = f.max(axis=2)
    mn = f.min(axis=2)
    d = mx - mn
    hue = np.zeros_like(mx)
    nz = d > 1e-6
    r, g, b = f[:, :, 0], f[:, :, 1], f[:, :, 2]
    idx = nz & (mx == r)
    hue[idx] = ((g - b)[idx] / d[idx]) % 6
    idx = nz & (mx == g)
    hue[idx] = ((b - r)[idx] / d[idx]) + 2
    idx = nz & (mx == b)
    hue[idx] = ((r - g)[idx] / d[idx]) + 4
    hue = hue / 6.0
    sat = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    return hue, sat, mx


def find_markers(arr, n):
    """Cari n bola penanda lewat warna; kembalikan [(x, y, radius)].

    Radius (persentil 95 jarak piksel dari pusat) dipakai untuk menentukan
    besar badge, supaya bola penanda selalu tertutup rapat oleh badge.

    Ambang bawah dibuat longgar: sisi bola yang membelakangi cahaya dapat
    menjadi sangat gelap (val ~ 0,08) atau tertutup sebagian, sedangkan warna
    material terdekat tetap tersaring oleh syarat saturasi.
    """
    hue, sat, val = hsv_arrays(arr)
    mask = (sat > 0.65) & (val > 0.06)
    out = []
    for i in range(n):
        mh = rgb01(MARKER_HEX[i])
        mx, mn = max(mh), min(mh)
        d = mx - mn
        if mx == mh[0]:
            h = ((mh[1] - mh[2]) / d) % 6
        elif mx == mh[1]:
            h = (mh[2] - mh[0]) / d + 2
        else:
            h = (mh[0] - mh[1]) / d + 4
        h /= 6.0
        dh = np.abs(hue - h)
        dh = np.minimum(dh, 1 - dh)
        sel = mask & (dh < 0.025)
        if sel.sum() < 12:
            raise SystemExit(
                f"penanda ke-{i + 1} ({MARKER_HEX[i]}) tidak ditemukan di render")
        ys, xs = np.nonzero(sel)
        cx, cy = float(np.median(xs)), float(np.median(ys))
        d = np.hypot(xs - cx, ys - cy)
        out.append((cx, cy, float(np.percentile(d, 95))))
    return out


# Ambang alpha. Latar render preview rata (248,248,248), jadi ambang rendah
# aman. Ambang lama 24 membuang permukaan tembus pandang yang hampir seputih
# latar, dan lubang-lubang itu tampak sebagai bintik di atas gradien hq.
ALPHA_LO = 6
ALPHA_HI = 22


def object_bbox(arr, bg):
    diff = np.abs(arr.astype("int16") - np.array(bg, dtype="int16")).sum(axis=2)
    obj = diff > ALPHA_LO
    ys, xs = np.nonzero(obj)
    if len(xs) == 0:
        raise SystemExit("render kosong: tidak ada objek terdeteksi")
    return obj, (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())), diff


def backdrop(w, h, style):
    """Latar kanvas penuh: putih polos, atau gradien lembut untuk hq."""
    canvas = Image.new("RGB", (w, h), (255, 255, 255))
    if style != "hq":
        return canvas
    t = np.linspace(0, 1, h)[:, None, None] ** 1.5
    top = np.array([255, 255, 255], "float32")
    bot = np.array([208, 221, 233], "float32")
    rows = (top + (bot - top) * t).astype("uint8")
    canvas.paste(Image.fromarray(np.repeat(rows, w, axis=1)), (0, 0))
    return canvas


def rect_overlap(a, b):
    """Luas irisan dua kotak [x0, y0, x1, y1]."""
    ox = min(a[2], b[2]) - max(a[0], b[0])
    oy = min(a[3], b[3]) - max(a[1], b[1])
    return ox * oy if ox > 0 and oy > 0 else 0.0


def compose():
    bar = 76
    for f in FIGS["figures"]:
        w, h = f.get("output", FIGS["output"])   # gambar berskala butuh kanvas lebar
        fid = f["id"]
        src = RAW / f"{fid}.png"
        if not src.exists():
            raise SystemExit(f"{src} belum ada; jalankan render dulu")
        arr = np.array(Image.open(src).convert("RGB"))
        bg = tuple(int(v) for v in arr[2, 2])
        obj, (x0, y0, x1, y1), diff = object_bbox(arr, bg)
        # trim: fraksi bbox yang dibuang dari atas. Dipakai gambar posisi
        # pakai: ujung silinder penanda pergelangan dipotong di garis judul,
        # jadi terbaca sebagai kaki yang keluar bingkai, bukan tabung pendek.
        if f.get("trim"):
            y0 += int((y1 - y0) * f["trim"])
        marks = find_markers(arr, len(f["callouts"]))
        H, W = arr.shape[:2]

        # potong ke objek + sedikit ruang, lalu skalakan ke kanvas
        pad = 0.06 * max(x1 - x0, y1 - y0) + 24
        cx0, cy0 = max(0, int(x0 - pad)), max(0, int(y0 - pad))
        cx1, cy1 = min(W, int(x1 + pad)), min(H, int(y1 + pad))
        # alpha bertahap di tepi: tepi antialias menyatu dengan latar gradien
        # hq, tidak lagi tampak sebagai garis pucat mengikuti siluet.
        ramp = np.clip((diff[cy0:cy1, cx0:cx1] - ALPHA_LO) / (ALPHA_HI - ALPHA_LO), 0, 1)
        layer = Image.fromarray(
            np.dstack([arr[cy0:cy1, cx0:cx1], (ramp * 255).astype("uint8")]), "RGBA")
        cw, ch = layer.size

        # margin samping cukup lebar untuk pita label: label diletakkan di
        # luar siluet objek, jadi ruang itu harus disediakan sejak penskalaan.
        # Margin bisa ditimpa per gambar: tampak ledak butuh pita label yang
        # lebih dalam di bawah objek karena semua penunjuknya menumpuk di
        # lapisan alas.
        ml, mr, mt, mb = f.get("margin", (104, 104, bar + 40, 96))
        if f.get("dims"):
            mb += 70
            mr += 70
        s = min((w - ml - mr) / cw, (h - mt - mb) / ch)
        nw, nh = int(cw * s), int(ch * s)
        ox = ml + (w - ml - mr - nw) // 2
        oy = mt + (h - mt - mb - nh) // 2

        canvas = backdrop(w, h, f["style"])
        box = [ox + (x0 - cx0) * s, oy + (y0 - cy0) * s,
               ox + (x1 - cx0) * s, oy + (y1 - cy0) * s]
        if f["style"] == "hq":
            shadow = Image.new("L", (w, h), 0)
            ImageDraw.Draw(shadow).ellipse(
                [box[0] - 50, box[3] - 70, box[2] + 50, box[3] + 60], fill=110)
            shadow = shadow.filter(ImageFilter.GaussianBlur(48))
            canvas.paste((150, 162, 178), (0, 0), shadow)

        canvas.paste(layer.resize((nw, nh), Image.LANCZOS), (ox, oy),
                     layer.resize((nw, nh), Image.LANCZOS))

        # siluet objek pada kanvas, dipakai penata letak label
        silhouette = Image.new("L", (w, h), 0)
        silhouette.paste(layer.getchannel("A").resize((nw, nh), Image.NEAREST),
                         (ox, oy))
        objmask = np.array(silhouette) > 128

        draw = ImageDraw.Draw(canvas)
        marks = [(ox + (x - cx0) * s, oy + (y - cy0) * s, r * s) for x, y, r in marks]
        draw_figure(canvas, draw, f, marks, box, objmask)
        canvas.save(RENDER / f"{fid}.png")
        print(f"compose: render/{fid}.png  {w}×{h}  {len(marks)} penunjuk")


def draw_figure(canvas, draw, fig, marks, box, objmask):
    w, h = canvas.size
    title_font = font(30, True)
    sub_font = font(19)
    label_font = font(19)

    # ---- judul
    bar = 76
    draw.rectangle([0, 0, w, bar], fill=(255, 255, 255))
    draw.line([(0, bar), (w, bar)], fill=RULE, width=2)
    head = f"Gambar {fig['gambar']} · {fig['title']}"
    draw.text((34, 22), head, font=title_font, fill=INK)
    sw = draw.textlength(head, font=title_font)
    sub_end = 34 + sw + 22 + draw.textlength(fig["sub"], font=sub_font)
    draw.text((34 + sw + 22, 30), fig["sub"], font=sub_font, fill=(110, 122, 138))
    # catatan kanan hanya kalau masih ada ruang: pada kanvas sempit (gambar
    # pouch yang tinggi) judul sudah memakai hampir seluruh lebar.
    right = "Smart Insole · satuan mm"
    rx = w - 34 - draw.textlength(right, font=sub_font)
    if rx > sub_end + 26:
        draw.text((rx, 30), right, font=sub_font, fill=(110, 122, 138))

    # ---- garis dimensi (tampak atas)
    obstacles = []          # kotak yang tidak boleh ditimpa label
    if fig.get("dims"):
        pxmm = (box[2] - box[0]) / fig["dims"][0]["mm"]
        for d in fig["dims"]:
            if d["axis"] == "x":
                y = min(box[3] + 74, h - 60)
                draw.line([(box[0], box[3] + 12), (box[0], y + 12)], fill=(120, 132, 148))
                draw.line([(box[2], box[3] + 12), (box[2], y + 12)], fill=(120, 132, 148))
                arrow_dim(draw, (box[0], y), (box[2], y), d["label"], label_font)
                obstacles.append([box[0] - 20, y - 30, box[2] + 20, y + 30])
            else:
                x = min(box[2] + 74, w - 60)
                draw.line([(box[2] + 12, box[1]), (x + 12, box[1])], fill=(120, 132, 148))
                draw.line([(box[2] + 12, box[3]), (x + 12, box[3])], fill=(120, 132, 148))
                arrow_dim(draw, (x, box[1]), (x, box[3]), d["label"], label_font,
                          vertical=True)
                obstacles.append([x - 42, box[1], x + 42, box[3]])
        for z in fig.get("zones", []):
            zx = box[0] + z["frac"] * (box[2] - box[0])
            for yy in range(int(box[1]) + 20, int(box[3]) - 4, 18):
                draw.line([(zx, yy), (zx, yy + 9)], fill=(150, 120, 60), width=2)
            tw = draw.textlength(z["label"], font=sub_font)
            draw.rectangle([zx - tw / 2 - 8, box[1] - 30, zx + tw / 2 + 8, box[1] - 4],
                           fill=(255, 249, 235), outline=(226, 200, 150))
            draw.text((zx - tw / 2, box[1] - 27), z["label"], font=sub_font,
                      fill=(140, 104, 40))
            obstacles.append([zx - tw / 2 - 8, box[1] - 34, zx + tw / 2 + 8, box[1]])

    # ---- label + badge
    # radius badge mengikuti besar bola penanda di layar, supaya badannya
    # selalu tertutup rapat (kalau tidak, bola warna menyembul di tepi badge)
    badges = [max(16.0, min(56.0, r * 1.15 + 4)) for _, _, r in marks]

    # penata letak label: coba 8 arah x 5 jarak, pilih biaya terendah.
    # Biaya dihitung dalam satuan luas label, jadi label tidak menimpa label
    # lain, tidak menutupi badge, dan sedapat mungkin tidak menutupi objek.
    ii = np.pad(np.cumsum(np.cumsum(objmask.astype("int32"), 0), 1),
                ((1, 0), (1, 0)))

    def obj_area(r):
        x0, y0 = max(0, int(round(r[0]))), max(0, int(round(r[1])))
        x1, y1 = min(w, int(round(r[2]))), min(h, int(round(r[3])))
        if x1 <= x0 or y1 <= y0:
            return 0
        return int(ii[y1, x1] - ii[y0, x1] - ii[y1, x0] + ii[y0, x0])

    def candidate(d, bx, by, bw, bh, gap):
        if d == "right":
            x0 = bx + gap
            return [x0, by - bh / 2, x0 + bw, by + bh / 2]
        if d == "left":
            x0 = bx - gap - bw
            return [x0, by - bh / 2, x0 + bw, by + bh / 2]
        if d == "up":
            y0 = by - gap - bh
            return [bx - bw / 2, y0, bx + bw / 2, y0 + bh]
        if d == "down":
            y0 = by + gap
            return [bx - bw / 2, y0, bx + bw / 2, y0 + bh]
        dx = 1 if d.endswith("right") else -1
        dy = -1 if d.startswith("up") else 1
        x0 = bx + dx * gap * 0.72 if dx > 0 else bx - gap * 0.72 - bw
        y0 = by - gap * 0.72 - bh if dy < 0 else by + gap * 0.72
        return [x0, y0, x0 + bw, y0 + bh]

    ORDER = ["right", "left", "up", "down",
             "up-right", "up-left", "down-right", "down-left"]
    badge_boxes = [[bx - br, by - br, bx + br, by + br]
                   for (bx, by, _), br in zip(marks, badges)]

    labels = []
    taken = list(obstacles)
    for i, c in enumerate(fig["callouts"]):
        comp = BY_ID[c["c"]]
        text = f"{NUM[c['c']]}  {comp['name']}"
        bw = draw.textlength(text, font=label_font) + 30
        bh = 44.0
        area = bw * bh
        bx, by, _ = marks[i]
        pref = c.get("dir", "right")
        order = [pref] + [d for d in ORDER if d != pref]

        best = None
        if c.get("label"):
            # posisi label eksplisit (fraksi kanvas) untuk gambar yang
            # tata letaknya ditentukan tangan, mis. tampak ledak
            fx, fy = c["label"]
            cx, cy = fx * w, fy * h
            r = [cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2]
            r[0] = max(18, min(r[0], w - 18 - bw))
            r[1] = max(bar + 12, min(r[1], h - 18 - bh))
            best = (0.0, [r[0], r[1], r[0] + bw, r[1] + bh], c.get("dir", "right"))
        for rank, d in enumerate(order if best is None else []):
            for k in (1.0, 1.22, 1.5, 1.85, 2.3, 2.9, 3.6):
                gap = badges[i] + 34 * k
                r = candidate(d, bx, by, bw, bh, gap)
                if r[0] < 18 or r[1] < bar + 12 or r[2] > w - 18 or r[3] > h - 18:
                    continue
                # tumpang tindih antar label/badge jauh lebih buruk daripada
                # label yang menempel di siluet objek, jadi bobotnya dominan
                cost = rank * 0.45 + 0.004 * gap
                cost += 40.0 * sum(rect_overlap(r, o) for o in taken) / area
                cost += 60.0 * sum(rect_overlap(r, b) for b in badge_boxes) / area
                cost += 2.0 * obj_area(r) / area
                if best is None or cost < best[0]:
                    best = (cost, r, d)

        if best is None:            # tidak muat di mana pun: jepit ke kanvas
            r = candidate(pref, bx, by, bw, bh, badges[i] + 34)
            r[0] = max(18, min(r[0], w - 18 - bw))
            r[1] = max(bar + 12, min(r[1], h - 18 - bh))
            r = [r[0], r[1], r[0] + bw, r[1] + bh]
            best = (0.0, r, pref)
        labels.append({"i": i, "rect": best[1], "dir": best[2], "text": text})
        taken.append(best[1])
        if DEBUG:
            print(f"  {fig['id']} [{i}] {comp['id']:<9} {best[2]:<11} cost={best[0]:5.2f} "
                  f"obj={obj_area(best[1]) / area:4.2f} "
                  f"rect={[round(v) for v in best[1]]}")

    for lb in labels:
        bx, by, _ = marks[lb["i"]]
        r = lb["rect"]
        ax = min(max(bx, r[0]), r[2])
        ay = min(max(by, r[1]), r[3])
        draw.line([(bx, by), (ax, ay)], fill=INK, width=2)
        draw.rounded_rectangle(r, radius=9, fill=(255, 255, 255), outline=INK, width=2)
        draw.text((r[0] + 15, r[1] + 11), lb["text"], font=label_font, fill=INK)

    for i, (bx, by, _) in enumerate(marks):
        br = badges[i]
        draw.ellipse([bx - br, by - br, bx + br, by + br], fill=BADGE_FILL,
                     outline=(255, 255, 255), width=3)
        txt = str(NUM[fig["callouts"][i]["c"]])
        nf = font(max(15, min(34, int(br * 1.02))), True)
        tw = draw.textlength(txt, font=nf)
        ah = nf.getbbox(txt)[3]
        draw.text((bx - tw / 2, by - ah / 2 - 1), txt, font=nf, fill=(255, 255, 255))

    draw.rectangle([0, 0, w - 1, h - 1], outline=RULE, width=2)


def arrow_dim(draw, p1, p2, label, font, vertical=False):
    draw.line([p1, p2], fill=INK, width=2)
    for p, other in ((p1, p2), (p2, p1)):
        dx = 12 if other[0] > p[0] else -12
        dy = 12 if other[1] > p[1] else -12
        if vertical:
            draw.polygon([p, (p[0] - 6, p[1] + dy), (p[0] + 6, p[1] + dy)], fill=INK)
        else:
            draw.polygon([p, (p[0] + dx, p[1] - 6), (p[0] + dx, p[1] + 6)], fill=INK)
    tw = draw.textlength(label, font=font)
    mid = ((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2)
    if vertical:
        box = [mid[0] - tw / 2 - 12, mid[1] - 15, mid[0] + tw / 2 + 12, mid[1] + 17]
    else:
        box = [mid[0] - tw / 2 - 12, mid[1] - 34, mid[0] + tw / 2 + 12, mid[1] - 6]
    draw.rounded_rectangle(box, radius=8, fill=(255, 255, 255), outline=RULE, width=2)
    draw.text((box[0] + 12, box[1] + 8), label, font=font, fill=INK)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    if cmd in ("all", "emit"):
        emit()
    if cmd in ("all", "check"):
        check()
    if cmd in ("all", "compose"):
        compose()
