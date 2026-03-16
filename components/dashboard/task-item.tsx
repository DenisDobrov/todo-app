import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500"
}

export function TaskItem({ task }: { task: any }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
      <div className="flex items-center gap-4">
        <Checkbox checked={task.completed} />
        <div className="flex flex-col gap-1">
          <p className={task.completed ? "line-through text-muted-foreground" : "font-medium"}>
            {task.title}
          </p>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Дата выполнения */}
            {task.due_at && (
              <span className="text-xs text-muted-foreground">
                {new Date(task.due_at).toLocaleString('ru-RU')}
              </span>
            )}

            {/* ТЕГИ: вставляем сюда */}
            {task.tags && task.tags.length > 0 && task.tags.map((tag: string) => (
              <span 
                key={tag} 
                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 border border-blue-100"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
          {task.priority}
        </Badge>
        {task.is_calendar_synced && <Badge variant="outline">📅 Sync</Badge>}
      </div>
    </div>
  )
}