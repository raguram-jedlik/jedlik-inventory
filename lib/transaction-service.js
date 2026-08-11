/**
 * ============================================================
 * JEDLIK MOTORS — INVENTORY MANAGEMENT SYSTEM
 * Transaction Service
 * ============================================================
 *
 * Handles all inventory transactions: Take, Return, Expense.
 * Port of TransactionService.gs to Next.js.
 */

import { readSheet, appendRows, batchUpdate } from './sheets';
import { validateEmployee, getLocationDetails, generateNextId } from './sheets-service';

// Simple in-memory mutex to prevent concurrent transaction writes
let transactionLock = false;

async function acquireLock(timeoutMs = 15000) {
  const start = Date.now();
  while (transactionLock) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('System is busy. Please try again in a moment.');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  transactionLock = true;
}

function releaseLock() {
  transactionLock = false;
}

/**
 * Processes an inventory transaction.
 */
export async function processTransaction(data) {
  if (!data || !data.employeeCode || !data.locationId || !data.action || !data.items) {
    return { success: false, message: 'Missing required transaction data.', results: [] };
  }

  // Validate employee
  const empValidation = await validateEmployee(data.employeeCode);
  if (!empValidation.valid) {
    return { success: false, message: empValidation.message, results: [] };
  }

  // Validate location
  const location = await getLocationDetails(data.locationId);
  if (!location) {
    return { success: false, message: `Storage location "${data.locationId}" not found.`, results: [] };
  }

  // Validate action
  const validActions = ['Take', 'Return', 'Expense'];
  if (!validActions.includes(data.action)) {
    return { success: false, message: 'Invalid action: ' + data.action, results: [] };
  }

  // Validate items array
  if (!Array.isArray(data.items) || data.items.length === 0) {
    return { success: false, message: 'No items selected.', results: [] };
  }

  // Acquire lock
  try {
    await acquireLock();
  } catch (e) {
    return { success: false, message: e.message, results: [] };
  }

  try {
    // Load inventory data
    const { headers: invHeaders, rows: invData } = await readSheet('Inventory');

    const itemIdIdx = invHeaders.indexOf('Item ID');
    const nameIdx = invHeaders.indexOf('Component Name');
    const qtyIdx = invHeaders.indexOf('Quantity');
    const minStockIdx = invHeaders.indexOf('Min Stock');
    const lastActionIdx = invHeaders.indexOf('Last Action');
    const lastEmpIdx = invHeaders.indexOf('Last Employee');
    const lastTsIdx = invHeaders.indexOf('Last Timestamp');
    const statusIdx = invHeaders.indexOf('Status');

    const results = [];
    const now = new Date();
    const nowIso = now.toISOString();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const txnRows = [];
    const invUpdates = [];

    // Process each item
    for (const txnItem of data.items) {
      const itemId = String(txnItem.itemId).trim();
      const quantity = parseInt(txnItem.quantity, 10);
      const remarks = txnItem.remarks || '';

      if (isNaN(quantity) || quantity <= 0) {
        results.push({ itemId, success: false, message: 'Invalid quantity.' });
        continue;
      }

      // Find item in inventory
      let found = false;
      for (let r = 0; r < invData.length; r++) {
        if (String(invData[r][itemIdIdx] || '').trim() === itemId) {
          found = true;
          const currentQty = parseInt(invData[r][qtyIdx], 10) || 0;
          const minStock = parseInt(invData[r][minStockIdx], 10) || 5;
          const itemName = String(invData[r][nameIdx]);
          let newQty;

          switch (data.action) {
            case 'Take':
              if (quantity > currentQty) {
                results.push({
                  itemId,
                  success: false,
                  message: `Insufficient stock for "${itemName}". Available: ${currentQty}`,
                });
                continue;
              }
              newQty = currentQty - quantity;
              break;

            case 'Return':
              newQty = currentQty + quantity;
              break;

            case 'Expense':
              if (quantity > currentQty) {
                results.push({
                  itemId,
                  success: false,
                  message: `Insufficient stock for "${itemName}". Available: ${currentQty}`,
                });
                continue;
              }
              newQty = currentQty - quantity;
              break;

            default:
              results.push({ itemId, success: false, message: 'Unknown action.' });
              continue;
          }

          // Determine new status
          let newStatus = 'In Stock';
          if (newQty <= 0) newStatus = 'Out of Stock';
          else if (newQty <= minStock) newStatus = 'Low Stock';

          // Queue inventory updates (row is r + 2 for 1-indexed + header)
          const sheetRow = r + 2;
          invUpdates.push({ sheetName: 'Inventory', row: sheetRow, col: qtyIdx + 1, value: newQty });
          invUpdates.push({ sheetName: 'Inventory', row: sheetRow, col: lastActionIdx + 1, value: data.action });
          invUpdates.push({ sheetName: 'Inventory', row: sheetRow, col: lastEmpIdx + 1, value: data.employeeCode });
          invUpdates.push({ sheetName: 'Inventory', row: sheetRow, col: lastTsIdx + 1, value: nowIso });
          invUpdates.push({ sheetName: 'Inventory', row: sheetRow, col: statusIdx + 1, value: newStatus });

          // Update in-memory data for subsequent items
          invData[r][qtyIdx] = newQty;

          // Generate transaction ID
          const txnId = await generateNextId('TXN', 'NEXT_TXN_ID');

          // Queue transaction log entry
          txnRows.push([
            txnId,
            dateStr,
            timeStr,
            data.employeeCode,
            empValidation.name,
            data.locationId,
            itemId,
            itemName,
            quantity,
            data.action,
            remarks,
            nowIso,
          ]);

          results.push({
            itemId,
            success: true,
            message: `${data.action}: ${quantity} × ${itemName} (Remaining: ${newQty})`,
          });

          break;
        }
      }

      if (!found) {
        results.push({ itemId, success: false, message: 'Item not found: ' + itemId });
      }
    }

    // Apply all inventory updates in batch
    if (invUpdates.length > 0) {
      await batchUpdate(invUpdates);
    }

    // Append all transaction rows
    if (txnRows.length > 0) {
      await appendRows('Transaction History', txnRows);
    }

    const allSuccess = results.every((r) => r.success);
    const successCount = results.filter((r) => r.success).length;

    return {
      success: allSuccess,
      message: allSuccess
        ? `✅ Transaction complete. ${successCount} item(s) processed.`
        : `⚠️ ${successCount}/${results.length} item(s) processed. Check details below.`,
      results,
    };
  } catch (err) {
    console.error('Transaction error:', err);
    return { success: false, message: 'Transaction failed: ' + err.message, results: [] };
  } finally {
    releaseLock();
  }
}

/**
 * Returns transaction history for a specific item.
 */
export async function getItemTransactionHistory(itemId) {
  const { headers, rows } = await readSheet('Transaction History');
  const itemIdIdx = headers.indexOf('Item ID');

  const history = [];
  for (let i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i][itemIdIdx] || '').trim() === String(itemId).trim()) {
      const txn = {};
      for (let j = 0; j < headers.length; j++) {
        txn[headers[j]] = rows[i][j] !== undefined ? rows[i][j] : '';
      }
      history.push(txn);
    }
  }

  return history.slice(0, 50);
}

/**
 * Returns transaction history for a specific location.
 */
export async function getLocationTransactionHistory(locationId, limit = 30) {
  const { headers, rows } = await readSheet('Transaction History');
  const locIdx = headers.indexOf('Location ID');

  const history = [];
  for (let i = rows.length - 1; i >= 0 && history.length < limit; i--) {
    if (String(rows[i][locIdx] || '').trim().toUpperCase() === String(locationId).trim().toUpperCase()) {
      const txn = {};
      for (let j = 0; j < headers.length; j++) {
        txn[headers[j]] = rows[i][j] !== undefined ? rows[i][j] : '';
      }
      history.push(txn);
    }
  }

  return history;
}
