'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { PageBrand } from '@/components/Navbar';
import { callApi, debounce, formatDate, formatCurrency } from '@/lib/utils';

export default function SearchPage() {
  const showToast = useToast();
  const [query, setQuery] = useState('');
  const [field, setField] = useState('all');
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemHistory, setItemHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(
    debounce(async (q, f) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await callApi(`/api/inventory/search?q=${encodeURIComponent(q)}&field=${f}`);
        setResults(data);
      } catch (err) {
        showToast('Search failed: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  function handleSearch(q, f) {
    setQuery(q);
    setField(f || field);
    doSearch(q, f || field);
  }

  async function viewItem(item) {
    setSelectedItem(item);
    try {
      const history = await callApi(`/api/transactions?itemId=${encodeURIComponent(item['Item ID'])}`);
      setItemHistory(history);
    } catch (err) {
      showToast('Failed to load history: ' + err.message, 'error');
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case 'In Stock': return 'in-stock';
      case 'Low Stock': return 'low-stock';
      case 'Out of Stock': return 'out-of-stock';
      default: return '';
    }
  }

  return (
    <>
      <div className="page-header animate-in">
        <PageBrand size="md" />
        <h1 className="page-title">Search</h1>
        <p className="page-subtitle">Find components, tools, and consumables</p>
      </div>

      {/* Search Bar */}
      <div className="search-container animate-in">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search inventory..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* Filter Buttons */}
      <div className="btn-group animate-in" style={{ marginBottom: 'var(--space-lg)', overflowX: 'auto' }}>
        {[
          { value: 'all', label: 'All' },
          { value: 'name', label: 'Name' },
          { value: 'partNumber', label: 'Part #' },
          { value: 'location', label: 'Location' },
          { value: 'category', label: 'Category' },
          { value: 'itemId', label: 'Item ID' },
        ].map((f) => (
          <button
            key={f.value}
            className={`btn btn-sm ${field === f.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleSearch(query, f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Item Detail View */}
      {selectedItem && (
        <div className="card animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
            <div>
              <div className="item-name" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                {selectedItem['Component Name']}
              </div>
              <div className="item-meta">
                <span className="text-mono" style={{ color: 'var(--accent-primary)' }}>
                  {selectedItem['Item ID']}
                </span>
                {selectedItem['Part Number'] && <span>PN: {selectedItem['Part Number']}</span>}
              </div>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedItem(null)}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <div className="kpi-card">
              <div className="kpi-label">Quantity</div>
              <div className="kpi-value">{selectedItem['Quantity']} {selectedItem['Unit'] || 'pcs'}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Status</div>
              <div><span className={`status-badge ${getStatusClass(selectedItem['Status'])}`}>{selectedItem['Status']}</span></div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Location</div>
              <div className="kpi-value text-mono" style={{ fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
                {selectedItem['Location ID']}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Unit Cost</div>
              <div className="kpi-value" style={{ fontSize: '1.2rem' }}>
                {formatCurrency(selectedItem['Unit Cost (₹)'])}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            <span className="location-tag">{selectedItem['Category']}</span>
            <span className="location-tag">{selectedItem['Type']}</span>
            {selectedItem['Min Stock'] && <span className="location-tag">Min: {selectedItem['Min Stock']}</span>}
          </div>

          {/* Transaction History */}
          {itemHistory.length > 0 && (
            <>
              <div className="section-header" style={{ marginTop: 'var(--space-md)' }}>
                <h3 className="section-title">Transaction History</h3>
                <span className="section-count">{itemHistory.length}</span>
              </div>
              {itemHistory.slice(0, 15).map((txn, i) => {
                const action = (txn['Action'] || '').toLowerCase();
                return (
                  <div key={i} className="activity-item">
                    <div className={`activity-icon ${action}`}>
                      {action === 'take' ? '↗' : action === 'return' ? '↙' : '💸'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">
                        <strong>{txn['Employee Name'] || txn['Employee Code']}</strong>
                        {' '}{txn['Action']}{' '}<strong>{txn['Quantity']}</strong>
                      </div>
                      <div className="activity-time">
                        {txn['Date']} {txn['Time']}
                      </div>
                    </div>
                    <span className={`action-pill ${action}`}>{txn['Action']}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Results */}
      {!selectedItem && (
        <div className="card animate-in">
          {loading ? (
            <div className="empty-state">
              <div className="empty-text">Searching...</div>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="section-header">
                <h2 className="section-title">Results</h2>
                <span className="section-count">{results.length} items</span>
              </div>
              <div className="item-list">
                {results.map((item, i) => (
                  <div key={i} className="item-row" onClick={() => viewItem(item)} style={{ cursor: 'pointer' }}>
                    <div className="item-info">
                      <div className="item-name">{item['Component Name']}</div>
                      <div className="item-meta">
                        <span className="text-mono" style={{ color: 'var(--accent-primary)' }}>
                          {item['Item ID']}
                        </span>
                        <span>{item['Category']}</span>
                        <span className="text-mono">{item['Location ID']}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="text-mono font-bold">{item['Quantity']} {item['Unit'] || 'pcs'}</div>
                      <span className={`status-badge ${getStatusClass(item['Status'])}`}>
                        {item['Status']}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : query ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">No results found for &quot;{query}&quot;</div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">Start typing to search inventory</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
