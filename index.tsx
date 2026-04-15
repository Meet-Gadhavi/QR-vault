import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

if (typeof window !== 'undefined' && window.matchMedia) {
  // Only patch if addEventListener is missing (older browsers)
  const proto = Object.getPrototypeOf(window.matchMedia('all'));
  if (proto && !proto.addEventListener) {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => {
      const mql = originalMatchMedia.call(window, query);
      if (!mql.addEventListener) {
        mql.addEventListener = (type: string, listener: any) => {
          if (type === 'change') mql.addListener(listener);
        };
        mql.removeEventListener = (type: string, listener: any) => {
          if (type === 'change') mql.removeListener(listener);
        };
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