import { Navigation } from "@/components/landing/navigation"
import { Hero } from "@/components/landing/hero"
import { SocialProof } from "@/components/landing/social-proof"
import { WhoItsFor } from "@/components/landing/who-its-for"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Testimonials } from "@/components/landing/testimonials"
import { Pricing } from "@/components/landing/pricing"
import { FAQ } from "@/components/landing/faq"
import { FinalCTA } from "@/components/landing/final-cta"
import { Footer } from "@/components/landing/footer"

import { createClient } from '@/lib/supabase/server'
import TodoClient from "@/app/todo-client"

export default async function Home() {
  const supabase = await createClient()
  
  // 1. Проверяем пользователя максимально надежным способом
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Если сессия битая, есть ошибка или пользователя нет — показываем ТОЛЬКО лендинг
  if (authError || !user) {
    return (
      <main className="min-h-screen">
        <Navigation />
        <Hero />
        <SocialProof />
        <WhoItsFor />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
        <Footer />
      </main>
    )
  }

  // 2. Если мы здесь, значит пользователь авторизован. Грузим данные.
  try {
    const [tasksRes, coursesRes, progressRes, projectsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('courses').select('*').order('id', { ascending: true }),
      supabase.from('user_progress').select('course_id, status').eq('user_id', user.id),
      supabase.from('projects').select('*').eq('user_id', user.id).order('is_system', { ascending: false })
    ])

    const tasks = tasksRes.data || []
    const courses = coursesRes.data || []
    const progress = progressRes.data || []
    const projects = projectsRes.data || []

    // Мапим данные для интерфейса обучения
    const learningData = courses.map(course => ({
      ...course,
      status: progress.find(p => p.course_id === course.id)?.status || 'not_started'
    }))

    const doneCount = progress.filter(p => p.status === 'done').length
    const totalProgress = courses.length ? Math.round((doneCount / courses.length) * 100) : 0
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

    return (
      <TodoClient 
        user={user}
        userName={userName}
        initialTasks={tasks}
        projects={projects}
        learningData={learningData}
        totalProgress={totalProgress}
      />
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    // В случае критической ошибки данных лучше разлогинить или показать заглушку
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Ошибка загрузки данных. Попробуйте обновить страницу.</p>
      </div>
    )
  }
}
  
  /*
  // Если пользователь залогинен, показываем новый AI Dashboard
  if (user) {
    // 1. Загружаем задачи
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 2. Загружаем курсы
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .order('id', { ascending: true })

    // 3. Загружаем прогресс
    const { data: progress } = await supabase
      .from('user_progress')
      .select('course_id, status')
      .eq('user_id', user.id)

    // Мапим данные для интерфейса
    const learningData = courses?.map(course => ({
      ...course,
      status: progress?.find(p => p.course_id === course.id)?.status || 'not_started'
    })) || []

    const doneCount = progress?.filter(p => p.status === 'done').length || 0
    const totalProgress = courses?.length ? Math.round((doneCount / courses.length) * 100) : 0
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'

    return (
      <TodoClient 
        user={user}
        userName={userName}
        initialTasks={tasks || []}
        learningData={learningData}
        totalProgress={totalProgress}
      />
    )
  }

  // Если нет — показываем лендинг
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <SocialProof />
      <WhoItsFor />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
}
  */

