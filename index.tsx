import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

if (typeof window !== 'undefined') {
  const originalMatchMedia = window.matchMedia;
  if (originalMatchMedia) {
    window.matchMedia = (query) => {
      const mql = originalMatchMedia.call(window, query);
      if (mql) {
        // Modern compatibility check
        if (!mql.addEventListener && mql.addListener) {
          mql.addEventListener = (type: string, listener: any) => {
            if (type === 'change' && typeof mql.addListener === 'function') mql.addListener(listener);
          };
          mql.removeEventListener = (type: string, listener: any) => {
            if (type === 'change' && typeof mql.removeListener === 'function') mql.removeListener(listener);
          };
        }
        // Legacy compatibility check (ensuring addListener exists for libs like Recharts)
        if (!mql.addListener && mql.addEventListener) {
          mql.addListener = (listener: any) => mql.addEventListener('change', listener);
          mql.removeListener = (listener: any) => mql.removeEventListener('change', listener);
        }
      }
      return mql;
    };
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);