'use client'

import { format, isToday, isTomorrow, isAfter, startOfDay, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_at: string | null;
  completed: boolean;
}

export function TaskWidget({ tasks }: { tasks: Task[] }) {
  // Логика группировки
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);

  const groups = {
    'Сегодня': tasks.filter(t => t.due_at && isToday(new Date(t.due_at))),
    'Завтра': tasks.filter(t => t.due_at && isTomorrow(new Date(t.due_at))),
    'Предстоит': tasks.filter(t => t.due_at && isAfter(new Date(t.due_at), tomorrow)),
    'Без даты': tasks.filter(t => !t.due_at)
  };

  const renderTask = (task: Task) => (
    <div 
      key={task.id} 
      className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl mb-2 hover:border-blue-500 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        {/* Чекбокс */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
          ${task.completed 
            ? 'bg-blue-600 border-blue-600' 
            : 'border-gray-200 group-hover:border-blue-400'}`}>
          {task.completed && <span className="text-white text-xs">✓</span>}
        </div>

        <div className="flex flex-col">
          <span className={`text-sm font-bold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.title}
          </span>
          {task.due_at && (
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
              {format(new Date(task.due_at), 'p', { locale: ru })}
            </span>
          )}
        </div>
      </div>

      {/* Бейдж приоритета */}
      {task.priority === 'high' && !task.completed && (
        <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg">
          <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter">High</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-md ml-auto">
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
            
            <div className="flex flex-col">
              {groupTasks.map(renderTask)}
            </div>
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 rounded-[40px] opacity-50">
          <p className="text-gray-400 text-sm font-medium italic">Список задач пуст</p>
        </div>
      )}
    </div>
  );
}