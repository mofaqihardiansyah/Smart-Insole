#!/usr/bin/env python3
"""Aset turunan dan anotasi render 3D smart insole.

Tiga tugas, semuanya dijalankan oleh build-3d.sh:

  emit     menulis gen/palette.scad (warna material dari legend.json),
           gen/anchors-<gambar>.scad (titik penunjuk), gen/render-plan.tsv
           (daftar render untuk build-3d.sh), dan gen/pouch-contents.scad
           (tata letak isi pouch dari contents.json).
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

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
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
    print(f"emit: palet {len(LEGEND['components'])} material, "
          f"{len(FIGS['figures'])} gambar, {len(CONTENTS['parts'])} komponen pouch")


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
    """Cari n bola penanda lewat warna; kembalikan [(x, y) di piksel render].

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
        out.append((float(np.median(xs)), float(np.median(ys))))
    return out


def object_bbox(arr, bg):
    diff = np.abs(arr.astype("int16") - np.array(bg, dtype="int16")).sum(axis=2)
    obj = diff > 24
    ys, xs = np.nonzero(obj)
    if len(xs) == 0:
        raise SystemExit("render kosong: tidak ada objek terdeteksi")
    return obj, (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))


def compose():
    w, h = FIGS["output"]
    for f in FIGS["figures"]:
        fid = f["id"]
        src = RAW / f"{fid}.png"
        if not src.exists():
            raise SystemExit(f"{src} belum ada; jalankan render dulu")
        arr = np.array(Image.open(src).convert("RGB"))
        bg = tuple(int(v) for v in arr[2, 2])
        obj, (x0, y0, x1, y1) = object_bbox(arr, bg)
        marks = find_markers(arr, len(f["callouts"]))
        H, W = arr.shape[:2]

        # --- potong ke objek + ruang untuk label/dimensi, lalu perbesar
        pad = 0.10 * max(x1 - x0, y1 - y0) + 40
        cx0 = max(0, int(x0 - pad))
        cy0 = max(0, int(y0 - pad))
        cx1 = min(W, int(x1 + pad))
        cy1 = min(H, int(y1 + pad))

        # lapisan objek (alpha = mask) pada latar baru
        obj_rgba = np.dstack([arr, (obj * 255).astype("uint8")])
        crop = Image.fromarray(obj_rgba[cy0:cy1, cx0:cx1], "RGBA")
        cw, ch = crop.size

        if f["style"] == "hq":
            t = np.linspace(0, 1, ch)[:, None, None] ** 1.4
            top = np.array([255, 255, 255], "float32")
            bot = np.array([224, 232, 240], "float32")
            backdrop = (top + (bot - top) * t).astype("uint8")
            backdrop = np.repeat(backdrop, cw, axis=1)
            back = Image.fromarray(backdrop)
            shadow = Image.new("L", (cw, ch), 0)
            sx0, sy0 = x0 - cx0, y0 - cy0
            sx1, sy1 = x1 - cx0, y1 - cy0
            ImageDraw.Draw(shadow).ellipse(
                [sx0 - 70, sy1 - 110, sx1 + 70, sy1 + 90], fill=96)
            shadow = shadow.filter(ImageFilter.GaussianBlur(60))
            back.paste((148, 160, 176), (0, 0), shadow)
        else:
            back = Image.new("RGB", (cw, ch), (255, 255, 255))
        back.paste(crop, (0, 0), crop)

        # --- muat ke kanvas 1600x1200 dengan margin untuk judul & dimensi
        bar = 76
        ml, mr, mt, mb = 46, 46, bar + 34, 46
        if f.get("dims"):
            mb += 66
            mr += 66
        avail_w, avail_h = w - ml - mr, h - mt - mb
        s = min(avail_w / cw, avail_h / ch)
        nw, nh = int(cw * s), int(ch * s)
        ox = ml + (avail_w - nw) // 2
        oy = mt + (avail_h - nh) // 2

        canvas = Image.new("RGB", (w, h), (255, 255, 255))
        canvas.paste(back.resize((nw, nh), Image.LANCZOS), (ox, oy))
        draw = ImageDraw.Draw(canvas)
        marks = [(ox + (x - cx0) * s, oy + (y - cy0) * s) for x, y in marks]
        box = [ox + (x0 - cx0) * s, oy + (y0 - cy0) * s,
               ox + (x1 - cx0) * s, oy + (y1 - cy0) * s]
        draw_figure(canvas, draw, f, marks, box)
        canvas.save(RENDER / f"{fid}.png")
        print(f"compose: render/{fid}.png  {w}×{h}  {len(marks)} penunjuk")


def draw_figure(canvas, draw, fig, marks, box):
    w, h = canvas.size
    title_font = font(30, True)
    sub_font = font(19)
    label_font = font(19)
    num_font = font(20, True)

    # ---- judul
    bar = 76
    draw.rectangle([0, 0, w, bar], fill=(255, 255, 255))
    draw.line([(0, bar), (w, bar)], fill=RULE, width=2)
    head = f"Gambar {fig['gambar']} · {fig['title']}"
    draw.text((34, 22), head, font=title_font, fill=INK)
    sw = draw.textlength(head, font=title_font)
    draw.text((34 + sw + 22, 30), fig["sub"], font=sub_font, fill=(110, 122, 138))
    right = "Smart Insole · satuan mm"
    draw.text((w - 34 - draw.textlength(right, font=sub_font), 30),
              right, font=sub_font, fill=(110, 122, 138))

    # ---- garis dimensi (tampak atas)
    if fig.get("dims"):
        pxmm = (box[2] - box[0]) / fig["dims"][0]["mm"]
        for d in fig["dims"]:
            if d["axis"] == "x":
                y = min(box[3] + 74, h - 60)
                draw.line([(box[0], box[3] + 12), (box[0], y + 12)], fill=(120, 132, 148))
                draw.line([(box[2], box[3] + 12), (box[2], y + 12)], fill=(120, 132, 148))
                arrow_dim(draw, (box[0], y), (box[2], y), d["label"], label_font)
            else:
                x = min(box[2] + 74, w - 60)
                draw.line([(box[2] + 12, box[1]), (x + 12, box[1])], fill=(120, 132, 148))
                draw.line([(box[2] + 12, box[3]), (x + 12, box[3])], fill=(120, 132, 148))
                arrow_dim(draw, (x, box[1]), (x, box[3]), d["label"], label_font,
                          vertical=True)
        for z in fig.get("zones", []):
            zx = box[0] + z["frac"] * (box[2] - box[0])
            for yy in range(int(box[1]) + 20, int(box[3]) - 4, 18):
                draw.line([(zx, yy), (zx, yy + 9)], fill=(150, 120, 60), width=2)
            tw = draw.textlength(z["label"], font=sub_font)
            draw.rectangle([zx - tw / 2 - 8, box[1] - 30, zx + tw / 2 + 8, box[1] - 4],
                           fill=(255, 249, 235), outline=(226, 200, 150))
            draw.text((zx - tw / 2, box[1] - 27), z["label"], font=sub_font,
                      fill=(140, 104, 40))

    # ---- label + badge
    labels = []
    for i, c in enumerate(fig["callouts"]):
        comp = BY_ID[c["c"]]
        text = f"{NUM[c['c']]}  {comp['name']}"
        tw = draw.textlength(text, font=label_font)
        bw, bh = tw + 30, 44
        bx, by = marks[i]
        d = c.get("dir", "right")
        if d == "right":
            r = [bx + 74, by - bh / 2, bx + 74 + bw, by + bh / 2]
        elif d == "left":
            r = [bx - 74 - bw, by - bh / 2, bx - 74, by + bh / 2]
        elif d == "up":
            r = [bx - bw / 2, by - 74 - bh, bx + bw / 2, by - 74]
        else:
            r = [bx - bw / 2, by + 74, bx + bw / 2, by + 74 + bh]
        labels.append({"i": i, "rect": r, "dir": d, "text": text})

    for _ in range(240):
        moved = False
        for a in labels:
            a["rect"][0] = max(20, min(a["rect"][0], w - 20 - (a["rect"][2] - a["rect"][0])))
            a["rect"][1] = max(bar + 10, min(a["rect"][1], h - 16 - (a["rect"][3] - a["rect"][1])))
            a["rect"][2] = a["rect"][0] + (a["rect"][2] - a["rect"][0])
            a["rect"][3] = a["rect"][1] + (a["rect"][3] - a["rect"][1])
        for ai in range(len(labels)):
            for bi in range(ai + 1, len(labels)):
                a, b = labels[ai]["rect"], labels[bi]["rect"]
                ox = min(a[2], b[2]) - max(a[0], b[0])
                oy = min(a[3], b[3]) - max(a[1], b[1])
                if ox > 0 and oy > 0:
                    moved = True
                    if oy <= ox:
                        push = (oy / 2) + 3
                        if a[1] < b[1]:
                            a[1] -= push; b[1] += push
                        else:
                            a[1] += push; b[1] -= push
                    else:
                        push = (ox / 2) + 3
                        if a[0] < b[0]:
                            a[0] -= push; b[0] += push
                        else:
                            a[0] += push; b[0] -= push
        if not moved:
            break

    for lb in labels:
        bx, by = marks[lb["i"]]
        r = lb["rect"]
        ax = min(max(bx, r[0]), r[2])
        ay = min(max(by, r[1]), r[3])
        draw.line([(bx, by), (ax, ay)], fill=INK, width=2)
        draw.rounded_rectangle(r, radius=9, fill=(255, 255, 255), outline=INK, width=2)
        draw.text((r[0] + 15, r[1] + 11), lb["text"], font=label_font, fill=INK)

    for i, (bx, by) in enumerate(marks):
        comp = BY_ID[fig["callouts"][i]["c"]]
        r = 18
        draw.ellipse([bx - r, by - r, bx + r, by + r], fill=BADGE_FILL,
                     outline=(255, 255, 255), width=3)
        txt = str(NUM[fig["callouts"][i]["c"]])
        tw = draw.textlength(txt, font=num_font)
        draw.text((bx - tw / 2, by - 13), txt, font=num_font, fill=(255, 255, 255))

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
