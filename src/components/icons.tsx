/** Lightweight inline SVG icons (replace Material icons from the Android app). */
import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

const base = (size: number, style?: CSSProperties) => ({
  width: size,
  height: size,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  style,
});

export const SearchIcon = ({ size = 24, color, style }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, { color, ...style })}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const BookmarkIcon = ({ size = 24, color, style }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, { color, ...style })}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export const SettingsIcon = ({ size = 24, color, style }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, { color, ...style })}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const BackIcon = ({ size = 24, color, style }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, { color, ...style })}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ArrowForwardIcon = ({ size = 24, color, style }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, { color, ...style })}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const ShareIcon = ({ size = 24, color, style }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, { color, ...style })}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

export const SparkleIcon = ({ size = 24, color, style }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, { color, ...style })}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
  </svg>
);

export const VerifiedIcon = ({ size = 24, color, style }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, { color, ...style })}>
    <path d="M9 12l2 2 4-4" />
    <path d="M12 3l2.1 1.5 2.6-.2 1 2.4 2.2 1.4-.7 2.5.7 2.5-2.2 1.4-1 2.4-2.6-.2L12 21l-2.1-1.5-2.6.2-1-2.4-2.2-1.4.7-2.5-.7-2.5 2.2-1.4 1-2.4 2.6.2z" />
  </svg>
);

export const TrashIcon = ({ size = 24, color, style }: IconProps) => (
  <svg viewBox="0 0 24 24" {...base(size, { color, ...style })}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
