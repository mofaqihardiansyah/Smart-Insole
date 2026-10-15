# RF Model Report

## Training
- Data: DFN-DS (135 patients, 81k samples)
- Features: peak pressure (kPa), sustained duration (s)
- **Approach: Hybrid RF + Rule**
  - RF classifier untuk safe/warning boundary (data-driven)
  - Rule-based untuk danger: peak ≥ 70 kPa AND sustained ≥ 1 (0.1s)
- Class weighting: inverse frequency, clipped max 10x
- Best hyperparameters: n_trees=20, max_depth=8

## Validation Results (RF only: safe vs warning)
- Accuracy: 100.0%
- Macro-F1: 100.0%

| Level | Precision | Recall | F1 | Support |
|---|---|---|---|---|
| safe | 100.0% | 100.0% | 100.0% | 12934 |
| warning | 100.0% | 100.0% | 100.0% | 3866 |

## Clinical Contract (RF + Rule)
- 40 kPa, 1s -> warning (expect warning)
- 80 kPa, 31s -> danger (expect danger)
- 20 kPa, 0s -> safe (expect safe)
- 30 kPa, 0s -> safe (expect safe)

## Rationale
DFN-DS dataset hanya memiliki 31 danger samples (0.05%) dari 3 pasien. 
RF tidak cukup data untuk belajar pattern danger yang generalizable.
Danger ditentukan rule-based karena secara klinis sudah well-defined 
(tekanan >70 kPa dalam durasi signifikan sudah berbahaya).

RF tetap data-driven untuk safe/warning boundary (99.95% data).
