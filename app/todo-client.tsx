'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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

type Task = {
  id: number
  user_id: string
  title: string
  completed: boolean
  created_at: string
}

export default function TodoClient({ email }: { email: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function loadTasks() {
    setRefreshing(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!res.ok) {
        toast.error('Failed to load tasks')
        return
      }

      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    setLoading(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })

      if (!res.ok) {
        toast.error('Failed to create task')
        return
      }

      setTitle('')
      await loadTasks()
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

      await loadTasks()
      toast.success(task.completed ? 'Task reopened' : 'Task completed')
    } catch {
      toast.error('Failed to update task')
    }
  }

  async function deleteTask(id: number) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        toast.error('Failed to delete task')
        return
      }

      await loadTasks()
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const completedCount = tasks.filter((task) => task.completed).length
  const inProgressCount = tasks.length - completedCount
  const progressValue =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-3xl">
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
            <form onSubmit={addTask} className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a learning milestone..."
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add'}
              </Button>
            </form>

            <Separator />

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No milestones yet. Add your first AI learning task.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-2xl border bg-background p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task)}
                      />
                      <div className="flex flex-col">
                        <span
                          className={
                            task.completed
                              ? 'line-through text-muted-foreground'
                              : 'font-medium'
                          }
                        >
                          {task.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {task.completed ? 'Completed' : 'In progress'}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}