'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X } from 'lucide-react'

import AuthBar from '@/components/AuthBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Task = {
  id: string
  user_id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_at: string | null
  tags: string[]
  sort_order: number
  is_calendar_synced: boolean
  created_at: string
}

type Filter = 'all' | 'active' | 'completed'

function normalizePriority(value: unknown): 'low' | 'medium' | 'high' {
  if (value === 'high') return 'high'
  if (value === 'medium') return 'medium'
  return 'low'
}

function priorityBadgeClass(priorityRaw: unknown) {
  const priority = normalizePriority(priorityRaw)

  if (priority === 'high') {
    return 'bg-red-100 text-red-700 border-red-200'
  }
  if (priority === 'medium') {
    return 'bg-amber-100 text-amber-700 border-amber-200'
  }
  return 'bg-emerald-100 text-emerald-700 border-emerald-200'
}

function prioritySelectClass(priorityRaw: unknown) {
  const priority = normalizePriority(priorityRaw)

  if (priority === 'high') {
    return 'border-red-200 bg-red-50 text-red-700'
  }
  if (priority === 'medium') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function TagChipsInput({
  tags,
  setTags,
  placeholder = 'Add tag and press Enter',
}: {
  tags: string[]
  setTags: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim().replace(/^#/, '')
    if (!tag) return
    if (tags.includes(tag)) return
    setTags([...tags, tag])
  }

  function removeTag(tagToRemove: string) {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
      setInput('')
    }

    if (e.key === 'Backspace' && !input && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  function handleBlur() {
    if (input.trim()) {
      addTag(input)
      setInput('')
    }
  }

  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2 py-1 text-xs"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}

function SortableTaskItem({
  task,
  onToggle,
  onDelete,
  onSaveEdit,
}: {
  task: Task
  onToggle: (task: Task) => void
  onDelete: (id: string) => void
  onSaveEdit: (
    id: string,
    payload: {
      title: string
      priority: Task['priority']
      due_at: string | null
      tags: string[]
    }
  ) => Promise<void>
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editPriority, setEditPriority] = useState<Task['priority']>(
    normalizePriority(task.priority)
  )
  const [editDueAt, setEditDueAt] = useState(task.due_at ? task.due_at.slice(0, 10) : '')
  const [editTags, setEditTags] = useState<string[]>(task.tags || [])

  useEffect(() => {
    setEditTitle(task.title)
    setEditPriority(normalizePriority(task.priority))
    setEditDueAt(task.due_at ? task.due_at.slice(0, 10) : '')
    setEditTags(task.tags || [])
  }, [task])

  async function handleSave() {
    const trimmed = editTitle.trim()
    if (!trimmed) {
      toast.error('Title cannot be empty')
      return
    }

    await onSaveEdit(task.id, {
      title: trimmed,
      priority: normalizePriority(editPriority),
      due_at: editDueAt ? new Date(editDueAt).toISOString() : null,
      tags: editTags,
    })

    setIsEditing(false)
  }

  const safePriority = normalizePriority(task.priority)

  return (
    <div ref={setNodeRef} style={style}>
      <div className="rounded-2xl border bg-background p-4">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Task title"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <Select
                value={editPriority}
                onValueChange={(value) =>
                  setEditPriority(normalizePriority(value))
                }
              >
                <SelectTrigger className={prioritySelectClass(editPriority)}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low priority</SelectItem>
                  <SelectItem value="medium">Medium priority</SelectItem>
                  <SelectItem value="high">High priority</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={editDueAt}
                onChange={(e) => setEditDueAt(e.target.value)}
              />
            </div>

            <TagChipsInput
              tags={editTags}
              setTags={setEditTags}
              placeholder="Add tag and press Enter"
            />

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="cursor-grab text-muted-foreground"
                {...attributes}
                {...listeners}
              >
                ⋮⋮
              </button>

              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggle(task)}
              />

              <div className="flex flex-col gap-1">
                <span
                  className={
                    task.completed
                      ? 'line-through text-muted-foreground'
                      : 'font-medium'
                  }
                >
                  {task.title}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${priorityBadgeClass(
                      safePriority
                    )}`}
                  >
                    {safePriority}
                  </span>

                  {task.due_at && (
                    <Badge variant="outline">
                      due {new Date(task.due_at).toLocaleDateString()}
                    </Badge>
                  )}

                  {(task.tags || []).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TodoClient({ email }: { email: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [dueAt, setDueAt] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')

  const sensors = useSensors(useSensor(PointerSensor))

  async function loadTasks(nextFilter: Filter = filter) {
    setRefreshing(true)

    try {
      const res = await fetch(`/api/tasks?filter=${nextFilter}`, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!res.ok) {
        toast.error('Failed to load tasks')
        return
      }

      const data = await res.json()
      const normalized = Array.isArray(data)
        ? data.map((task) => ({
            ...task,
            priority: normalizePriority(task.priority),
            tags: Array.isArray(task.tags) ? task.tags : [],
          }))
        : []

      setTasks(normalized)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadTasks(filter)
  }, [filter])

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    setLoading(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmed,
          priority: normalizePriority(priority),
          due_at: dueAt ? new Date(dueAt).toISOString() : null,
          tags,
        }),
      })

      if (!res.ok) {
        toast.error('Failed to create task')
        return
      }

      setTitle('')
      setPriority('medium')
      setDueAt('')
      setTags([])
      await loadTasks(filter)
      toast.success('Learning task created')
    } catch {
      toast.error('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  async function toggleTask(task: Task) {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })

      if (!res.ok) {
        toast.error('Failed to update task')
        return
      }

      await loadTasks(filter)
      toast.success(task.completed ? 'Task reopened' : 'Task completed')
    } catch {
      toast.error('Failed to update task')
    }
  }

  async function deleteTask(id: string) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        toast.error('Failed to delete task')
        return
      }

      await loadTasks(filter)
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  async function saveEdit(
    id: string,
    payload: {
      title: string
      priority: Task['priority']
      due_at: string | null
      tags: string[]
    }
  ) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          priority: normalizePriority(payload.priority),
        }),
      })

      if (!res.ok) {
        toast.error('Failed to save task')
        return
      }

      await loadTasks(filter)
      toast.success('Task updated')
    } catch {
      toast.error('Failed to save task')
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tasks.findIndex((t) => t.id === active.id)
    const newIndex = tasks.findIndex((t) => t.id === over.id)

    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(tasks, oldIndex, newIndex).map((task, index) => ({
      ...task,
      sort_order: index,
    }))

    setTasks(reordered)

    try {
      await Promise.all(
        reordered.map((task) =>
          fetch(`/api/tasks/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order: task.sort_order }),
          })
        )
      )
    } catch {
      toast.error('Failed to save new order')
      await loadTasks(filter)
    }
  }

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  )

  const inProgressCount = tasks.length - completedCount
  const progressValue =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-4xl">
        <AuthBar email={email} />

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Current focus</div>
              <div className="mt-2 text-lg font-semibold">AI Career Transition</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="mt-2 text-2xl font-semibold">{completedCount}</div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">In progress</div>
              <div className="mt-2 text-2xl font-semibold">{inProgressCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-3xl">Learning Dashboard</CardTitle>
                <CardDescription>
                  Track your roadmap, complete milestones, and move into AI roles step by step
                </CardDescription>
              </div>

              <Badge variant="secondary">
                {refreshing ? 'Updating...' : `${completedCount}/${tasks.length} done`}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Career transition progress</span>
                <span className="font-medium">{progressValue}%</span>
              </div>
              <Progress value={progressValue} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={addTask} className="grid gap-3 md:grid-cols-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a learning milestone..."
                className="md:col-span-2"
              />

              <Select
                value={priority}
                onValueChange={(value) =>
                  setPriority(normalizePriority(value))
                }
              >
                <SelectTrigger className={prioritySelectClass(priority)}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low priority</SelectItem>
                  <SelectItem value="medium">Medium priority</SelectItem>
                  <SelectItem value="high">High priority</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />

              <div className="md:col-span-2">
                <TagChipsInput
                  tags={tags}
                  setTags={setTags}
                  placeholder="Add tag and press Enter"
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </form>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
              >
                Completed
              </Button>
            </div>

            <Separator />

            {tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No milestones yet. Add your first AI learning task.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={tasks.map((task) => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onSaveEdit={saveEdit}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
