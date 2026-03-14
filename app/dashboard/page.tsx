import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TodoClient from '@/app/todo-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return <TodoClient email={user.email ?? 'Unknown user'} />
}