'use client';

import { color } from '@/tokens';
import { type Tab, TAB_LABELS } from '@/ui/navigation';
import { SearchIcon, BookmarkIcon, SettingsIcon } from './icons';

const ICONS: Record<Tab, typeof SearchIcon> = {
  ANALYZE: SearchIcon,
  SAVED: BookmarkIcon,
  SETTINGS: SettingsIcon,
};

const ORDER: Tab[] = ['ANALYZE', 'SAVED', 'SETTINGS'];

interface NavProps {
  selected: Tab;
  onSelect: (tab: Tab) => void;
}

/** Bottom tab bar — mobile / tablet (<1024px). */
export function BottomNav({ selected, onSelect }: NavProps) {
  return (
    <nav
      className="av-nav-bottom"
      style={{
        background: color.surface,
        borderTop: `1px solid ${color.border}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {ORDER.map((tab) => {
        const Icon = ICONS[tab];
        const active = tab === selected;
        const tint = active ? color.primary : color.textSecondary;
        return (
          <button
            key={tab}
            onClick={() => onSelect(tab)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 0 10px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: tint,
            }}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={24} />
            <span style={{ fontSize: 12, fontWeight: active ? 700 : 500 }}>{TAB_LABELS[tab]}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Left side rail — desktop (>=1024px). */
export function SideNav({ selected, onSelect }: NavProps) {
  return (
    <nav
      className="av-nav-side"
      style={{
        flexDirection: 'column',
        width: 256,
        flexShrink: 0,
        background: color.surface,
        borderRight: `1px solid ${color.border}`,
        padding: '28px 18px',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '4px 12px 20px',
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: color.primary,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          AV
        </span>
        <span style={{ fontSize: 17, fontWeight: 800, color: color.textPrimary }}>AutoVerdict</span>
      </div>
      {ORDER.map((tab) => {
        const Icon = ICONS[tab];
        const active = tab === selected;
        return (
          <button
            key={tab}
            onClick={() => onSelect(tab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background: active ? `${color.primary}12` : 'transparent',
              color: active ? color.primary : color.textSecondary,
              fontSize: 15,
              fontWeight: active ? 700 : 500,
              textAlign: 'left',
            }}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} />
            {TAB_LABELS[tab]}
          </button>
        );
      })}
      <div
        style={{
          marginTop: 'auto',
          padding: '14px 14px 4px',
          fontSize: 12,
          lineHeight: 1.6,
          color: color.textSecondary,
        }}
      >
        엔카 중고차 매물을
        <br />
        12가지 규칙으로 자동 진단
      </div>
    </nav>
  );
}
