'use client';

import { useEffect, useState } from 'react';
import { color } from '@/tokens';
import {
  canPromptInstall,
  promptInstall,
  onInstallAvailabilityChange,
  isIos,
} from '@/ui/install';
import { ShareIcon } from './icons';

/**
 * Bottom-sheet guide explaining how to install the app to the home screen and
 * why it matters: only an installed PWA appears in the OS share sheet, enabling
 * "엔카에서 공유 → 바로 분석". Without installing, copy-paste still works.
 */
export function InstallGuide({ onDismiss }: { onDismiss: () => void }) {
  const [installable, setInstallable] = useState(false);
  const ios = isIos();

  useEffect(() => {
    setInstallable(canPromptInstall());
    return onInstallAvailabilityChange(() => setInstallable(canPromptInstall()));
  }, []);

  const steps = ios
    ? ['Safari 하단 공유 버튼(□↑)을 누르세요', "'홈 화면에 추가'를 선택하세요", '추가된 아이콘으로 앱을 실행하세요']
    : [
        '브라우저 메뉴(⋮)를 여세요',
        "'앱 설치' 또는 '홈 화면에 추가'를 선택하세요",
        '설치된 아이콘으로 앱을 실행하세요',
      ];

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: color.surface,
          borderRadius: '24px 24px 0 0',
          padding: '24px 24px 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `${color.primary}1f`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color.primary,
            }}
          >
            <ShareIcon size={20} />
          </span>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: color.textPrimary }}>
            홈 화면에 설치하기
          </h2>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: color.textSecondary }}>
          앱을 설치하면 <b style={{ color: color.textPrimary }}>엔카에서 ‘공유’ 한 번으로 바로 분석</b>할
          수 있어요. 설치하지 않아도 URL을 복사해 붙여넣으면 동일하게 분석됩니다.
        </p>

        <div style={{ height: 20 }} />
        {steps.map((text, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: color.primary,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <span style={{ fontSize: 14, color: color.textPrimary }}>{text}</span>
          </div>
        ))}

        {installable && !ios && (
          <button
            onClick={() => void promptInstall()}
            style={{
              marginTop: 8,
              width: '100%',
              height: 52,
              background: color.primary,
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            지금 설치하기
          </button>
        )}

        {ios && (
          <div
            style={{
              marginTop: 8,
              padding: '12px 14px',
              background: color.background,
              borderRadius: 12,
              fontSize: 12,
              color: color.textSecondary,
              lineHeight: 1.5,
            }}
          >
            ⓘ iOS는 공유 시트 자동 등록을 지원하지 않아요. 위 단계로 홈 화면에 추가한 뒤, 엔카 URL을
            복사해 분석 탭에 붙여넣어 사용하세요.
          </div>
        )}
      </div>
    </div>
  );
}
