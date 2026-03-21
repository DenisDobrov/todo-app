'use client'

import { Badge } from "@/components/ui/badge"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { Trash2, RefreshCcw, Check } from "lucide-react"
import { toggleTaskStatus, deleteTask } from "@/app/dashboard/actions"

import { useState } from "react" // Добавили
import { EditTaskDialog } from "./EditTaskDialog" // Добавили

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500"
}

export function TaskItem({ task, projects }: { task: any, projects: any[] }) {

  const [isEditOpen, setIsEditOpen] = useState(false); // Состояние для модалки
  
  const project = task.projects;
  
  // Создаем значения для анимации подложек
  const x = useMotionValue(0);
  // Иконка выполнения проявляется при движении вправо (x > 0)
  const opacityCheck = useTransform(x, [20, 80], [0, 1]);
  // Иконка удаления проявляется при движении влево (x < 0)
  const opacityTrash = useTransform(x, [-20, -80], [0, 1]);

  const handleToggle = async () => {
    await toggleTaskStatus(task.id, task.completed);
  };

  const handleSwipeDelete = async () => {
    if (confirm(`Удалить задачу "${task.title}"?`)) {
      await deleteTask(task.id);
    }
  };

// ... (весь код выше без изменений)

  return (
    <> {/* ТУТ ДОЛЖЕН БЫТЬ ОТКРЫВАЮЩИЙ ТЕГ */}
      <div className="relative overflow-hidden rounded-lg bg-slate-100">
        {/* Слой выполнения (Слева) */}
        <motion.div 
          style={{ opacity: opacityCheck }}
          className="absolute inset-y-0 left-0 w-full bg-green-500 flex items-center justify-start px-6 text-white"
        >
          <Check className="w-5 h-5" />
        </motion.div>

        {/* Слой удаления (Справа) */}
        <motion.div 
          style={{ opacity: opacityTrash }}
          className="absolute inset-y-0 right-0 w-full bg-red-500 flex items-center justify-end px-6 text-white"
        >
          <Trash2 className="w-5 h-5" />
        </motion.div>

        {/* Основная карточка */}
<motion.div
          style={{ x }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={(_, info) => {
            if (info.offset.x > 80) handleToggle();
            if (info.offset.x < -80) handleSwipeDelete();
          }}
          onTap={() => {
            if (Math.abs(x.get()) < 5) setIsEditOpen(true);
          }}
          className="relative flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer select-none"
        >
          <div className="flex items-center gap-4">
            {/* Точка статуса */}
            <div className={`w-2 h-2 rounded-full shrink-0 ${task.completed ? 'bg-green-500' : 'bg-slate-300'}`} />
            
            <div className="flex flex-col gap-0.5 text-left">
              {/* Название задачи */}
              <p className={`${task.completed ? "line-through text-muted-foreground" : "font-medium"} transition-all leading-tight`}>
                {task.title}
              </p>
              
              {/* МЕТАДАННЫЕ: Дата, Время, Проект */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                {/* Дата и время */}
              {/* Дата и время */}
              {task.due_at && (
                <span className={`text-[11px] flex items-center gap-1 ${
                  !task.completed && new Date(task.due_at) < new Date() 
                    ? "text-red-500 font-medium" // Просрочено
                    : "text-slate-400"           // Обычное состояние
                }`}>
                  {task.is_all_day ? "📅 Весь день" : new Date(task.due_at).toLocaleString('ru-RU', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                  {!task.completed && new Date(task.due_at) < new Date() && " (просрочено)"}
                </span>
              )}

                {/* Проект */}
                {project ? (
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <span className="opacity-50">•</span> 
                    {project.is_system ? "📥" : "🚀"} {project.title}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-300 italic flex items-center gap-1">
                    <span className="opacity-50">•</span> #без проекта
                  </span>
                )}

                {/* Рекурсия (если есть) */}
                {task.recurrence && (
                  <span className="text-[10px] text-blue-400/80 font-bold uppercase tracking-tighter flex items-center gap-0.5">
                    <RefreshCcw className="w-2.5 h-2.5" /> {task.recurrence}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Правая часть: Приоритет и иконка календаря */}
          <div className="flex items-center gap-2 shrink-0">
             <Badge className={`${priorityColors[task.priority as keyof typeof priorityColors]} text-white border-none text-[9px] px-1.5 h-4 flex items-center`}>
               {task.priority.toUpperCase()}
             </Badge>
             {task.google_event_id && <span className="text-[14px] grayscale opacity-50">📅</span>}
          </div>
        </motion.div>
      </div>

      {/* Окно редактирования */}
      <EditTaskDialog 
        task={task} 
        projects={projects} 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
      />
    </> // ТУТ ЗАКРЫВАЮЩИЙ
  );
}