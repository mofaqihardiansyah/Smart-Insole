#!/usr/bin/env python3
"""
prepare-dataset.py — DFN-DS -> training-data.json

Fase 1 dari roadmap: parse 135 file .xls pasien diabetes, agregasi
8 sensor/kaki -> 3 region (forefoot/midfoot/heel), ekstrak fitur
(peakPressure + sustainedDuration) per timestep, lalu beri label dua kelas.

Dua konstanta yang berbeda dan tidak boleh dicampur:

    CALIBRATION_ANCHOR_KPA — jangkar skala. p75 dari seluruh peak mentah
        dipetakan ke 35 kPa. Ini hanya mendefinisikan arti "kPa" pada data,
        bukan keputusan klinis; mengubahnya menggeser seluruh dataset.
    WARNING_KPA — batas operasional Aman/Waspada. Sampel berlabel `warning`
        bila peak >= 45 kPa.

Aturan label (satu baris, dipakai semua lapisan):

    warning  <=>  peak >= 45 kPa
    safe     <=>  peak <  45 kPa

Durasi TIDAK masuk aturan label. DFN-DS adalah rekaman berjalan: run
terpanjang di atas 45 kPa hanya 13 sampel (1,3 detik), jadi syarat
"sustained >= 5 detik" akan menghasilkan nol sampel positif. `sustained`
tetap dihitung dan disimpan sebagai fitur, bukan sebagai penentu label.

Split latih/validasi per patient dihapus: seluruh 135 pasien menjadi data
latih, dan satu-satunya data uji adalah subjek baru yang diukur sendiri.

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
CALIBRATION_ANCHOR_KPA = 35.0  # p75 mentah -> 35 kPa; jangkar skala, tetap
WARNING_KPA = 45.0         # batas Aman/Waspada; label = peak >= nilai ini

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
def label_samples(samples):
    """
    Label per-sample: safe atau warning saja.

    Aturan: peak >= WARNING_KPA (45 kPa) -> warning, selain itu safe.
    Grup DFN/DM tidak dipakai, dan durasi tidak dipakai (lihat docstring
    modul: run terpanjang di DFN-DS 1,3 detik).
    """
    labeled = []
    for s in samples:
        level = "warning" if s["peak"] >= WARNING_KPA else "safe"
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

    # ---- kalibrasi kuantil (jangkar tetap: p75 mentah -> 35 kPa) ----
    all_peaks.sort()
    n = len(all_peaks)
    p75_raw = all_peaks[int(n * 0.75)]
    p90_raw = all_peaks[int(n * 0.90)]
    scale = CALIBRATION_ANCHOR_KPA / p75_raw  # p75 mentah -> 35 kPa
    print(f"  p75 raw = {p75_raw:.2f} -> {CALIBRATION_ANCHOR_KPA} kPa (scale {scale:.2f}x)")
    print(f"  p90 raw = {p90_raw:.2f} -> {p90_raw * scale:.1f} kPa")

    # ---- pass 2: skala ke kPa, hitung sustained di atas WARNING_KPA, label ----
    for d in all_data:
        for s in d["samples"]:
            s["peak"] = round(s["peak"] * scale, 2)
            s["forefoot"] = round(s["forefoot"] * scale, 2)
            s["midfoot"] = round(s["midfoot"] * scale, 2)
            s["heel"] = round(s["heel"] * scale, 2)
        sustained = 0
        for s in d["samples"]:
            sustained = sustained + 1 if s["peak"] >= WARNING_KPA else 0
            s["sustained"] = sustained
        d["samples"] = label_samples(d["samples"])

    patients = sorted(all_data, key=lambda d: int(d["patient"]))

    # ---- laporan distribusi ----
    counts = {"safe": 0, "warning": 0}
    patients_with_warning = 0
    longest_run = 0
    stale = 0
    for d in patients:
        has_warning = False
        for s in d["samples"]:
            counts[s["level"]] += 1
            has_warning = has_warning or s["level"] == "warning"
            longest_run = max(longest_run, s["sustained"])
            # label harus konsisten dengan aturan, bukan sisa aturan lama
            expected = "warning" if s["peak"] >= WARNING_KPA else "safe"
            stale += 1 if s["level"] != expected else 0
        patients_with_warning += 1 if has_warning else 0
    n_samples = counts["safe"] + counts["warning"]
    print(f"  label warning : {counts['warning']} / {n_samples} "
          f"({100 * counts['warning'] / n_samples:.1f}%), "
          f"{patients_with_warning}/{len(patients)} pasien")
    print(f"  label safe    : {counts['safe']} / {n_samples} "
          f"({100 * counts['safe'] / n_samples:.1f}%)")
    print(f"  rasio         : {counts['safe'] / counts['warning']:.1f} : 1")
    print(f"  run >={WARNING_KPA:.0f} kPa terpanjang: {longest_run} sampel "
          f"({longest_run / 10:.1f} s pada 10 Hz)")
    print(f"  label tidak konsisten dengan aturan: {stale}")
    if stale:
        raise SystemExit("label lama masih tersisa; perbaiki aturan sebelum menulis")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump({
            "version": "2.0",
            "source": "DFN-DS (Zenodo MSSDA)",
            "calibration": {
                "method": "quantile",
                "anchorKpa": CALIBRATION_ANCHOR_KPA,
                "p75_raw": round(p75_raw, 2),
                "p90_raw": round(p90_raw, 2),
                "scale_factor": round(scale, 4),
            },
            "labelRule": {
                "warningKpa": WARNING_KPA,
                "expression": "peak >= warningKpa",
                "durationUsed": False,
            },
            "features": ["peak", "sustained", "forefoot", "midfoot", "heel"],
            "levels": ["safe", "warning"],
            "patients": patients,
        }, f)

    size_mb = OUTPUT.stat().st_size / 1e6
    print(f"  -> {OUTPUT}")
    print(f"  {len(patients)} patients, tanpa split validasi (uji = subjek baru)")
    print(f"  size: {size_mb:.1f} MB")

if __name__ == "__main__":
    sys.exit(main())
