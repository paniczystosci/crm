// src/components/TimeSlotGrid.tsx
'use client'

import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

interface TimeSlotGridProps {
  availableTimes: string[]
  selectedTime: string
  onSelectTime: (time: string) => void
  loading: boolean
}

export function TimeSlotGrid({ availableTimes, selectedTime, onSelectTime, loading }: TimeSlotGridProps) {
  const t = useTranslations('common')  // 👈 ДОЛЖНО БЫТЬ ТАК

  if (availableTimes.length === 0 && !loading) {
    return (
      <div className="mt-2 p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('noAvailableSlots')}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {availableTimes.map((time) => (
          <button
            key={time}
            onClick={() => onSelectTime(time)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedTime === time
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {time}
          </button>
        ))}
      </div>
      {loading && (
        <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" />
          {t('loadingSlots')}
        </p>
      )}
    </div>
  )
}