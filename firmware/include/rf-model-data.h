/**
 * rf-model-data.h — Auto-generated RF model data.
 *
 * Generated from: models/rf-model.json (v1.0)
 * Trees: 20, Total nodes: 60
 * DO NOT EDIT — regenerate with: node scripts/export-model-cpp.js
 */

#ifndef RF_MODEL_DATA_H
#define RF_MODEL_DATA_H

#include <stdint.h>

// Feature indices
#define FEATURE_PEAK     0
#define FEATURE_SUSTAINED 1

// Danger rule (from model)
#define DANGER_PEAK_KPA      70
#define DANGER_SUSTAINED_RAW 1

// Safe rule (clinical contract)
#define WARNING_PEAK_KPA    35
#define WARNING_SUSTAINED_RAW 200  // 20s at 10Hz

// Model metadata
#define RF_NUM_TREES    20
#define RF_TOTAL_NODES  60

// Tree node: internal or leaf
typedef struct {
  uint8_t  isLeaf;       // 1=leaf, 0=internal
  int8_t   feature;      // 0=peak, 1=sustained, -1=N/A (leaf)
  float    threshold;    // split threshold
  uint16_t leftIdx;      // child index (internal only)
  uint16_t rightIdx;     // child index (internal only)
  uint16_t safeCount;    // vote count (leaf only)
  uint16_t warningCount; // vote count (leaf only)
} RfNode;

// Tree offsets into the flat node array
static const uint16_t RF_TREE_OFFSETS[20] = {
  0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57
};

static const RfNode RF_NODES[60] = {
  // Tree 0 (offset 0)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32083, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32117 },
  // Tree 1 (offset 3)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32082, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32118 },
  // Tree 2 (offset 6)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32245, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=31955 },
  // Tree 3 (offset 9)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32242, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=31958 },
  // Tree 4 (offset 12)
  { .isLeaf=0, .feature=0, .threshold=34.97, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32138, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32062 },
  // Tree 5 (offset 15)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32288, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=31912 },
  // Tree 6 (offset 18)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32373, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=31827 },
  // Tree 7 (offset 21)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=31953, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32247 },
  // Tree 8 (offset 24)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32084, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32116 },
  // Tree 9 (offset 27)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32050, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32150 },
  // Tree 10 (offset 30)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=31974, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32226 },
  // Tree 11 (offset 33)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32046, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32154 },
  // Tree 12 (offset 36)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32175, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32025 },
  // Tree 13 (offset 39)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32187, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32013 },
  // Tree 14 (offset 42)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32057, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32143 },
  // Tree 15 (offset 45)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32303, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=31897 },
  // Tree 16 (offset 48)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=31999, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32201 },
  // Tree 17 (offset 51)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=31955, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32245 },
  // Tree 18 (offset 54)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32220, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=31980 },
  // Tree 19 (offset 57)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=32006, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=32194 },
};

#endif // RF_MODEL_DATA_H
