'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User, FilterX, Sparkles, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VoiceInput } from './voice-input'
import { TaskItem } from './task-item'

// 1. Добавили user в пропсы
export function TodoDashboard({ tasks, projects, user }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [activeFilter, setActiveFilter] = useState<{ priority_level?: string | null } | null>(null)

  // 2. Определяем userName (чтобы не было ошибки в хедере)
  const userName = user?.email?.split('@')[0] || 'User'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleVoiceAction = (action: string, params: any) => {
    if (action === 'filter') {
      setActiveFilter(params)
    }
  }

  // 3. Исправили фильтрацию (используем tasks вместо initialTasks)
  const filtered = tasks.filter((task: any) => {
    if (!activeFilter || activeFilter.priority_level === null) return true;
    return task.priority === activeFilter.priority_level;
  });

  // 4. Группировка по датам
  const groupedTasks = {
    today: filtered.filter((t: any) => {
      if (!t.due_at) return false;
      const d = new Date(t.due_at);
      return d.toDateString() === new Date().toDateString();
    }),
    tomorrow: filtered.filter((t: any) => {
      if (!t.due_at) return false;
      const d = new Date(t.due_at);
      const tom = new Date(); tom.setDate(tom.getDate() + 1);
      return d.toDateString() === tom.toDateString();
    }),
    later: filtered.filter((t: any) => {
      if (!t.due_at) return true; 
      const d = new Date(t.due_at);
      const tom = new Date(); tom.setDate(tom.getDate() + 1);
      // Чтобы не было пересечений с "завтра"
      const tomorrowStr = tom.toDateString();
      return d.toDateString() !== tomorrowStr && d > tom;
    })
  };

  // 5. Вспомогательный компонент секции (теперь видит projects)
  const Section = ({ title, tasks: sectionTasks }: { title: string, tasks: any[] }) => (
    sectionTasks.length > 0 ? (
      <div className="space-y-3 mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
          <CalendarIcon size={14} /> {title}
        </h3>
        <div className="grid gap-3">
          {sectionTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              projects={projects} 
            />
          ))}
        </div>
      </div>
    ) : null
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold">
              {userName[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Assistant Active</p>
              <p className="font-bold text-slate-800">{userName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400">
            <LogOut size={18} />
          </Button>
        </div>

        {/* Voice Input */}
        <div className="flex flex-col items-center py-6 bg-white rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <VoiceInput onAction={handleVoiceAction} />
          {activeFilter?.priority_level && (
            <div className="mt-4 flex items-center gap-2 animate-in slide-in-from-top-2">
              <span className="text-xs font-bold px-3 py-1 bg-blue-600 text-white rounded-full shadow-sm">
                Приоритет: {activeFilter.priority_level}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setActiveFilter(null)} className="h-7 text-xs">
                <FilterX size={14} className="mr-1" /> Сбросить
              </Button>
            </div>
          )}
        </div>

        {/* Список задач */}
        <div className="mt-4">
          <Section title="Сегодня" tasks={groupedTasks.today} />
          <Section title="Завтра" tasks={groupedTasks.tomorrow} />
          <Section title="Позже" tasks={groupedTasks.later} />
          
          {filtered.length === 0 && (
            <div className="text-center py-20 bg-white/40 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">Список пуст</p>
              <p className="text-xs text-slate-300 mt-1">Нажми на микрофон, чтобы добавить задачу</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}