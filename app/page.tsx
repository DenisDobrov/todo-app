'use client'

import { useEffect, useState } from 'react'

type Task = {
  id: number
  title: string
  completed: boolean
  created_at: string
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadTasks() {
    const res = await fetch('/api/tasks', { cache: 'no-store' })
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
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
        throw new Error('Failed to create task')
      }

      setTitle('')
      await loadTasks()
    } finally {
      setLoading(false)
    }
  }

  async function toggleTask(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    })

    await loadTasks()
  }

  async function deleteTask(id: number) {
    await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    })

    await loadTasks()
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-6 text-3xl font-bold">To-do List</h1>

        <form onSubmit={addTask} className="mb-6 flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task..."
            className="flex-1 rounded-lg border px-4 py-2 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            Add
          </button>
        </form>

        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task)}
                />
                <span className={task.completed ? 'line-through text-gray-400' : ''}>
                  {task.title}
                </span>
              </label>

              <button
                onClick={() => deleteTask(task.id)}
                className="rounded-md border px-3 py-1 text-sm"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}