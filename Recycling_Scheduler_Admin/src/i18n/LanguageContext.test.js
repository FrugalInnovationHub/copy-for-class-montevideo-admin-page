import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./LanguageContext.jsx', import.meta.url), 'utf8');

test('category status filter label has an English translation', () => {
  assert.match(source, /\['Estado de categoría', 'Category status'\]/);
});

test('material photo upload text has English translations', () => {
  assert.match(source, /\['Subir foto', 'Upload photo'\]/);
  assert.match(source, /\['Sin foto', 'No photo'\]/);
  assert.match(source, /\['El archivo debe ser una imagen', 'The file must be an image'\]/);
});
