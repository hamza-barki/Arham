'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✓ Arham Collection ServiceWorker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('ServiceWorker registration error:', error);
          });
      });
    }
  }, []);

  return null;
}

