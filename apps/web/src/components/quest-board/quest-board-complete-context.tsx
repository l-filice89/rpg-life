'use client';

import { createContext, useContext, type ReactNode } from 'react';

type QuestBoardCompleteContextValue = {
  requestBoardClear: () => void;
};

const QuestBoardCompleteContext = createContext<QuestBoardCompleteContextValue | null>(null);

export function QuestBoardCompleteProvider({
  requestBoardClear,
  children,
}: {
  requestBoardClear: () => void;
  children: ReactNode;
}) {
  return (
    <QuestBoardCompleteContext.Provider value={{ requestBoardClear }}>
      {children}
    </QuestBoardCompleteContext.Provider>
  );
}

export function useQuestBoardComplete(): QuestBoardCompleteContextValue {
  const context = useContext(QuestBoardCompleteContext);
  if (!context) {
    return { requestBoardClear: () => {} };
  }
  return context;
}
