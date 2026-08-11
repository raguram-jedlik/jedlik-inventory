/**
 * ============================================================
 * JEDLIK MOTORS — INVENTORY MANAGEMENT SYSTEM
 * Dashboard Service
 * ============================================================
 *
 * Computes dashboard metrics and report data.
 * Port of DashboardService.gs to Next.js.
 */

import { readSheet, rowsToObjects } from './sheets';
import { getAllInventory, getAllLocations, getRecentTransactions } from './sheets-service';

/**
 * Returns all dashboard data in a single call.
 */
export async function getDashboardData() {
  const inventory = await getAllInventory();
  const locations = await getAllLocations();
  const recentTxns = await getRecentTransactions(25);

  // Compute KPIs
  let totalQuantity = 0;
  let totalValue = 0;
  const lowStockItems = [];
  const outOfStockItems = [];
  const categoryBreakdown = {};
  const typeBreakdown = { Component: 0, Tool: 0, Consumable: 0 };

  for (const item of inventory) {
    const qty = parseInt(item['Quantity'], 10) || 0;
    const minStock = parseInt(item['Min Stock'], 10) || 5;
    const unitCost = parseFloat(item['Unit Cost (₹)']) || 0;

    totalQuantity += qty;
    totalValue += qty * unitCost;

    if (qty <= 0) {
      outOfStockItems.push({
        itemId: item['Item ID'],
        name: item['Component Name'],
        location: item['Location ID'],
        quantity: qty,
      });
    } else if (qty <= minStock) {
      lowStockItems.push({
        itemId: item['Item ID'],
        name: item['Component Name'],
        location: item['Location ID'],
        quantity: qty,
        minStock,
      });
    }

    const cat = item['Category'] || 'Other';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;

    const type = item['Type'] || 'Component';
    if (typeBreakdown[type] !== undefined) {
      typeBreakdown[type]++;
    }
  }

  // Most used components (from transaction history)
  const { headers: txnHeaders, rows: txnData } = await readSheet('Transaction History');
  const componentUsage = {};
  const activeEmployeeSet = {};
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (txnData.length > 0) {
    const txnNameIdx = txnHeaders.indexOf('Component Name');
    const txnQtyIdx = txnHeaders.indexOf('Quantity');
    const txnActionIdx = txnHeaders.indexOf('Action');
    const txnEmpIdx = txnHeaders.indexOf('Employee Code');
    const txnDateIdx = txnHeaders.indexOf('Timestamp');

    for (const row of txnData) {
      const compName = String(row[txnNameIdx] || '');
      const txnQty = parseInt(row[txnQtyIdx], 10) || 0;
      const action = String(row[txnActionIdx] || '');

      if (action === 'Take' || action === 'Expense') {
        componentUsage[compName] = (componentUsage[compName] || 0) + txnQty;
      }

      const txnDate = row[txnDateIdx] ? new Date(row[txnDateIdx]) : null;
      if (txnDate && txnDate >= thirtyDaysAgo) {
        activeEmployeeSet[String(row[txnEmpIdx])] = true;
      }
    }
  }

  // Sort most used components
  const topComponents = Object.entries(componentUsage)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const activeEmployees = Object.keys(activeEmployeeSet);

  // Recent transactions breakdown
  const recentTakes = recentTxns.filter((t) => t['Action'] === 'Take').slice(0, 5);
  const recentReturns = recentTxns.filter((t) => t['Action'] === 'Return').slice(0, 5);
  const recentExpenses = recentTxns.filter((t) => t['Action'] === 'Expense').slice(0, 5);

  // Category breakdown as array
  const categoryArr = Object.entries(categoryBreakdown)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    kpi: {
      totalItems: inventory.length,
      totalQuantity,
      totalLocations: locations.length,
      totalValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      activeEmployees: activeEmployees.length,
    },
    lowStock: lowStockItems,
    outOfStock: outOfStockItems,
    recentTransactions: recentTxns,
    recentTakes,
    recentReturns,
    recentExpenses,
    topComponents,
    categoryBreakdown: categoryArr,
    typeBreakdown,
    activeEmployeesList: activeEmployees,
  };
}

/**
 * Generates report data based on type and optional date range.
 */
export async function getReportData(reportType, startDate, endDate) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(23, 59, 59, 999);

  switch (reportType) {
    case 'inventory_movement':
      return reportInventoryMovement(start, end);
    case 'employee_usage':
      return reportEmployeeUsage(start, end);
    case 'monthly_consumption':
      return reportMonthlyConsumption(start, end);
    case 'stock_value':
      return reportStockValue();
    case 'low_stock':
      return reportLowStock();
    case 'fast_moving':
      return reportFastMoving(start, end);
    case 'slow_moving':
      return reportSlowMoving(start, end);
    default:
      return { columns: [], rows: [], title: 'Unknown Report Type' };
  }
}

// ── Private Report Generators ──────────────────────────────

async function getFilteredTransactions(start, end) {
  const { headers, rows } = await readSheet('Transaction History');
  const tsIdx = headers.indexOf('Timestamp');

  const txns = [];
  for (const row of rows) {
    if (!row[0] || String(row[0]).trim() === '') continue;

    if (tsIdx !== -1 && row[tsIdx]) {
      const txnDate = new Date(row[tsIdx]);
      if (!isNaN(txnDate.getTime())) {
        if (start && txnDate < start) continue;
        if (end && txnDate > end) continue;
      }
    }

    const txn = {};
    for (let j = 0; j < headers.length; j++) {
      txn[headers[j]] = row[j] !== undefined ? row[j] : '';
    }
    txns.push(txn);
  }

  return txns;
}

function formatDateStr(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toISOString().split('T')[0];
  } catch {
    return String(dateStr);
  }
}

async function reportInventoryMovement(start, end) {
  const txns = await getFilteredTransactions(start, end);
  return {
    title: 'Inventory Movement Report',
    columns: ['Date', 'Time', 'Employee', 'Location', 'Item', 'Qty', 'Action', 'Remarks'],
    rows: txns.map((t) => [
      t['Date'] || formatDateStr(t['Timestamp']),
      t['Time'] || '',
      t['Employee Name'] || t['Employee Code'],
      t['Location ID'],
      t['Component Name'],
      t['Quantity'],
      t['Action'],
      t['Remarks'],
    ]),
  };
}

async function reportEmployeeUsage(start, end) {
  const txns = await getFilteredTransactions(start, end);
  const usage = {};

  for (const t of txns) {
    const emp = t['Employee Code'] + ' (' + (t['Employee Name'] || '') + ')';
    if (!usage[emp]) usage[emp] = { take: 0, return_: 0, expense: 0, total: 0 };
    const qty = parseInt(t['Quantity'], 10) || 0;
    switch (t['Action']) {
      case 'Take': usage[emp].take += qty; break;
      case 'Return': usage[emp].return_ += qty; break;
      case 'Expense': usage[emp].expense += qty; break;
    }
    usage[emp].total += qty;
  }

  const rows = Object.entries(usage)
    .map(([emp, u]) => [emp, u.take, u.return_, u.expense, u.total])
    .sort((a, b) => b[4] - a[4]);

  return {
    title: 'Employee Usage Report',
    columns: ['Employee', 'Items Taken', 'Items Returned', 'Items Expensed', 'Total Transactions'],
    rows,
  };
}

async function reportMonthlyConsumption(start, end) {
  const txns = await getFilteredTransactions(start, end);
  const consumption = {};

  for (const t of txns) {
    if (t['Action'] === 'Expense' || t['Action'] === 'Take') {
      const name = t['Component Name'];
      const qty = parseInt(t['Quantity'], 10) || 0;
      if (!consumption[name]) consumption[name] = { take: 0, expense: 0 };
      if (t['Action'] === 'Take') consumption[name].take += qty;
      if (t['Action'] === 'Expense') consumption[name].expense += qty;
    }
  }

  const rows = Object.entries(consumption)
    .map(([name, c]) => [name, c.take, c.expense, c.take + c.expense])
    .sort((a, b) => b[3] - a[3]);

  return {
    title: 'Monthly Consumption Report',
    columns: ['Component', 'Taken', 'Expensed', 'Total Used'],
    rows,
  };
}

async function reportStockValue() {
  const inventory = await getAllInventory();
  let totalValue = 0;

  const rows = inventory.map((item) => {
    const qty = parseInt(item['Quantity'], 10) || 0;
    const cost = parseFloat(item['Unit Cost (₹)']) || 0;
    const value = qty * cost;
    totalValue += value;

    return [
      item['Item ID'], item['Component Name'], item['Category'],
      qty, item['Unit'], '₹' + cost.toFixed(2), '₹' + value.toFixed(2),
      item['Location ID'],
    ];
  });

  rows.sort((a, b) => parseFloat(b[6].replace('₹', '')) - parseFloat(a[6].replace('₹', '')));
  rows.push(['', '', 'TOTAL', '', '', '', '₹' + totalValue.toFixed(2), '']);

  return {
    title: 'Stock Value Report',
    columns: ['Item ID', 'Component', 'Category', 'Qty', 'Unit', 'Unit Cost', 'Total Value', 'Location'],
    rows,
  };
}

async function reportLowStock() {
  const inventory = await getAllInventory();
  const rows = [];

  for (const item of inventory) {
    const qty = parseInt(item['Quantity'], 10) || 0;
    const minStock = parseInt(item['Min Stock'], 10) || 5;

    if (qty <= minStock) {
      rows.push([
        item['Item ID'], item['Component Name'], item['Category'],
        qty, minStock, item['Unit'], item['Location ID'],
        qty <= 0 ? '🔴 OUT' : '🟡 LOW',
      ]);
    }
  }

  rows.sort((a, b) => a[3] - b[3]);

  return {
    title: 'Low Stock Report',
    columns: ['Item ID', 'Component', 'Category', 'Current Qty', 'Min Stock', 'Unit', 'Location', 'Status'],
    rows,
  };
}

async function reportFastMoving(start, end) {
  const txns = await getFilteredTransactions(start, end);
  const movement = {};

  for (const t of txns) {
    const name = t['Component Name'];
    const qty = parseInt(t['Quantity'], 10) || 0;
    if (!movement[name]) movement[name] = { txnCount: 0, totalQty: 0, itemId: t['Item ID'] };
    movement[name].txnCount++;
    movement[name].totalQty += qty;
  }

  const rows = Object.entries(movement)
    .map(([name, m]) => [m.itemId, name, m.txnCount, m.totalQty])
    .sort((a, b) => b[2] - a[2])
    .slice(0, 30);

  return {
    title: 'Fast Moving Items',
    columns: ['Item ID', 'Component', 'Transaction Count', 'Total Quantity Moved'],
    rows,
  };
}

async function reportSlowMoving(start, end) {
  const inventory = await getAllInventory();
  const txns = await getFilteredTransactions(start, end);

  const movedItems = new Set(txns.map((t) => t['Item ID']));

  const rows = inventory
    .filter((item) => !movedItems.has(item['Item ID']))
    .map((item) => [
      item['Item ID'], item['Component Name'], item['Category'],
      parseInt(item['Quantity'], 10) || 0, item['Location ID'],
      item['Last Action'] || 'Never', formatDateStr(item['Last Timestamp']),
    ]);

  return {
    title: 'Slow Moving Items (No Activity in Period)',
    columns: ['Item ID', 'Component', 'Category', 'Qty', 'Location', 'Last Action', 'Last Activity'],
    rows,
  };
}
