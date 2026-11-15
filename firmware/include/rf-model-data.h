/**
 * rf-model-data.h — Auto-generated RF model data.
 *
 * Generated from: models/rf-model.json (v2.0)
 * Trees: 20, Total nodes: 60
 * DO NOT EDIT — regenerate with: node scripts/export-model-cpp.js
 */

#ifndef RF_MODEL_DATA_H
#define RF_MODEL_DATA_H

#include <stdint.h>

// Feature indices
#define FEATURE_PEAK     0
#define FEATURE_SUSTAINED 1

// Batas Aman/Waspada. Satu angka, diekspor dari models/rf-model.json
// supaya firmware tidak bisa menyimpang dari model dan web.
#define WARNING_PEAK_KPA    45

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
  uint32_t safeCount;    // vote count (leaf only)
  uint32_t warningCount; // vote count (leaf only)
} RfNode;

// Tree offsets into the flat node array
static const uint16_t RF_TREE_OFFSETS[20] = {
  0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57
};

static const RfNode RF_NODES[60] = {
  // Tree 0 (offset 0)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76437, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76869 },
  // Tree 1 (offset 3)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76689, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76617 },
  // Tree 2 (offset 6)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76832, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76474 },
  // Tree 3 (offset 9)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76337, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76969 },
  // Tree 4 (offset 12)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76830, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76476 },
  // Tree 5 (offset 15)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76386, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76920 },
  // Tree 6 (offset 18)
  { .isLeaf=0, .feature=0, .threshold=44.97, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76657, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76649 },
  // Tree 7 (offset 21)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76848, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76458 },
  // Tree 8 (offset 24)
  { .isLeaf=0, .feature=0, .threshold=44.97, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76658, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76648 },
  // Tree 9 (offset 27)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76450, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76856 },
  // Tree 10 (offset 30)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76712, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76594 },
  // Tree 11 (offset 33)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76725, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76581 },
  // Tree 12 (offset 36)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76629, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76677 },
  // Tree 13 (offset 39)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76405, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76901 },
  // Tree 14 (offset 42)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=77007, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76299 },
  // Tree 15 (offset 45)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76778, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76528 },
  // Tree 16 (offset 48)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76715, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76591 },
  // Tree 17 (offset 51)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76563, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76743 },
  // Tree 18 (offset 54)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76495, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76811 },
  // Tree 19 (offset 57)
  { .isLeaf=0, .feature=1, .threshold=0, .leftIdx=1, .rightIdx=2, .safeCount=0, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=76628, .warningCount=0 },
  { .isLeaf=1, .feature=-1, .threshold=0, .leftIdx=0, .rightIdx=0, .safeCount=0, .warningCount=76678 },
};

#endif // RF_MODEL_DATA_H
