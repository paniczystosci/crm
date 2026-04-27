import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Страницы, доступные без авторизации
const publicPages = [
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
]

// Пути, которые middleware вообще не должен обрабатывать
const excludedPaths = [
  '/_next',            // статика Next.js
  '/api/auth',         // API-роуты авторизации
  '/auth/v1',          // запросы к Supabase API
  '/favicon.ico',      // иконка
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Пропускаем исключённые пути мгновенно, без дальнейших проверок
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 2. Пропускаем публичные страницы (логин, регистрация, callback)
  if (publicPages.some(page => pathname === page || pathname.startsWith(page))) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 3. Проверяем сессию только для защищённых маршрутов
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // 4. Проверка ролей для админки и панели клинера
  if (pathname.startsWith('/dashboard/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/cleaner'
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith('/dashboard/cleaner')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'cleaner') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/admin'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Исключаем статические файлы и изображения
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}