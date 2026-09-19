import { NextResponse } from 'next/server';
import { getAllTransactions, getAllEmployees } from '@/lib/sheets-service';
import { computeOpenHoldings } from '@/lib/returns-service.mjs';

/**
 * GET /api/returns
 *
 * Returns the per-employee open-holdings list, derived from Transaction
 * History. Optional ?employee=EMP001 query narrows the response to that
 * one employee; without it, all employees with open holdings are returned.
 *
 * Response:
 *   { holdings: [{ employeeCode, employeeName, items: [{ itemId, componentName, locationId, qty, lastTakenAt }] }] }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeFilter = searchParams.get('employee');

    const [transactions, employees] = await Promise.all([
      getAllTransactions(),
      getAllEmployees(),
    ]);

    let holdings = computeOpenHoldings(transactions);

    // Backfill any missing employee names from the Employees sheet (the
    // ledger falls back to the most recent name in transaction history,
    // but that's empty until an employee has transacted at least once).
    const empNameByCode = new Map();
    for (const e of employees) {
      const code = String(e['Employee Code'] || '').trim();
      const name = String(e['Name'] || '').trim();
      if (code) empNameByCode.set(code, name);
    }
    for (const group of holdings) {
      if (!group.employeeName && empNameByCode.has(group.employeeCode)) {
        group.employeeName = empNameByCode.get(group.employeeCode);
      }
    }

    if (employeeFilter) {
      const code = String(employeeFilter).trim().toUpperCase();
      holdings = holdings.filter((g) => g.employeeCode === code);
    }

    return NextResponse.json({ holdings });
  } catch (error) {
    console.error('GET /api/returns error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
