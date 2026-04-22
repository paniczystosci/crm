// src/components/SidebarLink.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function SidebarLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {icon}
      <span className="font-medium">{children}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>}
    </Link>
  )
}