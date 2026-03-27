'use client'

import { Badge } from "@/components/ui/badge"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { Trash2, RefreshCcw, Check, Calendar } from "lucide-react"
import { toggleTaskStatus, deleteTask } from "@/app/dashboard/actions"
import { useState } from "react"
import { EditTaskDialog } from "./EditTaskDialog"
import { formatTaskDate, isOverdue } from "@/lib/utils/date-utils"

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500"
}

export function TaskItem({ task, projects }: { task: any, projects: any[] }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Безопасно находим данные проекта
  // Сначала смотрим в task.projects (join из БД), если нет - ищем в массиве projects по id
  const projectData = task.projects || projects.find(p => p.id === task.project_id);
  
  const overdue = isOverdue(task.due_at, task.completed);
  
  const x = useMotionValue(0);
  const opacityCheck = useTransform(x, [20, 80], [0, 1]);
  const opacityTrash = useTransform(x, [-20, -80], [0, 1]);

  const handleToggle = async () => {
    await toggleTaskStatus(task.id, task.completed);
  };

  const handleSwipeDelete = async () => {
    if (confirm(`Удалить задачу "${task.title}"?`)) {
      await deleteTask(task.id);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl bg-slate-100 group">
        {/* Подложка "Выполнено" */}
        <motion.div 
          style={{ opacity: opacityCheck }}
          className="absolute inset-y-0 left-0 w-full bg-green-500 flex items-center justify-start px-6 text-white"
        >
          <Check className="w-5 h-5" />
        </motion.div>

        {/* Подложка "Удалить" */}
        <motion.div 
          style={{ opacity: opacityTrash }}
          className="absolute inset-y-0 right-0 w-full bg-red-500 flex items-center justify-end px-6 text-white"
        >
          <Trash2 className="w-5 h-5" />
        </motion.div>

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
            // Открываем только если не было значительного сдвига (защита от случайных открытий при свайпе)
            if (Math.abs(x.get()) < 5) setIsEditOpen(true);
          }}
          className="relative flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.98]"
        >
          <div className="flex items-center gap-4 overflow-hidden">
            {/* Индикатор статуса */}
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300 ${
              task.completed ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300'
            }`} />
            
            <div className="flex flex-col gap-0.5 text-left overflow-hidden">
              <p className={`truncate ${
                task.completed ? "line-through text-slate-400" : "font-medium text-slate-700"
              } transition-all leading-tight`}>
                {task.title}
              </p>
              
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                {/* Дата */}
                {task.due_at && (
                  <span className={`text-[11px] flex items-center gap-1 ${
                    overdue ? "text-red-500 font-bold animate-pulse" : "text-slate-400 font-medium"
                  }`}>
                    {formatTaskDate(task.due_at, task.is_all_day)}
                    {overdue && " (просрочено)"}
                  </span>
                )}

                {/* Проект */}
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <span className="opacity-30">•</span> 
                  {projectData ? (
                    <>
                      <span className="text-[10px]">{projectData.is_system ? "📥" : "🚀"}</span>
                      {projectData.title}
                    </>
                  ) : (
                    <span className="italic text-slate-300">#без проекта</span>
                  )}
                </span>

                {/* Повтор */}
                {task.recurrence && (
                  <span className="text-[10px] text-blue-500/80 font-bold uppercase tracking-tight flex items-center gap-0.5 bg-blue-50 px-1 rounded">
                    <RefreshCcw className="w-2.5 h-2.5" /> {task.recurrence}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            <Badge className={`${priorityColors[task.priority as keyof typeof priorityColors] || "bg-slate-400"} text-white border-none text-[9px] px-1.5 h-4 font-bold`}>
              {task.priority?.toUpperCase()}
            </Badge>
            {task.google_event_id && (
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
            )}
          </div>
        </motion.div>
      </div>

      <EditTaskDialog 
        task={task} 
        projects={projects} 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
      />
    </>
  );
}