'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext(null);

export function useLoading() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState({ active: false, text: 'Loading...' });

  const showLoading = useCallback((text = 'Loading...') => {
    setLoading({ active: true, text });
  }, []);

  const hideLoading = useCallback(() => {
    setLoading({ active: false, text: 'Loading...' });
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      <div className={`loading-overlay ${loading.active ? 'active' : ''}`}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <div className="loading-text">{loading.text}</div>
        </div>
      </div>
    </LoadingContext.Provider>
  );
}
