'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

type Task = {
  id: number
  user_id: string
  title: string
  completed: boolean
  created_at: string
}

export default function TodoClient({ email }: { email: string }) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadTasks() {
    const res = await fetch('/api/tasks', { cache: 'no-store' })
    if (!res.ok) {
      toast.error('Failed to load tasks')
      return
    }
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    loadTasks()

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        async () => {
          await loadTasks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
      toast.success('Task created')
    } finally {
      setLoading(false)
    }
  }

  async function toggleTask(task: Task) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    })

    if (!res.ok) {
      toast.error('Failed to update task')
    }
  }

  async function deleteTask(id: number) {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })

    if (!res.ok) {
      toast.error('Failed to delete task')
      return
    }

    toast.success('Task deleted')
  }

  const completedCount = tasks.filter((task) => task.completed).length

  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-2xl">
        <AuthBar email={email} />

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-3xl">To-do List</CardTitle>
                <CardDescription>
                  Manage your tasks with authentication and live updates
                </CardDescription>
              </div>

              <Badge variant="secondary">
                {completedCount}/{tasks.length} done
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={addTask} className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New task..."
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add'}
              </Button>
            </form>

            <Separator />

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No tasks yet. Add your first one.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-xl border bg-background p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task)}
                      />
                      <span
                        className={
                          task.completed
                            ? 'text-muted-foreground line-through'
                            : 'font-medium'
                        }
                      >
                        {task.title}
                      </span>
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