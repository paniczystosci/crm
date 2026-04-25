// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Если пользователь не авторизован и пытается зайти в дашборд
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Если пользователь авторизован
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'admin'

    // Если пользователь на главной дашборда - редирект по роли
    if (pathname === '/dashboard') {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard/cleaner', request.url))
      }
    }

    // Защита: клинер не может зайти в админ-панель
    if (!isAdmin && pathname.startsWith('/dashboard/admin')) {
      return NextResponse.redirect(new URL('/dashboard/cleaner', request.url))
    }

    // Защита: админ не может зайти в панель клинера
    if (isAdmin && pathname.startsWith('/dashboard/cleaner')) {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
  ],
}