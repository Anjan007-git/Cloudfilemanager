import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Fetch Interceptor to dynamically route /api/* requests to production Cloud Run URL when deployed on Vercel
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    writable: true,
    value: function (input: any, init: any) {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        const isVercel = window.location.hostname.includes('vercel.app');
        const isNotCloudRun = !window.location.hostname.endsWith('.run.app') && 
                              window.location.hostname !== 'localhost' && 
                              window.location.hostname !== '127.0.0.1';
        
        if (isVercel || isNotCloudRun) {
          const apiBase = (import.meta as any).env.VITE_API_URL || 'https://ais-pre-3jurc4t4l3jgejtc77cjns-965251783867.asia-southeast1.run.app';
          input = `${apiBase}${input}`;
        }
      }
      return originalFetch(input, init);
    }
  });
} catch (e) {
  console.warn('Dynamic fetch redirection could not be registered on read-only window.fetch object. Relying on Vercel rewrites or native configurations.', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
