import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseLocationFromQr } from './qr-parse.mjs';

// Payload produced by lib/qr-service.js for a real location.
const REAL = 'https://inventory.jedlik.in/scan?location=BX-01-01';

test('extracts the location from a generated QR URL', () => {
  assert.equal(parseLocationFromQr(REAL), 'BX-01-01');
});

test('uppercases a lowercase location param', () => {
  assert.equal(
    parseLocationFromQr('https://inventory.jedlik.in/scan?location=bx-01-01'),
    'BX-01-01'
  );
});

test('decodes a percent-encoded location param', () => {
  assert.equal(
    parseLocationFromQr('https://inventory.jedlik.in/scan?location=BX%2D01'),
    'BX-01'
  );
});

test('works regardless of host, so staging and localhost QRs still scan', () => {
  assert.equal(parseLocationFromQr('http://localhost:3000/scan?location=DR-04'), 'DR-04');
});

test('tolerates extra query params and fragments', () => {
  assert.equal(
    parseLocationFromQr('https://inventory.jedlik.in/scan?ref=x&location=SH-9#top'),
    'SH-9'
  );
});

test('accepts a bare location ID, for QRs that encode only the code', () => {
  assert.equal(parseLocationFromQr('BX-01-01'), 'BX-01-01');
  assert.equal(parseLocationFromQr('  bx-01-01  '), 'BX-01-01');
});

test('rejects a URL that carries no location param', () => {
  assert.equal(parseLocationFromQr('https://inventory.jedlik.in/scan'), null);
  assert.equal(parseLocationFromQr('https://inventory.jedlik.in/scan?location='), null);
});

test('rejects an unrelated URL, e.g. a QR from some other product', () => {
  assert.equal(parseLocationFromQr('https://example.com/promo'), null);
  assert.equal(parseLocationFromQr('https://wifi.example.com/?ssid=guest'), null);
});

test('rejects free text, which is what most stray QRs contain', () => {
  assert.equal(parseLocationFromQr('Hello world'), null);
  assert.equal(parseLocationFromQr('WIFI:S:MyNet;T:WPA;P:secret;;'), null);
});

test('rejects empty and non-string input', () => {
  for (const bad of ['', '   ', null, undefined, 42, {}]) {
    assert.equal(parseLocationFromQr(bad), null);
  }
});

test('rejects an implausibly long payload rather than querying with it', () => {
  assert.equal(parseLocationFromQr('A'.repeat(200)), null);
});
