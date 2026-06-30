'use client';

import { useEffect } from 'react';
import { initInstall } from '@/ui/install';

/** Registers the service worker so the app is installable as a PWA / share target. */
export function Pwa() {
  useEffect(() => {
    initInstall();
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* registration failed — app still works, just not installable */
      });
    };
    if (document.readyState === 'complete') register();
    else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
