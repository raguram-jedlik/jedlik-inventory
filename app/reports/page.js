'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { useLoading } from '@/components/LoadingOverlay';
import { PageBrand } from '@/components/Navbar';
import { callApi, copyToClipboard } from '@/lib/utils';

const REPORT_TYPES = [
  { value: 'inventory_movement', label: 'Inventory Movement', icon: '📦', needsDates: true },
  { value: 'employee_usage', label: 'Employee Usage', icon: '👤', needsDates: true },
  { value: 'monthly_consumption', label: 'Monthly Consumption', icon: '📊', needsDates: true },
  { value: 'stock_value', label: 'Stock Value', icon: '💰', needsDates: false },
  { value: 'low_stock', label: 'Low Stock', icon: '⚠️', needsDates: false },
  { value: 'fast_moving', label: 'Fast Moving', icon: '🔥', needsDates: true },
  { value: 'slow_moving', label: 'Slow Moving', icon: '🐌', needsDates: true },
];

export default function ReportsPage() {
  const showToast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const [reportType, setReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);

  async function generateReport() {
    if (!reportType) {
      showToast('Select a report type', 'warning');
      return;
    }

    showLoading('Generating report...');
    try {
      let url = `/api/reports?type=${reportType}`;
      if (startDate) url += `&start=${startDate}`;
      if (endDate) url += `&end=${endDate}`;

      const data = await callApi(url);
      setReportData(data);
      showToast(`${data.title} generated — ${data.rows?.length || 0} rows`, 'success');
    } catch (err) {
      showToast('Report failed: ' + err.message, 'error');
    } finally {
      hideLoading();
    }
  }

  function exportCSV() {
    if (!reportData) return;

    const lines = [];
    lines.push(reportData.columns.join(','));
    for (const row of reportData.rows) {
      lines.push(row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','));
    }

    const csv = lines.join('\n');
    copyToClipboard(csv).then((ok) => {
      if (ok) showToast('CSV copied to clipboard!', 'success');
      else showToast('Failed to copy', 'error');
    });
  }

  const selectedType = REPORT_TYPES.find((r) => r.value === reportType);

  return (
    <>
      <div className="page-header animate-in">
        <PageBrand size="md" />
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate inventory reports and export data</p>
      </div>

      {/* Report Type Selector */}
      <div className="card animate-in">
        <div className="section-header">
          <h2 className="section-title">📋 Select Report</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-sm)' }}>
          {REPORT_TYPES.map((rt) => (
            <button
              key={rt.value}
              className={`btn ${reportType === rt.value ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', fontSize: '0.85rem' }}
              onClick={() => setReportType(rt.value)}
            >
              {rt.icon} {rt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range (if needed) */}
      {selectedType?.needsDates && (
        <div className="card animate-in">
          <div className="section-header">
            <h2 className="section-title">📅 Date Range</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      {reportType && (
        <button className="btn btn-primary btn-block btn-lg animate-in" style={{ marginBottom: 'var(--space-md)' }} onClick={generateReport}>
          Generate Report
        </button>
      )}

      {/* Report Results */}
      {reportData && (
        <div className="card animate-in">
          <div className="section-header">
            <h2 className="section-title">{reportData.title}</h2>
            <div className="btn-group">
              <span className="section-count">{reportData.rows?.length || 0} rows</span>
              <button className="btn btn-sm btn-secondary" onClick={exportCSV}>📋 Copy CSV</button>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {reportData.columns.map((col, i) => (
                    <th key={i}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(reportData.rows || []).map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className={j === 0 ? 'mono' : ''}>
                        {String(cell || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!reportData.rows || reportData.rows.length === 0) && (
            <div className="empty-state">
              <div className="empty-text">No data for this report</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
