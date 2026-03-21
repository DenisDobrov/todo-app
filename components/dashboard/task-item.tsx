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
            if (Math.abs(x.get()) < 5) {
              setIsEditOpen(true);
            }
          }}
          className="relative flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer select-none"
        >
          {/* ... (внутрянка карточки без изменений) ... */}
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full shrink-0 ${task.completed ? 'bg-green-500' : 'bg-slate-300'}`} />
            <div className="flex flex-col gap-1 text-left">
              <p className={`${task.completed ? "line-through text-muted-foreground" : "font-medium"} transition-all`}>
                {task.title}
              </p>
              {/* Бейджи и т.д. */}
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