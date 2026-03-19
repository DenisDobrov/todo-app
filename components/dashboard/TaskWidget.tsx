'use client'

import { format, isToday, isTomorrow, isAfter, startOfDay, addDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence, usePresence } from 'framer-motion';
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
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Сортировка внутри групп по времени
  const sortTasks = (taskList: Task[]) => {
    return [...taskList].sort((a, b) => {
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;
      return parseISO(a.due_at).getTime() - parseISO(b.due_at).getTime();
    });
  };

  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  const groups = {
    'Сегодня': sortTasks(tasks.filter(t => t.due_at && isToday(parseISO(t.due_at)))),
    'Завтра': sortTasks(tasks.filter(t => t.due_at && isTomorrow(parseISO(t.due_at)))),
    'Предстоит': sortTasks(tasks.filter(t => t.due_at && isAfter(parseISO(t.due_at), tomorrow))),
    'Без даты': tasks.filter(t => !t.due_at)
  };

  return (
    <div className="w-full max-w-md ml-auto h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden">
      <AnimatePresence mode="popLayout">
        {Object.entries(groups).map(([label, groupTasks]) => {
          if (groupTasks.length === 0) return null;
          return (
            <div key={label} className="mb-8">
              <div className="flex items-center gap-3 mb-4 ml-1">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</h4>
                <div className="h-[1px] flex-grow bg-gray-100" />
              </div>
              
              <div className="flex flex-col gap-2">
                {groupTasks.map((task) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={() => toggleTaskStatus(task.id, task.completed)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Отдельный компонент для задачи с логикой SWIPE
function TaskItem({ task, onToggle, onDelete }: { task: Task, onToggle: () => void, onDelete: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="relative"
    >
      {/* Фон, который видно при свайпе (Красная корзина) */}
      <div className="absolute inset-0 bg-red-500 rounded-2xl flex items-center justify-end px-6 text-white font-bold">
        <span>Удалить</span>
      </div>

      {/* Сама карточка задачи */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onDelete();
        }}
        className="relative z-10 flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl cursor-pointer active:cursor-grabbing hover:border-blue-500 transition-colors"
      >
        <div className="flex items-center gap-4 flex-grow" onClick={onToggle}>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
            ${task.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}>
            {task.completed && <span className="text-white text-[10px]">✓</span>}
          </div>

          <div className="flex flex-col">
            <span className={`text-sm font-bold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {task.title}
            </span>
            {task.due_at && (
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
                {format(parseISO(task.due_at), 'HH:mm', { locale: ru })}
              </span>
            )}
          </div>
        </div>

        {/* Индикатор приоритета для десктопа */}
        {task.priority === 'high' && !task.completed && (
          <div className="bg-red-50 px-2 py-1 rounded-lg">
            <span className="text-[9px] font-black text-red-600 uppercase">High</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}