/** Shared navigation contracts for the SPA shell (ports MainActivity routing). */
import type { MobileOrchestratorInput } from '@/orchestrate-mobile';

export type Tab = 'ANALYZE' | 'SAVED' | 'SETTINGS';

/** What the Result screen should evaluate and render. */
export type AnalyzeRequest =
  | { kind: 'url'; url: string }
  | { kind: 'sample'; sampleId: string }
  | { kind: 'paste'; input: MobileOrchestratorInput }
  | { kind: 'saved'; carId: string };

export const TAB_LABELS: Record<Tab, string> = {
  ANALYZE: '분석',
  SAVED: '저장',
  SETTINGS: '설정',
};
