#!/usr/bin/env python3
"""
prepare-dataset.py — DFN-DS -> training-data.json

Fase 1 dari roadmap: parse 135 file .xls pasien diabetes, agregasi
8 sensor/kaki -> 3 region (forefoot/midfoot/heel), ekstrak fitur
(peakPressure + sustainedDuration) per timestep, label per grup
(DFN -> danger, DM -> safe/warning), split 80/20 per patient.

Kalibrasi kuantil (data-driven, bukan asumsi manual):
    - p75 dari semua peak values -> dipetakan ke 35 kPa (warning threshold)
    - p90 dari semua peak values -> dipetakan ke 70 kPa (danger threshold)
    - Semua peak values diskalakan linear agar threshold kuantil
      cocok dengan threshold klinis existing di app.

Mapping sensor (8 FSR per kaki, urutan anatomis):
    L1-L3 / R1-R3 -> forefoot (hallux + metatarsal)
    L4-L5 / R4-R5 -> midfoot (arch)
    L6-L8 / R6-R8 -> heel (calcaneus + lateral)
Per region: ambil mean sensor; per timestep: ambil max kedua kaki
(konservatif — kaki berisik lebih tinggi yang dipantau).

Sampling: setiap baris ke-10 (efektif 10Hz) untuk ukuran wajar.
Split per patient (bukan per baris) agar tidak bocor.
"""

import json
import sys
from pathlib import Path

import openpyxl
import xlrd

# ---------------------------------------------------------------- config ---
DATASET_DIR = Path(__file__).resolve().parents[1] / "datasets" / "dfn-ds"
XLS_DIR = DATASET_DIR / "DFN-DS" / "total_plantar_dataset"
META_FILE = DATASET_DIR / "final_135_5_total_info.xlsx"
OUTPUT = Path(__file__).resolve().parents[1] / "models" / "training-data.json"

SAMPLE_EVERY = 10          # 100Hz -> 10Hz
WARNING_KPA = 35.0         # sesuai RISK_THRESHOLDS
DANGER_KPA = 70.0          # sesuai RISK_THRESHOLDS
WARNING_SECONDS = 5        # durasi tumpuan > 5s -> warning (DM); class weighting di Fase 2

# ------------------------------------------------------------- metadata ------
def load_metadata():
    """-> {patient_id: {label: 'DFN'|'DM', age, sex, duration, bmi}}"""
    wb = openpyxl.load_workbook(META_FILE, read_only=True)
    ws = wb[wb.sheetnames[0]]
    meta = {}
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue  # header
        pid = str(row[0])
        meta[pid] = {
            "label": str(row[4]).strip(),   # DFN / DM
            "age": row[2],
            "sex": row[1],
            "duration_min": row[3],
            "bmi": row[5],
        }
    wb.close()
    return meta

# ---------------------------------------------------------------- series -----
def region_pressures(left, right):
    """8 sensor per kaki -> 3 region per kaki (mean)."""
    forefoot = (left[0] + left[1] + left[2]) / 3
    midfoot = (left[3] + left[4]) / 2
    heel = (left[5] + left[6] + left[7]) / 3
    forefoot_r = (right[0] + right[1] + right[2]) / 3
    midfoot_r = (right[3] + right[4]) / 2
    heel_r = (right[5] + right[6] + right[7]) / 3
    return forefoot, midfoot, heel, forefoot_r, midfoot_r, heel_r

def parse_xls(path):
    """-> list of raw region values per timestep, sampled."""
    wb = xlrd.open_workbook(path)
    sh = wb.sheet_by_index(0)
    samples = []
    for r in range(1, sh.nrows):
        if r % SAMPLE_EVERY != 0:
            continue
        row = [float(sh.cell_value(r, c)) for c in range(1, 17)]
        left, right = row[0:8], row[8:16]
        f, m, h, fr, mr, hr = region_pressures(left, right)
        forefoot = max(f, fr)
        midfoot = max(m, mr)
        heel = max(h, hr)
        samples.append({
            "peak": round(max(forefoot, midfoot, heel), 2),
            "forefoot": round(forefoot, 2),
            "midfoot": round(midfoot, 2),
            "heel": round(heel, 2),
        })
    return samples

# ----------------------------------------------------------------- label ----
def label_samples(samples, group):
    """
    Label per-sample: safe atau warning saja.
    Danger di-handle rule-based terpisah (peak >= 70 kPa AND sustained >= 0.1s).
    
    Hybrid approach: RF classifier untuk safe/warning boundary,
    clinical rule untuk danger (data DFN-DS hanya punya 31 danger samples).
    """
    labeled = []
    for s in samples:
        if s["peak"] >= 35 or s["sustained"] >= 200:
            level = "warning"
        else:
            level = "safe"
        labeled.append({**s, "level": level})
    return labeled

# ------------------------------------------------------------------- main ---
def main():
    print(f"Loading metadata: {META_FILE.name}")
    meta = load_metadata()
    print(f"  {len(meta)} patients")

    # ---- pass 1: parse semua, kumpulkan peak values ----
    all_data = []
    all_peaks = []
    for pid, info in meta.items():
        xls = XLS_DIR / f"{pid}.xls"
        if not xls.exists():
            print(f"  skip {pid}: no file")
            continue
        samples = parse_xls(xls)
        all_data.append({
            "patient": pid,
            "group": info["label"],
            "meta": info,
            "samples": samples,
        })
        all_peaks.extend(s["peak"] for s in samples)

    total = sum(len(d["samples"]) for d in all_data)
    n_dfn = sum(1 for d in all_data if d["group"] == "DFN")
    print(f"  {len(all_data)} parsed ({n_dfn} DFN), {total} samples")

    # ---- kalibrasi kuantil ----
    all_peaks.sort()
    n = len(all_peaks)
    p75_raw = all_peaks[int(n * 0.75)]
    p90_raw = all_peaks[int(n * 0.90)]
    scale = WARNING_KPA / p75_raw  # p75 -> 35 kPa
    print(f"  p75 raw = {p75_raw:.2f} -> {WARNING_KPA} kPa (scale {scale:.2f}x)")
    print(f"  p90 raw = {p90_raw:.2f} -> {p90_raw * scale:.1f} kPa")

    # ---- pass 2: hitung sustained dengan threshold kuantil, scale, label ----
    for d in all_data:
        sustained = 0
        for s in d["samples"]:
            sustained = sustained + 1 if s["peak"] >= p75_raw else 0
            s["sustained"] = sustained
            s["peak"] = round(s["peak"] * scale, 2)
            s["forefoot"] = round(s["forefoot"] * scale, 2)
            s["midfoot"] = round(s["midfoot"] * scale, 2)
            s["heel"] = round(s["heel"] * scale, 2)
        d["samples"] = label_samples(d["samples"], d["group"])

    # ---- split per patient: 80% train, 20% validation ----
    dfn = sorted([d for d in all_data if d["group"] == "DFN"], key=lambda d: int(d["patient"]))
    dm = sorted([d for d in all_data if d["group"] == "DM"], key=lambda d: int(d["patient"]))
    split_at = lambda lst: int(len(lst) * 0.8)
    train_patients = dfn[:split_at(dfn)] + dm[:split_at(dm)]
    val_patients = dfn[split_at(dfn):] + dm[split_at(dm):]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump({
            "version": "1.1",
            "source": "DFN-DS (Zenodo MSSDA)",
            "calibration": {
                "method": "quantile",
                "p75_raw": round(p75_raw, 2),
                "p90_raw": round(p90_raw, 2),
                "scale_factor": round(scale, 4),
                "warning_kpa": WARNING_KPA,
                "danger_kpa": DANGER_KPA,
            },
            "features": ["peak", "sustained", "forefoot", "midfoot", "heel"],
            "levels": ["safe", "warning", "danger"],
            "thresholds": {"warningKpa": WARNING_KPA, "warningSeconds": WARNING_SECONDS},
            "train": train_patients,
            "validation": val_patients,
        }, f)

    size_mb = OUTPUT.stat().st_size / 1e6
    print(f"  -> {OUTPUT}")
    print(f"  train: {len(train_patients)} patients, val: {len(val_patients)} patients")
    print(f"  size: {size_mb:.1f} MB")

if __name__ == "__main__":
    sys.exit(main())
