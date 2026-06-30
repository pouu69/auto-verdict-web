'use client';

import { useCallback, useEffect, useState } from 'react';
import { color } from '@/tokens';
import { savedRepo } from '@/storage/saved';
import type { SavedCar } from '@/storage/types';
import {
  verdictDisplay,
  scoreColor,
  formatPriceWon,
  formatMileage,
} from '@/ui/verdict';
import { useIsDesktop } from '@/ui/useIsDesktop';
import { TrashIcon, BookmarkIcon } from '@/components/icons';

type SortMode = 'RECENT' | 'SCORE_DESC' | 'SCORE_ASC';

const SORT_LABELS: Record<SortMode, string> = {
  RECENT: '최근순',
  SCORE_DESC: '점수 높은순',
  SCORE_ASC: '점수 낮은순',
};

function sortCars(cars: SavedCar[], mode: SortMode): SavedCar[] {
  switch (mode) {
    case 'SCORE_DESC':
      return [...cars].sort((a, b) => b.score - a.score);
    case 'SCORE_ASC':
      return [...cars].sort((a, b) => a.score - b.score);
    case 'RECENT':
    default:
      return cars; // getAll() already returns savedAt DESC
  }
}

export function SavedListScreen({
  onOpen,
  onCompare,
}: {
  onOpen: (carId: string) => void;
  onCompare: (carIds: string[]) => void;
}) {
  const [cars, setCars] = useState<SavedCar[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('RECENT');
  const isDesktop = useIsDesktop();

  const refresh = useCallback(async () => {
    const all = await savedRepo.getAll();
    setCars(all);
    // Drop any selections that no longer exist after a delete.
    setSelectedIds((prev) => prev.filter((id) => all.some((c) => c.carId === id)));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleCompareMode = () => {
    setCompareMode((on) => {
      if (on) setSelectedIds([]);
      return !on;
    });
  };

  const handleSelect = (carId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(carId)) return prev.filter((id) => id !== carId);
      if (prev.length < 2) return [...prev, carId];
      return prev; // already 2 selected — ignore
    });
  };

  const handleCardClick = (car: SavedCar) => {
    if (compareMode) {
      handleSelect(car.carId);
    } else {
      onOpen(car.carId);
    }
  };

  const handleDelete = async (carId: string) => {
    await savedRepo.deleteByCarId(carId);
    await refresh();
  };

  const runCompare = () => {
    if (selectedIds.length !== 2) return;
    onCompare([...selectedIds]);
    setCompareMode(false);
    setSelectedIds([]);
  };

  const sorted = sortCars(cars, sortMode);
  const canCompare = selectedIds.length === 2;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        background: color.background,
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 56,
          padding: '0 16px',
          background: color.background,
        }}
      >
        <h1 style={{ flex: 1, margin: 0, fontSize: 22, fontWeight: 800, color: color.textPrimary }}>
          저장된 매물
        </h1>
        {cars.length >= 2 && (
          <button
            onClick={toggleCompareMode}
            aria-label={compareMode ? '비교 취소' : '비교 모드'}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              color: compareMode ? color.danger : color.primary,
              padding: '8px 4px',
            }}
          >
            {compareMode ? '✕ 비교 취소' : '⇄ 비교 모드'}
          </button>
        )}
      </header>

      {/* Compare-mode banner */}
      {compareMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            margin: '0 20px 8px',
            padding: '12px 14px',
            borderRadius: 14,
            background: `${color.primary}14`,
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `${color.primary}29`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color.primary,
              flexShrink: 0,
            }}
          >
            ⇄
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: color.primary }}>
              비교할 매물 2대를 선택하세요
            </div>
            <div style={{ fontSize: 11, color: color.textSecondary }}>
              {selectedIds.length} / 2 선택됨
            </div>
          </div>
          {canCompare ? (
            <button
              onClick={runCompare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: color.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                padding: '9px 18px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(0,100,255,0.3)',
              }}
            >
              ⇄ 비교하기
            </button>
          ) : (
            <span
              style={{
                background: color.primary,
                color: '#fff',
                borderRadius: 999,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {selectedIds.length}/2
            </span>
          )}
        </div>
      )}

      {/* Sort chips (hidden in compare mode) */}
      {!compareMode && cars.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 8px' }}>
          {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => {
            const active = mode === sortMode;
            return (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                style={{
                  border: `1px solid ${active ? 'transparent' : color.border}`,
                  background: active ? color.primary : color.surface,
                  color: active ? '#fff' : color.textSecondary,
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {SORT_LABELS[mode]}
              </button>
            );
          })}
        </div>
      )}

      {/* List / empty state */}
      <div
        className="av-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '4px 20px 24px',
        }}
      >
        {cars.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={
              isDesktop
                ? {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 12,
                  }
                : { display: 'flex', flexDirection: 'column', gap: 8 }
            }
          >
            {sorted.map((car) => (
              <SavedCarRow
                key={car.carId}
                car={car}
                compareMode={compareMode}
                selected={selectedIds.includes(car.carId)}
                onClick={() => handleCardClick(car)}
                onDelete={() => void handleDelete(car.carId)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function SavedCarRow({
  car,
  compareMode,
  selected,
  onClick,
  onDelete,
}: {
  car: SavedCar;
  compareMode: boolean;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const vd = verdictDisplay[car.verdict as keyof typeof verdictDisplay];

  const details: string[] = [];
  if (car.year !== null) details.push(`${car.year}년`);
  if (car.mileageKm !== null) details.push(formatMileage(car.mileageKm));
  if (car.priceWon !== null) details.push(formatPriceWon(car.priceWon));

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: color.surface,
        border:
          compareMode && selected
            ? `2px solid ${color.primary}`
            : `1px solid ${color.border}`,
        borderRadius: 16,
        padding: 14,
        cursor: 'pointer',
      }}
    >
      {/* Leading: selection check (compare mode) or colored score badge */}
      {compareMode ? (
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: selected ? color.primary : color.background,
            border: selected ? 'none' : `1.5px solid ${color.border}`,
            color: selected ? '#fff' : scoreColor(car.score),
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {selected ? '✓' : car.score}
        </div>
      ) : (
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: scoreColor(car.score),
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {car.score}
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 16,
              fontWeight: 600,
              color: color.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {car.title || `매물 #${car.carId}`}
          </span>
          {vd && (
            <span
              style={{
                background: vd.bg,
                color: vd.text,
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {vd.label}
            </span>
          )}
        </div>

        {details.length > 0 && (
          <div
            style={{
              marginTop: 3,
              fontSize: 13,
              color: color.textSecondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {details.join(' · ')}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          {car.dangerCount > 0 && (
            <SeverityChip label={`위험 ${car.dangerCount}`} text={color.danger} bg={color.dangerBg} />
          )}
          {car.cautionCount > 0 && (
            <SeverityChip
              label={`주의 ${car.cautionCount}`}
              text={color.warning}
              bg={color.warningBg}
            />
          )}
          {car.passCount > 0 && (
            <SeverityChip label={`양호 ${car.passCount}`} text={color.success} bg={color.successBg} />
          )}
          <span style={{ flex: 1 }} />
          {!compareMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="삭제"
              style={{
                border: 'none',
                background: 'transparent',
                color: color.textSecondary,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <TrashIcon size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SeverityChip({ label, text, bg }: { label: string; text: string; bg: string }) {
  return (
    <span
      style={{
        background: bg,
        color: text,
        borderRadius: 6,
        padding: '3px 7px',
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        padding: '0 32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 28,
          background: `${color.primary}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color.primary,
        }}
      >
        <BookmarkIcon size={44} />
      </div>
      <div style={{ marginTop: 20, fontSize: 16, fontWeight: 600, color: color.textPrimary }}>
        저장된 매물이 없습니다
      </div>
      <div style={{ marginTop: 6, fontSize: 14, color: color.textSecondary, whiteSpace: 'pre-line' }}>
        {'분석 결과 화면에서 저장하면\n여기에 모아 비교할 수 있어요'}
      </div>
    </div>
  );
}
