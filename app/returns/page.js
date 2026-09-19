'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/Toast';
import { PageBrand } from '@/components/Navbar';
import { callApi, timeAgo } from '@/lib/utils';

/**
 * Per-profile "what to return" view. Reads /api/returns, which derives
 * each employee's open holdings from Transaction History. The scan flow
 * is still where Returns actually happen; this page is visibility.
 */
export default function ReturnsPage() {
  const showToast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await callApi('/api/returns');
      setData(res);
    } catch (err) {
      showToast('Failed to load holdings: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!data?.holdings) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.holdings;

    return data.holdings
      .map((group) => {
        const empMatch =
          group.employeeCode.toLowerCase().includes(q) ||
          (group.employeeName || '').toLowerCase().includes(q);
        const itemMatch = group.items.some(
          (i) =>
            i.itemId.toLowerCase().includes(q) ||
            (i.componentName || '').toLowerCase().includes(q)
        );
        if (empMatch) return group;
        if (itemMatch) {
          return {
            ...group,
            items: group.items.filter(
              (i) =>
                i.itemId.toLowerCase().includes(q) ||
                (i.componentName || '').toLowerCase().includes(q)
            ),
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [data, query]);

  const totalEmployees = data?.holdings?.length || 0;
  const totalItems = (data?.holdings || []).reduce(
    (s, g) => s + g.items.length,
    0
  );

  return (
    <>
      <div className="page-header animate-in">
        <PageBrand size="md" />
        <h1 className="page-title">What to Return</h1>
        <p className="page-subtitle">
          Items each team member currently has out, derived from transaction
          history.
        </p>
      </div>

      {/* KPI strip */}
      <div className="kpi-grid animate-in">
        <div className="kpi-card">
          <div className="kpi-label">People with open items</div>
          <div className="kpi-value">{totalEmployees}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Open holdings</div>
          <div className="kpi-value">{totalItems}</div>
        </div>
      </div>

      {/* Search + refresh */}
      <div className="search-container animate-in">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Filter by employee or item name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter open holdings"
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-md)' }}>
        <button
          className="btn btn-sm btn-secondary"
          onClick={load}
          disabled={loading}
          aria-label="Refresh holdings"
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {loading && !data ? (
        <div className="card animate-in">
          <div className="empty-state">
            <div className="empty-text">Loading open holdings…</div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card animate-in">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-text">
              {totalEmployees === 0
                ? 'Nothing is out right now — every item is back in its box.'
                : 'No holdings match your filter.'}
            </div>
          </div>
        </div>
      ) : (
        filtered.map((group) => (
          <div key={group.employeeCode} className="card animate-in">
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  {group.employeeName || group.employeeCode}
                </h2>
                <div className="item-meta">
                  <span
                    className="text-mono"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {group.employeeCode}
                  </span>
                  <span>
                    {group.items.length} item
                    {group.items.length === 1 ? '' : 's'} out
                  </span>
                </div>
              </div>
            </div>

            <div className="item-list">
              {group.items.map((item) => (
                <div key={item.itemId} className="item-row">
                  <div className="item-info">
                    <div className="item-name">{item.componentName || item.itemId}</div>
                    <div className="item-meta">
                      <span
                        className="text-mono"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        {item.itemId}
                      </span>
                      <span className="text-mono">
                        {item.locationId || '—'}
                      </span>
                      {item.lastTakenAt && (
                        <span>taken {timeAgo(item.lastTakenAt)}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-mono font-bold">
                      {item.qty}
                    </div>
                    <span className="status-badge in-stock">Open</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
