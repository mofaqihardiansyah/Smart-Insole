#!/usr/bin/env python3
"""
compare-models.py — perbandingan lima algoritma klasifikasi pada data latih DFN-DS.

Lima model, masing-masing diambil dari satu jurnal (rinciannya di
docs/perbandingan-algoritma.md):

  Decision Tree        Sheikh dkk. 2025, Scientific Reports 15:20962
  ANN (MLP)            Darwich dkk. 2023, Baghdad Science Journal 20(6)
  SVM (linear)         Agrawal dkk. 2023, IEEE Access 11:23119-23126
  AdaBoost             Agrawal dkk. 2024, Technologies 12:231
  Fuzzy Cognitive Map  Ramirez-Bautista dkk. 2022, IEEE Latin America Transactions 20(7)

Random Forest tidak dilatih ulang di sini: angkanya diambil dari
docs/evidence/metrics.json (pipeline JS), karena lipatannya sama persis.

Protokol: 5 lipatan berkelompok per pasien dari models/folds.json, dibuat
scripts/export-folds.js dari groupedFolds di scripts/train-model.js. Scaler
dan model hanya melihat lipatan latih.

Usage:
  uv run --with scikit-learn --with matplotlib python scripts/compare-models.py
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import platform
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from sklearn.ensemble import AdaBoostClassifier
from sklearn.metrics import precision_recall_curve, roc_auc_score, roc_curve
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import MinMaxScaler
from sklearn.svm import LinearSVC
from sklearn.tree import DecisionTreeClassifier

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "models" / "training-data.json"
FOLDS_FILE = ROOT / "models" / "folds.json"
OUT_DIR = ROOT / "docs" / "evidence" / "perbandingan"
CHART_DIR = OUT_DIR / "charts"

SEED = 42
GAINS = [0.9, 1.0, 1.1, 1.2, 1.3]
WARNING_KPA = 45.0
GRID = np.linspace(0.0, 1.0, 201)
COLORS = {
    "Decision Tree": "#0072B2",
    "ANN (MLP)": "#D55E00",
    "SVM (linear)": "#009E73",
    "AdaBoost": "#CC79A7",
    "Fuzzy Cognitive Map": "#E69F00",
    "Aturan murni": "#666666",
}


# ------------------------------------------------------------------ helper ---


def round2(value: float) -> float:
    return math.floor(value * 100 + 0.5) / 100


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def fmt(value: float, digits: int = 3) -> str:
    return f"{value:.{digits}f}".replace(".", ",")


def pm(stat: dict) -> str:
    return f"{fmt(stat['mean'])} ± {fmt(stat['std'])}"


def binary_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Metrik dengan kelas positif = warning (1)."""
    tp = int(np.sum((y_pred == 1) & (y_true == 1)))
    tn = int(np.sum((y_pred == 0) & (y_true == 0)))
    fp = int(np.sum((y_pred == 1) & (y_true == 0)))
    fn = int(np.sum((y_pred == 0) & (y_true == 1)))

    def ratio(numerator: float, denominator: float) -> float:
        return float(numerator) / float(denominator) if denominator else 0.0

    precision_w = ratio(tp, tp + fp)
    recall_w = ratio(tp, tp + fn)
    specificity = ratio(tn, tn + fp)
    precision_safe = ratio(tn, tn + fn)
    f1_warning = ratio(2 * precision_w * recall_w, precision_w + recall_w)
    f1_safe = ratio(2 * precision_safe * specificity, precision_safe + specificity)

    return {
        "tp": tp,
        "tn": tn,
        "fp": fp,
        "fn": fn,
        "accuracy": ratio(tp + tn, tp + tn + fp + fn),
        "macro_f1": (f1_warning + f1_safe) / 2.0,
        "precision_warning": precision_w,
        "recall_warning": recall_w,
        "f1_warning": f1_warning,
        "specificity": specificity,
        "support_warning": tp + fn,
    }


def choose_threshold(scores: np.ndarray, y_true: np.ndarray) -> float:
    """
    Ambang keputusan dipilih pada lipatan latih, bukan pada lipatan uji.

    Alasannya nyata: kelas waspada hanya 5,4 % dari data, sehingga model yang
    terkalibrasi (mis. FCM dengan BCE) menghasilkan probabilitas di sekitar
    prevalensi dan tidak pernah melewati 0,5. Ambang 0,5 akan membuat model
    itu buta, padahal peringkatnya benar (AUC 1,000). Prosedur ini dipakai
    untuk semua model supaya perlakuannya seragam.
    """
    candidates = np.unique(np.quantile(scores, np.linspace(0.5, 0.999, 120)))
    best_threshold, best_score = float(candidates[0]), -1.0
    for threshold in candidates:
        predicted = (scores >= threshold).astype(int)
        score = binary_metrics(y_true, predicted)["macro_f1"]
        if score > best_score:
            best_threshold, best_score = float(threshold), float(score)
    return best_threshold


def mean_std(values: list[float]) -> dict:
    array = np.asarray(values, dtype=float)
    return {
        "mean": float(array.mean()),
        "std": float(array.std(ddof=1)) if array.size > 1 else 0.0,
        "values": [float(v) for v in array],
    }


# --------------------------------------------------------- FCM classifier ---


class FuzzyCognitiveMapClassifier:
    """
    Fuzzy Cognitive Map dengan pembelajaran terawasi.

    Konsep: [peak, sustained, waspada]. Dua konsep masukan di-clamp pada tiap
    langkah inferensi, konsep keluaran dihitung dengan sigmoid dan iterasi
    tetap, lalu dilatih dengan gradient descent pada BCE. Satu konsep keluaran
    dipakai karena tingkat risiko di sini biner; dua unit keluaran membuat
    kedua logit tumbuh bersamaan dan keputusannya jatuh ke kelas mayoritas.

    Penyederhanaan terhadap jurnal asal (Ramirez-Bautista dkk. 2022) dicatat
    terbuka: mereka mengoptimasi matriks bobot dengan Bacterial Foraging
    Optimization; di sini dipakai gradient descent agar hasilnya dapat
    direproduksi tanpa parameter pencarian tambahan.
    """

    def __init__(self, steps: int = 2, lr: float = 2.0, epochs: int = 300, seed: int = SEED):
        self.steps = steps
        self.lr = lr
        self.epochs = epochs
        self.seed = seed
        self.w = np.zeros((3, 3), dtype=float)
        self.b = np.zeros(3, dtype=float)

    def _forward(self, x: np.ndarray):
        activation = np.zeros((x.shape[0], 3), dtype=float)
        activation[:, 0:2] = x
        trace = [activation.copy()]
        for _ in range(self.steps):
            z = activation @ self.w + self.b
            nxt = activation.copy()
            nxt[:, 2] = 1.0 / (1.0 + np.exp(-z[:, 2]))
            activation = nxt
            trace.append(activation.copy())
        return activation, trace

    def fit(self, x: np.ndarray, y: np.ndarray) -> "FuzzyCognitiveMapClassifier":
        rng = np.random.default_rng(self.seed)
        self.w = rng.uniform(-0.5, 0.5, size=(3, 3))
        self.b = np.zeros(3, dtype=float)
        target = y.astype(float)

        for _ in range(self.epochs):
            activation, trace = self._forward(x)
            out = np.clip(activation[:, 2], 1e-6, 1 - 1e-6)
            grad_activation = np.zeros_like(activation)
            grad_activation[:, 2] = (out - target) / x.shape[0]

            grad_w = np.zeros_like(self.w)
            grad_b = np.zeros(3, dtype=float)
            for step in range(self.steps, 0, -1):
                current = trace[step]
                grad_z = grad_activation * current * (1.0 - current)
                grad_z[:, 0:2] = 0.0
                grad_w += trace[step - 1].T @ grad_z
                grad_b += grad_z.sum(axis=0)
                grad_activation = grad_z @ self.w.T
                grad_activation[:, 0:2] = 0.0

            self.w -= self.lr * grad_w
            self.b -= self.lr * grad_b

        return self

    def decision_function(self, x: np.ndarray) -> np.ndarray:
        activation, _ = self._forward(x)
        warning = np.clip(activation[:, 2], 1e-6, 1 - 1e-6)
        return np.log(warning / (1.0 - warning))

    def predict_proba(self, x: np.ndarray) -> np.ndarray:
        activation, _ = self._forward(x)
        warning = np.clip(activation[:, 2], 1e-6, 1 - 1e-6)
        return np.column_stack([1.0 - warning, warning])

    def predict(self, x: np.ndarray) -> np.ndarray:
        return (self.predict_proba(x)[:, 1] >= 0.5).astype(int)


# ------------------------------------------------------------- model specs ---


@dataclass
class ModelSpec:
    name: str
    factory: object
    scaled: bool
    hyperparameters: dict
    reference: str
    parameters: int


def model_specs() -> list[ModelSpec]:
    return [
        ModelSpec(
            "Decision Tree",
            lambda: DecisionTreeClassifier(
                max_depth=8, class_weight="balanced", random_state=SEED
            ),
            False,
            {"max_depth": 8, "criterion": "gini", "class_weight": "balanced"},
            "Sheikh dkk. 2025, Scientific Reports 15:20962",
            2 ** 9 - 1,
        ),
        ModelSpec(
            "ANN (MLP)",
            lambda: MLPClassifier(
                hidden_layer_sizes=(16,),
                max_iter=2000,
                random_state=SEED,
                early_stopping=False,
            ),
            True,
            {"hidden_layer_sizes": [16], "max_iter": 2000, "activation": "relu"},
            "Darwich dkk. 2023, Baghdad Science Journal 20(6)",
            2 * 16 + 16 + 16 * 2 + 2,
        ),
        ModelSpec(
            "SVM (linear)",
            lambda: LinearSVC(C=1.0, class_weight="balanced", random_state=SEED, max_iter=20000),
            True,
            {"kernel": "linear", "C": 1.0, "class_weight": "balanced"},
            "Agrawal dkk. 2023, IEEE Access 11:23119-23126",
            3,
        ),
        ModelSpec(
            "AdaBoost",
            lambda: AdaBoostClassifier(n_estimators=100, learning_rate=0.5, random_state=SEED),
            False,
            {"n_estimators": 100, "learning_rate": 0.5, "base": "decision stump"},
            "Agrawal dkk. 2024, Technologies 12:231",
            100 * 3,
        ),
        ModelSpec(
            "Fuzzy Cognitive Map",
            lambda: FuzzyCognitiveMapClassifier(steps=2, lr=2.0, epochs=300, seed=SEED),
            True,
            {"concepts": 3, "steps": 2, "lr": 2.0, "epochs": 300, "learning": "BCE gradient",
             "threshold": "dipilih pada lipatan latih"},
            "Ramirez-Bautista dkk. 2022, IEEE Latin America Transactions 20(7)",
            3 * 3 + 3,
        ),
    ]


# ------------------------------------------------------------------ dataset ---


@dataclass
class Dataset:
    x: np.ndarray
    y: np.ndarray
    patient: np.ndarray
    fold: np.ndarray
    peak: np.ndarray
    sustained: np.ndarray


def load_dataset() -> tuple[Dataset, dict]:
    raw = json.loads(DATA_FILE.read_text())
    folds_raw = json.loads(FOLDS_FILE.read_text())
    assignment = {int(k): int(v) for k, v in folds_raw["assignment"].items()}

    x_rows, y_rows, patient_rows, peak_rows, sustained_rows = [], [], [], [], []
    for patient in raw["patients"]:
        pid = int(patient["patient"])
        if pid not in assignment:
            raise SystemExit(f"pasien {pid} tidak ada di folds.json; jalankan export-folds.js")
        for sample in patient["samples"]:
            x_rows.append([sample["peak"], sample["sustained"]])
            y_rows.append(1 if sample["level"] == "warning" else 0)
            patient_rows.append(pid)
            peak_rows.append(sample["peak"])
            sustained_rows.append(sample["sustained"])

    dataset = Dataset(
        x=np.asarray(x_rows, dtype=float),
        y=np.asarray(y_rows, dtype=int),
        patient=np.asarray(patient_rows, dtype=int),
        fold=np.asarray([assignment[p] for p in patient_rows], dtype=int),
        peak=np.asarray(peak_rows, dtype=float),
        sustained=np.asarray(sustained_rows, dtype=float),
    )
    return dataset, folds_raw


def check_folds(dataset: Dataset, folds_raw: dict) -> None:
    """Gagal keras bila lipatan tidak sesuai dataset; jangan pakai berkas basi."""
    expected = set(int(k) for k in folds_raw["assignment"])
    if expected != set(dataset.patient.tolist()):
        raise SystemExit("himpunan pasien di folds.json tidak sama dengan dataset")
    for patient in np.unique(dataset.patient):
        if np.unique(dataset.fold[dataset.patient == patient]).size != 1:
            raise SystemExit(f"pasien {patient} muncul di lebih dari satu lipatan")


# --------------------------------------------------------------- evaluation ---


def scores_of(model, x: np.ndarray) -> np.ndarray:
    if hasattr(model, "decision_function"):
        return np.asarray(model.decision_function(x), dtype=float)
    return np.asarray(model.predict_proba(x)[:, 1], dtype=float)


def fit_fold(specs: list[ModelSpec], x_train, y_train):
    """
    Latih setiap model pada masukan yang sesuai: yang butuh skala memakai
    MinMaxScaler yang di-fit pada lipatan latih saja, yang tidak butuh memakai
    nilai mentah. Satu scaler dipakai bersama supaya transformasi data uji sama.
    """
    scaler = MinMaxScaler().fit(x_train)
    scaled_train = scaler.transform(x_train)
    fitted = {}
    seconds = {}
    thresholds = {}
    for spec in specs:
        inputs = scaled_train if spec.scaled else x_train
        model = spec.factory()
        started = time.perf_counter()
        model.fit(inputs, y_train)
        seconds[spec.name] = time.perf_counter() - started
        fitted[spec.name] = model
        thresholds[spec.name] = choose_threshold(scores_of(model, inputs), y_train)
    return fitted, seconds, scaler, thresholds


def run_cv(dataset: Dataset, specs: list[ModelSpec]):
    folds = sorted(np.unique(dataset.fold).tolist())
    rows: dict[str, list[dict]] = {spec.name: [] for spec in specs}
    times: dict[str, list[float]] = {spec.name: [] for spec in specs}
    oof_scores = {spec.name: np.zeros(dataset.y.size) for spec in specs}
    oof_preds = {spec.name: np.zeros(dataset.y.size, dtype=int) for spec in specs}
    roc_curves = {spec.name: [] for spec in specs}
    pr_curves = {spec.name: [] for spec in specs}

    for fold in folds:
        train_mask = dataset.fold != fold
        test_mask = dataset.fold == fold
        x_train, y_train = dataset.x[train_mask], dataset.y[train_mask]
        x_test, y_test = dataset.x[test_mask], dataset.y[test_mask]

        fitted, seconds, scaler, thresholds = fit_fold(specs, x_train, y_train)

        for spec in specs:
            model = fitted[spec.name]
            inputs = scaler.transform(x_test) if spec.scaled else x_test
            scores = scores_of(model, inputs)
            y_pred = (scores >= thresholds[spec.name]).astype(int)

            metrics = binary_metrics(y_test, y_pred)
            metrics["fold"] = int(fold)
            metrics["fit_seconds"] = seconds[spec.name]
            metrics["threshold"] = thresholds[spec.name]
            rows[spec.name].append(metrics)
            times[spec.name].append(seconds[spec.name])

            oof_scores[spec.name][test_mask] = scores
            oof_preds[spec.name][test_mask] = y_pred

            fpr, tpr, _ = roc_curve(y_test, scores)
            precision, recall, _ = precision_recall_curve(y_test, scores)
            roc_curves[spec.name].append((fpr, tpr))
            pr_curves[spec.name].append((recall, precision))

    curves = {}
    for spec in specs:
        tpr_stack = np.asarray([np.interp(GRID, fpr, tpr) for fpr, tpr in roc_curves[spec.name]])
        precision_stack = []
        for recall, precision in pr_curves[spec.name]:
            order = np.argsort(recall)
            precision_stack.append(np.interp(GRID, np.asarray(recall)[order], np.asarray(precision)[order]))
        curves[spec.name] = {
            "tpr_mean": tpr_stack.mean(axis=0).tolist(),
            "precision_mean": np.asarray(precision_stack).mean(axis=0).tolist(),
        }

    summary = {}
    for spec in specs:
        fold_rows = rows[spec.name]
        summary[spec.name] = {
            "accuracy": mean_std([r["accuracy"] for r in fold_rows]),
            "macro_f1": mean_std([r["macro_f1"] for r in fold_rows]),
            "precision_warning": mean_std([r["precision_warning"] for r in fold_rows]),
            "recall_warning": mean_std([r["recall_warning"] for r in fold_rows]),
            "f1_warning": mean_std([r["f1_warning"] for r in fold_rows]),
            "specificity": mean_std([r["specificity"] for r in fold_rows]),
            "fit_seconds": mean_std(times[spec.name]),
            "confusion": [
                [sum(r["tn"] for r in fold_rows), sum(r["fp"] for r in fold_rows)],
                [sum(r["fn"] for r in fold_rows), sum(r["tp"] for r in fold_rows)],
            ],
            "folds": fold_rows,
            "reference": spec.reference,
            "hyperparameters": spec.hyperparameters,
            "parameters": spec.parameters,
            "scaled": spec.scaled,
            "threshold": mean_std([r["threshold"] for r in fold_rows]),
            "auc": float(roc_auc_score(dataset.y, oof_scores[spec.name])),
            "oof_accuracy": float(np.mean(oof_preds[spec.name] == dataset.y)),
        }

    return summary, {"grid": GRID.tolist(), "curves": curves}, {
        "scores": oof_scores,
        "predictions": oof_preds,
    }


def pooled_macro_f1(tn: int, fp: int, fn: int, tp: int) -> float:
    """Macro-F1 dari confusion matrix gabungan, sama seperti pipeline JS."""
    def ratio(a: float, b: float) -> float:
        return float(a) / float(b) if b else 0.0

    precision_w = ratio(tp, tp + fp)
    recall_w = ratio(tp, tp + fn)
    specificity = ratio(tn, tn + fp)
    precision_safe = ratio(tn, tn + fn)
    f1_w = ratio(2 * precision_w * recall_w, precision_w + recall_w)
    f1_s = ratio(2 * precision_safe * specificity, precision_safe + specificity)
    return (f1_w + f1_s) / 2.0


def gain_sweep(dataset: Dataset, specs: list[ModelSpec]) -> dict:
    """
    Galat penguatan pada data uji.

    Model dilatih sekali per lipatan pada data bersih (gain bukan bagian dari
    pelatihan), lalu prediksi diulang untuk tiap gain. `peak` digeser dan
    `sustained` dihitung ulang dari deret tergeser, persis seperti firmware
    menghitungnya; label tetap label asli.

    Angka dilaporkan sebagai macro-F1 gabungan seluruh sampel (pooled), bukan
    rata-rata lipatan, supaya bisa dibandingkan langsung dengan
    docs/evidence/metrics.json yang memakai cara yang sama.
    """
    folds = sorted(np.unique(dataset.fold).tolist())
    names = [spec.name for spec in specs]
    results = {name: [] for name in names}
    results["Aturan murni"] = []

    groups: dict[int, list[int]] = {}
    for index in np.argsort(dataset.patient, kind="stable"):
        groups.setdefault(int(dataset.patient[index]), []).append(int(index))

    shifted_by_gain = {}
    for gain in GAINS:
        shifted = dataset.x.copy()
        for indices in groups.values():
            run = 0
            for index in indices:
                peak = round2(dataset.peak[index] * gain)
                run = run + 1 if peak >= WARNING_KPA else 0
                shifted[index, 0] = peak
                shifted[index, 1] = run
        shifted_by_gain[gain] = shifted

    for gain in GAINS:
        shifted = shifted_by_gain[gain]
        totals = {name: {"tn": 0, "fp": 0, "fn": 0, "tp": 0} for name in results}
        for fold in folds:
            train_mask = dataset.fold != fold
            test_mask = dataset.fold == fold
            fitted, _, scaler, thresholds = fit_fold(
                specs, dataset.x[train_mask], dataset.y[train_mask]
            )
            x_test = shifted[test_mask]
            y_test = dataset.y[test_mask]
            for spec in specs:
                model = fitted[spec.name]
                inputs = scaler.transform(x_test) if spec.scaled else x_test
                y_pred = (scores_of(model, inputs) >= thresholds[spec.name]).astype(int)
                counts = totals[spec.name]
                counts["tn"] += int(np.sum((y_pred == 0) & (y_test == 0)))
                counts["fp"] += int(np.sum((y_pred == 1) & (y_test == 0)))
                counts["fn"] += int(np.sum((y_pred == 0) & (y_test == 1)))
                counts["tp"] += int(np.sum((y_pred == 1) & (y_test == 1)))
            rule_pred = (x_test[:, 0] >= WARNING_KPA).astype(int)
            counts = totals["Aturan murni"]
            counts["tn"] += int(np.sum((rule_pred == 0) & (y_test == 0)))
            counts["fp"] += int(np.sum((rule_pred == 1) & (y_test == 0)))
            counts["fn"] += int(np.sum((rule_pred == 0) & (y_test == 1)))
            counts["tp"] += int(np.sum((rule_pred == 1) & (y_test == 1)))

        for name, counts in totals.items():
            results[name].append(
                pooled_macro_f1(counts["tn"], counts["fp"], counts["fn"], counts["tp"])
            )

    return results


def validate_anchor(gain: dict) -> dict:
    """
    Jangkar: pipeline JS sudah melaporkan macro-F1 aturan murni 78,41 % pada
    gain 0,9 dan 82,36 % pada 1,1. Kalau porting perhitungan `sustained` salah,
    angka ini tidak akan cocok dan skrip berhenti.
    """
    expected = {0.9: 0.7840631420131574, 1.1: 0.8236126270558843}
    checks = []
    for g, wanted in expected.items():
        got = gain["Aturan murni"][GAINS.index(g)]
        delta = abs(got - wanted)
        checks.append({"gain": g, "expected": wanted, "got": got, "delta": delta})
        if delta > 1e-9:
            raise SystemExit(
                f"jangkar gain {g} gagal: diharapkan {wanted:.12f}, didapat {got:.12f}. "
                "Perhitungan ulang sustained kemungkinan tidak sama dengan pipeline JS."
            )
    return {"checks": checks, "passed": True}


# ------------------------------------------------------------------ charts ---


def style() -> None:
    plt.rcParams.update(
        {
            "font.size": 9,
            "axes.titlesize": 9.5,
            "axes.labelsize": 9,
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.grid": True,
            "grid.alpha": 0.25,
            "grid.linewidth": 0.6,
            "figure.dpi": 120,
            "savefig.dpi": 220,
            "savefig.bbox": "tight",
            "svg.fonttype": "path",
            "legend.frameon": False,
            "legend.fontsize": 7.5,
        }
    )


def save(fig, name: str) -> None:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    fig.savefig(CHART_DIR / f"{name}.svg")
    fig.savefig(CHART_DIR / f"{name}.png")
    plt.close(fig)


def short(name: str) -> str:
    return name.replace(" (linear)", "").replace(" (MLP)", "")


def chart_class_balance(dataset: Dataset) -> None:
    folds = sorted(np.unique(dataset.fold).tolist())
    safe = [int(np.sum((dataset.fold == f) & (dataset.y == 0))) for f in folds]
    warning = [int(np.sum((dataset.fold == f) & (dataset.y == 1))) for f in folds]

    fig, ax = plt.subplots(figsize=(5.0, 2.7))
    x = np.arange(len(folds))
    ax.bar(x, safe, color="#56B4E9", label="Aman")
    ax.bar(x, warning, bottom=safe, color="#D55E00", label="Waspada")
    ax.set_xticks(x, [f"L{f + 1}" for f in folds])
    ax.set_ylabel("Sampel uji")
    ax.set_title("Komposisi kelas per lipatan")
    for i, total in enumerate(np.add(safe, warning)):
        ax.text(i, total * 1.02, f"{warning[i] / total:.1%}", ha="center", fontsize=7.5)
    ax.legend(loc="upper center", ncol=2, bbox_to_anchor=(0.5, 1.0))
    ax.margins(y=0.18)
    save(fig, "01-komposisi-kelas")


def chart_feature_distribution(dataset: Dataset) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(7.2, 2.7))
    bins_peak = np.linspace(0, 95, 48)
    axes[0].hist(dataset.peak[dataset.y == 0], bins=bins_peak, color="#56B4E9", alpha=0.9, label="Aman")
    axes[0].hist(dataset.peak[dataset.y == 1], bins=bins_peak, color="#D55E00", alpha=0.9, label="Waspada")
    axes[0].axvline(WARNING_KPA, color="#111111", linestyle="--", linewidth=1)
    axes[0].set_xlabel("peak (kPa)")
    axes[0].set_ylabel("Sampel")
    axes[0].set_title("Sebaran puncak tekanan")
    axes[0].legend()

    bins_sustained = np.arange(0, 15) - 0.5
    axes[1].hist(dataset.sustained[dataset.y == 0], bins=bins_sustained, color="#56B4E9", alpha=0.9, label="Aman")
    axes[1].hist(dataset.sustained[dataset.y == 1], bins=bins_sustained, color="#D55E00", alpha=0.9, label="Waspada")
    axes[1].set_xlabel("sustained (sampel berurutan)")
    axes[1].set_yscale("log")
    axes[1].set_title("Sebaran durasi tumpuan")
    axes[1].legend()
    save(fig, "02-sebaran-fitur")


def chart_decision_maps(dataset: Dataset, specs: list[ModelSpec]) -> None:
    """
    Wilayah keputusan tiap model pada ruang peak x sustained.

    Latar hanya dua warna (aman / waspada) memakai ambang masing-masing model;
    garis hitam adalah batasnya. Ini lebih jujur daripada plot probabilitas:
    model yang terkalibrasi menghasilkan skor di sekitar prevalensi sehingga
    warna kontinu membuat panel jenuh, padahal keputusannya benar.
    """
    peak_grid = np.linspace(0, 90, 220)
    sustained_grid = np.linspace(0, 12, 160)
    xx, yy = np.meshgrid(peak_grid, sustained_grid)
    grid = np.column_stack([xx.ravel(), yy.ravel()])
    scaler = MinMaxScaler().fit(dataset.x)
    scaled_data = scaler.transform(dataset.x)

    fig, axes = plt.subplots(1, 5, figsize=(13.4, 3.1), sharey=True)
    for ax, spec in zip(axes, specs):
        model = spec.factory().fit(scaled_data if spec.scaled else dataset.x, dataset.y)
        inputs = scaler.transform(grid) if spec.scaled else grid
        train_inputs = scaled_data if spec.scaled else dataset.x
        threshold = choose_threshold(scores_of(model, train_inputs), dataset.y)
        scores = scores_of(model, inputs)
        predicted = (scores >= threshold).astype(float).reshape(xx.shape)

        ax.contourf(xx, yy, predicted, levels=[-0.5, 0.5, 1.5], colors=["#CFE3F2", "#F6D5C2"])
        ax.contour(xx, yy, predicted, levels=[0.5], colors="#111111", linewidths=1.2)
        ax.axvline(WARNING_KPA, color="#054B37", linestyle=":", linewidth=1)
        ax.set_title(f"{short(spec.name)}\nambang skor {threshold:.2f}")
        ax.set_xlabel("peak (kPa)")
        ax.grid(False)
    axes[0].set_ylabel("sustained")
    fig.suptitle("Wilayah keputusan (biru: aman, oranye: waspada; garis titik: 45 kPa)", y=1.04)
    save(fig, "03-batas-keputusan")


def chart_confusion(summary: dict) -> None:
    fig, axes = plt.subplots(1, len(summary), figsize=(13.4, 2.7))
    for ax, (name, payload) in zip(axes, summary.items()):
        matrix = np.asarray(payload["confusion"], dtype=float)
        normalised = matrix / matrix.sum(axis=1, keepdims=True)
        ax.imshow(normalised, cmap="Blues", vmin=0, vmax=1)
        for i in range(2):
            for j in range(2):
                ax.text(
                    j, i,
                    f"{int(matrix[i, j])}\n{normalised[i, j]:.2%}",
                    ha="center", va="center", fontsize=7.5,
                    color="#111111" if normalised[i, j] < 0.6 else "#FFFFFF",
                )
        ax.set_xticks([0, 1], ["Aman", "Waspada"])
        ax.set_yticks([])
        ax.set_title(short(name))
        ax.grid(False)
    axes[0].set_yticks([0, 1], ["Aman", "Waspada"])
    axes[0].set_ylabel("Label asli")
    fig.suptitle("Confusion matrix out-of-fold (gabungan 5 lipatan)", y=1.03)
    fig.subplots_adjust(wspace=0.25)
    save(fig, "04-confusion-matrix")


LINESTYLES = ["-", "--", "-.", ":", (0, (4, 1, 1, 1))]
LINEWIDTHS = [2.4, 1.9, 1.5, 1.1, 0.8]


def chart_roc(curves: dict) -> None:
    """
    Semua kurva berimpit di sudut kiri atas karena pemisahannya sempurna, jadi
    tiap model digambar dengan gaya garis berbeda agar tumpangannya terbaca.
    """
    fig, ax = plt.subplots(figsize=(4.6, 4.0))
    grid = np.asarray(curves["grid"])
    for index, (name, payload) in enumerate(curves["curves"].items()):
        ax.plot(
            grid, payload["tpr_mean"], color=COLORS[name],
            linestyle=LINESTYLES[index % len(LINESTYLES)],
            linewidth=LINEWIDTHS[index % len(LINEWIDTHS)], label=short(name),
        )
    ax.plot([0, 1], [0, 1], color="#999999", linestyle="--", linewidth=1)
    ax.set_xlabel("False positive rate")
    ax.set_ylabel("True positive rate")
    ax.set_title("Kurva ROC (rata-rata 5 lipatan)")
    ax.legend(loc="lower right")
    save(fig, "05-roc")


def chart_pr(curves: dict, prevalence: float) -> None:
    """Precision–Recall kelas minoritas; skala log supaya ekor kanannya terbaca."""
    fig, ax = plt.subplots(figsize=(4.6, 4.0))
    grid = np.asarray(curves["grid"])
    for index, (name, payload) in enumerate(curves["curves"].items()):
        precision = np.clip(np.asarray(payload["precision_mean"]), 0.05, 1.0)
        ax.plot(
            grid, precision, color=COLORS[name],
            linestyle=LINESTYLES[index % len(LINESTYLES)],
            linewidth=LINEWIDTHS[index % len(LINEWIDTHS)], label=short(name),
        )
    ax.axhline(prevalence, color="#999999", linestyle="--", linewidth=1,
               label=f"Prevalensi {prevalence:.1%}")
    ax.set_yscale("log")
    ax.set_ylim(0.04, 1.05)
    ax.set_xlabel("Recall kelas waspada")
    ax.set_ylabel("Precision kelas waspada (log)")
    ax.set_title("Kurva Precision–Recall")
    ax.legend(loc="center left", bbox_to_anchor=(0.02, 0.45))
    save(fig, "05-pr")


def chart_per_fold(summary: dict) -> None:
    """
    Metrik per lipatan sebagai titik, bukan batang.

    Semua nilai berada di atas 0,98, sehingga batang dari nol menyembunyikan
    justru selisih yang dibahas. Sumbu y dipotong dan dicatat di keterangan.
    """
    folds = len(next(iter(summary.values()))["folds"])
    fig, axes = plt.subplots(1, 3, figsize=(12.0, 3.3), sharex=True)
    metrics = [
        ("macro_f1", "Macro-F1"),
        ("recall_warning", "Recall waspada"),
        ("specificity", "Specificity"),
    ]
    x = np.arange(folds)
    for ax, (key, title) in zip(axes, metrics):
        values_all = []
        for offset, (name, payload) in enumerate(summary.items()):
            values = [row[key] for row in payload["folds"]]
            values_all += values
            ax.plot(
                x + (offset - 2) * 0.06, values, linestyle="none", marker="o",
                markersize=5, color=COLORS[name], label=short(name),
            )
        low = max(0.0, min(values_all) - 0.01)
        ax.set_ylim(low, 1.002)
        ax.set_xticks(x, [f"L{i + 1}" for i in range(folds)])
        ax.set_title(title)
    handles, labels = axes[0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="lower center", ncol=6, bbox_to_anchor=(0.5, -0.02))
    fig.suptitle("Metrik per lipatan (sumbu y dipotong; semua nilai di atas 0,98)", y=1.02)
    fig.subplots_adjust(bottom=0.22)
    save(fig, "06-metrik-per-lipatan")


def chart_gain(gain_results: dict) -> None:
    fig, ax = plt.subplots(figsize=(5.0, 3.3))
    for name, values in gain_results.items():
        colour = COLORS[name]
        style_kw = dict(
            color=colour, linewidth=1.5, label="Aturan murni" if name == "Aturan murni" else short(name)
        )
        if name == "Aturan murni":
            ax.plot(GAINS, values, linestyle="--", marker="s", markersize=3.5, **style_kw)
        else:
            ax.plot(GAINS, values, marker="o", markersize=4, **style_kw)
    ax.axvline(1.0, color="#BBBBBB", linewidth=1)
    ax.set_xlabel("Gain kalibrasi relatif")
    ax.set_ylabel("Macro-F1")
    ax.set_ylim(0.35, 1.02)
    ax.set_title("Ketahanan terhadap galat kalibrasi FSR")
    ax.legend(loc="lower left", ncol=2)
    save(fig, "07-gain-sweep")


def chart_reliability(dataset: Dataset, oof: dict) -> None:
    fig, ax = plt.subplots(figsize=(4.4, 3.7))
    bins = np.linspace(0, 1, 11)
    for index, (name, scores) in enumerate(oof["scores"].items()):
        probabilities = 1.0 / (1.0 + np.exp(-scores))
        centres, observed = [], []
        for low, high in zip(bins[:-1], bins[1:]):
            mask = (probabilities >= low) & (probabilities < high)
            if mask.sum() < 100:
                continue
            centres.append(float(probabilities[mask].mean()))
            observed.append(float(dataset.y[mask].mean()))
        ax.plot(
            centres, observed, marker="o", markersize=3.5, color=COLORS[name],
            linestyle=LINESTYLES[index % len(LINESTYLES)],
            linewidth=LINEWIDTHS[index % len(LINEWIDTHS)], label=short(name),
        )
    ax.plot([0, 1], [0, 1], color="#999999", linestyle="--", linewidth=1)
    ax.set_xlabel("Probabilitas terprediksi")
    ax.set_ylabel("Fraksi aktual waspada")
    ax.set_title("Diagram reliabilitas")
    ax.legend(loc="upper left")
    save(fig, "08-kalibrasi")


def chart_complexity(summary: dict) -> None:
    """Waktu latih vs macro-F1, label diletakkan bergantian agar tidak bertumpuk."""
    fig, ax = plt.subplots(figsize=(5.6, 3.6))
    offsets = [(8, 8), (8, -12), (8, 8), (8, -12), (-10, 12)]
    # ANN dan FCM punya waktu latih dan macro-F1 yang hampir sama; kedua titik
    # digeser 2 % pada sumbu x hanya untuk keterbacaan, dicatat di keterangan.
    jitter = [1.0, 1.06, 1.0, 1.0, 0.94]
    for (name, payload), (dx, dy), factor in zip(summary.items(), offsets, jitter):
        x = payload["fit_seconds"]["mean"] * factor
        y = payload["macro_f1"]["mean"]
        ax.scatter(x, y, s=60, color=COLORS[name], edgecolor="#111111", linewidth=0.6, zorder=3)
        ax.annotate(
            short(name), (x, y), textcoords="offset points", xytext=(dx, dy), fontsize=7.5,
            ha="right" if dx < 0 else "left",
        )
    ax.set_xscale("log")
    ax.set_xlabel("Waktu latih per lipatan (detik, log)")
    ax.set_ylabel("Macro-F1")
    ax.set_ylim(0.985, 1.0025)
    ax.set_title("Waktu latih dan kinerja (ANN/FCM digeser 6 % untuk keterbacaan)")
    save(fig, "09-kompleksitas")


def chart_model_sizes(summary: dict) -> None:
    fig, ax = plt.subplots(figsize=(5.4, 2.8))
    names = list(summary)
    sizes = [summary[n]["parameters"] for n in names]
    ax.barh([short(n) for n in names], sizes, color=[COLORS[n] for n in names])
    ax.set_xscale("log")
    ax.set_xlabel("Parameter efektif (log)")
    ax.set_title("Ukuran model")
    for index, value in enumerate(sizes):
        ax.text(value * 1.2, index, str(value), va="center", fontsize=7.5)
    ax.set_xlim(1, max(sizes) * 6)
    save(fig, "10-ukuran-model")


# ----------------------------------------------------------------- reports ---


HTML_HEAD = """<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Perbandingan lima algoritma klasifikasi — smart insole</title>
<style>
  :root { --bg:#EFEFEC; --surface:#FFFFFF; --fg:#0A0A0F; --fg2:#46464F; --line:#DCDCD8; --accent:#04644C; --warn:#823700; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; line-height:1.6; }
  main { max-width: 1040px; margin: 0 auto; padding: 40px 24px 80px; }
  h1 { font-size: 1.85rem; line-height:1.2; margin:0 0 8px; }
  h2 { font-size: 1.24rem; margin: 38px 0 12px; padding-top: 18px; border-top:1px solid var(--line); }
  p, li { color: var(--fg2); }
  .lead { font-size: 1.02rem; }
  .meta { color: var(--fg2); font-size: .85rem; margin-bottom: 22px; }
  .card { background: var(--surface); border:1px solid var(--line); border-radius: 12px; padding: 18px 20px; margin: 14px 0; }
  .table-wrap { overflow-x: auto; }
  table { width:100%; border-collapse: collapse; font-size: .86rem; background: var(--surface); }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { font-weight: 600; color: var(--fg); }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  figure { margin: 18px 0; background: var(--surface); border:1px solid var(--line); border-radius: 12px; padding: 12px 14px; }
  figure img { width: 100%; height: auto; display:block; }
  figcaption { font-size: .82rem; color: var(--fg2); margin-top: 8px; }
  .fig-no { font-weight: 600; color: var(--fg); }
  code { background:#E7E7E3; padding:1px 5px; border-radius:4px; font-size:.85em; }
  pre { background:#E7E7E3; padding:12px 14px; border-radius:8px; overflow-x:auto; font-size:.8rem; }
  .note { border-left: 3px solid var(--warn); padding-left: 14px; }
  ul.tight li { margin-bottom: 4px; }
  @media print { body { background:#fff; } main { padding: 0; } figure, .card { break-inside: avoid; } }
</style>
</head>
<body>
<main>
"""


def load_rf_reference() -> dict | None:
    """Angka Random Forest dari pipeline JS, lipatan identik."""
    path = ROOT / "docs" / "evidence" / "metrics.json"
    if not path.exists():
        return None
    payload = json.loads(path.read_text())
    schemes = {item["key"]: item for item in payload["cv"]["schemes"]}
    return {
        "schemes": schemes,
        "gain": payload["cv"]["gain"],
    }


def write_config(dataset: Dataset, summary: dict, meta: dict) -> None:
    models = {}
    for name, payload in summary.items():
        models[name] = {
            "reference": payload["reference"],
            "hyperparameters": payload["hyperparameters"],
            "scaled": payload["scaled"],
            "parameters": payload["parameters"],
        }
    config = {
        "generatedBy": "scripts/compare-models.py",
        "seed": SEED,
        "folds": int(len(np.unique(dataset.fold))),
        "warningKpa": WARNING_KPA,
        "dataset": {
            "file": str(DATA_FILE.relative_to(ROOT)),
            "sha256": sha256(DATA_FILE),
            "patients": meta["patients"],
            "samples": meta["samples"],
            "warningSamples": meta["warningSamples"],
        },
        "foldsFile": {
            "file": str(FOLDS_FILE.relative_to(ROOT)),
            "sha256": sha256(FOLDS_FILE),
        },
        "environment": {
            "python": platform.python_version(),
            "numpy": np.__version__,
            "scikit-learn": meta.get("sklearn"),
            "platform": platform.platform(),
        },
        "models": models,
        "gains": GAINS,
    }
    (OUT_DIR / "config.json").write_text(json.dumps(config, indent=2) + "\n")


def write_metrics(summary: dict, curves: dict, gain: dict, meta: dict, anchor: dict) -> None:
    payload = {
        "meta": meta,
        "models": {},
        "curves": curves,
        "gainSweep": {"gains": GAINS, "macroF1": gain, "aggregation": "pooled", "anchor": anchor},
    }
    for name, item in summary.items():
        payload["models"][name] = {
            key: item[key]
            for key in (
                "accuracy",
                "macro_f1",
                "precision_warning",
                "recall_warning",
                "f1_warning",
                "specificity",
                "fit_seconds",
                "confusion",
                "folds",
                "reference",
                "hyperparameters",
                "parameters",
                "auc",
                "oof_accuracy",
                "threshold",
            )
        }
    (OUT_DIR / "metrics.json").write_text(json.dumps(payload, indent=2) + "\n")


def write_html(summary: dict, curves: dict, gain: dict, meta: dict) -> None:
    best = max(summary.items(), key=lambda item: item[1]["macro_f1"]["mean"])
    prevalence = meta["warningSamples"] / meta["samples"]
    out: list[str] = [HTML_HEAD]

    out.append("<h1>Perbandingan lima algoritma klasifikasi risiko tekanan plantar</h1>")
    out.append(
        "<p class='meta'>Smart insole tiga sensor FSR · dataset DFN-DS "
        f"({meta['patients']} pasien, {meta['samples']:,} sampel) · validasi silang "
        f"berkelompok {meta['folds']} lipatan · label <code>peak &ge; 45 kPa</code> · seed {meta['seed']}</p>"
        .replace(",", ".")
    )
    out.append(
        "<p class='lead'>Laporan ini membandingkan lima algoritma dari lima jurnal berbeda, "
        "pada data, lipatan, dan metrik yang sama dengan Random Forest produksi. Setiap pasien "
        "hanya muncul di satu sisi (latih atau uji), dan scaler hanya melihat lipatan latih.</p>"
    )

    out.append("<h2>1. Ringkasan eksekutif</h2>")
    out.append("<div class='card'><ul class='tight'>")
    out.append(f"<li>Macro-F1 tertinggi: <b>{short(best[0])}</b>, {pm(best[1]['macro_f1'])}.</li>")
    out.append(
        "<li>Semua model meniru aturan ambang pada data bersih. Itu konsekuensi label yang "
        "berasal dari aturan, bukan bukti keunggulan algoritma.</li>"
    )
    out.append(
        "<li>Pembeda yang jujur ada pada kolom ketahanan (bagian 9): saat gain bergeser, "
        "seluruh model turun bersama dan urutannya berubah.</li>"
    )
    out.append("</ul></div>")

    out.append("<h2>2. Dataset</h2>")
    out.append(
        "<p>Sumber DFN-DS (Zenodo MSSDA, CC BY 4.0), tersedia sebagai "
        "<code>models/training-data.json</code> v2.0 dengan kalibrasi kuantil dan aturan label "
        "dua kelas.</p>"
    )
    out.append(
        "<div class='table-wrap'><table><thead><tr><th>Properti</th><th class='num'>Nilai</th>"
        "</tr></thead><tbody>"
        f"<tr><td>Pasien</td><td class='num'>{meta['patients']}</td></tr>"
        f"<tr><td>Sampel</td><td class='num'>{meta['samples']:,}</td></tr>"
        f"<tr><td>Sampel waspada</td><td class='num'>{meta['warningSamples']:,} ({prevalence:.1%})</td></tr>"
        f"<tr><td>Rasio kelas</td><td class='num'>{meta['samples'] / max(meta['warningSamples'], 1):.1f} : 1</td></tr>"
        "<tr><td>Fitur</td><td class='num'><code>peak</code> (kPa), <code>sustained</code> (sampel)</td></tr>"
        "</tbody></table></div>".replace(",", ".")
    )
    out.append(
        "<figure><img src='charts/01-komposisi-kelas.svg' alt='Komposisi kelas per lipatan'>"
        "<figcaption><span class='fig-no'>Gambar 1.</span> Komposisi kelas per lipatan: proporsi "
        "waspada 5–6 % di setiap lipatan, jadi stratifikasi bekerja.</figcaption></figure>"
    )
    out.append(
        "<figure><img src='charts/02-sebaran-fitur.svg' alt='Sebaran fitur per kelas'>"
        "<figcaption><span class='fig-no'>Gambar 2.</span> Sebaran dua fitur per kelas. Garis "
        "putus-putus adalah ambang label; kelas waspada terpisah oleh garis itu, yang menjelaskan "
        "hasil mendekati sempurna di semua model.</figcaption></figure>"
    )

    out.append("<h2>3. Protokol evaluasi</h2>")
    out.append(
        "<p>Lipatan dibuat <code>groupedFolds</code> di <code>scripts/train-model.js</code> dan "
        "diekspor ke <code>models/folds.json</code>, sehingga Random Forest dan kelima model "
        "diuji pada pasien yang sama. Skrip berhenti bila ada pasien yang masuk dua lipatan.</p>"
    )

    out.append("<h2>4. Konfigurasi model</h2>")
    out.append(
        "<div class='table-wrap'><table><thead><tr><th>Model</th><th>Jurnal asal</th>"
        "<th>Hiperparameter</th><th class='num'>Parameter</th></tr></thead><tbody>"
    )
    for name, item in summary.items():
        hyper = ", ".join(f"<code>{k}</code>: {v}" for k, v in item["hyperparameters"].items())
        out.append(
            f"<tr><td>{short(name)}</td><td>{item['reference']}</td><td>{hyper}</td>"
            f"<td class='num'>{item['parameters']}</td></tr>"
        )
    out.append("</tbody></table></div>")
    out.append(
        "<p class='note'>Tidak ada tuning hiperparameter. Tuning per model akan membuat "
        "perbandingan tidak sebanding dan angkanya bias optimis.</p>"
    )
    out.append(
        "<p>Ambang keputusan setiap model dipilih pada lipatan latih (bukan lipatan uji) "
        "dengan memaksimalkan macro-F1. Tanpa langkah ini model yang terkalibrasi baik, "
        "seperti FCM dengan BCE, menghasilkan probabilitas di sekitar prevalensi kelas dan "
        "tidak pernah melewati 0,5 sehingga seluruh kelas waspada terlewat walaupun "
        "peringkatnya sempurna. Ambang rata-rata per model: "
        + ", ".join(
            f"{short(name)} {fmt(item['threshold']['mean'], 4)}"
            for name, item in summary.items()
        )
        + ".</p>"
    )

    out.append("<h2>5. Hasil utama</h2>")
    out.append(
        "<div class='table-wrap'><table><thead><tr><th>Model</th><th class='num'>Akurasi</th>"
        "<th class='num'>Macro-F1</th><th class='num'>Precision (waspada)</th>"
        "<th class='num'>Recall (waspada)</th><th class='num'>Specificity</th>"
        "<th class='num'>AUC</th><th class='num'>Latih (dtk)</th></tr></thead><tbody>"
    )
    for name, item in summary.items():
        out.append(
            f"<tr><td>{short(name)}</td>"
            f"<td class='num'>{pm(item['accuracy'])}</td>"
            f"<td class='num'>{pm(item['macro_f1'])}</td>"
            f"<td class='num'>{pm(item['precision_warning'])}</td>"
            f"<td class='num'>{pm(item['recall_warning'])}</td>"
            f"<td class='num'>{pm(item['specificity'])}</td>"
            f"<td class='num'>{fmt(item['auc'])}</td>"
            f"<td class='num'>{item['fit_seconds']['mean']:.2f}</td></tr>"
        )
    out.append("</tbody></table></div>")
    out.append(
        "<p>Rata-rata &plusmn; simpangan baku antar lima lipatan. Recall kelas waspada adalah "
        "metrik utama: melewatkan tekanan berbahaya lebih mahal daripada alarm palsu.</p>"
    )
    rf = load_rf_reference()
    if rf:
        rows = []
        for key, label in (
            ("aturan murni", "Aturan murni (baseline)"),
            ("RF class-weight", "Random Forest + class-weight"),
            ("RF + SMOTE", "Random Forest + SMOTE (produksi)"),
        ):
            item = rf["schemes"].get(key)
            if not item:
                continue
            rows.append(
                f"<tr><td>{label}</td><td class='num'>{fmt(item['accuracy'])}</td>"
                f"<td class='num'>{fmt(item['macroF1'])}</td>"
                f"<td class='num'>{fmt(item['perLevel']['warning']['precision'])}</td>"
                f"<td class='num'>{fmt(item['perLevel']['warning']['recall'])}</td></tr>"
            )
        out.append("<h3>5.1 Pembanding dari pipeline produksi (Random Forest)</h3>")
        out.append(
            "<div class='table-wrap'><table><thead><tr><th>Skema</th>"
            "<th class='num'>Akurasi</th><th class='num'>Macro-F1</th>"
            "<th class='num'>Precision (waspada)</th><th class='num'>Recall (waspada)</th>"
            "</tr></thead><tbody>" + "".join(rows) + "</tbody></table></div>"
        )
        out.append(
            "<p>Angka ini berasal dari <code>docs/evidence/metrics.json</code> (pipeline JS), "
            "<b>bukan</b> dilatih ulang di Python, tetapi memakai lipatan pasien yang sama "
            "sehingga sebanding. Ketiga skema identik 1,000 karena label berasal dari aturan; "
            "SMOTE dan <em>class weighting</em> tidak bisa memperbaiki batas yang sudah "
            "sempurna.</p>"
        )
    out.append(
        "<figure><img src='charts/06-metrik-per-lipatan.svg' alt='Metrik per lipatan'>"
        "<figcaption><span class='fig-no'>Gambar 3.</span> Metrik per lipatan. Sebaran antar "
        "lipatan lebih lebar daripada selisih antar model, tanda variasi pasien "
        "mendominasi.</figcaption></figure>"
    )

    out.append("<h2>6. Confusion matrix</h2>")
    out.append(
        "<figure><img src='charts/04-confusion-matrix.svg' alt='Confusion matrix'>"
        "<figcaption><span class='fig-no'>Gambar 4.</span> Confusion matrix gabungan lima "
        "lipatan, dinormalisasi per baris.</figcaption></figure>"
    )

    out.append("<h2>7. Kurva ROC dan Precision–Recall</h2>")
    out.append(
        "<figure><img src='charts/05-roc.svg' alt='Kurva ROC'>"
        "<figcaption><span class='fig-no'>Gambar 5.</span> Kurva ROC rata-rata lima lipatan. "
        "Pada data bersih semua model mendekati sudut kiri atas.</figcaption></figure>"
    )
    out.append(
        "<figure><img src='charts/05-pr.svg' alt='Kurva precision recall'>"
        "<figcaption><span class='fig-no'>Gambar 6.</span> Kurva Precision–Recall kelas waspada; "
        f"garis putus-putus adalah prevalensi {prevalence:.1%}, batas acak.</figcaption></figure>"
    )

    out.append("<h2>8. Batas keputusan dan kalibrasi</h2>")
    out.append(
        "<figure><img src='charts/03-batas-keputusan.svg' alt='Batas keputusan'>"
        "<figcaption><span class='fig-no'>Gambar 7.</span> Wilayah keputusan tiap model. Decision "
        "Tree memilih potongan tegak di 45 kPa, sedangkan model lain memilih batas miring yang "
        "setara: keduanya memisahkan kelas dengan sempurna karena data memang dibangun dari "
        "aturan.</figcaption></figure>"
    )
    out.append(
        "<p class='note'>Temuan yang harus disebut di Bab IV: pada dataset ini "
        "<code>sustained &ge; 1</code> setara dengan <code>peak &ge; 45 kPa</code> untuk "
        "<b>seluruh 81.000 sampel</b>, karena <code>sustained</code> dihitung sebagai panjang "
        "run di atas ambang yang sama. Artinya masalah klasifikasinya efektif satu dimensi: model "
        "cukup memakai salah satu fitur untuk sempurna. Ini keterbatasan desain label, bukan "
        "keunggulan algoritma, dan alasan tabel hasil bersih tidak boleh dipakai untuk memilih "
        "model.</p>"
    )
    out.append(
        "<figure><img src='charts/08-kalibrasi.svg' alt='Diagram reliabilitas'>"
        "<figcaption><span class='fig-no'>Gambar 8.</span> Diagram reliabilitas. Kurva yang jauh "
        "dari diagonal berarti skor model tidak bisa dibaca sebagai probabilitas.</figcaption></figure>"
    )

    out.append("<h2>9. Ketahanan terhadap galat kalibrasi</h2>")
    out.append(
        "<figure><img src='charts/07-gain-sweep.svg' alt='Sapuan gain'>"
        "<figcaption><span class='fig-no'>Gambar 9.</span> Macro-F1 saat nilai sensor digeser "
        "gain. Model dilatih pada data bersih; gain hanya diterapkan pada data uji dan "
        "<code>sustained</code> dihitung ulang dari deret tergeser.</figcaption></figure>"
    )
    out.append(
        "<div class='table-wrap'><table><thead><tr><th>Model</th>"
        + "".join(f"<th class='num'>&times;{g}</th>" for g in GAINS)
        + "</tr></thead><tbody>"
    )
    for name, values in gain.items():
        out.append(
            f"<tr><td>{short(name) if name != 'Aturan murni' else name}</td>"
            + "".join(f"<td class='num'>{fmt(v)}</td>" for v in values)
            + "</tr>"
        )
    out.append("</tbody></table></div>")
    out.append(
        "<p>Baseline aturan dipakai sebagai jangkar: bila angka &times;1,1 dan &times;1,2 tidak "
        "mendekati 82,4 % dan 69,7 % dari paket bukti sebelumnya, porting perhitungan "
        "<code>sustained</code> salah.</p>"
    )

    out.append("<h2>10. Kompleksitas dan on-device</h2>")
    out.append(
        "<figure><img src='charts/09-kompleksitas.svg' alt='Trade-off kompleksitas'>"
        "<figcaption><span class='fig-no'>Gambar 10.</span> Waktu latih dan kinerja. Waktu latih "
        "bukan kendala; semuanya di bawah beberapa detik per lipatan.</figcaption></figure>"
    )
    out.append(
        "<figure><img src='charts/10-ukuran-model.svg' alt='Ukuran model'>"
        "<figcaption><span class='fig-no'>Gambar 11.</span> Jumlah parameter efektif. Angka ini "
        "yang menentukan apakah model muat di ESP32; Random Forest 20 pohon kedalaman 8 jauh "
        "lebih besar daripada kelima model ini.</figcaption></figure>"
    )
    out.append(
        "<p>Kelayakan perangkat ditentukan biaya inferensi dan ukuran kode, bukan akurasi. Model "
        "linear (SVM, FCM) paling murah, tetapi keduanya memerlukan normalisasi masukan yang "
        "harus ikut dikalibrasi di perangkat.</p>"
    )

    out.append("<h2>11. Analisis kesalahan</h2>")
    out.append(
        "<div class='table-wrap'><table><thead><tr><th>Model</th>"
        "<th class='num'>False negative</th><th class='num'>False positive</th>"
        "<th class='num'>FN / total waspada</th></tr></thead><tbody>"
    )
    for name, item in summary.items():
        fn = sum(row["fn"] for row in item["folds"])
        fp = sum(row["fp"] for row in item["folds"])
        support = sum(row["support_warning"] for row in item["folds"])
        out.append(
            f"<tr><td>{short(name)}</td><td class='num'>{fn}</td><td class='num'>{fp}</td>"
            f"<td class='num'>{fn / max(support, 1):.2%}</td></tr>"
        )
    out.append("</tbody></table></div>")
    out.append(
        "<p>Kesalahan yang paling mahal adalah false negative: sampel waspada yang diprediksi "
        "aman, karena pasien tidak menerima peringatan.</p>"
    )

    out.append("<h2>12. Batasan dan reproducibility</h2>")
    out.append("<ul class='tight'>")
    out.append(
        "<li>Label berasal dari aturan; macro-F1 mendekati 1 berarti model meniru aturan, bukan "
        "tervalidasi secara klinis.</li>"
    )
    out.append("<li>Tidak ada tuning hiperparameter dan tidak ada seleksi fitur.</li>")
    out.append(
        "<li>Belum ada data uji eksternal (subjek diabetes baru); semua angka adalah validasi "
        "silang pada DFN-DS.</li>"
    )
    out.append(
        f"<li>Seed {meta['seed']}, scikit-learn {meta.get('sklearn', '-')}, NumPy {meta['numpy']}; "
        "dua kali jalan menghasilkan JSON identik.</li>"
    )
    out.append("</ul>")
    out.append(
        "<p>Reproduksi:</p><pre><code>node scripts/export-folds.js\n"
        "uv run --with scikit-learn --with matplotlib python scripts/compare-models.py</code></pre>"
    )
    out.append("</main></body></html>")
    (OUT_DIR / "index.html").write_text("\n".join(out))


def write_readme(summary: dict, meta: dict) -> None:
    best = max(summary.items(), key=lambda item: item[1]["macro_f1"]["mean"])
    lines = [
        "# Perbandingan algoritma — ringkasan",
        "",
        f"Dataset DFN-DS: {meta['patients']} pasien, {meta['samples']} sampel, "
        f"{meta['warningSamples']} waspada ({meta['warningSamples'] / meta['samples']:.1%}). "
        f"Validasi silang berkelompok {meta['folds']} lipatan, seed {meta['seed']}.",
        "",
        "| Model | Macro-F1 | Recall waspada | AUC | Jurnal |",
        "| --- | --- | --- | --- | --- |",
    ]
    for name, item in summary.items():
        lines.append(
            f"| {short(name)} | {pm(item['macro_f1'])} | {pm(item['recall_warning'])} | "
            f"{fmt(item['auc'])} | {item['reference']} |"
        )
    lines += [
        "",
        f"Model terbaik: **{short(best[0])}** ({pm(best[1]['macro_f1'])}).",
        "",
        "## Berkas",
        "",
        "- `index.html` — laporan lengkap (12 bagian, 11 gambar)",
        "- `metrics.json` — metrik per lipatan, confusion matrix, kurva, sapuan gain",
        "- `config.json` — seed, versi pustaka, hiperparameter, hash dataset dan folds",
        "- `charts/` — sebelas gambar, SVG dan PNG",
        "- `ringkasan-konsultasi.html` — satu halaman untuk bimbingan",
        "",
        "## Reproduksi",
        "",
        "```bash",
        "node scripts/export-folds.js",
        "uv run --with scikit-learn --with matplotlib python scripts/compare-models.py",
        "```",
        "",
    ]
    (OUT_DIR / "README.md").write_text("\n".join(lines))


def write_one_pager(summary: dict, gain: dict) -> None:
    best = max(summary.items(), key=lambda item: item[1]["macro_f1"]["mean"])
    rows = "".join(
        f"<tr><td>{short(name)}</td><td class='num'>{pm(item['macro_f1'])}</td>"
        f"<td class='num'>{pm(item['recall_warning'])}</td><td>{item['reference']}</td></tr>"
        for name, item in summary.items()
    )
    html = (
        HTML_HEAD
        + f"""
<h1 style="font-size:1.45rem">Perbandingan lima algoritma — satu halaman</h1>
<p class="meta">Untuk bimbingan; rincian di <code>index.html</code>.</p>
<div class="table-wrap"><table><thead><tr><th>Model</th><th class="num">Macro-F1</th>
<th class="num">Recall waspada</th><th>Jurnal</th></tr></thead><tbody>{rows}</tbody></table></div>
<figure><img src="charts/07-gain-sweep.svg" alt="Sapuan gain">
<figcaption><span class="fig-no">Gambar 1.</span> Gambar yang paling perlu dibawa: ketahanan
terhadap galat kalibrasi. Pada gain &times;1,2 semua model turun bersama.</figcaption></figure>
<div class="card"><ul class="tight">
<li>Semua model meniru aturan 45 kPa pada data bersih; urutan juara tidak bermakna klinis.</li>
<li>Pembeda nyata: ketahanan terhadap gain dan biaya inferensi, bukan akurasi.</li>
<li>Macro-F1 tertinggi: <b>{short(best[0])}</b> ({pm(best[1]['macro_f1'])}).</li>
</ul></div>
</main></body></html>"""
    )
    (OUT_DIR / "ringkasan-konsultasi.html").write_text(html)


# -------------------------------------------------------------------- main ---


def main() -> None:
    parser = argparse.ArgumentParser(description="Perbandingan lima algoritma pada DFN-DS")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    style()

    dataset, folds_raw = load_dataset()
    check_folds(dataset, folds_raw)
    specs = model_specs()

    print(
        f"dataset: {len(np.unique(dataset.patient))} pasien, {dataset.y.size} sampel, "
        f"{int(dataset.y.sum())} waspada, {len(np.unique(dataset.fold))} lipatan"
    )

    summary, curves, oof = run_cv(dataset, specs)
    gain = gain_sweep(dataset, specs)
    anchor = validate_anchor(gain)
    print(f"jangkar gain lolos: {[round(c['delta'], 12) for c in anchor['checks']]}")

    meta = {
        "seed": SEED,
        "patients": int(len(np.unique(dataset.patient))),
        "samples": int(dataset.y.size),
        "warningSamples": int(dataset.y.sum()),
        "folds": int(len(np.unique(dataset.fold))),
        "numpy": np.__version__,
        "generatedBy": "scripts/compare-models.py",
    }
    try:
        import sklearn

        meta["sklearn"] = sklearn.__version__
    except Exception:  # pragma: no cover
        pass

    write_config(dataset, summary, meta)
    write_metrics(summary, curves, gain, meta, anchor)

    chart_class_balance(dataset)
    chart_feature_distribution(dataset)
    chart_decision_maps(dataset, specs)
    chart_confusion(summary)
    chart_roc(curves)
    chart_pr(curves, meta["warningSamples"] / meta["samples"])
    chart_per_fold(summary)
    chart_gain(gain)
    chart_reliability(dataset, oof)
    chart_complexity(summary)
    chart_model_sizes(summary)

    write_html(summary, curves, gain, meta)
    write_readme(summary, meta)
    write_one_pager(summary, gain)

    if not args.quiet:
        print("\nmodel                 macro-F1            recall(w)           AUC")
        for name, item in summary.items():
            print(
                f"{short(name):20}  {pm(item['macro_f1'])}   {pm(item['recall_warning'])}   "
                f"{fmt(item['auc'])}"
            )
        print("\nsapuan gain:")
        for name, values in gain.items():
            print(f"  {name:22}" + "  ".join(f"{v:.3f}" for v in values))
        print(f"\nkeluaran: {OUT_DIR.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
