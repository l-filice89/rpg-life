'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_QUEST_BOARD_FILTERS,
  loadQuestBoardFilters,
  saveQuestBoardFilters,
  type QuestBoardFilterState,
} from '@/lib/quest-board-filters';

type QuestBoardFilterContextValue = {
  filters: QuestBoardFilterState;
  setFilters: (next: QuestBoardFilterState) => void;
};

const QuestBoardFilterContext = createContext<QuestBoardFilterContextValue | null>(null);

export function QuestBoardFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<QuestBoardFilterState>(DEFAULT_QUEST_BOARD_FILTERS);

  useEffect(() => {
    setFiltersState(loadQuestBoardFilters());
  }, []);

  const setFilters = useCallback((next: QuestBoardFilterState) => {
    setFiltersState(next);
    saveQuestBoardFilters(next);
  }, []);

  const value = useMemo(() => ({ filters, setFilters }), [filters, setFilters]);

  return (
    <QuestBoardFilterContext.Provider value={value}>{children}</QuestBoardFilterContext.Provider>
  );
}

export function useQuestBoardFilters(): QuestBoardFilterContextValue {
  const context = useContext(QuestBoardFilterContext);
  if (!context) {
    throw new Error('useQuestBoardFilters must be used within QuestBoardFilterProvider');
  }
  return context;
}
