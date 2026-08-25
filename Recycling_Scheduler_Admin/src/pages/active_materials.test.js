import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./active_materials.jsx', import.meta.url), 'utf8');
const serviceSource = readFileSync(new URL('../services/materialService.js', import.meta.url), 'utf8');

test('active material cards place a filled status badge beside the title', () => {
  assert.match(source, /active: 'border-emerald-600 bg-emerald-600 text-white'/);
  assert.match(source, /material\.name[\s\S]*statusStyles\[material\.status\][\s\S]*Activo/);
});

test('active material cards receive a subtle green tint', () => {
  assert.match(source, /material\.status === 'active'[\s\S]*bg-emerald-100\/80/);
});

test('category status filter has no visible title and filters material categories only', () => {
  assert.doesNotMatch(source, /Estado de categoría/);
  assert.match(source, /id="category-status-filter"[\s\S]*value=\{filter\}/);
  assert.match(source, /filter !== 'all' && material\.status !== filter/);
});

test('new materials and sub-materials require both Spanish and English names', () => {
  assert.match(source, /newMaterialNames\.es\.trim\(\)[\s\S]*newMaterialNames\.en\.trim\(\)/);
  assert.match(source, /Nombre del material en español/);
  assert.match(source, /Nombre del material en inglés/);
  assert.match(source, /subMaterialNames\[material\.id\]\?\.es\?\.trim\(\)[\s\S]*subMaterialNames\[material\.id\]\?\.en\?\.trim\(\)/);
  assert.match(source, /Nombre del submaterial en español/);
  assert.match(source, /Nombre del submaterial en inglés/);
  assert.match(serviceSource, /const normalizeRequiredNames = names/);
  assert.match(serviceSource, /names: localizedNames/);
});
