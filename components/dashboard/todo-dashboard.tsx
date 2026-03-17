'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User, FilterX, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VoiceInput } from './voice-input'
import { TaskItem } from './task-item'

export default function TodoDashboard({ initialTasks, userName }: any) {
  const router = useRouter()
  const supabase = createClient()
  
  // Состояние активного фильтра
  const [activeFilter, setActiveFilter] = useState<{ priority_level?: string | null } | null>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Колбэк для обработки команд от VoiceInput
  const handleVoiceAction = (action: string, params: any) => {
    if (action === 'filter') {
      console.log("🎨 Применяю фильтр в UI:", params);
      setActiveFilter(params);
    }
  }

  // Фильтруем список задач перед рендерингом
  const displayTasks = initialTasks.filter((task: any) => {
    if (!activeFilter) return true;
    if (activeFilter.priority_level && task.priority !== activeFilter.priority_level) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold">
              {userName[0]}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Smart Assistant</p>
              <p className="font-bold text-slate-800">{userName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </Button>
        </div>

        {/* Voice Input с передачей экшена */}
        <div className="flex flex-col items-center py-6 bg-white rounded-3xl shadow-sm border border-slate-100">
          <VoiceInput onAction={handleVoiceAction} />
          
          {activeFilter && (
            <div className="mt-4 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100 flex items-center gap-1">
                <Sparkles size={12} /> Фильтр: {activeFilter.priority_level}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-slate-400 hover:text-slate-600"
                onClick={() => setActiveFilter(null)}
              >
                <FilterX size={14} className="mr-1" /> Сбросить
              </Button>
            </div>
          )}
        </div>

        {/* Task List */}
        <div className="grid gap-3">
          {displayTasks.map((task: any) => (
            <TaskItem key={task.id} task={task} />
          ))}
          
          {displayTasks.length === 0 && (
            <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-400">В этом списке пока ничего нет</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}