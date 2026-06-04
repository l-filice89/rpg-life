'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CreateQuestSheet } from '@/components/create-quest-sheet/CreateQuestSheet';

type CreateQuestSheetContextValue = {
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  openCreateQuestSheet: () => void;
};

const CreateQuestSheetContext = createContext<CreateQuestSheetContextValue | null>(null);

export function CreateQuestSheetProvider({ children }: { children: ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const openCreateQuestSheet = useCallback(() => setSheetOpen(true), []);

  const value = useMemo(
    () => ({ sheetOpen, setSheetOpen, openCreateQuestSheet }),
    [sheetOpen, openCreateQuestSheet],
  );

  return (
    <CreateQuestSheetContext.Provider value={value}>
      {children}
      <CreateQuestSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </CreateQuestSheetContext.Provider>
  );
}

export function useCreateQuestSheet(): CreateQuestSheetContextValue {
  const context = useContext(CreateQuestSheetContext);
  if (!context) {
    return {
      sheetOpen: false,
      setSheetOpen: () => {},
      openCreateQuestSheet: () => {},
    };
  }
  return context;
}
