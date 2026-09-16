import assert from 'node:assert/strict';
import test from 'node:test';
import { MONTEVIDEO_MATERIAL_PRESETS } from './montevideoMaterialPresets.js';
import { localizedName } from '../services/materialService.js';

const expected = {
  papel_carton: ['Papel Cartón', 'Paper/Cardboard'],
  plasticos: ['Plásticos', 'Plastics'],
  otros: ['Otros', 'Other'],
  organico: ['Orgánico', 'Organic'],
  descarte: ['Descarte', 'Discard'],
  sin_identificar: ['Sin Identificar', 'Unidentified'],
};

test('restore presets contain the exact bilingual root taxonomy', () => {
  assert.deepEqual(MONTEVIDEO_MATERIAL_PRESETS.map(item => item.id), Object.keys(expected));
  MONTEVIDEO_MATERIAL_PRESETS.forEach(item => {
    assert.equal(item.names.es, expected[item.id][0]);
    assert.equal(item.names.en, expected[item.id][1]);
  });
});

test('every restored child has non-empty Spanish and English names and a unique id', () => {
  const children = MONTEVIDEO_MATERIAL_PRESETS.flatMap(item => item.subMaterials);
  const childIds = children.map(item => item.id);
  // Organic and Discard intentionally reuse the parent id for direct classification.
  assert.equal(new Set(childIds).size, childIds.length);
  children.forEach(item => {
    assert.ok(item.names.es.trim(), `${item.id} is missing Spanish`);
    assert.ok(item.names.en.trim(), `${item.id} is missing English`);
  });
});

test('Admin display selects the requested preset language ahead of the legacy name field', () => {
  MONTEVIDEO_MATERIAL_PRESETS.forEach(item => {
    const data = { ...item, name: 'legacy-name-must-not-win' };
    assert.equal(localizedName(data, 'es'), item.names.es);
    assert.equal(localizedName(data, 'en'), item.names.en);
    item.subMaterials.forEach(child => {
      const childData = { ...child, name: 'legacy-child-name-must-not-win' };
      assert.equal(localizedName(childData, 'es'), child.names.es);
      assert.equal(localizedName(childData, 'en'), child.names.en);
    });
  });
});
