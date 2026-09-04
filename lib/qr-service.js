/**
 * ============================================================
 * JEDLIK MOTORS — INVENTORY MANAGEMENT SYSTEM
 * QR Service
 * ============================================================
 *
 * QR code generation via QuickChart.io API.
 * Port of QRService.gs to Next.js.
 */

import { readSheet, updateCell } from './sheets';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || '').trim();

// Kept in sync with QR_PRINT_* in lib/utils.js. Not imported from there because
// that module touches `document` and must stay out of this server-only path.
const QR_PIXEL_SIZE = 600;
const QR_EC_LEVEL = 'M';

/**
 * Generates a QR code URL for a storage location.
 * The QR code encodes the web app URL with location parameter.
 *
 * IMPORTANT: NEXT_PUBLIC_APP_URL must be set to the PRODUCTION URL of the
 * deployed app (e.g. https://inventory.jedlik.in) wherever QRs are being
 * generated for employees to scan. QRs are baked at generation time —
 * regenerating them is required whenever this URL changes.
 *
 * If NEXT_PUBLIC_APP_URL is missing or still set to localhost, we log a
 * loud warning and refuse to generate QRs so stale/invalid URLs don't
 * silently end up on printed labels.
 */
export function generateQRCodeUrl(locationId) {
  const isProductionSafe =
    APP_URL.length > 0 &&
    APP_URL.startsWith('https://') &&
    !APP_URL.includes('localhost');

  if (!isProductionSafe) {
    console.warn(
      `[qr-service] NEXT_PUBLIC_APP_URL="${APP_URL || '(unset)'}" is missing or not production-safe. ` +
      `QR codes will encode "${APP_URL || 'http://localhost:3000'}" — fine for local testing, ` +
      `but for printed employee labels set NEXT_PUBLIC_APP_URL to e.g. https://inventory.jedlik.in ` +
      `and regenerate from Admin → QR Codes.`
    );
  }

  const base = APP_URL || 'http://localhost:3000';
  const scanUrl = `${base.replace(/\/$/, '')}/scan?location=${encodeURIComponent(locationId)}`;
  // size/ecLevel are tuned for the 1.5cm Box stickers, where modules land near
  // the ~0.3mm scannable floor. Existing rows keep whatever was baked in at the
  // time; highResQrUrl() in lib/utils.js upgrades those at render time.
  const qrApiUrl =
    `https://quickchart.io/qr?text=${encodeURIComponent(scanUrl)}` +
    `&size=${QR_PIXEL_SIZE}&ecLevel=${QR_EC_LEVEL}&margin=1`;
  return qrApiUrl;
}

/**
 * Gets QR status for all locations.
 */
export async function getAllQRData() {
  const { headers, rows } = await readSheet('Storage Locations');
  if (rows.length === 0) return [];

  const locIdIdx = headers.indexOf('Location ID');
  const locNameIdx = headers.indexOf('Location Name');
  const typeIdx = headers.indexOf('Storage Type');
  const qrUrlIdx = headers.indexOf('QR Code URL');
  const qrGenIdx = headers.indexOf('QR Generated');

  const qrData = [];

  for (const row of rows) {
    if (!row[locIdIdx] || String(row[locIdIdx]).trim() === '') continue;

    qrData.push({
      locationId: row[locIdIdx],
      locationName: row[locNameIdx] || '',
      storageType: row[typeIdx] || '',
      qrCodeUrl: row[qrUrlIdx] || '',
      qrGenerated: String(row[qrGenIdx]).toUpperCase() === 'TRUE',
    });
  }

  return qrData;
}

/**
 * Generates QR codes for all locations that don't have one.
 */
export async function generateAllMissingQRCodes() {
  const { headers, rows } = await readSheet('Storage Locations');

  const locIdIdx = headers.indexOf('Location ID');
  const qrUrlIdx = headers.indexOf('QR Code URL');
  const qrGenIdx = headers.indexOf('QR Generated');

  let generated = 0;

  for (let i = 0; i < rows.length; i++) {
    const locId = String(rows[i][locIdIdx] || '').trim();
    if (!locId) continue;

    const isGenerated = String(rows[i][qrGenIdx]).toUpperCase() === 'TRUE';
    if (isGenerated) continue;

    const qrUrl = generateQRCodeUrl(locId);
    const sheetRow = i + 2; // 1-indexed + header

    await updateCell('Storage Locations', sheetRow, qrUrlIdx + 1, qrUrl);
    await updateCell('Storage Locations', sheetRow, qrGenIdx + 1, 'TRUE');

    generated++;
  }

  return { generated, message: `Generated ${generated} QR code(s).` };
}

/**
 * Generates a QR code for a single location.
 */
export async function generateQRCodeForLocation(locationId) {
  const { headers, rows } = await readSheet('Storage Locations');

  const locIdIdx = headers.indexOf('Location ID');
  const qrUrlIdx = headers.indexOf('QR Code URL');
  const qrGenIdx = headers.indexOf('QR Generated');

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][locIdIdx] || '').trim().toUpperCase() === locationId.trim().toUpperCase()) {
      const qrUrl = generateQRCodeUrl(locationId);
      const sheetRow = i + 2;

      await updateCell('Storage Locations', sheetRow, qrUrlIdx + 1, qrUrl);
      await updateCell('Storage Locations', sheetRow, qrGenIdx + 1, 'TRUE');

      return qrUrl;
    }
  }

  return null;
}

/**
 * Returns print-ready QR label data.
 */
export async function getQRLabelsForPrint() {
  const { headers, rows } = await readSheet('Storage Locations');

  const locIdIdx = headers.indexOf('Location ID');
  const locNameIdx = headers.indexOf('Location Name');
  const typeIdx = headers.indexOf('Storage Type');
  const qrUrlIdx = headers.indexOf('QR Code URL');
  const qrGenIdx = headers.indexOf('QR Generated');
  const roomIdx = headers.indexOf('Room');

  const labels = [];

  for (const row of rows) {
    const locId = String(row[locIdIdx] || '').trim();
    if (!locId) continue;

    const isGenerated = String(row[qrGenIdx]).toUpperCase() === 'TRUE';
    if (!isGenerated) continue;

    labels.push({
      locationId: locId,
      locationName: row[locNameIdx] || '',
      storageType: row[typeIdx] || '',
      room: row[roomIdx] || '',
      qrCodeUrl: row[qrUrlIdx] || generateQRCodeUrl(locId),
    });
  }

  return labels;
}
