#!/usr/bin/env python3
"""
prepare-session-dataset.py — DFN-DS -> one row per patient (session level).

Fase 0 dari rencana "Bentuk 2": model kedua yang membaca *pola tekanan satu
sesi* dan memperkirakan apakah kaki itu neuropatik (DFN) atau diabetik tanpa
neuropati (DM). Model per sampel (`peak`/`sustained` -> safe/warning) tidak
disentuh.

Kenapa level sesi: label DFN/DM hanya ada per pasien, bukan per sampel. Melatih
per sampel dengan label pasien berarti menyalin label yang sama 600 kali dan
menggelembungkan n — itu tautologi baru dengan angka yang terlihat bagus.
Satu pasien = satu baris, jadi 135 baris dan tidak ada kebocoran antar-split.

Input : models/training-data.json  (hasil scripts/prepare-dataset.py)
Output: models/session-dataset.json

Sampel di training-data.json sudah berupa 3 region (forefoot/midfoot/heel)
hasil `region_pressures()` di prepare-dataset.py. Memakai file itu, bukan XLSX
mentah, menjamin definisi region yang sama persis dengan model per sampel.

Jalankan: python3 scripts/prepare-session-dataset.py
"""

import json
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "models" / "training-data.json"
OUTPUT_FILE = ROOT / "models" / "session-dataset.json"

ZONES = ("forefoot", "midfoot", "heel")

# Fitur sengaja dibatasi pada besaran yang bisa dihitung dari tiga zona insole
# (forefoot, midfoot, heel) dalam satu jendela waktu. Asimetri kiri-kanan tidak
# dipakai: prepare-dataset.py mengambil max(left, right) per region, jadi
# informasinya sudah hilang sebelum sampai ke sini.
FEATURES = [
    "ff_mean", "mf_mean", "hf_mean",
    "ff_max", "mf_max", "hf_max",
    "ff_std", "mf_std", "hf_std",
    "ff_hi35", "mf_hi35", "hf_hi35",
    "peak_mean", "peak_std",
    "contact_frac",
    "ff_hf_ratio", "mf_peak_ratio",
]

HIGH_KPA = 35.0   # ambang waspada yang dipakai sistem
CONTACT_KPA = 5.0  # di atas ini kaki dianggap menyentuh alas


def _num(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _zone_prefix(zone):
    return {"forefoot": "ff", "midfoot": "mf", "heel": "hf"}[zone]


def _ratio(numerator, denominator):
    """Rasio yang tidak meledak saat penyebut mendekati nol."""
    return (numerator + 1.0) / (denominator + 1.0)


def session_features(samples):
    if not samples:
        raise ValueError("sesi tanpa sampel")

    out = {}
    for zone in ZONES:
        prefix = _zone_prefix(zone)
        values = [s[zone] for s in samples]
        out[f"{prefix}_mean"] = statistics.fmean(values)
        out[f"{prefix}_max"] = max(values)
        out[f"{prefix}_std"] = statistics.pstdev(values)
        out[f"{prefix}_hi35"] = sum(1 for v in values if v >= HIGH_KPA) / len(values)

    peaks = [s["peak"] for s in samples]
    out["peak_mean"] = statistics.fmean(peaks)
    out["peak_std"] = statistics.pstdev(peaks)
    out["contact_frac"] = sum(1 for p in peaks if p > CONTACT_KPA) / len(peaks)
    out["ff_hf_ratio"] = _ratio(out["ff_mean"], out["hf_mean"])
    out["mf_peak_ratio"] = _ratio(out["mf_mean"], out["peak_mean"])

    return {name: round(out[name], 6) for name in FEATURES}


def main():
    data = json.loads(DATA_FILE.read_text())
    print(f"Loading {DATA_FILE.name}: {len(data['train'])} train, {len(data['validation'])} validation patients")

    sessions = []
    seen = set()
    for split in ("train", "validation"):
        for patient in data[split]:
            key = (patient["group"], str(patient["patient"]))
            if key in seen:
                raise SystemExit(
                    f"Duplicate patient id {key}: the 80/20 split is no longer per patient, "
                    "which would leak a patient across folds."
                )
            seen.add(key)
            sessions.append({
                "id": f"{patient['group']}-{patient['patient']}",
                "group": patient["group"],
                "split": split,
                "sampleCount": len(patient["samples"]),
                "features": session_features(patient["samples"]),
                # Kept only as a positive control in the trainer: if a model
                # built from age/BMI/diabetes duration cannot separate the
                # groups either, the pipeline is broken rather than the
                # pressure being uninformative.
                "meta": {
                    "age": _num(patient["meta"].get("age")),
                    "sex": 1.0 if str(patient["meta"].get("sex", "")).upper().startswith("M") else 0.0,
                    "diabetesYears": _num(patient["meta"].get("duration_min")),
                    "bmi": _num(patient["meta"].get("bmi")),
                },
            })

    sessions.sort(key=lambda s: (s["group"], int(s["id"].split("-")[1])))

    counts = {}
    for s in sessions:
        counts[s["group"]] = counts.get(s["group"], 0) + 1

    payload = {
        "version": "1.0",
        "source": data["source"],
        "datasetVersion": data["version"],
        "features": FEATURES,
        "labels": ["DM", "DFN"],
        "labelMeaning": (
            "group from the DFN-DS metadata: DFN = diabetic foot with neuropathy, "
            "DM = diabetes without neuropathy"
        ),
        "grain": "one row per patient session",
        "preparedBy": "scripts/prepare-session-dataset.py",
        "sessions": sessions,
    }
    OUTPUT_FILE.write_text(json.dumps(payload, indent=1) + "\n")

    print(f"  sessions: {len(sessions)}  ({', '.join(f'{k}={v}' for k, v in sorted(counts.items()))})")
    print(f"  features: {len(FEATURES)}")
    print(f"  sample count per session: {sorted({s['sampleCount'] for s in sessions})}")
    print(f"Output: {OUTPUT_FILE} ({OUTPUT_FILE.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
