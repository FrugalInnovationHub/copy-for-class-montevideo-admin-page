import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./active_materials.jsx', import.meta.url), 'utf8');

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
