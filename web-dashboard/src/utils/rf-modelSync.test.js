import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The web bundle cannot import JSON from outside its root, so
 * src/utils/rf-model.json is a copy of models/rf-model.json. If the two drift,
 * the dashboard and the firmware classify with different trees — and nothing
 * else in the test suite would notice.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB_MODEL = path.join(here, 'rf-model.json');
const SOURCE_MODEL = path.resolve(here, '..', '..', '..', 'models', 'rf-model.json');

const read = (file) => fs.readFileSync(file, 'utf8');

describe('rf-model copy', () => {
  it('matches models/rf-model.json byte for byte', () => {
    expect(fs.existsSync(SOURCE_MODEL)).toBe(true);
    expect(read(WEB_MODEL)).toBe(read(SOURCE_MODEL));
  });

  it('keeps the provenance block written by the training script', () => {
    const model = JSON.parse(read(WEB_MODEL));

    expect(model.provenance).toMatchObject({
      preparedBy: 'scripts/prepare-dataset.py',
      trainedBy: 'scripts/train-model.js',
    });
    expect(model.provenance.trainPatients).toBeGreaterThan(0);
    expect(model.provenance.validationPatients).toBeGreaterThan(0);
    expect(model.trees.length).toBe(model.combo.nTrees);
  });
});
