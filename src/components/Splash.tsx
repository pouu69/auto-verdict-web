'use client';

import { useEffect } from 'react';
import { color } from '@/tokens';

/** Brand splash — port of MainActivity.BrandSplashScreen (1.5s, primary bg). */
export function Splash({ onFinished }: { onFinished: () => void }) {
  useEffect(() => {
    // Desktop browsers skip the splash entirely (mobile-app pattern only).
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
      onFinished();
      return;
    }
    const t = setTimeout(onFinished, 1500);
    return () => clearTimeout(t);
  }, [onFinished]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: color.primary,
        gap: 20,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          fontWeight: 800,
          color: color.primary,
        }}
      >
        AV
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>AutoVerdict</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
          엔카 중고차 종합 평가
        </div>
      </div>
    </div>
  );
}
