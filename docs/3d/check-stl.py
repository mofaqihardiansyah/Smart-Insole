#!/usr/bin/env python3
"""Periksa berkas STL sebelum dikirim ke jasa cetak.

Membaca STL ASCII maupun biner, lalu melaporkan:

  * jumlah segitiga, bbox, volume, luas permukaan;
  * manifold: setiap sisi dipakai tepat dua segitiga;
  * tertutup: tidak ada sisi batas dan volume bernilai positif;
  * jumlah cangkang terpisah (harus 1 untuk satu benda cetak);
  * segitiga degenerate dan normal yang tidak konsisten.

Pakai:
    python3 check-stl.py berkas.stl [berkas2.stl ...]
    python3 check-stl.py --expect-bbox 73,73,35 berkas.stl

Keluar dengan kode 1 kalau ada berkas yang GAGAL, supaya bisa dipakai
sebagai gerbang di dalam skrip build.
"""

from __future__ import annotations

import argparse
import math
import struct
import sys

TOL = 1e-4          # pembulatan titik sudut, dalam mm
DEGENERATE = 1e-9   # luas segitiga minimum


def read_stl(path):
    """Kembalikan daftar segitiga: [(normal, v0, v1, v2), ...]."""
    with open(path, "rb") as fh:
        data = fh.read()

    if data[:5] == b"solid":
        text = data.decode("utf-8", errors="replace")
        if "facet" in text:
            return _read_ascii(text)
    return _read_binary(data)


def _read_ascii(text):
    tris = []
    normal = (0.0, 0.0, 0.0)
    verts = []
    for line in text.splitlines():
        parts = line.split()
        if not parts:
            continue
        if parts[0] == "facet" and len(parts) >= 5:
            normal = tuple(float(x) for x in parts[2:5])
            verts = []
        elif parts[0] == "vertex" and len(parts) >= 4:
            verts.append(tuple(float(x) for x in parts[1:4]))
        elif parts[0] == "endfacet":
            if len(verts) == 3:
                tris.append((normal, verts[0], verts[1], verts[2]))
    return tris


def _read_binary(data):
    if len(data) < 84:
        return []
    count = struct.unpack("<I", data[80:84])[0]
    tris = []
    off = 84
    for _ in range(count):
        if off + 50 > len(data):
            break
        vals = struct.unpack("<12fH", data[off:off + 50])
        n = vals[0:3]
        v = [(vals[3], vals[4], vals[5]),
             (vals[6], vals[7], vals[8]),
             (vals[9], vals[10], vals[11])]
        tris.append((n, v[0], v[1], v[2]))
        off += 50
    return tris


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0])


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def norm(a):
    return math.sqrt(dot(a, a))


def check(path, expect_bbox=None, expect_shells=1):
    tris = read_stl(path)
    result = {"path": path, "triangles": len(tris), "problems": []}
    if not tris:
        result["problems"].append("berkas kosong atau tidak terbaca")
        return result

    lo = [math.inf] * 3
    hi = [-math.inf] * 3
    volume = 0.0
    area = 0.0
    degenerate = 0
    flipped = 0
    edges = {}
    parent = list(range(len(tris)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    def key(p):
        return (round(p[0] / TOL), round(p[1] / TOL), round(p[2] / TOL))

    for index, (normal, a, b, c) in enumerate(tris):
        for p in (a, b, c):
            for i in range(3):
                lo[i] = min(lo[i], p[i])
                hi[i] = max(hi[i], p[i])

        geo = cross(sub(b, a), sub(c, a))
        tri_area = norm(geo) / 2.0
        area += tri_area
        if tri_area < DEGENERATE:
            degenerate += 1
            continue

        volume += dot(a, cross(b, c)) / 6.0

        if norm(normal) > 0.5 and dot(normal, geo) < 0:
            flipped += 1

        ka, kb, kc = key(a), key(b), key(c)
        for p, q in ((ka, kb), (kb, kc), (kc, ka)):
            edge = (min(p, q), max(p, q))
            edges.setdefault(edge, []).append(index)

    boundary = 0
    nonmanifold = 0
    for users in edges.values():
        if len(users) == 1:
            boundary += 1
        elif len(users) > 2:
            nonmanifold += 1
        else:
            union(users[0], users[1])

    shells = len({find(i) for i in range(len(tris))})

    result.update(
        bbox=[round(hi[i] - lo[i], 3) for i in range(3)],
        bbox_min=[round(lo[i], 3) for i in range(3)],
        volume=round(volume / 1000.0, 3),          # cm3
        area=round(area / 100.0, 3),               # cm2
        degenerate=degenerate,
        flipped_normals=flipped,
        boundary_edges=boundary,
        nonmanifold_edges=nonmanifold,
        shells=shells,
    )

    if volume <= 0:
        result["problems"].append("volume tidak positif, orientasi terbalik")
    if boundary > 0:
        result["problems"].append(f"{boundary} sisi batas, benda tidak tertutup")
    if nonmanifold > 0:
        result["problems"].append(f"{nonmanifold} sisi dipakai lebih dari dua segitiga")
    if degenerate > 0:
        result["problems"].append(f"{degenerate} segitiga degenerate")
    if flipped > 0:
        result["problems"].append(f"{flipped} normal tidak konsisten")
    if shells != expect_shells:
        result["problems"].append(f"{shells} cangkang terpisah, diharapkan {expect_shells}")
    if expect_bbox:
        for i, axis in enumerate("xyz"):
            if abs(result["bbox"][i] - expect_bbox[i]) > 0.2:
                result["problems"].append(
                    f"bbox {axis} = {result['bbox'][i]} mm, diharapkan {expect_bbox[i]} mm")
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--expect-bbox", default=None,
                    help="tiga angka dipisah koma, mis. 73,73,26")
    ap.add_argument("--expect-shells", type=int, default=1)
    args = ap.parse_args()

    expect = None
    if args.expect_bbox:
        expect = [float(x) for x in args.expect_bbox.split(",")]

    failed = False
    for path in args.files:
        res = check(path, expect, args.expect_shells)
        verdict = "LULUS" if not res["problems"] else "GAGAL"
        print(f"{verdict}  {path}")
        print(f"        segitiga {res['triangles']}  cangkang {res.get('shells')}  "
              f"volume {res.get('volume')} cm3  luas {res.get('area')} cm2")
        print(f"        bbox {res.get('bbox')} mm  minimum {res.get('bbox_min')}")
        print(f"        sisi batas {res.get('boundary_edges')}  "
              f"non-manifold {res.get('nonmanifold_edges')}  "
              f"degenerate {res.get('degenerate')}  normal terbalik {res.get('flipped_normals')}")
        for problem in res["problems"]:
            print(f"        ! {problem}")
            failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
