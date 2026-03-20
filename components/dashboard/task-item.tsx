'use client'

import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, RefreshCcw } from "lucide-react"
import { toggleTaskStatus, deleteTask } from "@/app/dashboard/actions"

const priorityColors = {
  high: "bg-red-500 hover:bg-red-600",
  medium: "bg-yellow-500 hover:bg-yellow-600",
  low: "bg-blue-500 hover:bg-blue-600"
}

export function TaskItem({ task }: { task: any }) {
  const project = task.projects;

  const handleToggle = async (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Чтобы клик по чекбоксу не дублировал клик по строке
    await toggleTaskStatus(task.id, task.completed);
  };

  const handleSwipeDelete = async () => {
    if (confirm(`Удалить задачу "${task.title}"?`)) {
      await deleteTask(task.id);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg group">
      {/* Слой удаления (появляется под карточкой при свайпе) */}
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6 text-white rounded-lg">
        <Trash2 className="w-5 h-5" />
      </div>

      {/* Основная карточка */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) handleSwipeDelete();
        }}
        onClick={() => handleToggle()} // Клик по всей задаче завершает её
        className="relative flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer select-none"
      >
        <div className="flex items-center gap-4">
          <Checkbox 
            checked={task.completed} 
            onCheckedChange={() => handleToggle()}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex flex-col gap-1">
            <p className={`${task.completed ? "line-through text-muted-foreground" : "font-medium"} transition-all`}>
              {task.title}
            </p>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Время выполнения */}
              {task.due_at && (
                <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md flex items-center gap-1">
                  {task.is_all_day ? "📅 Весь день" : new Date(task.due_at).toLocaleString('ru-RU', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              )}

              {/* Индикатор повторения */}
              {task.recurrence && (
                <span className="text-[10px] flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                  <RefreshCcw className="w-3 h-3" /> {task.recurrence}
                </span>
              )}

              {/* Проект */}
              {project ? (
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border uppercase ${
                  project.is_system ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-orange-50 text-orange-700 border-orange-100"
                }`}>
                  {project.is_system ? "📥 " : "🚀 "} {project.title}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground italic">#личная задача</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`${priorityColors[task.priority as keyof typeof priorityColors]} text-white border-none text-[10px] px-2`}>
            {task.priority.toUpperCase()}
          </Badge>
          {task.google_event_id && <span className="text-[14px]">📅</span>}
        </div>
      </motion.div>
    </div>
  )
}