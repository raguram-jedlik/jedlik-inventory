'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useLoading } from '@/components/LoadingOverlay';
import { PageBrand } from '@/components/Navbar';
import ConfirmModal from '@/components/ConfirmModal';
import QrScanner from '@/components/QrScanner';
import { callApi, escapeHtml } from '@/lib/utils';
import { parseLocationFromQr } from '@/lib/qr-parse.mjs';

const STEPS = [
  { key: 'location', label: 'Location', n: 1 },
  { key: 'employee', label: 'Employee', n: 2 },
  { key: 'action', label: 'Action', n: 3 },
  { key: 'items', label: 'Items', n: 4 },
];

function ScanPageInner() {
  const searchParams = useSearchParams();
  const showToast = useToast();
  const { showLoading, hideLoading } = useLoading();

  const [locationId, setLocationId] = useState(searchParams.get('location') || '');
  const [location, setLocation] = useState(null);
  const [items, setItems] = useState([]);
  const [empCode, setEmpCode] = useState('');
  const [empValidation, setEmpValidation] = useState(null);
  const [action, setAction] = useState('');
  const [quantities, setQuantities] = useState({});
  const [remarks, setRemarks] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [step, setStep] = useState('location');

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  // Auto-load location from URL
  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc) {
      setLocationId(loc);
      loadLocation(loc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function loadLocation(id) {
    try {
      const locItems = await callApi(`/api/inventory?location=${encodeURIComponent(id)}`);
      setItems(locItems);

      const allLocs = await callApi('/api/locations');
      const loc = allLocs.find((l) => (l['Location ID'] || '').toUpperCase() === id.toUpperCase());
      setLocation(loc || { 'Location ID': id });
      setStep('employee');
    } catch (err) {
      showToast('Failed to load location: ' + err.message, 'error');
    }
  }

  async function handleLocationSubmit() {
    if (!locationId.trim()) {
      showToast('Enter a location ID', 'warning');
      return;
    }
    await loadLocation(locationId.trim().toUpperCase());
  }

  /**
   * Handles a decoded QR payload. Returning false tells QrScanner to keep the
   * camera running, which is what we want for a QR that is not one of ours —
   * closing on every stray code would be maddening in a workshop.
   */
  function handleQrDetected(text) {
    const scannedId = parseLocationFromQr(text);
    if (!scannedId) {
      showToast('That QR code is not a location code. Try another.', 'warning');
      return false;
    }

    setShowScanner(false);
    setLocationId(scannedId);
    loadLocation(scannedId);
    return true;
  }

  async function handleValidateEmployee() {
    if (!empCode.trim()) {
      showToast('Enter your employee code', 'warning');
      return;
    }

    try {
      const result = await callApi('/api/employees/validate', {
        method: 'POST',
        body: { employeeCode: empCode.trim() },
      });
      setEmpValidation(result);

      if (result.valid) {
        showToast(result.message, 'success');
        setStep('action');
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) {
      showToast('Validation failed: ' + err.message, 'error');
    }
  }

  function handleActionSelect(selectedAction) {
    setAction(selectedAction);
    setStep('items');

    const initialQty = {};
    items.forEach((item) => {
      initialQty[item['Item ID']] = 0;
    });
    setQuantities(initialQty);
  }

  function updateQty(itemId, delta) {
    setQuantities((prev) => {
      const current = prev[itemId] || 0;
      const item = items.find((i) => i['Item ID'] === itemId);
      const available = parseInt(item?.['Quantity'], 10) || 0;
      let newVal = current + delta;

      if (newVal < 0) newVal = 0;
      if ((action === 'Take' || action === 'Expense') && newVal > available) {
        newVal = available;
      }

      return { ...prev, [itemId]: newVal };
    });
  }

  function setQty(itemId, value) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    const item = items.find((i) => i['Item ID'] === itemId);
    const available = parseInt(item?.['Quantity'], 10) || 0;

    let finalVal = num;
    if ((action === 'Take' || action === 'Expense') && finalVal > available) {
      finalVal = available;
    }

    setQuantities((prev) => ({ ...prev, [itemId]: finalVal }));
  }

  function getSelectedItems() {
    return items.filter((item) => (quantities[item['Item ID']] || 0) > 0);
  }

  function handleSubmitClick() {
    const selected = getSelectedItems();
    if (selected.length === 0) {
      showToast('Select at least one item', 'warning');
      return;
    }
    setShowConfirm(true);
  }

  async function handleConfirmTransaction() {
    setShowConfirm(false);
    showLoading('Processing transaction...');

    const txnItems = getSelectedItems().map((item) => ({
      itemId: item['Item ID'],
      quantity: quantities[item['Item ID']],
      remarks: remarks[item['Item ID']] || '',
    }));

    try {
      const result = await callApi('/api/transactions', {
        method: 'POST',
        body: {
          employeeCode: empCode.trim().toUpperCase(),
          locationId: locationId.trim().toUpperCase(),
          action,
          items: txnItems,
        },
      });

      hideLoading();

      if (result.success) {
        showToast(result.message, 'success');
        const updatedItems = await callApi(`/api/inventory?location=${encodeURIComponent(locationId)}`);
        setItems(updatedItems);
        const resetQty = {};
        updatedItems.forEach((item) => {
          resetQty[item['Item ID']] = 0;
        });
        setQuantities(resetQty);
        setRemarks({});
      } else {
        showToast(result.message, 'warning');
        result.results?.forEach((r) => {
          if (!r.success) showToast(r.message, 'error');
        });
      }
    } catch (err) {
      hideLoading();
      showToast('Transaction failed: ' + err.message, 'error');
    }
  }

  const selectedItems = getSelectedItems();
  // Built as an HTML string for ConfirmModal's dangerouslySetInnerHTML, so every
  // sheet-sourced value must be escaped before it lands in the markup.
  const confirmBody = selectedItems
    .map((item) => {
      const partNumber = item['Part Number']
        ? `<div style="color:#8a8a8a;font-family:'JetBrains Mono',monospace;font-size:0.75rem;margin-top:2px;">PN: ${escapeHtml(item['Part Number'])}</div>`
        : `<div style="color:#5a5a5a;font-size:0.75rem;margin-top:2px;">No part number</div>`;

      return `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px solid #1f1f1f;">
          <div style="min-width:0;">
            <div style="color:#e8e8e8;">${escapeHtml(item['Component Name'])}</div>
            ${partNumber}
          </div>
          <strong style="color:#fff;font-family:'JetBrains Mono',monospace;white-space:nowrap;">${quantities[item['Item ID']]} ${escapeHtml(item['Unit'] || 'pcs')}</strong>
        </div>`;
    })
    .join('');

  return (
    <>
      {/* Header — Jedlik logo + scan-specific title */}
      <div className="page-header animate-in">
        <PageBrand size="md" />
        <h1 className="page-title">Scan &amp; Transact</h1>
        <p className="page-subtitle">
          {step === 'location' && 'Scan a QR code or enter a storage location to begin.'}
          {step === 'employee' && 'Verify your identity with your employee code.'}
          {step === 'action' && 'What are you doing with these items?'}
          {step === 'items' && `${action} items from ${locationId}`}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="scan-progress animate-in" aria-label="Progress">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`scan-progress-step ${
              i < currentStepIndex ? 'done' : i === currentStepIndex ? 'active' : ''
            }`}
          />
        ))}
      </div>

      {/* Step 1: Location */}
      {step === 'location' && (
        <div className="card animate-in">
          <div className="section-header">
            <h2 className="section-title">📍 Location</h2>
          </div>
          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={() => setShowScanner(true)}
          >
            📷 Scan QR Code
          </button>

          <div className="or-divider"><span>or type it</span></div>

          <div className="form-group">
            <label className="form-label" htmlFor="loc-input">
              Location ID
            </label>
            <input
              id="loc-input"
              type="text"
              className="form-input scan-input-hero"
              placeholder="BX-01-01"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleLocationSubmit()}
              inputMode="text"
              autoCapitalize="characters"
            />
            <p className="form-hint">
              Type the code printed on the box / drawer / shelf.
            </p>
          </div>
          <button className="btn btn-secondary btn-block" onClick={handleLocationSubmit}>
            Load Location →
          </button>
        </div>
      )}

      {/* Step 2: Employee */}
      {step === 'employee' && location && (
        <>
          <div className="location-card animate-in">
            <div className="location-id">{location['Location ID']}</div>
            <div className="location-name">{location['Location Name'] || ''}</div>
            <div className="location-tags">
              {location['Storage Type'] && <span className="location-tag">{location['Storage Type']}</span>}
              {location['Room'] && <span className="location-tag">{location['Room']}</span>}
              <span className="location-tag">{items.length} items</span>
            </div>
          </div>

          <div className="card animate-in">
            <div className="section-header">
              <h2 className="section-title">👤 Employee</h2>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="emp-input">
                Your employee code
              </label>
              <input
                id="emp-input"
                type="text"
                className={`form-input scan-input-hero employee ${empValidation ? (empValidation.valid ? 'success' : 'error') : ''}`}
                placeholder="EMP001"
                value={empCode}
                onChange={(e) => setEmpCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleValidateEmployee()}
                autoFocus
                autoCapitalize="characters"
              />
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={handleValidateEmployee}>
              Verify &amp; Continue →
            </button>
            <button
              className="btn btn-ghost btn-block mt-md"
              onClick={() => {
                setLocation(null);
                setStep('location');
                setEmpCode('');
                setEmpValidation(null);
              }}
            >
              ← Change location
            </button>
          </div>
        </>
      )}

      {/* Step 3: Action */}
      {step === 'action' && (
        <>
          <div className="location-card animate-in">
            <div className="location-id">{locationId}</div>
            <div className="location-name">
              Welcome, <strong style={{ color: 'var(--text-primary)' }}>{empValidation?.name}</strong> ({empCode})
            </div>
          </div>

          <div className="card animate-in">
            <div className="section-header">
              <h2 className="section-title">What are you doing?</h2>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              <button
                className="action-hero take"
                onClick={() => handleActionSelect('Take')}
                aria-label="Take items from this location"
              >
                <div className="action-hero-icon" aria-hidden="true">↗</div>
                <div>
                  <div className="action-hero-label">Take Items</div>
                  <div className="action-hero-desc">
                    Borrow components or tools. Stock will be debited from {locationId}.
                  </div>
                </div>
              </button>

              <button
                className="action-hero return"
                onClick={() => handleActionSelect('Return')}
                aria-label="Return items to this location"
              >
                <div className="action-hero-icon" aria-hidden="true">↙</div>
                <div>
                  <div className="action-hero-label">Return Items</div>
                  <div className="action-hero-desc">
                    Put components or tools back. Stock will be credited to {locationId}.
                  </div>
                </div>
              </button>

              <button
                className="action-hero expense"
                onClick={() => handleActionSelect('Expense')}
                aria-label="Mark items as consumed or written off"
              >
                <div className="action-hero-icon" aria-hidden="true">{"\ud83d\udcb8"}</div>
                <div>
                  <div className="action-hero-label">Expense Items</div>
                  <div className="action-hero-desc">
                    Consumed, broken, or written off. Stock reduced permanently.
                  </div>
                </div>
              </button>
            </div>

            <button
              className="btn btn-ghost btn-block mt-lg"
              onClick={() => setStep('employee')}
            >
              ← Change employee
            </button>
          </div>
        </>
      )}

      {/* Step 4: Items */}
      {step === 'items' && (
        <>
          <div className="location-card animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="location-id">{locationId}</div>
                <div className="location-name">{empValidation?.name} · {empCode}</div>
              </div>
              <span className={`action-pill ${action.toLowerCase()}`} style={{ fontSize: '0.8rem', padding: '8px 14px' }}>
                {action}
              </span>
            </div>
          </div>

          <div className="card animate-in">
            <div className="section-header">
              <h2 className="section-title">Select Items</h2>
              <span className="section-count">{items.length} items</span>
            </div>

            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <div className="empty-text">No items at this location</div>
              </div>
            ) : (
              <div>
                {items.map((item) => {
                  const available = parseInt(item['Quantity'], 10) || 0;
                  const qty = quantities[item['Item ID']] || 0;
                  const isSelected = qty > 0;

                  return (
                    <div
                      key={item['Item ID']}
                      className={`scan-item ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="scan-item-header">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="scan-item-name">{item['Component Name']}</div>
                          {item['Part Number'] ? (
                            <div className="scan-item-pn">PN: {item['Part Number']}</div>
                          ) : (
                            <div className="scan-item-pn empty">No part number</div>
                          )}
                          <div className="scan-item-id">{item['Item ID']}</div>
                          <div className="scan-item-available">
                            {available} {item['Unit'] || 'pcs'} available
                          </div>
                        </div>
                      </div>
                      <div className="scan-item-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQty(item['Item ID'], -1)}
                          disabled={qty === 0}
                          aria-label={`Decrease ${item['Component Name']}`}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          className="qty-input"
                          value={qty}
                          onChange={(e) => setQty(item['Item ID'], e.target.value)}
                          min="0"
                          max={action !== 'Return' ? available : undefined}
                          aria-label={`Quantity of ${item['Component Name']}`}
                        />
                        <button
                          className="qty-btn"
                          onClick={() => updateQty(item['Item ID'], 1)}
                          disabled={action !== 'Return' && qty >= available}
                          aria-label={`Increase ${item['Component Name']}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky bottom CTA */}
          {selectedItems.length > 0 && (
            <div className="scan-cta" role="region" aria-label="Submit transaction">
              <div className="scan-cta-inner">
                <div className="scan-cta-summary">
                  <div className="scan-cta-count">{action}</div>
                  <div className="scan-cta-items">
                    {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}
                    {' · '}
                    {selectedItems.reduce((s, it) => s + quantities[it['Item ID']], 0)} {items[0]?.['Unit'] || 'pcs'}
                  </div>
                </div>
                <button
                  className={`btn btn-${action.toLowerCase()} btn-lg`}
                  onClick={handleSubmitClick}
                  style={{ flexShrink: 0 }}
                >
                  Confirm →
                </button>
              </div>
            </div>
          )}

          <button
            className="btn btn-ghost btn-block"
            onClick={() => { setStep('action'); setAction(''); }}
            style={{ marginBottom: 'var(--space-lg)' }}
          >
            ← Change action
          </button>
        </>
      )}

      {/* QR scanner overlay */}
      {showScanner && (
        <QrScanner
          onDetected={handleQrDetected}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <ConfirmModal
          title={`Confirm ${action}`}
          body={`
            <div style="margin-bottom:14px;">
              <strong style="color:#fff;">Location:</strong> ${escapeHtml(locationId)}<br/>
              <strong style="color:#fff;">Employee:</strong> ${escapeHtml(empValidation?.name)} (${escapeHtml(empCode)})
            </div>
            <div style="border-top:1px solid #1f1f1f;padding-top:12px;">
              ${confirmBody}
            </div>
          `}
          confirmText={`${action} Items`}
          confirmClass={`btn-${action.toLowerCase()}`}
          onConfirm={handleConfirmTransaction}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="page-header animate-in">
          <h1 className="page-title">Scan &amp; Transact</h1>
          <p className="page-subtitle">Loading...</p>
        </div>
      }
    >
      <ScanPageInner />
    </Suspense>
  );
}
