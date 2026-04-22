// src/components/ThemeToggle.tsx (с отладкой)
'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log('Current theme:', theme, 'Resolved:', resolvedTheme)
  }, [theme, resolvedTheme])

  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  const handleToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    console.log('Toggling theme to:', newTheme)
    setTheme(newTheme)
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      aria-label="Переключить тему"
    >
      {resolvedTheme === 'dark' ? (
        <Sun size={20} className="text-amber-500" />
      ) : (
        <Moon size={20} className="text-gray-700" />
      )}
    </button>
  )
}