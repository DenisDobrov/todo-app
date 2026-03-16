'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VoiceInput } from './voice-input'
import { TaskItem } from './task-item'
import AuthBar from '@/components/AuthBar'

interface TodoDashboardProps {
  user: any
  userName: string
  email: string
}

export function TodoDashboard({ user, userName, email }: TodoDashboardProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching tasks:', error)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchTasks()

    // Подписка на Realtime изменения в таблице tasks
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          console.log('Realtime update:', payload)
          fetchTasks() // Перезагружаем список при любом изменении
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user.id, fetchTasks])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Панель пользователя: передаем userName */}
        <AuthBar userName={userName} />

        <header className="flex justify-between items-center mb-8 mt-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Мой день</h1>
            <p className="text-slate-500">Управляйте задачами с помощью голоса</p>
          </div>
          <VoiceInput />
        </header>

        <div className="grid gap-3">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Загрузка задач...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-white">
              <p className="text-slate-400 text-lg">Задач пока нет. Попробуйте надиктовать!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}