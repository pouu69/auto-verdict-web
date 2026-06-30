'use client';

import { useCallback, useEffect, useState } from 'react';
import { color } from '@/tokens';
import type { AnalyzeRequest } from '@/ui/navigation';
import { OverlayPage } from '@/overlay/OverlayPage';
import { ScoreCard } from '@/overlay/ScoreCard';
import { SummaryRow } from '@/overlay/SummaryRow';
import { CategoryAccordion, groupByCategory } from '@/overlay/CategoryAccordion';
import { CATEGORY_ORDER } from '@/rule-meta';
import { useIsDesktop } from '@/ui/useIsDesktop';
import { TopBar } from '@/components/TopBar';
import { collectFromUrl } from '@/collect/collect';
import { evaluateInput, evaluateParsed, type EvalResult } from '@/collect/evaluate';
import { SAMPLE_LISTINGS } from '@/collect/samples';
import {
  buildSavedCar,
  carBaseOf,
  evaluateRaw,
  type SavedRaw,
} from '@/ui/result-helpers';
import { savedRepo } from '@/storage/saved';
import { cacheRepo } from '@/storage/cache';
import { extractCarId } from '@/encar/url';

interface Resolved {
  result: EvalResult;
  raw: SavedRaw;
}

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; resolved: Resolved };

export function ResultScreen({
  request,
  fromSaved,
  onBack,
}: {
  request: AnalyzeRequest;
  fromSaved: boolean;
  onBack: () => void;
}) {
  const isDesktop = useIsDesktop();
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [alreadySaved, setAlreadySaved] = useState(fromSaved);
  const [toast, setToast] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Lets the error view fall back to a bundled sample without leaving the screen.
  const [override, setOverride] = useState<AnalyzeRequest | null>(null);
  const activeRequest = override ?? request;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState({ phase: 'loading' });
      try {
        const resolved = await resolveRequest(activeRequest);
        if (cancelled) return;
        setState({ phase: 'ready', resolved });

        const existing = await savedRepo.getByCarId(resolved.result.parsed.carId);
        if (!cancelled) setAlreadySaved(fromSaved || !!existing);
      } catch (e) {
        if (!cancelled) {
          setState({
            phase: 'error',
            message: e instanceof Error ? e.message : '평가 중 오류가 발생했습니다.',
          });
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [activeRequest, fromSaved, attempt]);

  const handleSave = useCallback(async () => {
    if (state.phase !== 'ready') return;
    const car = buildSavedCar(state.resolved.result, state.resolved.raw);
    await savedRepo.upsert(car);
    setAlreadySaved(true);
    setToast('저장되었습니다');
    setTimeout(() => setToast(null), 1800);
  }, [state]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <TopBar title="분석 결과" onBack={onBack} />
      <div className="av-scroll">
        {state.phase === 'loading' && <LoadingView />}
        {state.phase === 'error' && (
          <ErrorView
            message={state.message}
            onRetry={() => setAttempt((a) => a + 1)}
            onSample={() => setOverride({ kind: 'sample', sampleId: 'ideal' })}
            onBack={onBack}
          />
        )}
        {state.phase === 'ready' &&
          (isDesktop ? (
            <DesktopResult
              result={state.resolved.result}
              alreadySaved={alreadySaved}
              onSave={() => void handleSave()}
            />
          ) : (
            <OverlayPage
              report={state.resolved.result.report}
              carBase={carBaseOf(state.resolved.result.parsed)}
              onClose={onBack}
              onSave={() => void handleSave()}
              hideSave={alreadySaved}
            />
          ))}
      </div>
      {toast && <Toast message={toast} />}
    </div>
  );
}

async function resolveRequest(request: AnalyzeRequest): Promise<Resolved> {
  if (request.kind === 'saved') {
    const saved = await savedRepo.getByCarId(request.carId);
    if (!saved) throw new Error('저장된 매물을 찾을 수 없습니다.');
    return { result: evaluateRaw(saved.rawJson), raw: JSON.parse(saved.rawJson) as SavedRaw };
  }

  if (request.kind === 'sample') {
    const sample = SAMPLE_LISTINGS.find((s) => s.id === request.sampleId);
    if (!sample) throw new Error('샘플 매물을 찾을 수 없습니다.');
    return { result: evaluateParsed(sample.parsed), raw: { kind: 'parsed', parsed: sample.parsed } };
  }

  if (request.kind === 'paste') {
    return { result: evaluateInput(request.input), raw: { kind: 'input', input: request.input } };
  }

  // kind === 'url' — check 24h cache first, then collect live via the proxy.
  const carId = extractCarId(request.url);
  if (carId) {
    const cached = await cacheRepo.getValid(carId);
    if (cached) {
      return {
        result: evaluateRaw(cached.rawInputJson),
        raw: JSON.parse(cached.rawInputJson) as SavedRaw,
      };
    }
  }

  const input = await collectFromUrl(request.url);
  const raw: SavedRaw = { kind: 'input', input };
  const result = evaluateInput(input);
  const base = carBaseOf(result.parsed);
  await cacheRepo.upsert({
    carId: result.parsed.carId,
    url: result.parsed.url,
    title: base ? `${base.category.manufacturerName} ${base.category.modelName}` : '차량',
    score: result.report.score,
    verdict: result.report.verdict,
    resultJson: JSON.stringify(result.report),
    rawInputJson: JSON.stringify(raw),
  });
  return { result, raw };
}

function LoadingView() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: `3px solid ${color.border}`,
          borderTop: `3px solid ${color.primary}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <div style={{ fontSize: 14, color: color.textSecondary }}>분석 중...</div>
    </div>
  );
}

function ErrorView({
  message,
  onRetry,
  onSample,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onSample: () => void;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: color.textPrimary }}>{message}</div>
      <div style={{ fontSize: 13, color: color.textSecondary, marginTop: 8 }}>
        엔카가 자동 수집을 차단했을 수 있어요. 샘플 매물로 기능을 확인할 수 있습니다.
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          onClick={onRetry}
          style={{
            padding: '10px 24px',
            background: '#fff',
            color: color.primary,
            border: `1px solid ${color.primary}`,
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
        <button
          onClick={onSample}
          style={{
            padding: '10px 24px',
            background: color.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          샘플로 보기
        </button>
      </div>
      <button
        onClick={onBack}
        style={{
          marginTop: 14,
          padding: '8px 16px',
          background: 'transparent',
          color: color.textSecondary,
          border: 'none',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        닫기
      </button>
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(26,26,26,0.92)',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: 20,
        fontSize: 13,
        zIndex: 100,
      }}
    >
      {message}
    </div>
  );
}

/** Desktop two-column result: sticky score/summary rail + scrolling rule sections. */
function DesktopResult({
  result,
  alreadySaved,
  onSave,
}: {
  result: EvalResult;
  alreadySaved: boolean;
  onSave: () => void;
}) {
  const groups = [...groupByCategory(result.report.results)].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );
  const carBase = carBaseOf(result.parsed);

  // Spread the rule sections across two columns to cut vertical scrolling.
  const columns: (typeof groups)[] = [[], []];
  groups.forEach((g, i) => columns[i % 2]!.push(g));

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: '28px 24px 56px',
        display: 'flex',
        gap: 28,
        alignItems: 'flex-start',
      }}
    >
      <aside style={{ width: 340, flexShrink: 0, position: 'sticky', top: 24 }}>
        <ScoreCard
          score={result.report.score}
          verdict={result.report.verdict}
          carBase={carBase}
        />
        <SummaryRow results={result.report.results} />
        {!alreadySaved && (
          <div style={{ padding: '4px 16px 0' }}>
            <button
              onClick={onSave}
              style={{
                width: '100%',
                padding: 14,
                background: color.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              저장하기
            </button>
          </div>
        )}
      </aside>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 4, display: 'flex', gap: 4 }}>
        {columns.map((col, ci) => (
          <div key={ci} style={{ flex: 1, minWidth: 0 }}>
            {col.map(({ category, results }) => (
              <CategoryAccordion key={category} category={category} results={results} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
