'use client';

import { color } from '@/tokens';
import { TopBar } from '@/components/TopBar';

interface PolicyEntry {
  number: number;
  icon: string;
  title: string;
  content: string;
}

const policyEntries: PolicyEntry[] = [
  {
    number: 1,
    icon: 'ℹ️',
    title: '수집하는 정보',
    content:
      'AutoVerdict는 사용자가 입력한 엔카 매물 URL과 해당 매물의 공개 정보(차량 상태, 이력, 가격 등)를 처리합니다. 모든 데이터는 사용자의 기기에만 저장되며, 외부 서버로 전송되지 않습니다.',
  },
  {
    number: 2,
    icon: '🔍',
    title: '정보 이용 목적',
    content:
      '수집된 정보는 차량 평가 분석 결과를 생성하고, 사용자가 저장한 매물 목록을 관리하는 데에만 사용됩니다.',
  },
  {
    number: 3,
    icon: '💾',
    title: '데이터 저장',
    content:
      '• 분석 캐시: 최근 분석한 매물 데이터를 24시간 동안 기기 내부에 캐시합니다.\n• 저장 목록: 사용자가 명시적으로 저장한 매물 정보를 기기 내부 데이터베이스에 보관합니다.\n• 캐시 데이터는 설정 화면에서 수동으로 삭제할 수 있습니다.',
  },
  {
    number: 4,
    icon: '🔒',
    title: '네트워크 통신',
    content:
      '앱은 엔카(encar.com) 웹사이트에서 공개된 매물 정보를 조회합니다. 이 과정에서 사용자의 개인정보는 전송되지 않습니다.',
  },
  {
    number: 5,
    icon: '📱',
    title: '권한 사용',
    content:
      '• 인터넷 권한: 엔카 매물 정보를 조회하기 위해 사용합니다.\n• 광고 권한: 배너/전면 광고 표시를 위해 사용합니다.',
  },
  {
    number: 6,
    icon: '🚫',
    title: '제3자 제공',
    content: 'AutoVerdict는 수집한 데이터를 제3자에게 제공하지 않습니다.',
  },
  {
    number: 7,
    icon: '✉️',
    title: '문의',
    content: '개인정보 처리에 관한 문의는 pouu69@gmail.com 으로 연락해주세요.',
  },
];

function PolicyHeroBlock() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderRadius: 16,
        background: `rgba(0, 100, 255, 0.06)`,
        padding: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `rgba(0, 100, 255, 0.14)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        📋
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: color.primary,
            marginBottom: 2,
          }}
        >
          내 기기에만 저장됩니다
        </div>
        <div style={{ fontSize: 12, color: color.textSecondary }}>
          외부 서버로 데이터를 전송하지 않아요
        </div>
      </div>
    </div>
  );
}

function PolicyCard({ entry }: { entry: PolicyEntry }) {
  const num = `0${entry.number}`.slice(-2);
  const lines = entry.content.split('\n');

  return (
    <div
      style={{
        borderRadius: 16,
        background: color.surface,
        padding: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `rgba(0, 100, 255, 0.10)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {entry.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.6px',
              color: color.textSecondary,
              marginBottom: 2,
              textTransform: 'uppercase',
            }}
          >
            {num}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: color.textPrimary,
            }}
          >
            {entry.title}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        {lines.map((line, i) => (
          <p
            key={i}
            style={{
              margin: i === 0 ? 0 : '4px 0 0',
              fontSize: 14,
              lineHeight: '22px',
              color: color.textSecondary,
            }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function PolicyFooter() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}
    >
      <div
        style={{
          width: 60,
          height: 2,
          borderRadius: 1,
          background: color.border,
        }}
      />
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: `rgba(136,136,136,0.7)`,
        }}
      >
        최종 업데이트
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 12,
          fontWeight: 500,
          color: color.textSecondary,
        }}
      >
        2026년 5월 27일
      </div>
    </div>
  );
}

export function PrivacyPolicyScreen({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        background: color.background,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TopBar title="개인정보 처리방침" onBack={onBack} />
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 20px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <PolicyHeroBlock />
        {policyEntries.map((entry) => (
          <PolicyCard key={entry.number} entry={entry} />
        ))}
        <div style={{ marginTop: 8 }}>
          <PolicyFooter />
        </div>
      </div>
    </div>
  );
}
