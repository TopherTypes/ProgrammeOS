import test from 'node:test';
import assert from 'node:assert/strict';

import { escapeAttribute, escapeHtml } from '../src/render/safeRender.js';

test('escapeHtml escapes script-like content and quotes', () => {
  const value = '<img src=x onerror="alert(1)"> & "quoted"';
  assert.equal(
    escapeHtml(value),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &quot;quoted&quot;'
  );
});

test('escapeHtml handles empty and null-like values', () => {
  assert.equal(escapeHtml(''), '');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

test('escapeAttribute also escapes backticks for attributes', () => {
  assert.equal(escapeAttribute('foo`bar'), 'foo&#96;bar');
});
