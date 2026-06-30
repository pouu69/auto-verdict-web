'use client';

import { useEffect, useState } from 'react';
import { color } from '@/tokens';
import { TrashIcon, ArrowForwardIcon } from '@/components/icons';
import { cacheRepo } from '@/storage/cache';

export function SettingsScreen({
  onPrivacyPolicy,
  onReplayGuide,
}: {
  onPrivacyPolicy: () => void;
  onReplayGuide: () => void;
}) {
  const [cacheCount, setCacheCount] = useState(0);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    void cacheRepo.count().then((n) => setCacheCount(n));
  }, []);

  const handleClearCache = async () => {
    await cacheRepo.clearAll();
    setCacheCount(0);
    setShowDialog(false);
  };

  return (
    <div style={{ background: color.background, minHeight: '100%' }}>
      {/* Top bar */}
      <div style={{ padding: '16px 20px 4px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: color.textPrimary }}>
          설정
        </h1>
      </div>

      <div style={{ padding: '4px 20px 40px' }}>
        {/* Section: 저장공간 */}
        <SectionHeader title="저장공간" />
        <SettingsGroup>
          <SettingsRow
            iconEmoji="🗄️"
            iconColor={color.primary}
            title="캐시 항목"
            subtitle={`${cacheCount}개 저장됨`}
            trailing={
              <span style={{ fontSize: 16, fontWeight: 600, color: color.textPrimary }}>
                {cacheCount}
              </span>
            }
          />
          <SettingsDivider />
          <SettingsRow
            iconEmoji="🕐"
            iconColor={color.primary}
            title="캐시 유효기간"
            subtitle="24시간 후 자동 만료"
            trailing={
              <span style={{ fontSize: 13, fontWeight: 500, color: color.textSecondary }}>
                24h
              </span>
            }
          />
          {cacheCount > 0 && (
            <>
              <SettingsDivider />
              <SettingsRow
                iconEmoji="🗑️"
                iconColor={color.danger}
                title="캐시 삭제"
                subtitle="저장된 분석 캐시 전체 제거"
                titleColor={color.danger}
                onClick={() => setShowDialog(true)}
                trailing={
                  <span style={{ color: color.textSecondary, fontSize: 18 }}>›</span>
                }
              />
            </>
          )}
        </SettingsGroup>

        <div style={{ height: 16 }} />

        {/* Section: 정보 */}
        <SectionHeader title="정보" />
        <SettingsGroup>
          <SettingsRow
            iconEmoji="❓"
            iconColor={color.primary}
            title="사용법 다시 보기"
            subtitle="엔카 공유로 분석하는 방법 안내"
            onClick={onReplayGuide}
            trailing={<span style={{ color: color.textSecondary, fontSize: 18 }}>›</span>}
          />
          <SettingsDivider />
          <SettingsRow
            iconEmoji="🔏"
            iconColor={color.primary}
            title="개인정보 처리방침"
            subtitle="데이터 사용 및 권한 안내"
            onClick={onPrivacyPolicy}
            trailing={<span style={{ color: color.textSecondary, fontSize: 18 }}>›</span>}
          />
          <SettingsDivider />
          <SettingsRow
            iconEmoji="ℹ️"
            iconColor={color.primary}
            title="버전"
            subtitle="AutoVerdict for Web"
            trailing={
              <span style={{ fontSize: 13, fontWeight: 500, color: color.textSecondary }}>
                v1.0.0
              </span>
            }
          />
        </SettingsGroup>

        {/* Footer */}
        <div style={{ height: 28 }} />
        <p
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 12,
            color: `${color.textSecondary}b3`,
          }}
        >
          AutoVerdict · 엔카 매물 종합 평가
        </p>
      </div>

      {/* Cache clear confirm dialog */}
      {showDialog && (
        <div
          onClick={() => setShowDialog(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 340,
              background: color.surface,
              borderRadius: 20,
              padding: '28px 24px 20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: color.dangerBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: color.danger,
              }}
            >
              <TrashIcon size={22} color={color.danger} />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: color.textPrimary }}>
              캐시를 삭제할까요?
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: color.textSecondary, lineHeight: 1.5 }}>
              {cacheCount}개의 분석 캐시가 모두 삭제됩니다. 다음 분석 시 다시 캐싱됩니다.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDialog(false)}
                style={{
                  flex: 1,
                  height: 46,
                  border: `1px solid ${color.border}`,
                  borderRadius: 12,
                  background: 'transparent',
                  fontSize: 15,
                  fontWeight: 500,
                  color: color.textSecondary,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={() => void handleClearCache()}
                style={{
                  flex: 1,
                  height: 46,
                  border: 'none',
                  borderRadius: 12,
                  background: color.danger,
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p
      style={{
        margin: '12px 0 8px 8px',
        fontSize: 12,
        fontWeight: 600,
        color: color.textSecondary,
        letterSpacing: 0.3,
      }}
    >
      {title}
    </p>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: color.surface,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function SettingsDivider() {
  return (
    <div
      style={{
        marginLeft: 64,
        height: 0.5,
        background: `${color.border}99`,
      }}
    />
  );
}

function SettingsRow({
  iconEmoji,
  iconColor,
  title,
  subtitle,
  titleColor,
  onClick,
  trailing,
}: {
  iconEmoji: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  titleColor?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 14px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${iconColor}1a`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {iconEmoji}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 15,
            fontWeight: 500,
            color: titleColor ?? color.textPrimary,
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span style={{ display: 'block', fontSize: 12, color: color.textSecondary, marginTop: 1 }}>
            {subtitle}
          </span>
        )}
      </span>
      {trailing && (
        <span style={{ flexShrink: 0 }}>{trailing}</span>
      )}
    </div>
  );
}
