/**
 * ============================================================
 * JEDLIK MOTORS — INVENTORY MANAGEMENT SYSTEM
 * Returns Service — Open Holdings Ledger
 * ============================================================
 *
 * Derives "what each employee currently has out" by walking
 * Transaction History as a ledger. Pure functions only — the
 * network/sheet I/O lives in returns-service.js (Next route layer).
 *
 * Holdings are keyed by (employee, item) — not location — so a Return
 * to a different box than the original Take still reduces the
 * employee's net balance correctly. The display `locationId` is the
 * location of the most recent Take for that (employee, item), purely
 * as a memory aid ("where did I grab it from").
 */

// Key: an employee holding units of a specific item, summed across locations.
const holdingKey = (employeeCode, itemId) =>
  `${employeeCode}::${itemId}`;

const parseQty = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

const parseTs = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toISOString();
};

/**
 * Pure ledger: walks transactions chronologically and returns the open
 * holdings grouped by employee. Each holding is the net qty an employee
 * still has after all Take/Return/Expense entries.
 *
 *   Take    → +qty
 *   Return  → −qty (clamped at 0)
 *   Expense → −qty (clamped at 0)
 *
 * Anything else is ignored. Unknown quantities are treated as zero.
 * Cross-location Returns debit the employee's net balance for that item.
 *
 * @param {Array<object>} transactions
 * @returns {Array<{ employeeCode: string, employeeName: string, items: Array<{ itemId: string, componentName: string, locationId: string, qty: number, lastTakenAt: string }> }>}
 */
export function computeOpenHoldings(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  // Sort chronologically. ISO 8601 strings sort lexicographically the same
  // as chronologically, so this works for both string and Date timestamps.
  // Stable sort preserves sheet order on ties.
  const sorted = transactions
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
      const ta = parseTs(a.t['Timestamp']);
      const tb = parseTs(b.t['Timestamp']);
      if (ta < tb) return -1;
      if (ta > tb) return 1;
      return a.i - b.i;
    });

  // holdings: Map<key, holdingState>; key = `${employeeCode}::${itemId}`
  const holdings = new Map();
  // employeeNames: Map<employeeCode, latest non-empty name observed>
  const employeeNames = new Map();

  for (const { t } of sorted) {
    const employeeCode = String(t['Employee Code'] || '').trim();
    const itemId = String(t['Item ID'] || '').trim();
    const locationId = String(t['Location ID'] || '').trim();
    const action = String(t['Action'] || '').trim();
    const qty = parseQty(t['Quantity']);
    const ts = parseTs(t['Timestamp']);

    if (!employeeCode || !itemId || !locationId) continue;

    const name = String(t['Employee Name'] || '').trim();
    if (name) employeeNames.set(employeeCode, name);

    const key = holdingKey(employeeCode, itemId);
    const prev = holdings.get(key) || {
      employeeCode,
      itemId,
      componentName: String(t['Component Name'] || '').trim(),
      locationId,
      qty: 0,
      lastTakenAt: '',
    };

    let nextQty = prev.qty;
    if (action === 'Take') {
      nextQty = prev.qty + qty;
      // Update locationId and lastTakenAt to reflect the most recent Take.
      holdings.set(key, {
        ...prev,
        locationId,
        componentName: prev.componentName || String(t['Component Name'] || '').trim(),
        lastTakenAt: ts,
        qty: nextQty,
      });
      continue;
    } else if (action === 'Return' || action === 'Expense') {
      nextQty = prev.qty - qty;
      if (nextQty < 0) nextQty = 0;
      holdings.set(key, { ...prev, qty: nextQty });
      continue;
    } else {
      // Unknown action — ignore.
      continue;
    }
  }

  // Drop zero-qty holdings and group by employee.
  const byEmployee = new Map();
  for (const h of holdings.values()) {
    if (h.qty <= 0) continue;
    if (!byEmployee.has(h.employeeCode)) {
      byEmployee.set(h.employeeCode, {
        employeeCode: h.employeeCode,
        employeeName: employeeNames.get(h.employeeCode) || '',
        items: [],
      });
    }
    byEmployee.get(h.employeeCode).items.push({
      itemId: h.itemId,
      componentName: h.componentName,
      locationId: h.locationId,
      qty: h.qty,
      lastTakenAt: h.lastTakenAt,
    });
  }

  const result = Array.from(byEmployee.values());

  // Sort employees by code for stable rendering.
  result.sort((a, b) => (a.employeeCode < b.employeeCode ? -1 : a.employeeCode > b.employeeCode ? 1 : 0));

  // Within an employee, sort items by lastTakenAt descending (newest first).
  for (const group of result) {
    group.items.sort((a, b) => {
      if (a.lastTakenAt < b.lastTakenAt) return 1;
      if (a.lastTakenAt > b.lastTakenAt) return -1;
      return 0;
    });
  }

  return result;
}

/**
 * Builds a Map of `itemId → openQty` for the given employee, summing
 * across all locations. Used by the Return guard in processTransaction
 * so the per-line check is O(1) instead of re-walking the ledger.
 *
 * @param {string} employeeCode
 * @param {Array<object>} transactions
 * @returns {Map<string, number>}
 */
export function buildEmployeeOpenHoldings(employeeCode, transactions) {
  const map = new Map();
  const normalizedEmp = String(employeeCode || '').trim();
  if (!normalizedEmp) return map;

  const group = computeOpenHoldings(transactions).find(
    (g) => g.employeeCode === normalizedEmp
  );
  if (!group) return map;

  for (const item of group.items) {
    map.set(item.itemId, item.qty);
  }
  return map;
}

/**
 * Convenience wrapper for "how many of item X does this employee currently
 * hold?". Returns 0 when either argument is empty or no holding exists.
 *
 * @param {string} employeeCode
 * @param {string} itemId
 * @param {Array<object>} transactions
 * @returns {number}
 */
export function getOpenHoldingQty(employeeCode, itemId, transactions) {
  if (!employeeCode || !itemId) return 0;
  const map = buildEmployeeOpenHoldings(employeeCode, transactions);
  return map.get(String(itemId).trim()) || 0;
}

/**
 * Validates a batch of Return line-items against an employee's open
 * holdings. Pure: no I/O, no globals. Used by processTransaction as the
 * source of truth for the "you can only return what you hold" rule.
 *
 * Each result entry has shape:
 *   { valid: boolean, openQty: number, message?: string }
 *
 * Lines with non-positive quantities are rejected up front so the caller
 * doesn't have to.
 *
 * @param {Array<{ itemId: string, quantity: number|string }>} items
 * @param {Map<string, number>} holdingsMap — itemId → open qty for this employee
 * @returns {Object<string, { valid: boolean, openQty: number, message?: string }>}
 */
export function validateReturnRequests(items, holdingsMap) {
  const result = {};
  if (!Array.isArray(items)) return result;

  for (const it of items) {
    const itemId = String(it.itemId || '').trim();
    const requestedQty = parseInt(it.quantity, 10);

    if (!Number.isFinite(requestedQty) || requestedQty <= 0) {
      result[itemId] = {
        valid: false,
        openQty: holdingsMap.get(itemId) || 0,
        message: `Invalid quantity for "${itemId}".`,
      };
      continue;
    }

    const openQty = holdingsMap.get(itemId) || 0;

    if (openQty <= 0) {
      result[itemId] = {
        valid: false,
        openQty,
        message: `You have not taken any "${itemId}". Cannot return what you don't hold.`,
      };
      continue;
    }

    if (requestedQty > openQty) {
      result[itemId] = {
        valid: false,
        openQty,
        message: `You currently hold ${openQty} of "${itemId}" — cannot return ${requestedQty}.`,
      };
      continue;
    }

    result[itemId] = { valid: true, openQty };
  }

  return result;
}
