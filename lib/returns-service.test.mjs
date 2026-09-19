import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeOpenHoldings,
  buildEmployeeOpenHoldings,
  getOpenHoldingQty,
  validateReturnRequests,
} from './returns-service.mjs';

// ── Helpers ────────────────────────────────────────────────
// Each txn mirrors a row in the "Transaction History" sheet. Timestamps are
// ISO 8601 so they sort lexicographically the same as chronologically.

const T = (overrides) => ({
  'Employee Code': 'EMP001',
  'Employee Name': 'Ragu',
  'Item ID': 'ITM-0001',
  'Component Name': 'M3 Screw',
  'Location ID': 'BX-01-01',
  Quantity: 1,
  Action: 'Take',
  Timestamp: '2026-09-01T10:00:00.000Z',
  ...overrides,
});

// ── Basic shape ────────────────────────────────────────────

test('empty history returns no holdings', () => {
  assert.deepEqual(computeOpenHoldings([]), []);
});

test('a Take leaves the item open under the taking employee', () => {
  const out = computeOpenHoldings([
    T({ Quantity: 5, Timestamp: '2026-09-01T10:00:00.000Z' }),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].employeeCode, 'EMP001');
  assert.equal(out[0].employeeName, 'Ragu');
  assert.equal(out[0].items.length, 1);
  assert.equal(out[0].items[0].itemId, 'ITM-0001');
  assert.equal(out[0].items[0].componentName, 'M3 Screw');
  assert.equal(out[0].items[0].locationId, 'BX-01-01');
  assert.equal(out[0].items[0].qty, 5);
  assert.equal(out[0].items[0].lastTakenAt, '2026-09-01T10:00:00.000Z');
});

// ── Ledger arithmetic ──────────────────────────────────────

test('a Take then a partial Return leaves the remainder open', () => {
  const out = computeOpenHoldings([
    T({ Quantity: 5, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ Quantity: 2, Action: 'Return', Timestamp: '2026-09-02T10:00:00.000Z' }),
  ]);
  assert.equal(out[0].items[0].qty, 3);
});

test('a Take then a full Return leaves nothing open', () => {
  const out = computeOpenHoldings([
    T({ Quantity: 4, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ Quantity: 4, Action: 'Return', Timestamp: '2026-09-02T10:00:00.000Z' }),
  ]);
  assert.deepEqual(out, []);
});

test('Expense reduces open holdings like a return — it consumes the item', () => {
  const out = computeOpenHoldings([
    T({ Quantity: 5, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ Quantity: 1, Action: 'Expense', Timestamp: '2026-09-02T10:00:00.000Z' }),
  ]);
  assert.equal(out[0].items[0].qty, 4);
});

test('a Return greater than the open balance is clamped to zero, never negative', () => {
  const out = computeOpenHoldings([
    T({ Quantity: 2, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ Quantity: 5, Action: 'Return', Timestamp: '2026-09-02T10:00:00.000Z' }),
  ]);
  assert.deepEqual(out, []);
});

test('a Return with no prior Take produces no holding', () => {
  const out = computeOpenHoldings([
    T({ Quantity: 3, Action: 'Return', Timestamp: '2026-09-01T10:00:00.000Z' }),
  ]);
  assert.deepEqual(out, []);
});

// ── Per-employee grouping ──────────────────────────────────

test('two employees taking the same item appear as two separate groups', () => {
  const out = computeOpenHoldings([
    T({ 'Employee Code': 'EMP001', 'Employee Name': 'Ragu', Quantity: 2, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ 'Employee Code': 'EMP002', 'Employee Name': 'Priya', Quantity: 3, Timestamp: '2026-09-01T11:00:00.000Z' }),
  ]);
  assert.equal(out.length, 2);
  const codes = out.map((g) => g.employeeCode).sort();
  assert.deepEqual(codes, ['EMP001', 'EMP002']);
  const ragu = out.find((g) => g.employeeCode === 'EMP001');
  assert.equal(ragu.items[0].qty, 2);
});

test('employees with no open holdings are omitted from the result', () => {
  const out = computeOpenHoldings([
    T({ 'Employee Code': 'EMP001', Quantity: 1, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ 'Employee Code': 'EMP001', Quantity: 1, Action: 'Return', Timestamp: '2026-09-02T10:00:00.000Z' }),
    T({ 'Employee Code': 'EMP002', Quantity: 2, Timestamp: '2026-09-03T10:00:00.000Z' }),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].employeeCode, 'EMP002');
});

// ── Composite key (item × location) ────────────────────────

test('the same item taken from two locations sums into one holding keyed by item', () => {
  const out = computeOpenHoldings([
    T({ Quantity: 2, 'Location ID': 'BX-01-01', Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ Quantity: 3, 'Location ID': 'BX-01-02', Timestamp: '2026-09-01T11:00:00.000Z' }),
  ]);
  assert.equal(out[0].items.length, 1);
  assert.equal(out[0].items[0].itemId, 'ITM-0001');
  assert.equal(out[0].items[0].qty, 5);
  // locationId reflects the most recent Take for that item
  assert.equal(out[0].items[0].locationId, 'BX-01-02');
});

test('returning an item to a different location than it was taken from still reduces the net balance', () => {
  const out = computeOpenHoldings([
    T({ Quantity: 5, 'Location ID': 'BX-01-01', Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ Quantity: 2, Action: 'Return', 'Location ID': 'BX-01-02', Timestamp: '2026-09-02T10:00:00.000Z' }),
  ]);
  assert.equal(out[0].items.length, 1);
  assert.equal(out[0].items[0].qty, 3);
});

// ── Ordering ───────────────────────────────────────────────

test('ledger order follows timestamp, not sheet order — out-of-order rows balance correctly', () => {
  const out = computeOpenHoldings([
    T({ Quantity: 2, Action: 'Return', Timestamp: '2026-09-02T10:00:00.000Z' }),
    T({ Quantity: 5, Timestamp: '2026-09-01T10:00:00.000Z' }),
  ]);
  assert.equal(out[0].items[0].qty, 3);
});

test('lastTakenAt is the most recent Take for that holding', () => {
  const out = computeOpenHoldings([
    T({ Quantity: 5, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ Quantity: 2, Timestamp: '2026-09-03T10:00:00.000Z' }),
    T({ Quantity: 1, Action: 'Return', Timestamp: '2026-09-02T10:00:00.000Z' }),
  ]);
  assert.equal(out[0].items[0].qty, 6);
  assert.equal(out[0].items[0].lastTakenAt, '2026-09-03T10:00:00.000Z');
});

test('result employees are returned sorted by code for stable UI rendering', () => {
  const out = computeOpenHoldings([
    T({ 'Employee Code': 'EMP003', 'Employee Name': 'C', Quantity: 1, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ 'Employee Code': 'EMP001', 'Employee Name': 'A', Quantity: 1, Timestamp: '2026-09-01T11:00:00.000Z' }),
    T({ 'Employee Code': 'EMP002', 'Employee Name': 'B', Quantity: 1, Timestamp: '2026-09-01T12:00:00.000Z' }),
  ]);
  assert.deepEqual(out.map((g) => g.employeeCode), ['EMP001', 'EMP002', 'EMP003']);
});

test('within an employee, items are sorted by lastTakenAt descending (newest first)', () => {
  const out = computeOpenHoldings([
    T({ 'Item ID': 'ITM-0001', 'Component Name': 'A', Quantity: 1, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ 'Item ID': 'ITM-0002', 'Component Name': 'B', Quantity: 1, Timestamp: '2026-09-03T10:00:00.000Z' }),
    T({ 'Item ID': 'ITM-0003', 'Component Name': 'C', Quantity: 1, Timestamp: '2026-09-02T10:00:00.000Z' }),
  ]);
  assert.deepEqual(out[0].items.map((i) => i.itemId), ['ITM-0002', 'ITM-0003', 'ITM-0001']);
});

// ── Robustness ─────────────────────────────────────────────

test('rows with unknown action are ignored', () => {
  const out = computeOpenHoldings([
    T({ Quantity: 2, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ Quantity: 1, Action: 'Mystery', Timestamp: '2026-09-02T10:00:00.000Z' }),
  ]);
  assert.equal(out[0].items[0].qty, 2);
});

test('rows missing a quantity are treated as zero, not NaN', () => {
  const out = computeOpenHoldings([
    T({ Quantity: undefined, Timestamp: '2026-09-01T10:00:00.000Z' }),
  ]);
  assert.deepEqual(out, []);
});

test('employee name uses the most recent non-empty name observed', () => {
  const out = computeOpenHoldings([
    T({ 'Employee Name': 'Old Name', Quantity: 1, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ 'Employee Name': 'New Name', Quantity: 1, Timestamp: '2026-09-02T10:00:00.000Z' }),
  ]);
  assert.equal(out[0].employeeName, 'New Name');
});

// ── Per-employee lookup helpers (used by the Return guard) ─

test('buildEmployeeOpenHoldings on empty history returns an empty map', () => {
  const map = buildEmployeeOpenHoldings('EMP001', []);
  assert.ok(map instanceof Map);
  assert.equal(map.size, 0);
});

test('buildEmployeeOpenHoldings sums across locations and excludes other employees', () => {
  const txns = [
    T({ Quantity: 3, 'Location ID': 'BX-01-01', Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ Quantity: 2, 'Location ID': 'BX-01-02', Timestamp: '2026-09-01T11:00:00.000Z' }),
    T({ 'Employee Code': 'EMP002', 'Employee Name': 'Other', Quantity: 99, Timestamp: '2026-09-01T12:00:00.000Z' }),
  ];
  const map = buildEmployeeOpenHoldings('EMP001', txns);
  assert.equal(map.size, 1);
  assert.equal(map.get('ITM-0001'), 5);
});

test('buildEmployeeOpenHoldings reflects Returns and Expenses', () => {
  const txns = [
    T({ Quantity: 5, Timestamp: '2026-09-01T10:00:00.000Z' }),
    T({ Quantity: 1, Action: 'Expense', Timestamp: '2026-09-02T10:00:00.000Z' }),
    T({ Quantity: 2, Action: 'Return', Timestamp: '2026-09-03T10:00:00.000Z' }),
  ];
  const map = buildEmployeeOpenHoldings('EMP001', txns);
  assert.equal(map.get('ITM-0001'), 2);
});

test('getOpenHoldingQty is a thin wrapper around the per-employee lookup', () => {
  const txns = [T({ Quantity: 4, Timestamp: '2026-09-01T10:00:00.000Z' })];
  assert.equal(getOpenHoldingQty('EMP001', 'ITM-0001', txns), 4);
  assert.equal(getOpenHoldingQty('EMP001', 'ITM-DOES-NOT-EXIST', txns), 0);
  assert.equal(getOpenHoldingQty('EMP-WHO-IS-NOT-PRESENT', 'ITM-0001', txns), 0);
});

// ── validateReturnRequests — the guard used by processTransaction ─

test('validateReturnRequests flags a Return of an item the employee never took', () => {
  const holdings = new Map([['ITM-OTHER', 2]]);
  const out = validateReturnRequests(
    [{ itemId: 'ITM-0001', quantity: 1 }],
    holdings
  );
  assert.equal(out['ITM-0001'].valid, false);
  assert.equal(out['ITM-0001'].openQty, 0);
  assert.match(out['ITM-0001'].message, /not taken/i);
});

test('validateReturnRequests flags a Return greater than the open balance', () => {
  const holdings = new Map([['ITM-0001', 2]]);
  const out = validateReturnRequests(
    [{ itemId: 'ITM-0001', quantity: 5 }],
    holdings
  );
  assert.equal(out['ITM-0001'].valid, false);
  assert.equal(out['ITM-0001'].openQty, 2);
  assert.match(out['ITM-0001'].message, /currently hold 2/i);
});

test('validateReturnRequests accepts a Return within the open balance', () => {
  const holdings = new Map([['ITM-0001', 5]]);
  const out = validateReturnRequests(
    [{ itemId: 'ITM-0001', quantity: 5 }],
    holdings
  );
  assert.equal(out['ITM-0001'].valid, true);
  assert.equal(out['ITM-0001'].openQty, 5);
});

test('validateReturnRequests accepts a partial Return within the open balance', () => {
  const holdings = new Map([['ITM-0001', 5]]);
  const out = validateReturnRequests(
    [{ itemId: 'ITM-0001', quantity: 3 }],
    holdings
  );
  assert.equal(out['ITM-0001'].valid, true);
});

test('validateReturnRequests handles multiple items independently (partial-success)', () => {
  const holdings = new Map([
    ['ITM-0001', 3],
    ['ITM-0002', 0],
    ['ITM-0003', 7],
  ]);
  const out = validateReturnRequests(
    [
      { itemId: 'ITM-0001', quantity: 2 },   // valid
      { itemId: 'ITM-0002', quantity: 1 },   // never taken
      { itemId: 'ITM-0003', quantity: 9 },   // over-return
      { itemId: 'ITM-0004', quantity: 1 },   // not in holdings at all
    ],
    holdings
  );
  assert.equal(out['ITM-0001'].valid, true);
  assert.equal(out['ITM-0002'].valid, false);
  assert.equal(out['ITM-0003'].valid, false);
  assert.equal(out['ITM-0004'].valid, false);
});

test('validateReturnRequests flags a non-positive quantity without consulting holdings', () => {
  const holdings = new Map([['ITM-0001', 5]]);
  const out = validateReturnRequests(
    [{ itemId: 'ITM-0001', quantity: 0 }],
    holdings
  );
  assert.equal(out['ITM-0001'].valid, false);
  assert.match(out['ITM-0001'].message, /invalid quantity/i);
});
