#!/usr/bin/env python3
"""
Fase 3 — validasi model terhadap data nyata.

3.1  OptiTrack v2: pola tekanan 3 region (heel -> midfoot -> forefoot) saat gait.
3.2  Figshare DFU: ambang klinis model (35 / 70 kPa) dibandingkan dengan puncak
     tekanan kaki DFU yang sebenarnya.

Cara pakai:

    python3 scripts/validate-datasets.py [--limit N]

Dataset dibaca langsung dari arsip, tidak perlu diekstrak. `--limit` membatasi
jumlah rekaman yang diproses (default: semua).

Keluaran: ringkasan di stdout; angka yang sama dipakai di
`docs/validation-report.md`.
"""

import argparse
import csv
import io
import statistics
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPTITRACK_ZIP = ROOT / "datasets" / "optitrack" / "InsolesOpitrackDataset_v2.zip"
FIGSHARE_XLSX = ROOT / "datasets" / "figshare-dfu" / "Data Sheets.xlsx"

# Sensor -> region, dibaca dari `insoles-number.jpeg` di dalam arsip: nomor 1-32
# per insole, ujung kaki di atas. Celah baris pada gambar memisahkan tiga blok.
FOREFOOT = {1, 17, 4, 20, 18, 2, 3, 19, 8, 5, 24, 10, 21, 6, 7, 22, 9, 11, 23}
MIDFOOT = {12, 15, 16}
HEEL = {13, 29, 14, 27, 30, 32, 26, 28, 31, 25}

WARNING_KPA = 35.0
DANGER_KPA = 70.0


def region(sensor_index):
    """0 = forefoot, 1 = midfoot, 2 = heel."""
    number = sensor_index + 1
    if number in FOREFOOT:
        return 0
    if number in MIDFOOT:
        return 1
    return 2


def load_pressure(zf, name):
    with zf.open(name) as handle:
        rows = list(csv.reader(io.TextIOWrapper(handle)))
    columns = [i for i, head in enumerate(rows[0]) if head.startswith("PressureSensor")]
    return [[float(row[i]) for i in columns] for row in rows[1:] if row]


def sensor_counts():
    counts = [0, 0, 0]
    for index in range(32):
        counts[region(index)] += 1
    return counts


def to_regions(frames):
    """
    Sum the 32 sensors into forefoot / midfoot / heel and drop the idle offset.

    Returns (sums, means). The sums are for peak timing; the means are for load
    share, because the three regions hold 19 / 3 / 10 sensors and a raw sum
    would call the forefoot the heaviest region no matter what the foot does.
    """
    sums = [[], [], []]
    means = [[], [], []]
    counts = sensor_counts()
    for frame in frames:
        totals = [0.0, 0.0, 0.0]
        for index, value in enumerate(frame):
            totals[region(index)] += value
        for r in range(3):
            sums[r].append(totals[r])
            means[r].append(totals[r] / counts[r])
    def drop_baseline(series):
        baseline = [min(s) if s else 0.0 for s in series]
        return [
            [max(0.0, value - base) for value in s]
            for s, base in zip(series, baseline)
        ]
    return drop_baseline(sums), drop_baseline(means)


def heel_strikes(heel):
    """Onsets where heel load rises past 20% of its own maximum."""
    peak = max(heel) if heel else 0.0
    if peak <= 0:
        return []
    return [
        i
        for i in range(1, len(heel))
        if heel[i - 1] < 0.2 * peak <= heel[i]
    ]


def analyse_gait(series):
    """Per stance phase, find the frame each region peaks on."""
    onsets = heel_strikes(series[2])
    rows = []
    for start, end in zip(onsets, onsets[1:]):
        if end - start < 15:
            continue
        segment = [s[start:end] for s in series]
        peaks = [
            max(range(len(s)), key=lambda i: s[i]) if s else 0 for s in segment
        ]
        rows.append(
            {
                "forefoot": peaks[0],
                "midfoot": peaks[1],
                "heel": peaks[2],
                "load": [sum(s) for s in segment],
            }
        )
    return rows


def check_optitrack(limit):
    if not OPTITRACK_ZIP.exists():
        print("3.1 SKIP: arsip OptiTrack tidak ada", file=sys.stderr)
        return None
    with zipfile.ZipFile(OPTITRACK_ZIP) as zf:
        names = [n for n in zf.namelist() if n.endswith(".csv") and "Pressure" in n]
        if limit:
            names = names[:limit]
        steps = 0
        heel_first = 0
        full_order = 0
        load = [0.0, 0.0, 0.0]
        for name in names:
            series, means = to_regions(load_pressure(zf, name))
            total = sum(sum(s) for s in means)
            if total:
                for r in range(3):
                    load[r] += sum(means[r]) / total
            for row in analyse_gait(series):
                steps += 1
                if row["heel"] <= row["forefoot"]:
                    heel_first += 1
                if row["heel"] <= row["midfoot"] <= row["forefoot"]:
                    full_order += 1
        if not steps:
            print("3.1 SKIP: tidak ada fase tumpu yang terdeteksi", file=sys.stderr)
            return None
        return {
            "recordings": len(names),
            "steps": steps,
            "heel_before_forefoot_pct": 100.0 * heel_first / steps,
            "heel_mid_fore_pct": 100.0 * full_order / steps,
            "load_share_pct": [100.0 * x / len(names) for x in load],
        }


def check_figshare():
    if not FIGSHARE_XLSX.exists():
        print("3.2 SKIP: Data Sheets.xlsx tidak ada", file=sys.stderr)
        return None
    try:
        import openpyxl
    except ImportError:
        print("3.2 SKIP: openpyxl tidak terpasang", file=sys.stderr)
        return None

    sheet = openpyxl.load_workbook(FIGSHARE_XLSX, read_only=True, data_only=True)[
        "Sheet 1"
    ]
    # Baris 4 = header, kolom peak pressure ada di 2, 4, 6, 8, 10.
    peaks = []
    regions = set()
    participants = set()
    for row in sheet.iter_rows(min_row=5, values_only=True):
        if row[0] is not None:
            participants.add(row[0])
        if row[1] is not None:
            regions.add(row[1])
        for index in (2, 4, 6, 8, 10):
            value = row[index]
            if isinstance(value, (int, float)):
                peaks.append(float(value))
    if not peaks:
        print("3.2 SKIP: tidak ada nilai peak pressure", file=sys.stderr)
        return None
    return {
        "participants": len(participants),
        "regions": len(regions),
        "measurements": len(peaks),
        "median_kpa": statistics.median(peaks),
        "max_kpa": max(peaks),
        "at_or_above_warning_pct": 100.0 * sum(p >= WARNING_KPA for p in peaks) / len(peaks),
        "at_or_above_danger_pct": 100.0 * sum(p >= DANGER_KPA for p in peaks) / len(peaks),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=0, help="batasi jumlah rekaman")
    args = parser.parse_args()

    print("=== 3.1 OptiTrack v2 — pola 3 region saat gait ===")
    gait = check_optitrack(args.limit)
    if gait:
        print(f"rekaman            : {gait['recordings']}")
        print(f"fase tumpu         : {gait['steps']}")
        print(f"heel sebelum fore  : {gait['heel_before_forefoot_pct']:.1f}%")
        print(f"heel<mid<fore      : {gait['heel_mid_fore_pct']:.1f}%")
        print(
            "porsi beban F/M/H  : "
            + " / ".join(f"{x:.1f}%" for x in gait["load_share_pct"])
        )

    print()
    print("=== 3.2 Figshare DFU — ambang klinis vs puncak tekanan nyata ===")
    dfu = check_figshare()
    if dfu:
        print(f"partisipan         : {dfu['participants']}")
        print(f"region             : {dfu['regions']}")
        print(f"pengukuran         : {dfu['measurements']}")
        print(f"median puncak      : {dfu['median_kpa']:.1f} kPa")
        print(f"puncak tertinggi   : {dfu['max_kpa']:.1f} kPa")
        print(f">= {WARNING_KPA:.0f} kPa        : {dfu['at_or_above_warning_pct']:.1f}%")
        print(f">= {DANGER_KPA:.0f} kPa        : {dfu['at_or_above_danger_pct']:.1f}%")

    return 0 if (gait or dfu) else 1


if __name__ == "__main__":
    raise SystemExit(main())
