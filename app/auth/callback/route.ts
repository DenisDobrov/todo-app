import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Если в запросе был параметр next (например, /auth?next=/dashboard), 
  // то после логина отправим туда, иначе на главную
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // КРИТИЧНО: используем origin, чтобы редирект был на тот же домен
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Если что-то пошло не так, возвращаем на страницу логина
  return NextResponse.redirect(`${origin}/auth`)
}