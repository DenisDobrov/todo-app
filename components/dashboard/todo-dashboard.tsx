'use client'

import { useState, useEffect } from 'react'
// Импортируем аккуратно
import * as CardUI from '@/components/ui/card'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VoiceInput } from './voice-input'
import { TaskItem } from './task-item'

const HINTS = [
  "Попробуй: 'Что у меня на сегодня?'",
  "Скажи: 'Запиши созвон на завтра в 10 утра'",
  "Попробуй: 'Удали все выполненные задачи'",
  "Скажи: 'Купить молоко, тег покупки'",
]

export default function TodoDashboard({ initialTasks, userName }: { initialTasks: any[], user: any, userName: string, email: string }) {
  const [currentHint, setCurrentHint] = useState(0)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }
  // Лайфхак для iOS: разблокировка звука при первом взаимодействии
  const unlockAudio = () => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (context.state === 'suspended') {
      context.resume()
    }
  }

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setCurrentHint((prev) => (prev + 1) % HINTS.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  // Безопасные компоненты (если shadcn не установлен, используем обычные div)
  const Container = CardUI.Card || 'div'
  const Content = CardUI.CardContent || 'div'

return (
    <div className="min-h-screen bg-slate-50/50 p-4" onClick={unlockAudio}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header с Logout */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Привет,</p>
              <p className="font-bold text-slate-900 leading-none">{userName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition-colors">
            <LogOut size={18} className="mr-2" /> Выйти
          </Button>
        </div>

        {/* Voice Input Section */}
        <div className="flex flex-col items-center justify-center py-6">
          <VoiceInput />
        </div>

        {/* Task List */}
        <div className="grid gap-4">
          {initialTasks?.map((task: any) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  )
}