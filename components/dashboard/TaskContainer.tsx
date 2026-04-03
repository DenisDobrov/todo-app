'use client'

import { useState } from 'react'
import { TaskFilters } from './TaskFilters'
import { TaskItem } from './task-item'
import { Plus } from "lucide-react"
import { EditTaskDialog } from './EditTaskDialog'
import { Button } from '../ui/button'
import dayjs from 'dayjs'

interface Project {
  id: string;
  title: string;
  is_system?: boolean;
  is_active?: boolean;
}

interface Task {
  id: string;
  title: string;
  due_at: string | null;
  due_date: string | null; // Новое поле
  due_datetime_utc: string | null; // Новое поле
  project_id: string;
  completed: boolean;
  priority: string;
  description?: string;
  google_event_id?: string;
  is_all_day: boolean;
  projects?: Project;
}

interface TaskContainerProps {
  initialTasks: Task[];
  projects: Project[];
}

export function TaskContainer({ initialTasks, projects }: TaskContainerProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const sortedProjects = [...projects].sort((a: any, b: any) => {
    const aWeight = a.is_active === false ? 0 : 1;
    const bWeight = b.is_active === false ? 0 : 1;
    if (aWeight !== bWeight) return bWeight - aWeight;
    const aSys = a.is_system ? 1 : 0;
    const bSys = b.is_system ? 1 : 0;
    return bSys - aSys;
  });

  const filteredTasks = activeProjectId 
    ? initialTasks.filter(t => t.project_id === activeProjectId)
    : initialTasks;

  // Группировка на основе ЧИСТОЙ даты (due_date), игнорируя время
  const todayStr = dayjs().format('YYYY-MM-DD');
  const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD');

  const todayTasks = filteredTasks.filter(t => t.due_date === todayStr);
  const tomorrowTasks = filteredTasks.filter(t => t.due_date === tomorrowStr);
  
  const laterTasks = filteredTasks.filter(t => {
    if (t.completed) return false;
    if (!t.due_date) return true;
    return t.due_date !== todayStr && t.due_date !== tomorrowStr;
  });

  const renderGroup = (title: string, tasks: Task[]) => {
    if (tasks.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
          {title}
        </h4>
        <div className="grid gap-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} projects={projects} />
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
        <TaskFilters 
          projects={sortedProjects} 
          onFilterChange={(id) => setActiveProjectId(id)} 
        />
      </div>
      
      <EditTaskDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        projects={projects} 
      />

      <div className="space-y-10">
        {filteredTasks.length > 0 ? (
          <>
            {renderGroup("Сегодня", todayTasks)}
            {renderGroup("Завтра", tomorrowTasks)}
            {renderGroup("Предстоящие / Без даты", laterTasks)}
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