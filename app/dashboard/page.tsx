import { logout } from '@/app/auth/actions'; // Создадим этот файл ниже

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CourseList } from '@/components/dashboard/CourseList';
import { TaskWidget } from '@/components/dashboard/TaskWidget';
import { VoiceAssistant } from '@/components/ui/VoiceAssistant';
import { ProgressHeader } from '@/components/dashboard/ProgressHeader';


export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Получаем задачи и прогресс (замени на свои реальные запросы)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

 
  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32">
      {/* Top Navigation / Header */}
      <nav className="h-16 border-b bg-white flex items-center px-8 justify-between sticky top-0 z-40">
        <span className="font-bold text-xl tracking-tight text-gray-900">SOLUTER <span className="text-blue-600">AI</span>
        </span>
        <div className="flex items-center gap-4">
        {/* Кнопка Logout */}
          <form action={logout}>
            <button className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-red-500 transition-colors">
            Выйти
            </button>
          </form>
        <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-100 overflow-hidden">
          {/* User Avatar Placeholder */}
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
        </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Learning Path (7/12) */}
          <section className="lg:col-span-7 space-y-8">
            <ProgressHeader percent={68} />
            
            <div id="learning-path" className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Your Path</h3>
              <CourseList />
            </div>
          </section>

          {/* Right Column: Tasks & Stats (5/12) */}
          <section className="lg:col-span-5 space-y-8">
            <div id="tasks-section" className="sticky top-28">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-right">Upcoming Tasks</h3>
              <TaskWidget tasks={tasks || []} />
              
              {/* Дополнительный виджет статы (опционально) */}
              <div className="mt-6 p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl text-white shadow-xl">
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Weekly Focus</p>
                <p className="text-xl font-medium">Neural Networks</p>
                <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full w-[40%]" />
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Floating Voice Assistant Bar */}
      <VoiceAssistant />
    </div>
  );
}