import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicPages = [
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
]

// Точные пути для исключения (без авторизации)
const exactExcludedPaths = [
  '/manifest.json',
  '/sw.js',
  '/register-sw.js',
  '/offline.html',
  '/favicon.ico',
  '/logo.png',
]

// Префиксы для исключения
const excludedPrefixes = [
  '/_next',
  '/api/auth',
  '/auth/v1',
  '/icons/',
  '/images/',
]

// Расширения файлов, которые не требуют авторизации
const staticFileExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.json', '.js']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Проверка точных совпадений
  if (exactExcludedPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Проверка по префиксам
  if (excludedPrefixes.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Проверка по расширениям файлов
  if (staticFileExtensions.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next()
  }

  // Публичные страницы
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

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Проверка ролей для admin
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

  // Проверка ролей для cleaner
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
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (icons, images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|js)$).*)',
  ],
}