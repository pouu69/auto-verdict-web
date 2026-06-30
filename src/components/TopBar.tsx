'use client';

import type { ReactNode } from 'react';
import { color } from '@/tokens';
import { BackIcon } from './icons';

/** Simple top app bar with a back button — used by full-screen sub-pages. */
export function TopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        height: 56,
        padding: '0 8px',
        background: color.surface,
        borderBottom: `1px solid ${color.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <button
        onClick={onBack}
        aria-label="뒤로"
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: color.textPrimary,
        }}
      >
        <BackIcon size={24} />
      </button>
      <h1 style={{ flex: 1, fontSize: 17, fontWeight: 700, margin: 0, color: color.textPrimary }}>
        {title}
      </h1>
      {right}
    </header>
  );
}
