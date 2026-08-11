/**
 * ============================================================
 * JEDLIK MOTORS — INVENTORY MANAGEMENT SYSTEM
 * Google Sheets API Client
 * ============================================================
 *
 * Centralized Google Sheets authentication and helper functions.
 * Uses a service account for server-side access.
 */

import { google } from 'googleapis';

// Cache the auth client and sheets instance
let sheetsClient = null;

/**
 * Returns an authenticated Google Sheets API client.
 * Uses service account credentials from environment variables.
 */
async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const authClient = await auth.getClient();
  sheetsClient = google.sheets({ version: 'v4', auth: authClient });
  return sheetsClient;
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

/**
 * Reads all data from a sheet tab.
 * Returns { headers: string[], rows: any[][] }
 */
export async function readSheet(sheetName) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'`,
  });

  const values = response.data.values || [];
  if (values.length === 0) return { headers: [], rows: [] };

  return {
    headers: values[0],
    rows: values.slice(1),
  };
}

/**
 * Reads data from a specific range.
 */
export async function readRange(range) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  return response.data.values || [];
}

/**
 * Appends a row to a sheet.
 */
export async function appendRow(sheetName, values) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [values],
    },
  });
}

/**
 * Appends multiple rows to a sheet.
 */
export async function appendRows(sheetName, rows) {
  if (!rows || rows.length === 0) return;
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: rows,
    },
  });
}

/**
 * Updates a specific cell or range.
 */
export async function updateRange(range, values) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });
}

/**
 * Updates a single cell value.
 */
export async function updateCell(sheetName, row, col, value) {
  const colLetter = columnToLetter(col);
  const range = `'${sheetName}'!${colLetter}${row}`;
  await updateRange(range, [[value]]);
}

/**
 * Batch update multiple cells.
 * updates: Array of { sheetName, row, col, value }
 */
export async function batchUpdate(updates) {
  if (!updates || updates.length === 0) return;

  const sheets = await getSheetsClient();
  const data = updates.map((u) => ({
    range: `'${u.sheetName}'!${columnToLetter(u.col)}${u.row}`,
    values: [[u.value]],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });
}

/**
 * Converts rows array to array of objects using headers.
 */
export function rowsToObjects(headers, rows) {
  return rows
    .filter((row) => row[0] && String(row[0]).trim() !== '')
    .map((row, index) => {
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j] !== undefined ? row[j] : '';
      }
      obj._rowIndex = index + 2; // 1-indexed, skip header
      return obj;
    });
}

/**
 * Converts a 1-indexed column number to a letter (1='A', 2='B', 27='AA').
 */
function columnToLetter(col) {
  let letter = '';
  let temp = col;
  while (temp > 0) {
    temp--;
    letter = String.fromCharCode(65 + (temp % 26)) + letter;
    temp = Math.floor(temp / 26);
  }
  return letter;
}

/**
 * Gets a config value from the Config sheet.
 */
export async function getConfigValue(key) {
  const { headers, rows } = await readSheet('Config');
  for (const row of rows) {
    if (row[0] === key) return String(row[1] || '');
  }
  return '';
}

/**
 * Sets a config value in the Config sheet.
 */
export async function setConfigValue(key, value) {
  const { headers, rows } = await readSheet('Config');
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === key) {
      await updateCell('Config', i + 2, 2, value);
      return;
    }
  }
  // Key not found, append it
  await appendRow('Config', [key, value]);
}
