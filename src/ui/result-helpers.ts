/**
 * Helpers shared by the Result/Saved/Compare screens.
 * `buildSavedCar` mirrors the Android `App.tsx` save mapping. The saved
 * `rawJson` is a tagged envelope so both live inputs and bundled samples can be
 * re-opened and re-evaluated (the "re-run bridge+rules on read" invariant).
 */
import type { EncarCarBase, EncarParsedData } from '@core/types/ParsedData.js';
import type { RuleReport } from '@core/types/RuleTypes.js';
import { isValue } from '@core/types/FieldStatus.js';
import type { MobileOrchestratorInput } from '@/orchestrate-mobile';
import { evaluateInput, evaluateParsed, type EvalResult } from '@/collect/evaluate';
import type { SavedCar } from '@/storage/types';

/** Tagged payload stored in SavedCar.rawJson / CacheEntry.rawInputJson. */
export type SavedRaw =
  | { kind: 'input'; input: MobileOrchestratorInput }
  | { kind: 'parsed'; parsed: EncarParsedData };

export function carBaseOf(parsed: EncarParsedData): EncarCarBase | null {
  return isValue(parsed.raw.base) ? parsed.raw.base.value : null;
}

export interface Counts {
  danger: number;
  caution: number;
  pass: number;
  unknown: number;
}

export function countsOf(report: RuleReport): Counts {
  return {
    danger: report.results.filter((r) => r.severity === 'killer' || r.severity === 'fail').length,
    caution: report.warns.length,
    pass: report.results.filter((r) => r.severity === 'pass').length,
    unknown: report.results.filter((r) => r.severity === 'unknown').length,
  };
}

export function titleOf(base: EncarCarBase | null): string {
  if (!base) return '차량 정보 없음';
  const year = base.category.yearMonth?.slice(0, 4) ?? '';
  return `${year} ${base.category.manufacturerName} ${base.category.modelName}`.trim();
}

export function buildSavedCar(result: EvalResult, raw: SavedRaw): SavedCar {
  const base = carBaseOf(result.parsed);
  const counts = countsOf(result.report);
  const now = Date.now();
  return {
    carId: result.parsed.carId,
    url: result.parsed.url,
    title: titleOf(base),
    year: base?.category.yearMonth ? parseInt(base.category.yearMonth.slice(0, 4), 10) : null,
    mileageKm: base?.spec.mileage ?? null,
    priceWon: base?.advertisement.price ? base.advertisement.price * 10000 : null,
    fuelType: base?.spec.fuelName ?? null,
    score: result.report.score,
    verdict: result.report.verdict,
    dangerCount: counts.danger,
    cautionCount: counts.caution,
    passCount: counts.pass,
    unknownCount: counts.unknown,
    rawJson: JSON.stringify(raw),
    savedAt: now,
    updatedAt: now,
  };
}

/** Re-evaluate a saved/cached rawJson envelope. */
export function evaluateRaw(rawJson: string): EvalResult {
  const raw = JSON.parse(rawJson) as SavedRaw;
  if (raw.kind === 'parsed') return evaluateParsed(raw.parsed);
  return evaluateInput(raw.input);
}
