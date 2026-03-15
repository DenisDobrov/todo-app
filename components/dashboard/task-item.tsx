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
        <div>
          <p className={task.completed ? "line-through text-muted-foreground" : "font-medium"}>
            {task.title}
          </p>
          {task.due_at && (
            <span className="text-xs text-muted-foreground">
              {new Date(task.due_at).toLocaleString('ru-RU')}
            </span>
          )}
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