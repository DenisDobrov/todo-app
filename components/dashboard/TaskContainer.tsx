'use client'

import { useState } from 'react'
import { TaskFilters } from './TaskFilters'
import { TaskItem } from './task-item'
import { isToday, isTomorrow, isAfter, startOfDay, addDays } from 'date-fns'

import { Plus } from "lucide-react" // Импортируй иконку
import { EditTaskDialog } from './EditTaskDialog'
import { updateProjectActiveStatus } from "@/app/dashboard/actions" // Нужно создать такой экшен
import { Button } from '../ui/button'

// Описываем типы, чтобы TS был доволен
interface Project {
  id: string;
  title: string;
  is_system?: boolean;
  is_active?: boolean; // Добавили это поле
}

interface Task {
  id: string;
  title: string;
  due_at: string | null;
  project_id: string;
  completed: boolean;
  priority: string;
  description?: string;
  google_event_id?: string;
  projects?: Project; // Это данные проекта, пришедшие вместе с задачей из Supabase
}

interface TaskContainerProps {
  initialTasks: Task[];
  projects: Project[];
}

export function TaskContainer({ initialTasks, projects }: TaskContainerProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // 1. Фильтрация по выбранному проекту

// TaskContainer.tsx

  const sortedProjects = [...projects].sort((a: any, b: any) => {
      // Активные (is_active !== false) получают 1, неактивные 0
      const aWeight = a.is_active === false ? 0 : 1;
      const bWeight = b.is_active === false ? 0 : 1;
      
      if (aWeight !== bWeight) return bWeight - aWeight; // Сначала 1, потом 0
      
      // Если статус одинаковый, системные вперед
      const aSys = a.is_system ? 1 : 0;
      const bSys = b.is_system ? 1 : 0;
      return bSys - aSys;
    });

    const filteredTasks = activeProjectId 
    ? initialTasks.filter(t => t.project_id === activeProjectId)
    : initialTasks;


    
  // 2. Группировка
    const today = filteredTasks.filter(t => t.due_at && isToday(new Date(t.due_at)));
    const tomorrow = filteredTasks.filter(t => t.due_at && isTomorrow(new Date(t.due_at)));
    const later = filteredTasks.filter(t => {
    if (t.completed) return false; // Убираем выполненные отсюда
    if (!t.due_at) return true;
    const date = new Date(t.due_at);
    return !isToday(date) && !isTomorrow(date);
  });

  // 3. Функция для рендеринга каждой группы
  const renderGroup = (title: string, tasks: Task[]) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
          {title}
        </h4>
        <div className="grid gap-2">
          {tasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              projects={projects} // Весь список проектов для выбора в модалке
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
      <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setIsCreateOpen(true)}
          className="rounded-full shrink-0 border-dashed border-slate-300 text-slate-400 h-9 w-9"
        >
          <Plus size={18} />
        </Button>
      {/* Верхние фильтры (проекты) */}
      <TaskFilters 
        projects={sortedProjects} 
        onFilterChange={(id) => setActiveProjectId(id)} 
      />
    </div>
    <EditTaskDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        projects={projects} 
        // task={null} - явно не передаем задачу
      />
      <div className="space-y-10">
        {filteredTasks.length > 0 ? (
          <>
            {renderGroup("Сегодня", today)}
            {renderGroup("Завтра", tomorrow)}
            {renderGroup("Предстоящие / Без даты", later)}
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