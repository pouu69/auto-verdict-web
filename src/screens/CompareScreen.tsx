'use client';

/**
 * Two-car comparison screen — faithful web port of the Android Compose
 * `CompareScreen.kt`. Two saved cars are compared SIDE BY SIDE in two columns
 * within the 480px mobile frame: a hero strip, then metric rows grouped into
 * sections (기본 정보 / 종합 평가 / 진단 결과) plus a per-rule comparison grouped
 * by category so individual differences are visible.
 *
 * Each saved car's `rawJson` is re-evaluated via `evaluateRaw` so the engine
 * report (score / verdict / per-rule results) is always live, matching the
 * "re-run bridge+rules on read" invariant used by the Result screen.
 */
import { useEffect, useMemo, useState } from 'react';
import { color } from '@/tokens';
import { useIsDesktop } from '@/ui/useIsDesktop';
import { TopBar } from '@/components/TopBar';
import { savedRepo } from '@/storage/saved';
import type { SavedCar } from '@/storage/types';
import {
  evaluateRaw,
  carBaseOf,
  countsOf,
  titleOf,
} from '@/ui/result-helpers';
import {
  verdictDisplay,
  scoreColor,
} from '@/ui/verdict';
import { RULE_META, CATEGORY_ORDER, type Category } from '@/rule-meta';
import type { RuleResult, Severity, Verdict } from '@core/types/RuleTypes.js';

// Layout constants — mirror LABEL_COL_WIDTH / SIDE_PADDING / COLUMN_GAP.
const LABEL_COL_WIDTH = 72;
const SIDE_PADDING = 16;
const COLUMN_GAP = 10;

const numberFormat = new Intl.NumberFormat('ko-KR');

/** Per-car derived view model (Compose's SavedCarEntity + live EvalResult). */
interface CarModel {
  carId: string;
  title: string;
  year: number | null;
  mileageKm: number | null;
  priceWon: number | null;
  fuelType: string | null;
  score: number;
  verdict: string;
  dangerCount: number;
  cautionCount: number;
  passCount: number;
  unknownCount: number;
  results: RuleResult[];
}

interface WinnerIds {
  bestScoreId: string | null;
  bestYearId: string | null;
  bestMileageId: string | null;
  bestPriceId: string | null;
  bestDangerId: string | null;
  bestCautionId: string | null;
  bestPassId: string | null;
}

type Phase =
  | { kind: 'loading' }
  | { kind: 'insufficient' }
  | { kind: 'ready'; cars: CarModel[] };

export function CompareScreen({
  carIds,
  onBack,
}: {
  carIds: string[];
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setPhase({ kind: 'loading' });
      const loaded = await savedRepo.getByCarIds(carIds);
      if (cancelled) return;
      // Preserve the requested order, drop missing ids, take the first 2.
      const ordered = carIds
        .map((id) => loaded.find((c) => c.carId === id))
        .filter((c): c is SavedCar => c !== undefined)
        .slice(0, 2);
      if (ordered.length < 2) {
        setPhase({ kind: 'insufficient' });
        return;
      }
      setPhase({ kind: 'ready', cars: ordered.map(toCarModel) });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [carIds]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <TopBar title="비교 분석" onBack={onBack} />
      <div className="av-scroll" style={{ background: color.background }}>
        {phase.kind === 'loading' && <EmptyLoadingState />}
        {phase.kind === 'insufficient' && <InsufficientState />}
        {phase.kind === 'ready' && <CompareBody cars={phase.cars} />}
      </div>
    </div>
  );
}

/** Re-run the engine on the saved rawJson, then fold into the compare model. */
function toCarModel(saved: SavedCar): CarModel {
  const result = evaluateRaw(saved.rawJson);
  const base = carBaseOf(result.parsed);
  const counts = countsOf(result.report);
  const computedTitle = titleOf(base);
  return {
    carId: saved.carId,
    title: computedTitle && computedTitle !== '차량 정보 없음' ? computedTitle : saved.title,
    year: base?.category.yearMonth ? parseInt(base.category.yearMonth.slice(0, 4), 10) : saved.year,
    mileageKm: base?.spec.mileage ?? saved.mileageKm,
    priceWon: base?.advertisement.price ? base.advertisement.price * 10000 : saved.priceWon,
    fuelType: base?.spec.fuelName ?? saved.fuelType,
    score: result.report.score,
    verdict: result.report.verdict,
    dangerCount: counts.danger,
    cautionCount: counts.caution,
    passCount: counts.pass,
    unknownCount: counts.unknown,
    results: result.report.results,
  };
}

function CompareBody({ cars }: { cars: CarModel[] }) {
  const winners = useMemo(() => computeWinners(cars), [cars]);
  const isDesktop = useIsDesktop();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: isDesktop ? 780 : undefined,
        margin: isDesktop ? '0 auto' : undefined,
        padding: isDesktop ? '16px 12px 56px' : undefined,
      }}
    >
      <HeroStrip cars={cars} bestScoreId={winners.bestScoreId} />

      <CompareSection title="기본 정보">
        <MetricRow label="연식">
          {cars.map((car) => (
            <ValueCell
              key={car.carId}
              text={car.year != null ? `${car.year}년` : '—'}
              isBest={car.carId === winners.bestYearId}
              mono
            />
          ))}
        </MetricRow>
        <MetricRow label="주행">
          {cars.map((car) => (
            <ValueCell
              key={car.carId}
              text={car.mileageKm != null ? `${numberFormat.format(car.mileageKm)}km` : '—'}
              isBest={car.carId === winners.bestMileageId}
              mono
            />
          ))}
        </MetricRow>
        <MetricRow label="가격">
          {cars.map((car) => (
            <ValueCell
              key={car.carId}
              text={car.priceWon != null ? `${numberFormat.format(Math.round(car.priceWon / 10000))}만원` : '—'}
              isBest={car.carId === winners.bestPriceId}
              mono
              emphasize
            />
          ))}
        </MetricRow>
        <MetricRow label="연료" last>
          {cars.map((car) => (
            <ValueCell key={car.carId} text={car.fuelType ?? '—'} isBest={false} />
          ))}
        </MetricRow>
      </CompareSection>

      <CompareSection title="종합 평가">
        <MetricRow label="점수" tall>
          {cars.map((car) => (
            <ScoreCell key={car.carId} score={car.score} isBest={car.carId === winners.bestScoreId} />
          ))}
        </MetricRow>
        <MetricRow label="판정" last>
          {cars.map((car) => (
            <VerdictCell key={car.carId} verdict={car.verdict} score={car.score} />
          ))}
        </MetricRow>
      </CompareSection>

      <CompareSection title="진단 결과">
        <MetricRow label="분포" tall>
          {cars.map((car) => (
            <DiagnosisStackBar
              key={car.carId}
              danger={car.dangerCount}
              caution={car.cautionCount}
              pass={car.passCount}
              unknown={car.unknownCount}
            />
          ))}
        </MetricRow>
        <MetricRow label="위험">
          {cars.map((car) => (
            <CountCell
              key={car.carId}
              count={car.dangerCount}
              textColor={color.danger}
              bgColor={color.dangerBg}
              isBest={car.carId === winners.bestDangerId}
            />
          ))}
        </MetricRow>
        <MetricRow label="주의">
          {cars.map((car) => (
            <CountCell
              key={car.carId}
              count={car.cautionCount}
              textColor={color.warning}
              bgColor={color.warningBg}
              isBest={car.carId === winners.bestCautionId}
            />
          ))}
        </MetricRow>
        <MetricRow label="양호">
          {cars.map((car) => (
            <CountCell
              key={car.carId}
              count={car.passCount}
              textColor={color.success}
              bgColor={color.successBg}
              isBest={car.carId === winners.bestPassId}
            />
          ))}
        </MetricRow>
        <MetricRow label="미확인" last>
          {cars.map((car) => (
            <CountCell
              key={car.carId}
              count={car.unknownCount}
              textColor={color.textSecondary}
              bgColor={color.border}
              isBest={false}
            />
          ))}
        </MetricRow>
      </CompareSection>

      <RuleComparison cars={cars} />

      <div style={{ height: 40 }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero strip                                                          */
/* ------------------------------------------------------------------ */

function HeroStrip({ cars, bestScoreId }: { cars: CarModel[]; bestScoreId: string | null }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        padding: `18px ${SIDE_PADDING}px 12px 0`,
        gap: COLUMN_GAP,
        alignItems: 'flex-start',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: LABEL_COL_WIDTH - COLUMN_GAP, flexShrink: 0 }} />
      {cars.map((car, index) => (
        <HeroCarCard
          key={car.carId}
          index={index + 1}
          car={car}
          isBest={car.carId === bestScoreId}
        />
      ))}
    </div>
  );
}

function HeroCarCard({ index, car, isBest }: { index: number; car: CarModel; isBest: boolean }) {
  const accent = scoreColor(car.score);
  const fill = Math.max(0, Math.min(100, car.score)) / 100;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 16,
        background: color.surface,
        border: `${isBest ? 1.5 : 1}px solid ${isBest ? accent : color.border}`,
        padding: '14px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.8px',
            color: color.textSecondary,
          }}
        >
          {`0${index}`.slice(-2)}
        </span>
        <div style={{ flex: 1 }} />
        {isBest && (
          <span
            style={{
              borderRadius: 6,
              background: withAlpha(accent, 0.12),
              padding: '2px 6px',
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.6px',
              color: accent,
            }}
          >
            TOP
          </span>
        )}
      </div>
      <div style={{ height: 10 }} />
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          lineHeight: '18px',
          color: color.textPrimary,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {car.title.trim() || `매물 #${car.carId}`}
      </div>
      <div style={{ height: 14 }} />
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 32, color: accent, lineHeight: 1 }}>
          {car.score}
        </span>
        <span style={{ width: 3 }} />
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: color.textSecondary,
            paddingBottom: 6,
          }}
        >
          /100
        </span>
      </div>
      <div style={{ height: 8 }} />
      <div style={{ width: '100%', height: 4, borderRadius: 2, background: color.border, overflow: 'hidden' }}>
        <div style={{ width: `${fill * 100}%`, height: '100%', background: accent }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section + metric-row scaffolding                                    */
/* ------------------------------------------------------------------ */

function CompareSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '18px 16px 10px' }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: color.primary }} />
        <div style={{ width: 8 }} />
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.3px', color: color.textPrimary }}>
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

function MetricRow({
  label,
  tall = false,
  last = false,
  children,
}: {
  label: string;
  tall?: boolean;
  last?: boolean;
  children: React.ReactNode;
}) {
  const rowHeight = tall ? 76 : 52;
  return (
    <div style={{ background: color.surface }}>
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: rowHeight,
          paddingRight: SIDE_PADDING,
          alignItems: 'center',
          gap: COLUMN_GAP,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: LABEL_COL_WIDTH - COLUMN_GAP,
            flexShrink: 0,
            height: '100%',
            padding: '0 4px 0 16px',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.3px', color: color.textSecondary }}>
            {label}
          </span>
        </div>
        {children}
      </div>
      {!last && (
        <div style={{ height: 0, borderBottom: `0.5px solid ${withAlpha(color.border, 0.7)}`, margin: '0 16px' }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cells                                                               */
/* ------------------------------------------------------------------ */

function ValueCell({
  text,
  isBest,
  mono = false,
  emphasize = false,
}: {
  text: string;
  isBest: boolean;
  mono?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        padding: '6px 0',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '100%',
          borderRadius: 10,
          background: isBest ? withAlpha(color.primary, 0.07) : 'transparent',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isBest && (
          <>
            <span style={{ fontSize: 9, color: color.primary }}>▲</span>
            <span style={{ width: 4 }} />
          </>
        )}
        <span
          style={{
            fontFamily: mono ? 'monospace' : undefined,
            fontWeight: isBest ? 600 : emphasize ? 500 : 400,
            fontSize: 14,
            color: isBest ? color.primary : color.textPrimary,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

function ScoreCell({ score, isBest }: { score: number; isBest: boolean }) {
  const accent = scoreColor(score);
  const fill = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        padding: '0 8px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%' }}>
        {isBest && (
          <span style={{ fontSize: 10, color: accent, paddingRight: 4, paddingBottom: 5 }}>▲</span>
        )}
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 22, color: accent, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ width: 2 }} />
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: color.textSecondary, paddingBottom: 3 }}>
          점
        </span>
      </div>
      <div style={{ height: 6 }} />
      <div style={{ width: '100%', height: 3, borderRadius: 2, background: color.border, overflow: 'hidden' }}>
        <div style={{ width: `${fill * 100}%`, height: '100%', background: accent }} />
      </div>
    </div>
  );
}

function VerdictCell({ verdict, score }: { verdict: string; score: number }) {
  // Compose colors the badge by score threshold; label comes from verdictDisplay.
  const { bg, fg } =
    score >= 78
      ? { bg: color.successBg, fg: color.success }
      : score >= 50
        ? { bg: color.warningBg, fg: color.warning }
        : { bg: color.dangerBg, fg: color.danger };
  const label = verdictDisplay[verdict as Verdict]?.label ?? (verdict || '—');
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        padding: '0 8px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ borderRadius: 999, background: bg, padding: '6px 12px' }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: fg,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function CountCell({
  count,
  textColor,
  bgColor,
  isBest,
}: {
  count: number;
  textColor: string;
  bgColor: string;
  isBest: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        padding: '0 8px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isBest && (
        <>
          <span style={{ fontSize: 9, color: color.success }}>▲</span>
          <span style={{ width: 4 }} />
        </>
      )}
      {count > 0 ? (
        <div style={{ borderRadius: 8, background: bgColor, padding: '4px 10px' }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12, color: textColor }}>
            {count}
          </span>
        </div>
      ) : (
        <span style={{ fontFamily: 'monospace', fontSize: 14, color: withAlpha(color.textSecondary, 0.6) }}>
          0
        </span>
      )}
    </div>
  );
}

function DiagnosisStackBar({
  danger,
  caution,
  pass,
  unknown,
}: {
  danger: number;
  caution: number;
  pass: number;
  unknown: number;
}) {
  const total = Math.max(1, danger + caution + pass + unknown);
  const segments: Array<{ weight: number; bg: string }> = [
    { weight: danger, bg: color.danger },
    { weight: caution, bg: color.warning },
    { weight: pass, bg: color.success },
    { weight: unknown, bg: color.border },
  ];
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        padding: '0 8px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', background: color.border }}>
        {segments.map((seg, i) =>
          seg.weight > 0 ? <div key={i} style={{ flex: seg.weight, background: seg.bg }} /> : null,
        )}
      </div>
      <div style={{ height: 8 }} />
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 11,
          letterSpacing: '0.2px',
          color: color.textSecondary,
          textAlign: 'center',
          width: '100%',
        }}
      >
        총 {total}건 점검
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Per-rule comparison (grouped by CATEGORY_ORDER)                     */
/* ------------------------------------------------------------------ */

const severityMeta: Record<Severity, { label: string; bg: string; text: string }> = {
  pass: { label: '통과', bg: color.successBg, text: color.success },
  warn: { label: '주의', bg: color.warningBg, text: color.warning },
  fail: { label: '위험', bg: color.dangerBg, text: color.danger },
  killer: { label: '위험', bg: color.dangerBg, text: color.danger },
  unknown: { label: '미확인', bg: color.unknownBg, text: color.textSecondary },
};

function RuleComparison({ cars }: { cars: CarModel[] }) {
  // Index each car's results by ruleId for aligned lookups.
  const byRule = cars.map((car) => {
    const map = new Map<string, RuleResult>();
    for (const r of car.results) map.set(r.ruleId, r);
    return map;
  });

  // Collect rule ids per category, preserving CATEGORY_ORDER + RULE_META order.
  const ruleIdsByCategory = new Map<Category, string[]>();
  const seen = new Set<string>();
  for (const car of cars) {
    for (const r of car.results) {
      const meta = RULE_META[r.ruleId];
      if (!meta) continue;
      if (seen.has(r.ruleId)) continue;
      seen.add(r.ruleId);
      const list = ruleIdsByCategory.get(meta.category) ?? [];
      list.push(r.ruleId);
      ruleIdsByCategory.set(meta.category, list);
    }
  }

  const orderedCategories = CATEGORY_ORDER.filter(
    (cat) => (ruleIdsByCategory.get(cat)?.length ?? 0) > 0,
  );
  if (orderedCategories.length === 0) return null;

  return (
    <CompareSection title="진단 항목 비교">
      {orderedCategories.map((category) => {
        const ruleIds = ruleIdsByCategory.get(category) ?? [];
        return (
          <div key={category} style={{ background: color.surface }}>
            <div
              style={{
                padding: '10px 16px 6px',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.3px',
                color: color.textSecondary,
              }}
            >
              {category}
            </div>
            {ruleIds.map((ruleId, idx) => {
              const meta = RULE_META[ruleId];
              const last = idx === ruleIds.length - 1;
              return (
                <div key={ruleId}>
                  <div
                    style={{
                      display: 'flex',
                      width: '100%',
                      paddingRight: SIDE_PADDING,
                      alignItems: 'center',
                      gap: COLUMN_GAP,
                      minHeight: 56,
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{
                        width: LABEL_COL_WIDTH - COLUMN_GAP,
                        flexShrink: 0,
                        padding: '8px 4px 8px 16px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{meta?.icon}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: color.textSecondary,
                          lineHeight: '12px',
                          wordBreak: 'keep-all',
                        }}
                      >
                        {meta?.shortTitle}
                      </span>
                    </div>
                    {cars.map((car, ci) => {
                      const res = byRule[ci]?.get(ruleId);
                      return <RuleStatusCell key={car.carId} result={res} />;
                    })}
                  </div>
                  {!last && (
                    <div
                      style={{
                        height: 0,
                        borderBottom: `0.5px solid ${withAlpha(color.border, 0.7)}`,
                        margin: '0 16px',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </CompareSection>
  );
}

function RuleStatusCell({ result }: { result: RuleResult | undefined }) {
  const meta = result ? severityMeta[result.severity] : severityMeta.unknown;
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: '8px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span
        style={{
          borderRadius: 8,
          background: meta.bg,
          color: meta.text,
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {meta.label}
      </span>
      {result?.message && (
        <span
          style={{
            fontSize: 10,
            color: color.textSecondary,
            lineHeight: '13px',
            textAlign: 'center',
            wordBreak: 'keep-all',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {result.message}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty / loading states                                             */
/* ------------------------------------------------------------------ */

function EmptyLoadingState() {
  return (
    <PlaceholderState
      badge="01"
      title="매물 정보를 불러오는 중"
      subtitle="잠시만 기다려 주세요"
    />
  );
}

function InsufficientState() {
  return (
    <PlaceholderState
      badge="!"
      title="비교할 매물이 부족해요"
      subtitle="저장된 매물 2대를 선택해 주세요"
    />
  );
}

function PlaceholderState({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        padding: '0 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 28,
          background: color.surface,
          border: `1px solid ${color.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 28,
            color: withAlpha(color.textSecondary, 0.5),
          }}
        >
          {badge}
        </span>
      </div>
      <div style={{ height: 20 }} />
      <div style={{ fontSize: 16, fontWeight: 500, color: color.textPrimary }}>{title}</div>
      <div style={{ height: 4 }} />
      <div style={{ fontSize: 12, color: color.textSecondary }}>{subtitle}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Winner computation — ported from computeWinners / uniqueWinner      */
/* ------------------------------------------------------------------ */

function computeWinners(cars: CarModel[]): WinnerIds {
  return {
    bestScoreId: uniqueWinner(cars, true, (c) => c.score),
    bestYearId: uniqueWinner(cars, true, (c) => c.year),
    bestMileageId: uniqueWinner(cars, false, (c) => c.mileageKm),
    bestPriceId: uniqueWinner(cars, false, (c) => c.priceWon),
    bestDangerId: uniqueWinner(cars, false, (c) => c.dangerCount),
    bestCautionId: uniqueWinner(cars, false, (c) => c.cautionCount),
    bestPassId: uniqueWinner(cars, true, (c) => c.passCount),
  };
}

function uniqueWinner(
  cars: CarModel[],
  higherIsBetter: boolean,
  selector: (car: CarModel) => number | null,
): string | null {
  if (cars.length < 2) return null;
  const pairs: Array<[string, number]> = [];
  for (const car of cars) {
    const v = selector(car);
    if (v != null) pairs.push([car.carId, v]);
  }
  if (pairs.length < 2) return null;
  const values = pairs.map((p) => p[1]);
  const target = higherIsBetter ? Math.max(...values) : Math.min(...values);
  const tops = pairs.filter((p) => p[1] === target);
  return tops.length === 1 ? tops[0]![0] : null;
}

/* ------------------------------------------------------------------ */
/* Color helpers                                                       */
/* ------------------------------------------------------------------ */

/** Apply an alpha to a hex (#rrggbb) or rgb(...) color string. */
function withAlpha(c: string, alpha: number): string {
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    const full = hex.length === 3 ? hex.split('').map((h) => h + h).join('') : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const m = c.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
  return c;
}
