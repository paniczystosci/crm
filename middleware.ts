import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicPages = [
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password',
]

const excludedPaths = [
  '/_next',
  '/api/auth',
  '/auth/v1',
  '/favicon.ico',
  '/logo.png',
  '/manifest.json',
  '/sw.js',
  '/register-sw.js',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}