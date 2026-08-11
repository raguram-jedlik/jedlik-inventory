'use client';

import { useState } from 'react';

export default function ConfirmModal({ title, body, confirmText, confirmClass, onConfirm, onCancel }) {
  const [active, setActive] = useState(true);

  function handleClose(result) {
    setActive(false);
    setTimeout(() => {
      if (result) {
        onConfirm?.();
      } else {
        onCancel?.();
      }
    }, 300);
  }

  return (
    <div
      className={`modal-overlay ${active ? 'active' : ''}`}
      onClick={(e) => e.target === e.currentTarget && handleClose(false)}
    >
      <div className="modal">
        <div className="modal-title">{title}</div>
        <div className="modal-body" dangerouslySetInnerHTML={{ __html: body }} />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => handleClose(false)}>
            Cancel
          </button>
          <button className={`btn ${confirmClass || 'btn-primary'}`} onClick={() => handleClose(true)}>
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
