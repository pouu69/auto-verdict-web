/**
 * Unified evaluation entry points.
 *
 * Two producers feed the same `MobileOrchestratorResult` ({ parsed, facts,
 * report }) consumed by the Result UI:
 *   - `evaluateInput`  — from a raw MobileOrchestratorInput (live proxy / paste / saved rawJson)
 *   - `evaluateParsed` — from a pre-parsed EncarParsedData (bundled sample data)
 */
import type { EncarParsedData } from '@core/types/ParsedData.js';
import { encarToFacts } from '@core/bridge/encar-to-facts.js';
import { evaluate } from '@core/rules/index.js';
import {
  orchestrateMobile,
  type MobileOrchestratorInput,
  type MobileOrchestratorResult,
} from '@/orchestrate-mobile';

export type EvalResult = MobileOrchestratorResult;

export function evaluateInput(input: MobileOrchestratorInput): EvalResult {
  return orchestrateMobile(input);
}

export function evaluateParsed(parsed: EncarParsedData): EvalResult {
  const facts = encarToFacts(parsed);
  const report = evaluate(facts);
  return { parsed, facts, report };
}
