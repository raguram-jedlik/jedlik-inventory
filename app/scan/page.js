'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useLoading } from '@/components/LoadingOverlay';
import ConfirmModal from '@/components/ConfirmModal';
import { callApi } from '@/lib/utils';

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
  const [step, setStep] = useState('location'); // location, employee, action, items

  // Auto-load location from URL
  useEffect(() => {
    const loc = searchParams.get('location');
    if (loc) {
      setLocationId(loc);
      loadLocation(loc);
    }
  }, [searchParams]);

  async function loadLocation(id) {
    try {
      const locItems = await callApi(`/api/inventory?location=${encodeURIComponent(id)}`);
      if (locItems.length === 0) {
        // Still try to load location info
      }
      setItems(locItems);

      // Try to get location details from the locations list
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

    // Initialize quantities to 0
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
        // Reload items
        const updatedItems = await callApi(`/api/inventory?location=${encodeURIComponent(locationId)}`);
        setItems(updatedItems);
        // Reset quantities
        const resetQty = {};
        updatedItems.forEach((item) => {
          resetQty[item['Item ID']] = 0;
        });
        setQuantities(resetQty);
        setRemarks({});
      } else {
        showToast(result.message, 'warning');
        // Show individual item results
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
  const confirmBody = selectedItems
    .map((item) =>
      `<div style="display:flex;justify-content:space-between;padding:4px 0;">
        <span>${item['Component Name']}</span>
        <strong>${quantities[item['Item ID']]} ${item['Unit'] || 'pcs'}</strong>
      </div>`
    )
    .join('');

  return (
    <>
      {/* Header */}
      <div className="page-header animate-in">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Jedlik <span className="brand-accent">Motors</span></span>
        </div>
        <h1 className="page-title">Transaction</h1>
        <p className="page-subtitle">
          {step === 'location' && 'Enter or scan a storage location'}
          {step === 'employee' && 'Enter your employee code'}
          {step === 'action' && 'Select an action'}
          {step === 'items' && `${action} items from ${locationId}`}
        </p>
      </div>

      {/* Step 1: Location */}
      {step === 'location' && (
        <div className="card animate-in">
          <div className="section-header">
            <h2 className="section-title">📍 Storage Location</h2>
          </div>
          <div className="form-group">
            <label className="form-label">Location ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. BX-01-01"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleLocationSubmit()}
              style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
              autoFocus
            />
          </div>
          <button className="btn btn-primary btn-block" onClick={handleLocationSubmit}>
            Load Location
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
              <h2 className="section-title">👤 Employee Code</h2>
            </div>
            <div className="form-group">
              <input
                type="text"
                className={`form-input ${empValidation ? (empValidation.valid ? 'success' : 'error') : ''}`}
                placeholder="e.g. EMP001"
                value={empCode}
                onChange={(e) => setEmpCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleValidateEmployee()}
                style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', textAlign: 'center', fontSize: '1.3rem' }}
                autoFocus
              />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleValidateEmployee}>
              Verify & Continue
            </button>
          </div>
        </>
      )}

      {/* Step 3: Action Selection */}
      {step === 'action' && (
        <>
          <div className="location-card animate-in">
            <div className="location-id">{locationId}</div>
            <div className="location-name">
              Welcome, {empValidation?.name} ({empCode})
            </div>
          </div>

          <div className="card animate-in">
            <div className="section-header">
              <h2 className="section-title">What are you doing?</h2>
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
              <button className="btn btn-take btn-block btn-lg" onClick={() => handleActionSelect('Take')}>
                ↗ Take Items
              </button>
              <button className="btn btn-return btn-block btn-lg" onClick={() => handleActionSelect('Return')}>
                ↙ Return Items
              </button>
              <button className="btn btn-expense btn-block btn-lg" onClick={() => handleActionSelect('Expense')}>
                💸 Expense Items
              </button>
            </div>
          </div>
        </>
      )}

      {/* Step 4: Item Selection */}
      {step === 'items' && (
        <>
          <div className="location-card animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="location-id">{locationId}</div>
                <div className="location-name">{empValidation?.name}</div>
              </div>
              <span className={`action-pill ${action.toLowerCase()}`} style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
                {action}
              </span>
            </div>
          </div>

          <div className="card animate-in">
            <div className="section-header">
              <h2 className="section-title">Select Items & Quantities</h2>
              <span className="section-count">{items.length} items</span>
            </div>

            {items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-text">No items at this location</div>
              </div>
            ) : (
              <div className="item-list">
                {items.map((item) => {
                  const available = parseInt(item['Quantity'], 10) || 0;
                  const qty = quantities[item['Item ID']] || 0;

                  return (
                    <div key={item['Item ID']} className={`item-row ${qty > 0 ? 'selected' : ''}`}>
                      <div className="item-info">
                        <div className="item-name">{item['Component Name']}</div>
                        <div className="item-meta">
                          <span className="text-mono" style={{ color: 'var(--accent-primary)' }}>
                            {item['Item ID']}
                          </span>
                          <span>Available: {available} {item['Unit'] || 'pcs'}</span>
                        </div>
                      </div>
                      <div className="item-qty-control">
                        <button className="qty-btn" onClick={() => updateQty(item['Item ID'], -1)}>−</button>
                        <div>
                          <input
                            type="number"
                            className="qty-input"
                            value={qty}
                            onChange={(e) => setQty(item['Item ID'], e.target.value)}
                            min="0"
                            max={action !== 'Return' ? available : undefined}
                          />
                          <div className="qty-available">/{available}</div>
                        </div>
                        <button className="qty-btn" onClick={() => updateQty(item['Item ID'], 1)}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedItems.length > 0 && (
              <div style={{ marginTop: 'var(--space-lg)' }}>
                <button
                  className={`btn btn-${action.toLowerCase()} btn-block btn-lg`}
                  onClick={handleSubmitClick}
                >
                  {action} {selectedItems.length} Item(s)
                </button>
              </div>
            )}
          </div>

          {/* Back to action selection */}
          <button
            className="btn btn-secondary btn-block"
            onClick={() => { setStep('action'); setAction(''); }}
          >
            ← Change Action
          </button>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <ConfirmModal
          title={`Confirm ${action}`}
          body={`
            <div style="margin-bottom:12px;">
              <strong>Location:</strong> ${locationId}<br/>
              <strong>Employee:</strong> ${empValidation?.name} (${empCode})
            </div>
            <div style="border-top:1px solid var(--border-subtle);padding-top:12px;">
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
    <Suspense fallback={
      <div className="page-header animate-in">
        <h1 className="page-title">Transaction</h1>
        <p className="page-subtitle">Loading...</p>
      </div>
    }>
      <ScanPageInner />
    </Suspense>
  );
}
