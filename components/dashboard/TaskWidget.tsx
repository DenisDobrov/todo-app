'use client'

import { format, isToday, isTomorrow, isAfter, startOfDay, addDays, parseISO, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleTaskStatus, deleteTask } from '@/app/dashboard/actions';
import { useEffect, useState } from 'react';

  interface Task {
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    due_at: string | null;
    completed: boolean;
    is_all_day?: boolean;    // Добавь это
    recurrence?: string | null; // И это
  }

export function TaskWidget({ tasks }: { tasks: Task[] }) {
  
  const [filter, setFilter] = useState<'all' | 'high' | 'active'>('all');

  // Слушаем команды от VoiceAssistant через CustomEvent
  useEffect(() => {
    const handleFilter = (e: any) => {
      if (e.detail.action === 'ui_filter') {
        setFilter(e.detail.type); // 'high', 'active' или 'all'
      }
    };
    window.addEventListener('soluter-ui-command', handleFilter);
    return () => window.removeEventListener('soluter-ui-command', handleFilter);
  }, []);

  // ПРИМЕНЯЕМ ФИЛЬТР ПЕРЕД ГРУППИРОВКОЙ
  const filteredTasks = tasks.filter(t => {
    if (filter === 'high') return t.priority === 'high' && !t.completed;
    if (filter === 'active') return !t.completed;
    return true;
  });
  
  // Сортировка по времени внутри групп
  const sortTasks = (taskList: Task[]) => {
    return [...taskList].sort((a, b) => {
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;
      return parseISO(a.due_at).getTime() - parseISO(b.due_at).getTime();
    });
  };

  const now = new Date();
  const todayEnd = endOfDay(now);
  const tomorrowEnd = endOfDay(addDays(now, 1));

  // ИСПРАВЛЕННАЯ ГРУППИРОВКА: Четкие границы дней
  const groups = {
    'Сегодня': sortTasks(filteredTasks.filter(t => t.due_at && isToday(parseISO(t.due_at)))),
    'Завтра': sortTasks(filteredTasks.filter(t => t.due_at && isTomorrow(parseISO(t.due_at)))),
    'Предстоит': sortTasks(filteredTasks.filter(t => t.due_at && isAfter(parseISO(t.due_at), tomorrowEnd))),
    'Без даты': filteredTasks.filter(t => !t.due_at)
  };

  return (
    <div className="w-full max-w-md ml-auto h-[calc(100vh-180px)] overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden">
    {/* Кнопки быстрой фильтрации (для рук) */}
      <div className="flex gap-2 mb-6 justify-end">
         {['all', 'active', 'high'].map((f) => (
           <button 
             key={f}
             onClick={() => setFilter(f as any)}
             className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
               ${filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
           >
             {f === 'all' ? 'Все' : f === 'active' ? 'В работе' : 'Важные'}
           </button>
         ))}
      </div>
      <AnimatePresence mode="popLayout">
        {Object.entries(groups).map(([label, groupTasks]) => {
          if (groupTasks.length === 0) return null;
          return (
            <motion.div 
              key={label} 
              layout 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="mb-8"
            >
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
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }: { task: Task, onToggle: () => void, onDelete: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
      className="relative group mb-2"
    >
      {/* Красная зона (фон) */}
      <div className="absolute inset-0 bg-red-500 rounded-2xl flex items-center justify-end px-6 text-white text-[10px] font-black uppercase tracking-widest">
        Удаление...
      </div>

      <motion.div
        drag="x"
        // Ограничиваем свайп только влево и не даем уйти слишком далеко
        dragConstraints={{ left: -100, right: 0 }}
        // dragElastic заставляет карточку сопротивляться в конце свайпа
        dragElastic={0.2}
        // ВАЖНО: карточка вернется в 0, если её не "выбросили" за порог
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        onDragEnd={(_, info) => {
          // Если смахнули достаточно далеко (напр. больше 80px)
          if (info.offset.x < -80) {
            if (confirm(`Удалить задачу "${task.title}"?`)) {
              onDelete();
            } else {
              // Если пользователь нажал "Отмена" — возвращаем карточку на место программно
              // Framer motion сделает это автоматически при следующем рендере или через контроллеры
            }
          }
        }}
        className="relative z-10 flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-4 flex-grow" onClick={onToggle}>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
            ${task.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}>
            {task.completed && <span className="text-white text-[10px]">✓</span>}
          </div>

          <div className="flex flex-col">
            <span className={`text-sm font-bold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {task.title}
            </span>
            <div className="flex items-center gap-2">
              {task.is_all_day ? (
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight bg-blue-50 px-1.5 rounded">
                  Весь день
                </span>
              ) : (
                task.due_at && (
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
                    {/* Добавляем проверку на валидность даты перед форматированием */}
                    {(() => {
                      try {
                        return format(new Date(task.due_at), 'HH:mm', { locale: ru });
                      } catch (e) {
                        return '';
                      }
                    })()}
                  </span>
                )
              )}
              {task.recurrence && (
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <span className="opacity-70">🔄</span> {task.recurrence}
                </span>
              )}
            </div>
          </div>
        </div>

        {task.priority === 'high' && !task.completed && (
          <div className="bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
            <span className="text-[9px] font-black text-red-500 uppercase">High</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}