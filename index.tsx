import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Polyfill for matchMedia and its deprecated addListener/removeListener methods
// This fixes errors in some environments (like sandboxed iframes) where matchMedia
// might be missing or incomplete, which causes issues in libraries like Recharts or Supabase.
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => { },
      removeListener: () => { },
      addEventListener: () => { },
      removeEventListener: () => { },
      dispatchEvent: () => false,
    } as any);
  } else {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => {
      const mql = originalMatchMedia(query);
      if (mql && typeof mql === 'object') {
        if (!mql.addListener) {
          mql.addListener = (listener: any) => mql.addEventListener('change', listener);
        }
        if (!mql.removeListener) {
          mql.removeListener = (listener: any) => mql.removeEventListener('change', listener);
        }
        return mql;
      }
      return {
        matches: false,
        media: query,
        onchange: null,

        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
      } as any;
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