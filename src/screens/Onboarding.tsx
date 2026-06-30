'use client';

import { useRef, useState, type ReactNode } from 'react';
import { color } from '@/tokens';
import { SparkleIcon, ShareIcon, VerifiedIcon, ArrowForwardIcon } from '@/components/icons';

interface Page {
  icon: typeof SparkleIcon;
  tag: string;
  title: string;
  description: string;
  illustration?: ReactNode;
}

const PAGES: Page[] = [
  {
    icon: SparkleIcon,
    tag: 'AUTO ANALYSIS',
    title: '엔카 매물,\n자동으로 분석해드려요',
    description: '사고 이력, 정비 기록, 진단 정보를\n12가지 규칙으로 한 번에 평가합니다.',
  },
  {
    icon: ShareIcon,
    tag: 'QUICK START',
    title: 'URL 붙여넣기 한 번으로\n바로 분석 시작',
    description: '엔카 매물 페이지 주소를 복사해\n분석 탭에 붙여넣기만 하면 끝.',
    illustration: <UrlBarIllustration />,
  },
  {
    icon: VerifiedIcon,
    tag: 'VERDICT SCORE',
    title: '점수로 보는\n한눈에 매물 등급',
    description: '위험·주의·양호 카운트와 종합 점수로\n좋은 매물을 빠르게 찾고 저장해보세요.',
  },
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const isLast = index === PAGES.length - 1;

  const go = (next: number) => setIndex(Math.max(0, Math.min(PAGES.length - 1, next)));

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: color.background,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', height: 56 }}>
        {!isLast && (
          <button
            onClick={onComplete}
            style={{
              border: 'none',
              background: 'transparent',
              color: color.textSecondary,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            건너뛰기
          </button>
        )}
      </div>

      {/* Pager */}
      <div
        style={{ flex: 1, overflow: 'hidden' }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
          if (dx < -50) go(index + 1);
          else if (dx > 50) go(index - 1);
          touchX.current = null;
        }}
      >
        <div
          style={{
            display: 'flex',
            height: '100%',
            transform: `translateX(-${index * 100}%)`,
            transition: 'transform 0.3s ease',
          }}
        >
          {PAGES.map((page, i) => (
            <div key={i} style={{ flex: '0 0 100%', height: '100%' }}>
              <PageContent page={page} />
            </div>
          ))}
        </div>
      </div>

      {/* Indicators */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          alignItems: 'center',
          padding: '8px 0',
        }}
      >
        {PAGES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === index ? 28 : 8,
              height: 8,
              borderRadius: 999,
              background: i === index ? color.primary : color.border,
              transition: 'width 0.28s ease',
            }}
          />
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '16px 24px 28px' }}>
        <button
          onClick={() => (isLast ? onComplete() : go(index + 1))}
          style={{
            width: '100%',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: color.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isLast ? '시작하기' : '다음'}
          {!isLast && <ArrowForwardIcon size={18} />}
        </button>
      </div>
    </div>
  );
}

function PageContent({ page }: { page: Page }) {
  const Icon = page.icon;
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
        textAlign: 'center',
      }}
    >
      {page.illustration ?? (
        <div
          style={{
            width: 176,
            height: 176,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `radial-gradient(circle, ${color.primary}2e 0%, ${color.primary}00 70%)`,
          }}
        >
          <div
            style={{
              width: 108,
              height: 108,
              borderRadius: 28,
              background: `linear-gradient(135deg, ${color.primary}, ${color.primary}d9)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Icon size={48} />
          </div>
        </div>
      )}

      <div style={{ height: 36 }} />

      <span
        style={{
          borderRadius: 999,
          background: `${color.primary}14`,
          color: color.primary,
          padding: '5px 10px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
        }}
      >
        {page.tag}
      </span>

      <div style={{ height: 16 }} />

      <h2
        style={{
          margin: 0,
          fontSize: 26,
          fontWeight: 800,
          lineHeight: 1.3,
          color: color.textPrimary,
          whiteSpace: 'pre-line',
        }}
      >
        {page.title}
      </h2>

      <div style={{ height: 14 }} />

      <p
        style={{
          margin: 0,
          fontSize: 16,
          lineHeight: 1.6,
          color: color.textSecondary,
          whiteSpace: 'pre-line',
        }}
      >
        {page.description}
      </p>
    </div>
  );
}

/** Mock browser URL bar — web equivalent of the Android share-sheet illustration. */
function UrlBarIllustration() {
  return (
    <div style={{ width: '100%', maxWidth: 280 }}>
      <div
        style={{
          background: color.surface,
          borderRadius: 16,
          padding: 16,
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: `1px solid ${color.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: color.background,
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <span style={{ fontSize: 13, color: color.textSecondary }}>🔒</span>
          <span style={{ fontSize: 13, color: color.textPrimary, flex: 1, textAlign: 'left' }}>
            fem.encar.com/cars/detail/…
          </span>
          <span style={{ fontSize: 13, color: color.primary, fontWeight: 700 }}>복사</span>
        </div>
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            color: color.primary,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <ArrowForwardIcon size={16} /> 분석 탭에 붙여넣기
        </div>
      </div>
    </div>
  );
}
