'use client';

import { useEffect, useState } from 'react';
import { color } from '@/tokens';
import type { AnalyzeRequest } from '@/ui/navigation';
import { isEncarDetail, HOME_URL } from '@/encar/url';
import { SAMPLE_LISTINGS } from '@/collect/samples';
import { cacheRepo } from '@/storage/cache';
import type { CacheEntry } from '@/storage/types';
import { isStandalone } from '@/ui/install';
import { useIsDesktop } from '@/ui/useIsDesktop';
import { InstallGuide } from '@/components/InstallGuide';
import { ShareIcon, SparkleIcon, ArrowForwardIcon } from '@/components/icons';

export function AnalyzeScreen({ onAnalyze }: { onAnalyze: (req: AnalyzeRequest) => void }) {
  const [urlText, setUrlText] = useState('');
  const [fromClipboard, setFromClipboard] = useState(false);
  const [recent, setRecent] = useState<CacheEntry[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [installed, setInstalled] = useState(true);
  // Web Share Target is a mobile-only flow — desktop browsers can't be share
  // targets, so we only surface the install/share banner on touch devices.
  const [shareCapable, setShareCapable] = useState(false);

  const isDesktop = useIsDesktop();
  const isValid = isEncarDetail(urlText);
  const showError = urlText.trim().length > 0 && !isValid;

  useEffect(() => {
    void cacheRepo.getRecent().then((r) => setRecent(r.slice(0, 5)));
    setInstalled(isStandalone());
    setShareCapable(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const pasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (isEncarDetail(text)) {
        setUrlText(text.trim());
        setFromClipboard(true);
      }
    } catch {
      /* clipboard blocked — ignore, user can type */
    }
  };

  const startUrl = () => isValid && onAnalyze({ kind: 'url', url: urlText.trim() });

  if (isDesktop) {
    return (
      <div style={{ padding: '64px 40px 56px' }}>
        {/* Hero */}
        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              borderRadius: 999,
              background: `${color.primary}14`,
              color: color.primary,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.4,
            }}
          >
            AUTO ANALYSIS
          </span>
          <h1
            style={{
              margin: '20px 0 14px',
              fontSize: 42,
              fontWeight: 800,
              lineHeight: 1.25,
              color: color.textPrimary,
              letterSpacing: '-0.02em',
            }}
          >
            엔카 중고차, <span style={{ color: color.primary }}>한 번에 진단</span>
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: color.textSecondary }}>
            엔카 매물 URL만 붙여넣으면 사고이력·정비·진단 정보를
            <br />
            12가지 규칙으로 자동 평가해 드립니다.
          </p>

          {/* URL input row */}
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: color.surface,
              border: `1.5px solid ${showError ? color.danger : color.border}`,
              borderRadius: 16,
              padding: '8px 8px 8px 18px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            }}
          >
            <span style={{ color: color.textSecondary, fontSize: 18 }}>🔗</span>
            <input
              value={urlText}
              onChange={(e) => {
                setUrlText(e.target.value);
                setFromClipboard(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && startUrl()}
              placeholder="fem.encar.com/cars/detail/..."
              inputMode="url"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '14px 0',
                fontSize: 16,
                background: 'transparent',
                color: color.textPrimary,
              }}
            />
            <button
              onClick={() => void pasteClipboard()}
              style={{
                border: 'none',
                background: 'transparent',
                color: color.primary,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '0 8px',
                whiteSpace: 'nowrap',
              }}
            >
              붙여넣기
            </button>
            <button
              onClick={startUrl}
              disabled={!isValid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 48,
                padding: '0 26px',
                background: isValid ? color.primary : `${color.primary}4d`,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: isValid ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
              }}
            >
              <SparkleIcon size={18} /> 분석 시작
            </button>
          </div>
          <div style={{ minHeight: 22, marginTop: 8, textAlign: 'left', paddingLeft: 4 }}>
            {showError && (
              <span style={{ color: color.danger, fontSize: 13 }}>
                올바른 엔카 매물 URL을 입력해주세요
              </span>
            )}
          </div>
          <button
            onClick={() => setShowGuide(true)}
            style={{
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
              background: 'transparent',
              color: color.textSecondary,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <ShareIcon size={15} /> 엔카에서 매물 URL 찾는 법
          </button>
        </div>

        {/* Samples */}
        <div style={{ maxWidth: 920, margin: '52px auto 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: color.textPrimary }}>
              샘플로 둘러보기
            </span>
            <span style={{ fontSize: 13, color: color.textSecondary }}>
              실제 엔진으로 평가되는 예시 매물
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
            }}
          >
            {SAMPLE_LISTINGS.map((s) => (
              <button
                key={s.id}
                onClick={() => onAnalyze({ kind: 'sample', sampleId: s.id })}
                style={{
                  textAlign: 'left',
                  background: color.surface,
                  border: `1px solid ${color.border}`,
                  borderRadius: 16,
                  padding: '18px 18px 20px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: color.textPrimary }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 13, color: color.textSecondary, marginTop: 6 }}>{s.hint}</div>
                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: color.primary,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  분석 보기 <ArrowForwardIcon size={14} />
                </div>
              </button>
            ))}
          </div>

          {recent.length > 0 && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '36px 0 14px',
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: color.textPrimary }}>
                  최근 조회
                </span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: color.textSecondary }}>24시간</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 10,
                }}
              >
                {recent.map((item) => (
                  <button
                    key={item.carId}
                    onClick={() => onAnalyze({ kind: 'url', url: item.url })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: color.surface,
                      border: `1px solid ${color.border}`,
                      borderRadius: 14,
                      padding: 14,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 11,
                        background: `${color.primary}14`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      🔗
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 14,
                          fontWeight: 600,
                          color: color.textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title || `매물 #${item.carId}`}
                      </span>
                      <span style={{ display: 'block', fontSize: 12, color: color.textSecondary }}>
                        {new Date(item.cachedAt).toLocaleString('ko-KR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {showGuide && <GuideSheet onDismiss={() => setShowGuide(false)} />}
      </div>
    );
  }

  return (
    <div style={{ background: color.background, minHeight: '100%' }}>
      {/* Top bar */}
      <div style={{ padding: '16px 20px 4px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: color.textPrimary }}>
          AutoVerdict
        </h1>
      </div>

      <div style={{ padding: '4px 20px 24px' }}>
        {/* Install banner — only on touch devices (share target is mobile-only)
            and when not already running as an installed PWA */}
        {!installed && shareCapable && (
          <button
            onClick={() => setShowInstall(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: color.primary,
              border: 'none',
              borderRadius: 16,
              padding: '14px 16px',
              marginBottom: 12,
              cursor: 'pointer',
              textAlign: 'left',
              color: '#fff',
            }}
          >
            <span style={{ fontSize: 20 }}>📲</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>
                홈 화면에 설치하고 공유로 바로 분석
              </span>
              <span style={{ display: 'block', fontSize: 12, opacity: 0.85 }}>
                설치하면 엔카 공유 시트에 추가돼요 · 탭해서 보기
              </span>
            </span>
            <span style={{ fontSize: 20 }}>›</span>
          </button>
        )}

        {/* Guide prompt card */}
        <button
          onClick={() => setShowGuide(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: `${color.primary}0f`,
            border: 'none',
            borderRadius: 20,
            padding: 18,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
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
              flexShrink: 0,
            }}
          >
            <ShareIcon size={20} />
          </span>
          <span style={{ flex: 1 }}>
            <span
              style={{ display: 'block', fontSize: 16, fontWeight: 600, color: color.textPrimary }}
            >
              엔카 매물 URL로 자동 분석
            </span>
            <span style={{ display: 'block', fontSize: 12, color: color.textSecondary }}>
              탭해서 사용법 보기
            </span>
          </span>
          <span style={{ color: color.primary, fontSize: 20 }}>›</span>
        </button>

        <div style={{ height: 20 }} />

        {/* Or divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: `${color.border}` }} />
          <span style={{ fontSize: 12, color: color.textSecondary }}>또는 링크 직접 입력</span>
          <div style={{ flex: 1, height: 1, background: `${color.border}` }} />
        </div>

        <div style={{ height: 14 }} />

        {/* URL input card */}
        <div style={{ background: color.surface, borderRadius: 20, padding: 20 }}>
          {fromClipboard && isValid && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 12,
                color: color.primary,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              📋 복사한 링크를 가져왔어요
            </div>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: `1px solid ${showError ? color.danger : color.border}`,
              borderRadius: 12,
              padding: '0 12px',
              background: color.surface,
            }}
          >
            <span style={{ color: showError ? color.danger : color.textSecondary }}>🔗</span>
            <input
              value={urlText}
              onChange={(e) => {
                setUrlText(e.target.value);
                setFromClipboard(false);
              }}
              placeholder="fem.encar.com/cars/detail/..."
              inputMode="url"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '14px 0',
                fontSize: 14,
                background: 'transparent',
                color: color.textPrimary,
              }}
            />
            <button
              onClick={() => void pasteClipboard()}
              style={{
                border: 'none',
                background: 'transparent',
                color: color.primary,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              붙여넣기
            </button>
          </div>
          {showError && (
            <div style={{ color: color.danger, fontSize: 12, marginTop: 6 }}>
              올바른 엔카 매물 URL을 입력해주세요
            </div>
          )}
          <div style={{ height: 14 }} />
          <button
            onClick={() => isValid && onAnalyze({ kind: 'url', url: urlText.trim() })}
            disabled={!isValid}
            style={{
              width: '100%',
              height: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: isValid ? color.primary : `${color.primary}4d`,
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 600,
              cursor: isValid ? 'pointer' : 'default',
            }}
          >
            <SparkleIcon size={18} /> 분석 시작
          </button>
        </div>

        {/* Sample listings */}
        <SectionHeader title="샘플로 둘러보기" badge="체험" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 8,
          }}
        >
          {SAMPLE_LISTINGS.map((s) => (
            <button
              key={s.id}
              onClick={() => onAnalyze({ kind: 'sample', sampleId: s.id })}
              style={{
                textAlign: 'left',
                background: color.surface,
                border: `1px solid ${color.border}`,
                borderRadius: 14,
                padding: 14,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: color.textPrimary }}>
                {s.label}
              </div>
              <div style={{ fontSize: 12, color: color.textSecondary, marginTop: 4 }}>{s.hint}</div>
            </button>
          ))}
        </div>

        {/* Recent (24h cache) */}
        {recent.length > 0 && (
          <>
            <SectionHeader title="최근 조회" badge="24시간" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recent.map((item) => (
                <button
                  key={item.carId}
                  onClick={() => onAnalyze({ kind: 'url', url: item.url })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: color.surface,
                    border: 'none',
                    borderRadius: 14,
                    padding: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      background: `${color.primary}14`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: color.primary,
                      flexShrink: 0,
                    }}
                  >
                    🔗
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 500,
                        color: color.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title || `매물 #${item.carId}`}
                    </span>
                    <span style={{ display: 'block', fontSize: 11, color: color.textSecondary }}>
                      🕑 {new Date(item.cachedAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </span>
                  <span style={{ color: color.textSecondary }}>›</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {showGuide && <GuideSheet onDismiss={() => setShowGuide(false)} />}
      {showInstall && <InstallGuide onDismiss={() => setShowInstall(false)} />}
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        margin: '28px 0 10px',
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 600, color: color.textPrimary }}>{title}</span>
      <span style={{ flex: 1 }} />
      <span
        style={{
          fontSize: 11,
          color: color.textSecondary,
          background: color.surface,
          borderRadius: 999,
          padding: '4px 10px',
        }}
      >
        {badge}
      </span>
    </div>
  );
}

function GuideSheet({ onDismiss }: { onDismiss: () => void }) {
  const isDesktop = useIsDesktop();
  const steps = [
    '브라우저로 엔카 매물 페이지 열기',
    '주소창의 매물 URL 복사하기',
    "분석 화면에 붙여넣고 '분석 시작'",
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
        // Desktop: centered modal. Mobile: bottom sheet.
        alignItems: isDesktop ? 'center' : 'flex-end',
        justifyContent: 'center',
        padding: isDesktop ? 24 : 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isDesktop ? 440 : 480,
          background: color.surface,
          borderRadius: isDesktop ? 20 : '24px 24px 0 0',
          padding: isDesktop ? 28 : '24px 24px 32px',
          boxShadow: isDesktop ? '0 24px 60px rgba(0,0,0,0.22)' : undefined,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: color.textPrimary }}>
          엔카 URL로 분석하는 법
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: color.textSecondary }}>
          엔카 매물을 가장 빠르게 분석하는 방법이에요
        </p>
        <div style={{ height: 20 }} />
        {steps.map((text, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
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
        <a
          href={HOME_URL}
          target="_blank"
          rel="noreferrer noopener"
          style={{
            marginTop: 8,
            width: '100%',
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: color.primary,
            color: '#fff',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowForwardIcon size={18} /> 엔카에서 매물 찾기
        </a>
      </div>
    </div>
  );
}
