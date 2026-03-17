import { createClient } from '@/lib/supabase/server'

export async function getLearningData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Получаем все курсы
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('category', { ascending: false })

  // Получаем прогресс пользователя
  const { data: progress } = await supabase
    .from('user_progress')
    .select('course_id, status')
    .eq('user_id', user?.id)

  // Мапим прогресс на курсы
  return courses?.map(course => ({
    ...course,
    status: progress?.find(p => p.course_id === course.id)?.status || 'not_started'
  })) || []
}