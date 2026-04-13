import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

if (typeof window !== 'undefined') {
  const originalMatchMedia = window.matchMedia;
  window.matchMedia = (query) => {
    let mql: any = null;
    if (originalMatchMedia) {
      try {
        mql = originalMatchMedia.call(window, query);
      } catch (e) { }
    }

    return {
      matches: mql ? !!mql.matches : false,
      media: mql ? mql.media : query,
      onchange: mql ? mql.onchange : null,
      addListener: (listener: any) => {
        if (mql && typeof mql.addListener === 'function') mql.addListener(listener);
        else if (mql && typeof mql.addEventListener === 'function') mql.addEventListener('change', listener);
      },
      removeListener: (listener: any) => {
        if (mql && typeof mql.removeListener === 'function') mql.removeListener(listener);
        else if (mql && typeof mql.removeEventListener === 'function') mql.removeEventListener('change', listener);
      },
      addEventListener: (type: string, listener: any) => {
        if (mql && typeof mql.addEventListener === 'function') mql.addEventListener(type, listener);
      },
      removeEventListener: (type: string, listener: any) => {
        if (mql && typeof mql.removeEventListener === 'function') mql.removeEventListener(type, listener);
      },
      dispatchEvent: (event: Event) => {
        if (mql && typeof mql.dispatchEvent === 'function') return mql.dispatchEvent(event);
        return false;
      },
    } as any;
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <App />
);