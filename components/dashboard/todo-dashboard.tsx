'use client'

import { useState, useEffect } from 'react'
import { VoiceInput } from './voice-input'
import { TaskItem } from './task-item'
// Импортируем аккуратно
import * as CardUI from '@/components/ui/card'

const HINTS = [
  "Попробуй: 'Что у меня на сегодня?'",
  "Скажи: 'Запиши созвон на завтра в 10 утра'",
  "Попробуй: 'Удали все выполненные задачи'",
  "Скажи: 'Купить молоко, тег покупки'",
]

export default function TodoDashboard({ initialTasks, userName }: { initialTasks: any[], user: any, userName: string, email: string }) {
  const [currentHint, setCurrentHint] = useState(0)
  const [mounted, setMounted] = useState(false)

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
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        
        {/* Приветствие и Голосовой ввод */}
        <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Привет, {userName}!
            </h1>
            <p className="text-slate-500 text-lg">Что запланируем на сегодня?</p>
          </div>
          
          <div className="bg-white p-8 rounded-full shadow-xl shadow-blue-100/50 border border-blue-50">
            <VoiceInput />
          </div>

          {/* Анимированная подсказка */}
          <div className="h-6 overflow-hidden">
            <p 
              key={currentHint}
              className="text-sm font-medium text-blue-500/80 animate-in fade-in slide-in-from-bottom-2 duration-700"
            >
              {HINTS[currentHint]}
            </p>
          </div>
        </div>

        {/* Список задач в красивой обертке */}
        <Container className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl bg-white/80 backdrop-blur-sm">
          <Content className="p-6">
            <div className="space-y-4">
              {initialTasks && initialTasks.length > 0 ? (
                initialTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))
              ) : (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-slate-400 font-medium">Пока нет задач. Просто скажи, что нужно сделать!</p>
                </div>
              )}
            </div>
          </Content>
        </Container>
      </div>
    </div>
  )
}