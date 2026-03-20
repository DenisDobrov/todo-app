'use client'

import { useState } from 'react'
import { TaskFilters } from './TaskFilters'
import { TaskItem } from './task-item'
import { isToday, isTomorrow, isAfter, startOfDay, addDays } from 'date-fns'

export function TaskContainer({ initialTasks, projects }: { initialTasks: any[], projects: any[] }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // 1. Фильтруем по проекту
  const filteredByProject = activeProjectId 
    ? initialTasks.filter(task => task.project_id === activeProjectId)
    : initialTasks;

  // 2. Группируем БЕЗ пересечений
  const groups = {
    today: filteredByProject.filter(t => t.due_at && isToday(new Date(t.due_at))),
    
    tomorrow: filteredByProject.filter(t => t.due_at && isTomorrow(new Date(t.due_at))),

    later: filteredByProject.filter(t => {
      if (!t.due_at) return true; // Задачи без даты
      const date = new Date(t.due_at);
      const afterTomorrow = startOfDay(addDays(new Date(), 2)); 
      // Берем только то, что строго после завтрашнего дня
      return isAfter(date, afterTomorrow) || (!isToday(date) && !isTomorrow(date) && isAfter(date, new Date()));
    })
  };

  const renderGroup = (title: string, tasks: any[]) => {
    if (tasks.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
          {title}
        </h4>
        <div className="grid gap-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <TaskFilters 
        projects={projects} 
        onFilterChange={(id) => setActiveProjectId(id)} 
      />

      <div className="space-y-10">
        {filteredByProject.length > 0 ? (
          <>
            {renderGroup("Сегодня", groups.today)}
            {renderGroup("Завтра", groups.tomorrow)}
            {renderGroup("Предстоящие / Без даты", groups.later)}
          </>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl border-gray-100">
            <p className="text-gray-400 text-sm italic">В этом проекте пока пусто...</p>
          </div>
        )}
      </div>
    </div>
  )
}