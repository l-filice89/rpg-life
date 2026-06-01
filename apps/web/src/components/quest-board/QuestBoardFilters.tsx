'use client';

import { Button } from '@rpg-life/ui';
import type { QuestBoardFilterState } from '@/lib/quest-board-filters';

type QuestBoardFiltersProps = {
  filters: QuestBoardFilterState;
  onChange: (filters: QuestBoardFilterState) => void;
};

export function QuestBoardFilters({ filters, onChange }: QuestBoardFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Quest board filters">
      <FilterChip
        label="Overdue"
        pressed={filters.overdueOnly}
        onClick={() => {
          const nextOverdue = !filters.overdueOnly;
          onChange({
            ...filters,
            overdueOnly: nextOverdue,
            upcomingRangeEnabled: nextOverdue ? false : filters.upcomingRangeEnabled,
          });
        }}
      />
      <FilterChip
        label="Next 7 days"
        pressed={filters.upcomingRangeEnabled}
        onClick={() => {
          const nextUpcoming = !filters.upcomingRangeEnabled;
          onChange({
            ...filters,
            upcomingRangeEnabled: nextUpcoming,
            upcomingDays: 7,
            overdueOnly: nextUpcoming ? false : filters.overdueOnly,
          });
        }}
      />
    </div>
  );
}

type FilterChipProps = {
  label: string;
  pressed: boolean;
  onClick: () => void;
};

function FilterChip({ label, pressed, onClick }: FilterChipProps) {
  return (
    <Button
      type="button"
      variant={pressed ? 'default' : 'outline'}
      size="sm"
      aria-pressed={pressed}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
