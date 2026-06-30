'use client';

import { useEffect, useRef } from 'react';
import { color } from '@/tokens';

/**
 * Web replacement for the Android AdMob `AdBanner`.
 * Renders a Google AdSense display unit when NEXT_PUBLIC_ADSENSE_CLIENT /
 * _SLOT are configured; otherwise shows a neutral placeholder so the layout
 * (a fixed ad strip above the bottom nav) is preserved during development.
 */
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

export function AdBanner() {
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || !ADSENSE_SLOT || pushed.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* AdSense not ready — ignore */
    }
  }, []);

  if (!ADSENSE_CLIENT || !ADSENSE_SLOT) {
    return (
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: color.surface,
          borderTop: `1px solid ${color.border}`,
          color: color.textSecondary,
          fontSize: 11,
          letterSpacing: 1,
        }}
        aria-hidden
      >
        AD
      </div>
    );
  }

  return (
    <div style={{ background: color.surface, borderTop: `1px solid ${color.border}` }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', height: 56 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="horizontal"
        data-full-width-responsive="false"
      />
    </div>
  );
}
