'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { useLoading } from '@/components/LoadingOverlay';
import { PageBrand } from '@/components/Navbar';
import { callApi } from '@/lib/utils';

export default function PrintPage() {
  const showToast = useToast();
  const { showLoading, hideLoading } = useLoading();
  const [labels, setLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLabels();
  }, []);

  async function loadLabels() {
    try {
      const data = await callApi('/api/qr');
      // Only show labels that have QR codes
      setLabels(data.filter((l) => l.qrGenerated));
    } catch (err) {
      showToast('Failed to load labels: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function toggleLabel(id) {
    setSelectedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedLabels.size === labels.length) {
      setSelectedLabels(new Set());
    } else {
      setSelectedLabels(new Set(labels.map((l) => l.locationId)));
    }
  }

  function handlePrint() {
    window.print();
  }

  const visibleLabels = selectedLabels.size > 0
    ? labels.filter((l) => selectedLabels.has(l.locationId))
    : labels;

  return (
    <>
      <div className="page-header animate-in no-print">
        <PageBrand size="sm" />
        <h1 className="page-title">Print QR Labels</h1>
        <p className="page-subtitle">Select labels to print, or print all</p>
      </div>

      {/* Controls */}
      <div className="card animate-in no-print">
        <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={selectAll}>
            {selectedLabels.size === labels.length ? 'Deselect All' : 'Select All'}
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Print {selectedLabels.size > 0 ? `${selectedLabels.size} Labels` : 'All Labels'}
          </button>
          <span className="section-count" style={{ alignSelf: 'center' }}>
            {labels.length} labels available
          </span>
        </div>
      </div>

      {/* Labels Grid */}
      {loading ? (
        <div className="card animate-in">
          <div className="empty-state">
            <div className="empty-text">Loading QR labels...</div>
          </div>
        </div>
      ) : labels.length === 0 ? (
        <div className="card animate-in">
          <div className="empty-state">
            <div className="empty-icon">📱</div>
            <div className="empty-text">No QR labels generated yet. Go to Admin → QR Codes to generate them.</div>
          </div>
        </div>
      ) : (
        <div className="print-grid">
          {visibleLabels.map((label) => (
            <div
              key={label.locationId}
              className={`qr-label ${selectedLabels.has(label.locationId) ? 'selected' : ''}`}
              onClick={() => toggleLabel(label.locationId)}
            >
              {label.qrCodeUrl && (
                <img src={label.qrCodeUrl} alt={`QR: ${label.locationId}`} loading="lazy" />
              )}
              <div className="label-id">{label.locationId}</div>
              <div className="label-name">{label.locationName || ''}</div>
              <div className="label-type">{label.storageType || ''}</div>
              <img src="/jedlik-logo.png" alt="Jedlik Motors" className="label-brand" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
