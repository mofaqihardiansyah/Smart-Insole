/**
 * export-model-cpp.js
 *
 * Converts models/rf-model.json → firmware/include/rf-model-data.h
 *
 * Output format: flat array of nodes. Each tree is serialized as:
 *   [root_node, left_child, right_child, ...]
 *
 * Node struct:
 *   Internal: { isLeaf=0, feature, threshold, leftIdx, rightIdx }
 *   Leaf:     { isLeaf=1, feature=-1, threshold=0, safeCount, warningCount }
 */

const fs = require('fs');
const path = require('path');

const modelPath = path.resolve(__dirname, '..', 'models', 'rf-model.json');
const outPath = path.resolve(__dirname, '..', 'firmware', 'include', 'rf-model-data.h');

const model = JSON.parse(fs.readFileSync(modelPath, 'utf8'));

// Flatten a tree into a node array (BFS order).
// Returns { nodes, rootIndex } where rootIndex is always 0.
function flattenTree(tree) {
  const nodes = [];

  function serialize(node) {
    const idx = nodes.length;

    if (node.leaf) {
      nodes.push({
        isLeaf: 1,
        feature: -1,
        threshold: 0.0,
        leftIdx: 0,
        rightIdx: 0,
        safeCount: node.counts.safe || 0,
        warningCount: node.counts.warning || 0,
      });
      return idx;
    }

    // Internal node — reserve slot, then serialize children.
    nodes.push(null); // placeholder
    const leftIdx = serialize(node.left);
    const rightIdx = serialize(node.right);

    nodes[idx] = {
      isLeaf: 0,
      feature: node.feature === 'peak' ? 0 : 1, // 0=peak, 1=sustained
      threshold: node.threshold,
      leftIdx,
      rightIdx,
      safeCount: 0,
      warningCount: 0,
    };
    return idx;
  }

  serialize(tree);
  return nodes;
}

// Flatten all trees.
const allTrees = model.trees.map(flattenTree);
const treeOffsets = [];
let totalNodes = 0;
for (const tree of allTrees) {
  treeOffsets.push(totalNodes);
  totalNodes += tree.length;
}

// Generate header file.
const lines = [];
lines.push('/**');
lines.push(' * rf-model-data.h — Auto-generated RF model data.');
lines.push(' *');
lines.push(` * Generated from: models/rf-model.json (v${model.version})`);
lines.push(` * Trees: ${model.trees.length}, Total nodes: ${totalNodes}`);
lines.push(' * DO NOT EDIT — regenerate with: node scripts/export-model-cpp.js');
lines.push(' */');
lines.push('');
lines.push('#ifndef RF_MODEL_DATA_H');
lines.push('#define RF_MODEL_DATA_H');
lines.push('');
lines.push('#include <stdint.h>');
lines.push('');
lines.push('// Feature indices');
lines.push('#define FEATURE_PEAK     0');
lines.push('#define FEATURE_SUSTAINED 1');
lines.push('');
lines.push('// Danger rule (from model)');
lines.push(`#define DANGER_PEAK_KPA      ${model.dangerRule.peakThreshold}`);
lines.push(`#define DANGER_SUSTAINED_RAW ${model.dangerRule.sustainedThreshold}`);
lines.push('');
lines.push('// Safe rule (clinical contract)');
lines.push('#define WARNING_PEAK_KPA    35');
lines.push('#define WARNING_SUSTAINED_RAW 200  // 20s at 10Hz');
lines.push('');
lines.push('// Model metadata');
lines.push(`#define RF_NUM_TREES    ${model.trees.length}`);
lines.push(`#define RF_TOTAL_NODES  ${totalNodes}`);
lines.push('');
lines.push('// Tree node: internal or leaf');
lines.push('typedef struct {');
lines.push('  uint8_t  isLeaf;       // 1=leaf, 0=internal');
lines.push('  int8_t   feature;      // 0=peak, 1=sustained, -1=N/A (leaf)');
lines.push('  float    threshold;    // split threshold');
lines.push('  uint16_t leftIdx;      // child index (internal only)');
lines.push('  uint16_t rightIdx;     // child index (internal only)');
lines.push('  uint16_t safeCount;    // vote count (leaf only)');
lines.push('  uint16_t warningCount; // vote count (leaf only)');
lines.push('} RfNode;');
lines.push('');
lines.push('// Tree offsets into the flat node array');
lines.push(`static const uint16_t RF_TREE_OFFSETS[${allTrees.length}] = {`);
lines.push('  ' + treeOffsets.join(', '));
lines.push('};');
lines.push('');

// Generate node array.
lines.push(`static const RfNode RF_NODES[${totalNodes}] = {`);
for (let t = 0; t < allTrees.length; t++) {
  const tree = allTrees[t];
  lines.push(`  // Tree ${t} (offset ${treeOffsets[t]})`);
  for (let i = 0; i < tree.length; i++) {
    const n = tree[i];
    const parts = [
      `.isLeaf=${n.isLeaf}`,
      `.feature=${n.feature}`,
      `.threshold=${n.threshold}`,
      `.leftIdx=${n.leftIdx}`,
      `.rightIdx=${n.rightIdx}`,
      `.safeCount=${n.safeCount}`,
      `.warningCount=${n.warningCount}`,
    ];
    lines.push(`  { ${parts.join(', ')} },${i === tree.length - 1 ? '' : ''}`);
  }
}
lines.push('};');
lines.push('');
lines.push('#endif // RF_MODEL_DATA_H');
lines.push('');

fs.writeFileSync(outPath, lines.join('\n'));
console.log(`Generated: ${outPath}`);
console.log(`  Trees: ${allTrees.length}`);
console.log(`  Total nodes: ${totalNodes}`);
console.log(`  File size: ${fs.statSync(outPath).size} bytes`);
