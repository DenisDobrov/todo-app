import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

const priorityColors = {
  high: "bg-red-500 hover:bg-red-600",
  medium: "bg-yellow-500 hover:bg-yellow-600",
  low: "bg-blue-500 hover:bg-blue-600"
}

export function TaskItem({ task }: { task: any }) {
  // Вытаскиваем название курса из связанного объекта
  const courseTitle = task.courses?.title;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <Checkbox checked={task.completed} />
        <div className="flex flex-col gap-1">
          <p className={task.completed ? "line-through text-muted-foreground" : "font-medium"}>
            {task.title}
          </p>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* 🕒 Дата и время (сделаем чуть компактнее) */}
            {task.due_at && (
              <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                {new Date(task.due_at).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}

            {/* 📁 НОВЫЙ БЕЙДЖ: Проект (Курс) */}
            {courseTitle && (
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                {courseTitle}
              </span>
            )}

            {/* Теги (если они есть в базе) */}
            {task.tags?.map((tag: string) => (
              <span 
                key={tag} 
                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge className={`${priorityColors[task.priority as keyof typeof priorityColors]} text-white border-none text-[10px] px-2`}>
          {task.priority.toUpperCase()}
        </Badge>
        
        {/* Индикатор синхронизации с календарем (проверяем наличие google_event_id) */}
        {task.google_event_id && (
          <span className="text-[14px]" title="Синхронизировано с Google Calendar">📅</span>
        )}
      </div>
    </div>
  )
}