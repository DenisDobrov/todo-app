'use client'

import { useState } from 'react'
import { VoiceInput } from '@/components/dashboard/voice-input'
import { TaskItem } from '@/components/dashboard/task-item'
import { 
  LogOut, 
  Sparkles, 
  Circle, 
  CheckCircle2, 
  ListTodo,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TodoClient({ user, initialTasks, learningData, totalProgress }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [activeFilter, setActiveFilter] = useState<any>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-black text-slate-900 leading-none tracking-tighter text-xl">SOLUTER AI</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Career Transition Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Student</p>
              <p className="text-sm font-bold text-slate-700 leading-none">{user?.email?.split('@')[0]}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        
        {/* PROGRESS CARD (Дизайн SOLUTER AI) */}
        <section className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-blue-500" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Learning path</p>
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 mb-10 leading-[1.1] tracking-tight">
              Machine Learning<br />Engineer <span className="text-blue-600">.</span>
            </h1>

            <div className="space-y-3 mb-12 max-w-md">
              <div className="flex justify-between items-end">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Career progress</span>
                <span className="text-2xl font-black text-slate-900 leading-none">{totalProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-900 transition-all duration-1000 ease-out rounded-full" 
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>

            {/* LIST OF COURSES */}
            <div className="space-y-4">
              {learningData.length > 0 ? learningData.map((course: any) => (
                <div key={course.id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-md transition-all group/item">
                  <div className="flex items-center gap-5">
                    <div className={`${course.status === 'done' ? 'text-green-500' : 'text-slate-200'} transition-colors`}>
                      {course.status === 'done' ? <CheckCircle2 size={26} /> : <Circle size={26} />}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 tracking-tight leading-none mb-1.5">{course.title}</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                        {course.status === 'done' ? 'Completed' : course.status === 'active' ? 'In progress' : 'Upcoming'}
                      </p>
                    </div>
                  </div>
                  <div className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest transition-colors ${
                    course.status === 'done' ? 'bg-slate-100 text-slate-400' : 
                    course.status === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-300'
                  }`}>
                    {course.status === 'done' ? 'Done' : course.status === 'active' ? 'Active' : 'Locked'}
                  </div>
                </div>
              )) : (
                <p className="text-center py-10 text-slate-400 italic border-2 border-dashed border-slate-50 rounded-3xl">Загружаем программу обучения...</p>
              )}
            </div>
          </div>
        </section>

        {/* BOTTOM SECTION: ASSISTANT & TASKS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* VOICE BOX */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent" />
            <div className="relative z-10 flex flex-col items-center">
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8">Voice Command</p>
               <VoiceInput onAction={(action, params) => {
                 if (action === 'filter') setActiveFilter(params)
               }} />
               <p className="mt-8 text-slate-500 text-[11px] font-medium text-center max-w-[200px]">
                 "Я закончил курс Python" <br/> или "Что на сегодня?"
               </p>
            </div>
          </div>

          {/* TASKS BOX */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl">
                  <ListTodo size={20} className="text-blue-600" />
                </div>
                <h2 className="font-black text-slate-900 uppercase text-xs tracking-[0.15em]">Daily Tasks</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded tracking-widest">
                {initialTasks.length}
              </span>
            </div>
            
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {initialTasks.map((task: any) => (
                <TaskItem key={task.id} task={task} />
              ))}
              {initialTasks.length === 0 && (
                <div className="text-center py-10 opacity-30 italic text-sm">
                  Нет текущих задач
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}