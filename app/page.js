'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { PageBrand } from '@/components/Navbar';
import { callApi, formatCurrency, timeAgo } from '@/lib/utils';

export default function DashboardPage() {
  const showToast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callApi('/api/dashboard')
      .then(setData)
      .catch((err) => showToast('Failed to load dashboard: ' + err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <div className="page-header animate-in">
          <PageBrand size="sm" />
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Loading inventory data...</p>
        </div>
        <div className="kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card animate-in">
              <div className="kpi-label">Loading...</div>
              <div className="kpi-value">—</div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (!data) return null;

  const { kpi, lowStock, outOfStock, recentTransactions, topComponents, categoryBreakdown } = data;
  const maxComponent = topComponents?.[0]?.count || 1;

  return (
    <>
      <div className="page-header animate-in">
        <PageBrand size="sm" />
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Real-time inventory overview</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card animate-in">
          <div className="kpi-label">Unique Items</div>
          <div className="kpi-value">{kpi.totalItems}</div>
        </div>
        <div className="kpi-card animate-in">
          <div className="kpi-label">Total Quantity</div>
          <div className="kpi-value">{kpi.totalQuantity.toLocaleString()}</div>
        </div>
        <div className="kpi-card animate-in">
          <div className="kpi-label">Locations</div>
          <div className="kpi-value">{kpi.totalLocations}</div>
        </div>
        <div className="kpi-card animate-in">
          <div className="kpi-label">Stock Value</div>
          <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{formatCurrency(kpi.totalValue)}</div>
        </div>
      </div>

      {/* Alert Cards */}
      {(kpi.outOfStockCount > 0 || kpi.lowStockCount > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          {kpi.outOfStockCount > 0 && (
            <div className="kpi-card animate-in" style={{ borderColor: 'rgba(255, 23, 68, 0.3)' }}>
              <div className="kpi-label">Out of Stock</div>
              <div className="kpi-value" style={{ color: 'var(--color-error)' }}>{kpi.outOfStockCount}</div>
            </div>
          )}
          {kpi.lowStockCount > 0 && (
            <div className="kpi-card animate-in" style={{ borderColor: 'rgba(255, 167, 38, 0.3)' }}>
              <div className="kpi-label">Low Stock</div>
              <div className="kpi-value" style={{ color: 'var(--color-warning)' }}>{kpi.lowStockCount}</div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="card animate-in">
        <div className="section-header">
          <h2 className="section-title">📋 Recent Activity</h2>
          <span className="section-count">{recentTransactions?.length || 0} transactions</span>
        </div>

        {recentTransactions && recentTransactions.length > 0 ? (
          recentTransactions.slice(0, 10).map((txn, i) => {
            const action = (txn['Action'] || '').toLowerCase();
            const actionIcons = { take: '↗', return: '↙', expense: '💸' };
            return (
              <div key={i} className="activity-item">
                <div className={`activity-icon ${action}`}>
                  {actionIcons[action] || '•'}
                </div>
                <div className="activity-content">
                  <div className="activity-text">
                    <strong>{txn['Employee Name'] || txn['Employee Code']}</strong>
                    {' '}{action}{' '}
                    <strong>{txn['Quantity']}</strong> × {txn['Component Name']}
                  </div>
                  <div className="activity-time">
                    {txn['Location ID']} · {timeAgo(txn['Timestamp'])}
                  </div>
                </div>
                <span className={`action-pill ${action}`}>{txn['Action']}</span>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-text">No recent transactions</div>
          </div>
        )}
      </div>

      {/* Most Used Components */}
      {topComponents && topComponents.length > 0 && (
        <div className="card animate-in">
          <div className="section-header">
            <h2 className="section-title">🔥 Most Used Components</h2>
          </div>
          <div className="bar-chart">
            {topComponents.map((comp, i) => (
              <div key={i} className="bar-row">
                <div className="bar-label">{comp.name}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(comp.count / maxComponent) * 100}%` }}
                  />
                </div>
                <div className="bar-value">{comp.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {categoryBreakdown && categoryBreakdown.length > 0 && (
        <div className="card animate-in">
          <div className="section-header">
            <h2 className="section-title">📦 Categories</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            {categoryBreakdown.map((cat, i) => (
              <div key={i} className="location-tag">
                {cat.name}: {cat.count}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Items */}
      {lowStock && lowStock.length > 0 && (
        <div className="card animate-in">
          <div className="section-header">
            <h2 className="section-title">⚠️ Low Stock Items</h2>
            <span className="section-count">{lowStock.length} items</span>
          </div>
          <div className="item-list">
            {lowStock.slice(0, 10).map((item, i) => (
              <div key={i} className="item-row">
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-meta">
                    <span className="text-mono">{item.location}</span>
                  </div>
                </div>
                <span className="status-badge low-stock">Qty: {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Team */}
      <div className="card animate-in">
        <div className="section-header">
          <h2 className="section-title">👥 Active Team (30 days)</h2>
          <span className="section-count">{kpi.activeEmployees} members</span>
        </div>
        {data.activeEmployeesList && data.activeEmployeesList.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            {data.activeEmployeesList.map((emp, i) => (
              <span key={i} className="location-tag">{emp}</span>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-text">No activity in the last 30 days</div>
          </div>
        )}
      </div>
    </>
  );
}
