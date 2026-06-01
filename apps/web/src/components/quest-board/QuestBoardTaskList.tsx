'use client';

import type { TaskListItem } from '@rpg-life/api';
import {
  filterQuests,
  hasActiveQuestBoardFilters,
} from '@/lib/quest-board-filters';
import { useQuestBoardFilters } from './quest-board-filter-context';
import { QuestBoardFilters } from './QuestBoardFilters';
import { QuestRow } from './QuestRow';

type QuestBoardTaskListProps = {
  tasks: TaskListItem[];
};

export function QuestBoardTaskList({ tasks }: QuestBoardTaskListProps) {
  const { filters, setFilters } = useQuestBoardFilters();

  const filteredTasks = filterQuests(tasks, filters);
  const filtersActive = hasActiveQuestBoardFilters(filters);

  return (
    <>
      <QuestBoardFilters filters={filters} onChange={setFilters} />
      {filtersActive && filteredTasks.length === 0 ? (
        <p className="text-muted-foreground">No quests match your filters.</p>
      ) : (
        <>
          {filters.overdueOnly && filteredTasks.length > 0 ? (
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Overdue
            </h2>
          ) : null}
          <ul role="list" className="flex flex-col gap-5">
            {filteredTasks.map((task) => (
              <li key={task.id}>
                <QuestRow task={task} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
