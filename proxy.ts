// proxy.ts (бывший middleware.ts)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * В Next.js 16+ функция должна называться proxy (если файл proxy.ts) 
 * или экспортироваться как default.
 */
export async function proxy(request: NextRequest) {
  // Создаем базовый ответ
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Инициализируем клиент Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Критически важно: обновляем сессию
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // --- ЛОГИКА РЕДИРЕКТОВ ---

  // 1. ИСКЛЮЧЕНИЕ: Если это коллбек авторизации, ничего не делаем, даем отработать route.ts
  if (url.pathname.startsWith('/auth/callback')) {
    return response
  }

  // 2. ЗАЛОГИНЕН: Если юзер есть и он на / или /auth -> в дашборд
  if (user && (url.pathname === '/' || url.pathname === '/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. ГОСТЬ: Если юзера нет и он лезет в /dashboard -> на логин
  if (!user && url.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return response
}

/**
 * Настройка путей. 
 * ВАЖНО: добавил 'auth/callback' в исключения матчера, 
 * чтобы прокси не перехватывал технический процесс обмена кодами.
 */
export const config = {
  matcher: [
    /*
     * Пропускаем:
     * - api (ручки API)
     * - _next/static (статика)
     * - _next/image (оптимизация картинок)
     * - favicon.ico (иконка)
     * - auth/callback (процесс входа)
     * - файлы с расширениями (svg, png, jpg и т.д.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}