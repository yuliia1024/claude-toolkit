// The property is in New York; pricing runs in the property's time zone.
process.env.TZ = 'America/New_York';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nightsBetween, stayPrice } from '../src/nights.js';

test('one night', () => {
  assert.equal(nightsBetween('2024-06-01', '2024-06-02'), 1);
});

test('a week across a month boundary', () => {
  assert.equal(nightsBetween('2024-01-28', '2024-02-04'), 7);
});

test('rejects check-out before check-in', () => {
  assert.throws(() => nightsBetween('2024-06-02', '2024-06-01'), RangeError);
});

test('SUP-881: weekend stay of 9–11 March is billed two nights', () => {
  assert.equal(stayPrice('2024-03-09', '2024-03-11', 12000), 24000);
});
