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
        mql = originalMatchMedia(query);
      } catch (e) { }
    }

    return {
      matches: mql ? !!mql.matches : false,
      media: mql ? mql.media : query,
      onchange: mql ? mql.onchange : null,
      addListener: (listener: any) => {
        if (mql?.addListener) mql.addListener(listener);
        else if (mql?.addEventListener) mql.addEventListener('change', listener);
      },
      removeListener: (listener: any) => {
        if (mql?.removeListener) mql.removeListener(listener);
        else if (mql?.removeEventListener) mql.removeEventListener('change', listener);
      },
      addEventListener: (type: string, listener: any) => {
        if (mql?.addEventListener) mql.addEventListener(type, listener);
      },
      removeEventListener: (type: string, listener: any) => {
        if (mql?.removeEventListener) mql.removeEventListener(type, listener);
      },
      dispatchEvent: (event: Event) => {
        if (mql?.dispatchEvent) return mql.dispatchEvent(event);
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