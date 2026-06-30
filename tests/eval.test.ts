import { describe, it, expect } from 'vitest';
import { evaluateParsed } from '@/collect/evaluate';
import { SAMPLE_LISTINGS } from '@/collect/samples';
import { sample001, sampleIdeal } from '@/collect/samples-data';

const VERDICTS = ['OK', 'CAUTION', 'NEVER', 'UNKNOWN'];

describe('evaluation engine (web port)', () => {
  it('produces a well-formed report for every bundled sample', () => {
    for (const sample of SAMPLE_LISTINGS) {
      const { report } = evaluateParsed(sample.parsed);
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(VERDICTS).toContain(report.verdict);
      expect(report.results.length).toBeGreaterThan(0);
    }
  });

  it('flags a killer listing as NEVER (sample001 — rent/insurance-gap)', () => {
    const { report } = evaluateParsed(sample001);
    expect(report.verdict).toBe('NEVER');
  });

  it('passes a clean listing (sampleIdeal is not NEVER)', () => {
    const { report } = evaluateParsed(sampleIdeal);
    expect(report.verdict).not.toBe('NEVER');
  });
});
