'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { useLoading } from '@/components/LoadingOverlay';
import { callApi } from '@/lib/utils';
import Link from 'next/link';

export default function AdminPage() {
  const showToast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const [currentTab, setCurrentTab] = useState('locations');

  // Locations
  const [locations, setLocations] = useState([]);
  const [locForm, setLocForm] = useState({ locationId: '', locationName: '', storageType: 'Box', parentLocation: '', room: '', notes: '' });

  // Employees
  const [employees, setEmployees] = useState([]);
  const [empForm, setEmpForm] = useState({ employeeCode: '', name: '', role: 'Engineer', department: 'General' });

  // Inventory
  const [itemForm, setItemForm] = useState({
    componentName: '', partNumber: '', category: 'Electronics', type: 'Component',
    quantity: '0', minStock: '5', unit: 'pcs', unitCost: '0', locationId: '', notes: '',
  });

  // QR
  const [qrData, setQrData] = useState([]);

  // Alerts
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    loadLocations();
  }, []);

  function switchTab(tab) {
    setCurrentTab(tab);
    switch (tab) {
      case 'locations': loadLocations(); break;
      case 'employees': loadEmployees(); break;
      case 'qr': loadQRStatus(); break;
      case 'alerts': loadAlerts(); break;
    }
  }

  // ── Locations ──────────────────────────────

  async function loadLocations() {
    try {
      const data = await callApi('/api/locations');
      setLocations(data);
    } catch (err) {
      showToast('Failed to load locations: ' + err.message, 'error');
    }
  }

  async function addLocation() {
    if (!locForm.locationId.trim()) { showToast('Location ID is required', 'warning'); return; }
    showLoading('Adding location...');
    try {
      const result = await callApi('/api/locations', { method: 'POST', body: locForm });
      hideLoading();
      if (result.success) {
        showToast(result.message, 'success');
        setLocForm({ locationId: '', locationName: '', storageType: 'Box', parentLocation: '', room: '', notes: '' });
        loadLocations();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) { hideLoading(); showToast('Failed: ' + err.message, 'error'); }
  }

  // ── Employees ──────────────────────────────

  async function loadEmployees() {
    try {
      const data = await callApi('/api/employees');
      setEmployees(data);
    } catch (err) {
      showToast('Failed to load employees: ' + err.message, 'error');
    }
  }

  async function addEmployee() {
    if (!empForm.employeeCode.trim()) { showToast('Employee code is required', 'warning'); return; }
    if (!empForm.name.trim()) { showToast('Employee name is required', 'warning'); return; }
    showLoading('Adding employee...');
    try {
      const result = await callApi('/api/employees', { method: 'POST', body: empForm });
      hideLoading();
      if (result.success) {
        showToast(result.message, 'success');
        setEmpForm({ employeeCode: '', name: '', role: 'Engineer', department: 'General' });
        loadEmployees();
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) { hideLoading(); showToast('Failed: ' + err.message, 'error'); }
  }

  // ── Add Item ──────────────────────────────

  async function addItem() {
    if (!itemForm.componentName.trim()) { showToast('Component name is required', 'warning'); return; }
    if (!itemForm.locationId.trim()) { showToast('Location ID is required', 'warning'); return; }
    showLoading('Adding item...');
    try {
      const result = await callApi('/api/inventory', { method: 'POST', body: itemForm });
      hideLoading();
      if (result.success) {
        showToast(result.message, 'success');
        setItemForm({ ...itemForm, componentName: '', partNumber: '', quantity: '0', unitCost: '0', locationId: '', notes: '' });
      } else {
        showToast(result.message, 'error');
      }
    } catch (err) { hideLoading(); showToast('Failed: ' + err.message, 'error'); }
  }

  // ── QR ──────────────────────────────

  async function loadQRStatus() {
    try {
      const data = await callApi('/api/qr');
      setQrData(data);
    } catch (err) {
      showToast('Failed to load QR data: ' + err.message, 'error');
    }
  }

  async function generateMissingQR() {
    showLoading('Generating QR codes...');
    try {
      await callApi('/api/qr', { method: 'POST' });
      hideLoading();
      showToast('QR codes generated!', 'success');
      loadQRStatus();
    } catch (err) { hideLoading(); showToast('Failed: ' + err.message, 'error'); }
  }

  // ── Alerts ──────────────────────────────

  async function loadAlerts() {
    try {
      const data = await callApi('/api/alerts');
      setAlerts(data);
    } catch (err) {
      showToast('Failed to load alerts: ' + err.message, 'error');
    }
  }

  return (
    <>
      {/* Header */}
      <div className="page-header animate-in">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">Jedlik <span className="brand-accent">Motors</span></span>
        </div>
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage locations, employees, inventory, and QR codes</p>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar animate-in">
        {['locations', 'employees', 'inventory', 'qr', 'alerts'].map((tab) => (
          <button
            key={tab}
            className={`tab-item ${currentTab === tab ? 'active' : ''}`}
            onClick={() => switchTab(tab)}
          >
            {tab === 'locations' ? 'Locations' :
             tab === 'employees' ? 'Employees' :
             tab === 'inventory' ? 'Add Item' :
             tab === 'qr' ? 'QR Codes' : 'Alerts'}
          </button>
        ))}
      </div>

      {/* ═══ Tab: Locations ═══ */}
      {currentTab === 'locations' && (
        <>
          <div className="card animate-in">
            <div className="section-header">
              <h2 className="section-title">➕ Add New Location</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <div className="form-group">
                <label className="form-label">Location ID *</label>
                <input type="text" className="form-input" placeholder="e.g. BX-04-01"
                  value={locForm.locationId}
                  onChange={(e) => setLocForm({ ...locForm, locationId: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Location Name</label>
                <input type="text" className="form-input" placeholder="e.g. Box 1 (Drawer 4)"
                  value={locForm.locationName}
                  onChange={(e) => setLocForm({ ...locForm, locationName: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <div className="form-group">
                <label className="form-label">Storage Type *</label>
                <select className="form-select" value={locForm.storageType}
                  onChange={(e) => setLocForm({ ...locForm, storageType: e.target.value })}>
                  {['Box', 'Drawer', 'Cabinet', 'Shelf', 'Pegboard', 'Workbench', 'Bin', 'Tool Rack'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Parent Location</label>
                <input type="text" className="form-input" placeholder="e.g. DR-04"
                  value={locForm.parentLocation}
                  onChange={(e) => setLocForm({ ...locForm, parentLocation: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <div className="form-group">
                <label className="form-label">Room</label>
                <input type="text" className="form-input" placeholder="e.g. Lab Room 1"
                  value={locForm.room}
                  onChange={(e) => setLocForm({ ...locForm, room: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input type="text" className="form-input" placeholder="Description"
                  value={locForm.notes}
                  onChange={(e) => setLocForm({ ...locForm, notes: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={addLocation}>Add Location & Generate QR</button>
          </div>

          <div className="card animate-in">
            <div className="section-header">
              <h2 className="section-title">📍 All Locations</h2>
              <span className="section-count">{locations.length} locations</span>
            </div>
            {locations.length === 0 ? (
              <div className="empty-state"><div className="empty-text">No locations yet</div></div>
            ) : (
              <div className="item-list">
                {locations.map((loc, i) => {
                  const qrOk = String(loc['QR Generated']).toUpperCase() === 'TRUE';
                  return (
                    <div key={i} className="item-row">
                      <div className="item-info">
                        <div className="item-name text-mono" style={{ color: 'var(--accent-primary)' }}>
                          {loc['Location ID']}
                        </div>
                        <div className="item-meta">
                          <span>{loc['Location Name'] || ''}</span>
                          <span>{loc['Storage Type'] || ''}</span>
                          {loc['Room'] && <span>{loc['Room']}</span>}
                        </div>
                      </div>
                      <span className={`status-badge ${qrOk ? 'in-stock' : 'out-of-stock'}`}>
                        {qrOk ? 'QR ✓' : 'No QR'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ Tab: Employees ═══ */}
      {currentTab === 'employees' && (
        <>
          <div className="card animate-in">
            <div className="section-header">
              <h2 className="section-title">➕ Add New Employee</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <div className="form-group">
                <label className="form-label">Employee Code *</label>
                <input type="text" className="form-input" placeholder="e.g. EMP008"
                  value={empForm.employeeCode}
                  onChange={(e) => setEmpForm({ ...empForm, employeeCode: e.target.value.toUpperCase() })}
                  style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" placeholder="Full name"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={empForm.role}
                  onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}>
                  {['Engineer', 'Intern', 'Admin', 'Technician'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" value={empForm.department}
                  onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}>
                  {['General', 'Engineering', 'Mechanical', 'Electrical', 'Software', 'Design'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={addEmployee}>Add Employee</button>
          </div>

          <div className="card animate-in">
            <div className="section-header">
              <h2 className="section-title">👥 All Employees</h2>
              <span className="section-count">{employees.length} employees</span>
            </div>
            {employees.length === 0 ? (
              <div className="empty-state"><div className="empty-text">No employees yet</div></div>
            ) : (
              <div className="item-list">
                {employees.map((emp, i) => {
                  const isActive = String(emp['Active']).toUpperCase() === 'TRUE';
                  return (
                    <div key={i} className="item-row">
                      <div className="item-info">
                        <div className="item-name">{emp['Name'] || ''}</div>
                        <div className="item-meta">
                          <span className="text-mono" style={{ color: 'var(--accent-primary)' }}>{emp['Employee Code']}</span>
                          <span>{emp['Role'] || ''}</span>
                          <span>{emp['Department'] || ''}</span>
                        </div>
                      </div>
                      <span className={`status-badge ${isActive ? 'in-stock' : 'out-of-stock'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ Tab: Add Inventory Item ═══ */}
      {currentTab === 'inventory' && (
        <div className="card animate-in">
          <div className="section-header">
            <h2 className="section-title">➕ Add New Inventory Item</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div className="form-group">
              <label className="form-label">Component Name *</label>
              <input type="text" className="form-input" placeholder="e.g. M4 Hex Bolt"
                value={itemForm.componentName}
                onChange={(e) => setItemForm({ ...itemForm, componentName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Part Number</label>
              <input type="text" className="form-input" placeholder="e.g. M4-HEX-16"
                value={itemForm.partNumber}
                onChange={(e) => setItemForm({ ...itemForm, partNumber: e.target.value.toUpperCase() })}
                style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>
                {['Electronics', 'Fasteners', 'Motors', 'Battery', 'Tools', 'Adhesives', 'Consumables', 'Mechanical', 'Sensors', 'Wiring', 'Other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={itemForm.type}
                onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}>
                {['Component', 'Consumable', 'Tool'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)' }}>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input type="number" className="form-input" value={itemForm.quantity} min="0"
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Min Stock</label>
              <input type="number" className="form-input" value={itemForm.minStock} min="0"
                onChange={(e) => setItemForm({ ...itemForm, minStock: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-select" value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}>
                {['pcs', 'set', 'm', 'cm', 'kg', 'g', 'ml', 'sheet', 'roll', 'pack'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div className="form-group">
              <label className="form-label">Unit Cost (₹)</label>
              <input type="number" className="form-input" value={itemForm.unitCost} min="0" step="0.01"
                onChange={(e) => setItemForm({ ...itemForm, unitCost: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Location ID *</label>
              <input type="text" className="form-input" placeholder="e.g. BX-01-01"
                value={itemForm.locationId}
                onChange={(e) => setItemForm({ ...itemForm, locationId: e.target.value.toUpperCase() })}
                style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" placeholder="Additional notes..."
              value={itemForm.notes}
              onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-block" onClick={addItem}>Add Inventory Item</button>
        </div>
      )}

      {/* ═══ Tab: QR Codes ═══ */}
      {currentTab === 'qr' && (
        <div className="card animate-in">
          <div className="section-header">
            <h2 className="section-title">📱 QR Code Management</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
            <button className="btn btn-primary" onClick={generateMissingQR}>Generate Missing QR Codes</button>
            <Link href="/print" className="btn btn-secondary">🖨️ Print QR Labels</Link>
          </div>
          {qrData.length === 0 ? (
            <div className="empty-state"><div className="empty-text">No locations found</div></div>
          ) : (
            <div className="item-list">
              {qrData.map((loc, i) => (
                <div key={i} className="item-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1 }}>
                    {loc.qrGenerated && loc.qrCodeUrl ? (
                      <img src={loc.qrCodeUrl} alt={`QR ${loc.locationId}`}
                        style={{ width: 48, height: 48, borderRadius: 4, background: 'white', padding: 2 }} loading="lazy" />
                    ) : (
                      <div style={{ width: 48, height: 48, background: 'var(--bg-input)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.2rem' }}>?</div>
                    )}
                    <div className="item-info">
                      <div className="item-name text-mono" style={{ color: 'var(--accent-primary)' }}>{loc.locationId}</div>
                      <div className="item-meta">
                        <span>{loc.locationName || ''}</span>
                        <span>{loc.storageType || ''}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`status-badge ${loc.qrGenerated ? 'in-stock' : 'out-of-stock'}`}>
                    {loc.qrGenerated ? 'QR ✓' : 'Missing'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab: Alerts ═══ */}
      {currentTab === 'alerts' && (
        <div>
          {!alerts ? (
            <div className="card animate-in">
              <div className="empty-state"><div className="empty-text">Loading alerts...</div></div>
            </div>
          ) : alerts.totalAlerts === 0 ? (
            <div className="card animate-in">
              <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                <div className="empty-icon">✅</div>
                <div className="empty-text">All systems nominal — no alerts!</div>
              </div>
            </div>
          ) : (
            <>
              {alerts.negativeInventory.length > 0 && (
                <>
                  <div className="alert-banner error">
                    <span className="alert-icon">🚨</span>
                    <span><strong>{alerts.negativeInventory.length}</strong> item(s) have negative inventory!</span>
                  </div>
                  <AlertList items={alerts.negativeInventory} type="error" />
                </>
              )}
              {alerts.outOfStock.length > 0 && (
                <>
                  <div className="alert-banner error">
                    <span className="alert-icon">🔴</span>
                    <span><strong>{alerts.outOfStock.length}</strong> item(s) out of stock</span>
                  </div>
                  <AlertList items={alerts.outOfStock} type="error" />
                </>
              )}
              {alerts.lowStock.length > 0 && (
                <>
                  <div className="alert-banner warning">
                    <span className="alert-icon">⚠️</span>
                    <span><strong>{alerts.lowStock.length}</strong> item(s) running low</span>
                  </div>
                  <AlertList items={alerts.lowStock} type="warning" />
                </>
              )}
              {alerts.duplicateLocations.length > 0 && (
                <div className="alert-banner error">
                  <span className="alert-icon">❌</span>
                  <span>Duplicate Location IDs: <strong>{alerts.duplicateLocations.join(', ')}</strong></span>
                </div>
              )}
              {alerts.missingQR.length > 0 && (
                <div className="alert-banner info">
                  <span className="alert-icon">📱</span>
                  <span><strong>{alerts.missingQR.length}</strong> location(s) missing QR codes</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

function AlertList({ items, type }) {
  return (
    <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
      {items.slice(0, 15).map((item, i) => (
        <div key={i} className="item-row" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
          <div className="item-info">
            <div className="item-name" style={{ fontSize: '0.85rem' }}>{item.name}</div>
            <div className="item-meta"><span className="text-mono">{item.location || ''}</span></div>
          </div>
          <div className={`text-mono font-bold text-${type}`}>
            {item.quantity != null ? `Qty: ${item.quantity}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
