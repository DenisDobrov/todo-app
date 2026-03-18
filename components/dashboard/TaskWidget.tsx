'use client'

import { format, isToday, isTomorrow, isAfter, startOfDay, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

import { toggleTaskStatus, deleteTask } from '@/app/dashboard/actions';
import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_at: string | null;
  completed: boolean;
}

export function TaskWidget({ tasks }: { tasks: Task[] }) {

  // Логика интеративности тасков
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (id: string, status: boolean) => {
    setLoadingId(id);
    await toggleTaskStatus(id, status);
    setLoadingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить эту задачу?')) {
      await deleteTask(id);
    }
  };

  // Логика группировки
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  // const dayAfterTomorrow = addDays(today, 2); -- note used so far

  const groups = {
    'Сегодня': tasks.filter(t => t.due_at && isToday(new Date(t.due_at))),
    'Завтра': tasks.filter(t => t.due_at && isTomorrow(new Date(t.due_at))),
    'Предстоит': tasks.filter(t => t.due_at && isAfter(new Date(t.due_at), tomorrow)),
    'Без даты': tasks.filter(t => !t.due_at)
  };

  const renderTask = (task: Task) => (
    <div 
      key={task.id} 
      className={`group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl mb-2 transition-all duration-200
        ${loadingId === task.id ? 'opacity-50' : 'hover:border-blue-500 hover:shadow-md'}`}
    >
      <div className="flex items-center gap-4 flex-grow cursor-pointer" onClick={() => handleToggle(task.id, task.completed)}>
        {/* Чекбокс с поддержкой unclick */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
          ${task.completed 
            ? 'bg-blue-600 border-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' 
            : 'border-gray-200 group-hover:border-blue-400'}`}>
          {task.completed && <span className="text-white text-xs">✓</span>}
        </div>

        <div className="flex flex-col">
          <span className={`text-sm font-bold transition-all ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.title}
          </span>
          {task.due_at && (
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
              {format(new Date(task.due_at), 'p', { locale: ru })}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Приоритет */}
        {task.priority === 'high' && !task.completed && (
          <div className="hidden sm:flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
            <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter">High</span>
          </div>
        )}

        {/* Кнопка удаления (появляется при наведении) */}
        <button 
          onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
          className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
          title="Удалить задачу"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md ml-auto h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar">
      {Object.entries(groups).map(([label, groupTasks]) => {
        if (groupTasks.length === 0) return null;
        return (
          <div key={label} className="mb-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 mb-4 ml-1">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {label}
              </h4>
              <div className="h-[1px] flex-grow bg-gray-100" />
            </div>
            <div className="flex flex-col">{groupTasks.map(renderTask)}</div>
          </div>
        );
      })}
    </div>
  );
}