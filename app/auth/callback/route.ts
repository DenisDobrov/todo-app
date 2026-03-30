// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Определяем, куда идти после логина
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // Используем твой стандартный серверный клиент
    const supabase = await createClient()
    
    // Обмениваем код на сессию (куки установятся автоматически через твой createClient)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Важно: проверяем, что не редиректим на корень, если хотим в дашборд
      const redirectUrl = (next === '/' || !next) ? '/dashboard' : next;
      
      // Используем origin (soluter.com), чтобы избежать проблем с cross-origin
      return NextResponse.redirect(`${origin}${redirectUrl}`);
    }
  }

  // В случае ошибки возвращаем на страницу входа
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`)
}