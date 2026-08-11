/**
 * ============================================================
 * JEDLIK MOTORS — INVENTORY MANAGEMENT SYSTEM
 * Sheet Service — Data Access Layer
 * ============================================================
 *
 * All Google Sheets read/write operations are centralized here.
 * Port of SheetService.gs to Next.js API layer.
 */

import {
  readSheet,
  appendRow,
  rowsToObjects,
  getConfigValue,
  setConfigValue,
  updateCell,
} from './sheets';

// ── Inventory ───────────────────────────────────────────────

/**
 * Returns all inventory items at a specific storage location.
 */
export async function getInventoryByLocation(locationId) {
  const { headers, rows } = await readSheet('Inventory');
  if (rows.length === 0) return [];

  const locIdx = headers.indexOf('Location ID');
  const normalizedId = String(locationId).trim().toUpperCase();

  const items = [];
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][locIdx] || '').trim().toUpperCase() === normalizedId) {
      const item = {};
      for (let j = 0; j < headers.length; j++) {
        item[headers[j]] = rows[i][j] !== undefined ? rows[i][j] : '';
      }
      item._rowIndex = i + 2;
      items.push(item);
    }
  }

  return items;
}

/**
 * Returns location details for a given location ID.
 */
export async function getLocationDetails(locationId) {
  const { headers, rows } = await readSheet('Storage Locations');
  if (rows.length === 0) return null;

  const normalizedId = String(locationId).trim().toUpperCase();

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim().toUpperCase() === normalizedId) {
      const loc = {};
      for (let j = 0; j < headers.length; j++) {
        loc[headers[j]] = rows[i][j] !== undefined ? rows[i][j] : '';
      }
      loc._rowIndex = i + 2;
      return loc;
    }
  }

  return null;
}

/**
 * Returns all storage locations.
 */
export async function getAllLocations() {
  const { headers, rows } = await readSheet('Storage Locations');
  return rowsToObjects(headers, rows);
}

/**
 * Returns all employees.
 */
export async function getAllEmployees() {
  const { headers, rows } = await readSheet('Employees');
  return rowsToObjects(headers, rows);
}

/**
 * Validates an employee code and returns employee info.
 */
export async function validateEmployee(empCode) {
  if (!empCode || String(empCode).trim() === '') {
    return { valid: false, name: '', role: '', message: 'Employee code is required.' };
  }

  const code = String(empCode).trim().toUpperCase();
  const { headers, rows } = await readSheet('Employees');
  if (rows.length === 0) {
    return { valid: false, name: '', role: '', message: 'Employee database not found.' };
  }

  const codeIdx = headers.indexOf('Employee Code');
  const nameIdx = headers.indexOf('Name');
  const roleIdx = headers.indexOf('Role');
  const activeIdx = headers.indexOf('Active');

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][codeIdx] || '').trim().toUpperCase() === code) {
      const isActive = String(rows[i][activeIdx]).toUpperCase() === 'TRUE';
      if (!isActive) {
        return {
          valid: false,
          name: rows[i][nameIdx],
          role: rows[i][roleIdx],
          message: 'Employee account is deactivated.',
        };
      }
      return {
        valid: true,
        name: String(rows[i][nameIdx]),
        role: String(rows[i][roleIdx]),
        message: 'Welcome, ' + rows[i][nameIdx] + '!',
      };
    }
  }

  return { valid: false, name: '', role: '', message: 'Employee code not found: ' + empCode };
}

/**
 * Searches inventory by a given field and query.
 */
export async function searchInventory(query, field) {
  const { headers, rows } = await readSheet('Inventory');
  if (rows.length === 0) return [];

  const queryLower = String(query).toLowerCase().trim();
  if (queryLower === '') return [];

  const fieldMap = {
    name: 'Component Name',
    partNumber: 'Part Number',
    location: 'Location ID',
    storageType: 'Storage Type',
    category: 'Category',
    type: 'Type',
    itemId: 'Item ID',
  };

  const results = [];

  for (let i = 0; i < rows.length; i++) {
    let match = false;

    if (field === 'all' || !field) {
      for (let j = 0; j < rows[i].length; j++) {
        if (String(rows[i][j] || '').toLowerCase().includes(queryLower)) {
          match = true;
          break;
        }
      }
    } else {
      const colHeader = fieldMap[field] || field;
      const colIdx = headers.indexOf(colHeader);
      if (colIdx !== -1) {
        match = String(rows[i][colIdx] || '').toLowerCase().includes(queryLower);
      }
    }

    if (match) {
      const item = {};
      for (let j = 0; j < headers.length; j++) {
        item[headers[j]] = rows[i][j] !== undefined ? rows[i][j] : '';
      }
      item._rowIndex = i + 2;
      results.push(item);
    }
  }

  return results;
}

/**
 * Returns all inventory data.
 */
export async function getAllInventory() {
  const { headers, rows } = await readSheet('Inventory');
  return rowsToObjects(headers, rows);
}

/**
 * Returns recent transactions.
 */
export async function getRecentTransactions(limit = 20) {
  const { headers, rows } = await readSheet('Transaction History');
  const transactions = rowsToObjects(headers, rows);
  transactions.reverse();
  return transactions.slice(0, limit);
}

/**
 * Searches transactions.
 */
export async function searchTransactions(query) {
  const { headers, rows } = await readSheet('Transaction History');
  if (rows.length === 0) return [];

  const queryLower = String(query).toLowerCase().trim();
  if (queryLower === '') return [];

  const results = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < rows[i].length; j++) {
      if (String(rows[i][j] || '').toLowerCase().includes(queryLower)) {
        const txn = {};
        for (let k = 0; k < headers.length; k++) {
          txn[headers[k]] = rows[i][k] !== undefined ? rows[i][k] : '';
        }
        results.push(txn);
        break;
      }
    }
  }

  results.reverse();
  return results.slice(0, 100);
}

/**
 * Generates the next sequential ID.
 */
export async function generateNextId(prefix, configKey) {
  const nextNum = parseInt(await getConfigValue(configKey) || '1', 10);
  const id = prefix + '-' + String(nextNum).padStart(4, '0');
  await setConfigValue(configKey, String(nextNum + 1));
  return id;
}

/**
 * Adds a new storage location.
 */
export async function addNewLocation(locationData) {
  if (!locationData.locationId || String(locationData.locationId).trim() === '') {
    return { success: false, message: 'Location ID is required.' };
  }

  const locId = String(locationData.locationId).trim().toUpperCase();

  // Check for duplicates
  const existing = await getLocationDetails(locId);
  if (existing) {
    return { success: false, message: `Location ID "${locId}" already exists.` };
  }

  const now = new Date().toISOString();
  await appendRow('Storage Locations', [
    locId,
    locationData.locationName || locId,
    locationData.storageType || 'Box',
    locationData.parentLocation || '',
    locationData.room || '',
    '', // QR Code URL (will be generated)
    'FALSE', // QR Generated
    now,
    locationData.notes || '',
  ]);

  return {
    success: true,
    message: `Location "${locId}" added successfully.`,
  };
}

/**
 * Adds a new employee.
 */
export async function addNewEmployee(empData) {
  if (!empData.employeeCode || String(empData.employeeCode).trim() === '') {
    return { success: false, message: 'Employee code is required.' };
  }

  const code = String(empData.employeeCode).trim().toUpperCase();

  // Check for duplicates
  const existing = await validateEmployee(code);
  if (existing.valid || existing.message.includes('deactivated')) {
    return { success: false, message: `Employee code "${code}" already exists.` };
  }

  const now = new Date().toISOString();
  await appendRow('Employees', [
    code,
    empData.name || '',
    empData.role || 'Engineer',
    empData.department || 'General',
    'TRUE',
    now,
  ]);

  return { success: true, message: `Employee "${code}" added successfully.` };
}

/**
 * Adds a new inventory item.
 */
export async function addNewInventoryItem(itemData) {
  if (!itemData.componentName || String(itemData.componentName).trim() === '') {
    return { success: false, message: 'Component name is required.' };
  }

  const itemId = await generateNextId('ITM', 'NEXT_ITEM_ID');
  const quantity = parseInt(itemData.quantity || '0', 10);
  const minStock = parseInt(itemData.minStock || '5', 10);
  const unitCost = parseFloat(itemData.unitCost || '0');

  let status = 'In Stock';
  if (quantity <= 0) status = 'Out of Stock';
  else if (quantity <= minStock) status = 'Low Stock';

  await appendRow('Inventory', [
    itemId,
    itemData.componentName,
    itemData.partNumber || '',
    itemData.category || 'Other',
    itemData.type || 'Component',
    quantity,
    minStock,
    itemData.unit || 'pcs',
    unitCost,
    itemData.locationId || '',
    itemData.storageType || '',
    '', // Last Action
    '', // Last Employee
    '', // Last Timestamp
    itemData.notes || '',
    status,
  ]);

  return { success: true, message: `Item "${itemData.componentName}" added as ${itemId}.` };
}
