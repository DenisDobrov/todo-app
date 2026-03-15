'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client' // Клиентская версия
import { VoiceInput } from './voice-input'
import { TaskItem } from './task-item'

export function TodoDashboard({ user }: { user: any }) {
  const [tasks, setTasks] = useState<any[]>([])
  const supabase = createClient()

  // Загружаем задачи при монтировании
  useEffect(() => {
    const fetchTasks = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('sort_order', { ascending: true })
      if (data) setTasks(data)
    }
    fetchTasks()

    // Подписываемся на изменения в реальном времени (Realtime)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
        (payload) => {
          fetchTasks() // Просто перезагружаем список при любом изменении
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Привет, {user.email?.split('@')[0]}!</h1>
        <VoiceInput /> 
      </header>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Задач пока нет. Нажми на микрофон!</p>
        ) : (
          tasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  )
}