/**
 * ============================================================
 * JEDLIK MOTORS — INVENTORY MANAGEMENT SYSTEM
 * Notification Service
 * ============================================================
 *
 * Alert and validation checks.
 * Port of NotificationService.gs to Next.js.
 */

import { getAllInventory, getAllLocations } from './sheets-service';

/**
 * Returns all system alerts.
 */
export async function getAlerts() {
  const inventory = await getAllInventory();
  const locations = await getAllLocations();

  const negativeInventory = [];
  const outOfStock = [];
  const lowStock = [];
  const missingQR = [];
  const duplicateLocations = [];

  // Check inventory alerts
  for (const item of inventory) {
    const qty = parseInt(item['Quantity'], 10) || 0;
    const minStock = parseInt(item['Min Stock'], 10) || 5;

    if (qty < 0) {
      negativeInventory.push({
        name: item['Component Name'],
        location: item['Location ID'],
        quantity: qty,
      });
    } else if (qty === 0) {
      outOfStock.push({
        name: item['Component Name'],
        location: item['Location ID'],
        quantity: qty,
      });
    } else if (qty <= minStock) {
      lowStock.push({
        name: item['Component Name'],
        location: item['Location ID'],
        quantity: qty,
        minStock,
      });
    }
  }

  // Check location alerts
  const locationIds = new Set();
  const dupes = new Set();

  for (const loc of locations) {
    const locId = String(loc['Location ID']).trim().toUpperCase();

    if (locationIds.has(locId)) {
      dupes.add(locId);
    } else {
      locationIds.add(locId);
    }

    const qrGenerated = String(loc['QR Generated']).toUpperCase() === 'TRUE';
    if (!qrGenerated) {
      missingQR.push(locId);
    }
  }

  const totalAlerts =
    negativeInventory.length +
    outOfStock.length +
    lowStock.length +
    dupes.size +
    missingQR.length;

  return {
    totalAlerts,
    negativeInventory,
    outOfStock,
    lowStock,
    duplicateLocations: Array.from(dupes),
    missingQR,
  };
}
