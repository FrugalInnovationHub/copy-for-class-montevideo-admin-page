import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./materialService.js', import.meta.url), 'utf8');

test('material service can upload and store a material photo url', () => {
  assert.match(source, /export const uploadMaterialPhoto/);
  assert.match(source, /materials\/photos/);
  assert.match(source, /photoUrl/);
  assert.match(source, /const material = \{[\s\S]*photoUrl,[\s\S]*imageUrl: photoUrl,[\s\S]*\};/);
});

test('material service requires a photo url when creating a material', () => {
  assert.match(source, /if \(!photoUrl\) throw new Error\('La foto del material es obligatoria'\)/);
});
