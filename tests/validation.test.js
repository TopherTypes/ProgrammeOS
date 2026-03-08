import test from 'node:test';
import assert from 'node:assert/strict';

import { isValidDisplayDate, validateCrudValues } from '../src/state/validation.js';

test('date validation rejects malformed dates', () => {
  assert.equal(isValidDisplayDate('2026-03-07'), false);
  assert.equal(isValidDisplayDate('99 Mar 2026'), false);
  assert.equal(isValidDisplayDate('31 Feb 2026'), false);
});

test('date validation accepts valid display date and placeholder', () => {
  assert.equal(isValidDisplayDate('07 Mar 2026'), true);
  assert.equal(isValidDisplayDate('-'), true);
});

test('required validation flags empty text fields', () => {
  const errors = validateCrudValues('Update', { title: '   ' }, { people: [] });
  assert.equal(errors.title, 'This field is required.');
});

test('relationship validation flags unknown owner ids', () => {
  const errors = validateCrudValues(
    'Action',
    { title: 'Do thing', owner: 'person-999' },
    { people: [{ id: 'person-1', name: 'Chris' }], personIds: ['person-1'] }
  );
  assert.equal(errors.owner, 'Owner reference is invalid (unknown person ID).');
});
