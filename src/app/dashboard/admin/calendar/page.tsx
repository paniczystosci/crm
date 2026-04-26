// src/app/dashboard/admin/calendar/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useTranslations } from 'next-intl'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import multimonthPlugin from '@fullcalendar/multimonth'
import { Calendar as CalendarIcon, Clock, User, DollarSign, MapPin } from 'lucide-react'
import type { EventClickArg, EventDropArg } from '@fullcalendar/core'
import ruLocale from '@fullcalendar/core/locales/ru'
import plLocale from '@fullcalendar/core/locales/pl'
import enLocale from '@fullcalendar/core/locales/en-gb'
import deLocale from '@fullcalendar/core/locales/de'

type Order = {
  id: string
  client_name: string
  address: string
  price: number
  status: string
  planned_date: string
  planned_time: string
  duration: number
  cleaner_id: string
  cleaners?: { full_name: string }
}

type Cleaner = {
  id: string
  full_name: string
}

const statusColors: Record<string, string> = {
  new: '#3b82f6',
  accepted: '#10b981',
  in_progress: '#f59e0b',
  done: '#22c55e',
  cancelled: '#ef4444',
}

export default function AdminCalendar() {
  const t = useTranslations('common')
  const ordersT = useTranslations('orders')
  const cleanersT = useTranslations('cleaners')
  const chatT = useTranslations('chat')
  const calendarT = useTranslations('calendar')
  
  const [orders, setOrders] = useState<Order[]>([])
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCleaner, setSelectedCleaner] = useState<string>('all')
  const [events, setEvents] = useState<any[]>([])
  const [updating, setUpdating] = useState(false)
  const [locale, setLocale] = useState('ru')

  const supabase = createClient()

  // Определяем текущую локаль
  useEffect(() => {
    const currentLocale = document.documentElement.lang || 'ru'
    setLocale(currentLocale)
  }, [])

  // Получаем локализацию для календаря
  const getCalendarLocale = () => {
    switch (locale) {
      case 'ru': return ruLocale
      case 'pl': return plLocale
      case 'en': return enLocale
      case 'de': return deLocale
      default: return ruLocale
    }
  }

  const statusLabels: Record<string, string> = {
    new: `🆕 ${ordersT('status.new')}`,
    accepted: `✅ ${ordersT('status.accepted')}`,
    in_progress: `🔄 ${ordersT('status.in_progress')}`,
    done: `✔️ ${ordersT('status.done')}`,
    cancelled: `❌ ${ordersT('status.cancelled')}`,
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`
        *,
        cleaners:cleaner_id (full_name)
      `)
      .not('status', 'eq', 'cancelled')
      .order('planned_date', { ascending: true })

    const { data: cleanersData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'cleaner')

    setOrders(ordersData || [])
    setCleaners(cleanersData || [])
    
    const calendarEvents = (ordersData || []).map(order => {
      const startDate = new Date(order.planned_date)
      const [hours, minutes] = (order.planned_time || '09:00').split(':').map(Number)
      startDate.setHours(hours, minutes)
      
      const endDate = new Date(startDate)
      endDate.setMinutes(endDate.getMinutes() + (order.duration || 60))

      return {
        id: order.id,
        title: `${order.client_name}${order.cleaners?.full_name ? ` (${order.cleaners.full_name})` : ''}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: statusColors[order.status] || '#6b7280',
        borderColor: statusColors[order.status] || '#6b7280',
        extendedProps: {
          address: order.address,
          price: order.price,
          status: order.status,
          cleaner_id: order.cleaner_id,
          client_name: order.client_name,
          phone: order.client_phone,
          duration: order.duration,
        }
      }
    })

    setEvents(calendarEvents)
    setLoading(false)
  }

  const handleEventDrop = async (info: EventDropArg) => {
    setUpdating(true)
    
    const newDate = info.event.start
    if (!newDate) return
    
    const planned_date = newDate.toISOString().split('T')[0]
    const planned_time = newDate.toTimeString().slice(0, 5)
    const orderId = info.event.id
    
    const { data: conflictingOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('planned_date', planned_date)
      .eq('cleaner_id', info.event.extendedProps.cleaner_id)
      .neq('id', orderId)
      .not('status', 'eq', 'cancelled')
    
    if (conflictingOrders && conflictingOrders.length > 0) {
      alert(calendarT('timeConflict'))
      info.revert()
      setUpdating(false)
      return
    }
    
    const { error } = await supabase
      .from('orders')
      .update({ 
        planned_date, 
        planned_time,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
    
    if (error) {
      console.error('Error updating order date:', error)
      alert(calendarT('updateError'))
      info.revert()
    } else {
      fetchData()
    }
    
    setUpdating(false)
  }

  const handleEventClick = (info: EventClickArg) => {
    const props = info.event.extendedProps
    const statusText = statusLabels[props.status] || props.status
    
    alert(`
${ordersT('client')}: ${props.client_name}
${ordersT('status')}: ${statusText}
💰 ${ordersT('price')}: ${props.price} zł
📍 ${ordersT('address')}: ${props.address}
⏱️ ${calendarT('duration')}: ${props.duration || 60} ${t('minutes')}
    `)
  }

  const filteredEvents = selectedCleaner === 'all' 
    ? events 
    : events.filter(event => event.extendedProps.cleaner_id === selectedCleaner)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  const buttonTexts = {
    ru: { today: 'Сегодня', month: 'Месяц', week: 'Неделя', day: 'День', year: 'Год' },
    pl: { today: 'Dzisiaj', month: 'Miesiąc', week: 'Tydzień', day: 'Dzień', year: 'Rok' },
    en: { today: 'Today', month: 'Month', week: 'Week', day: 'Day', year: 'Year' },
    de: { today: 'Heute', month: 'Monat', week: 'Woche', day: 'Tag', year: 'Jahr' },
  }

  const currentButtonTexts = buttonTexts[locale as keyof typeof buttonTexts] || buttonTexts.ru

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <CalendarIcon size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                {calendarT('title')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {calendarT('description')}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <User size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{calendarT('filterByCleaner')}:</span>
            </div>
            <select
              value={selectedCleaner}
              onChange={(e) => setSelectedCleaner(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">{calendarT('allCleaners')}</option>
              {cleaners.map(cleaner => (
                <option key={cleaner.id} value={cleaner.id}>{cleaner.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 overflow-hidden">
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multimonthPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,multimonthYear'
              }}
              initialView="timeGridWeek"
              editable={true}
              droppable={true}
              events={filteredEvents}
              eventDrop={handleEventDrop}
              eventClick={handleEventClick}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              height="auto"
              locale={getCalendarLocale()}
              firstDay={1}
              buttonText={currentButtonTexts}
              eventContent={(eventInfo) => (
                <div className="p-1 text-xs">
                  <div className="font-medium truncate">
                    {eventInfo.event.title}
                  </div>
                  <div className="text-[10px] opacity-80">
                    {eventInfo.event.start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {eventInfo.event.extendedProps.price && ` • ${eventInfo.event.extendedProps.price} zł`}
                  </div>
                </div>
              )}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: statusColors.new }}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{ordersT('status.new')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: statusColors.accepted }}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{ordersT('status.accepted')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: statusColors.in_progress }}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{ordersT('status.in_progress')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: statusColors.done }}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{ordersT('status.done')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: statusColors.cancelled }}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{ordersT('status.cancelled')}</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>💡 {calendarT('dragHint')}</p>
        </div>

        {/* Custom CSS for calendar */}
        <style jsx global>{`
          .fc {
            --fc-border-color: #e5e7eb;
            --fc-button-bg-color: #10b981;
            --fc-button-border-color: #10b981;
            --fc-button-hover-bg-color: #059669;
            --fc-button-hover-border-color: #059669;
            --fc-button-active-bg-color: #059669;
            --fc-button-active-border-color: #059669;
          }
          .dark .fc {
            --fc-border-color: #374151;
            --fc-page-bg-color: #1f2937;
            --fc-neutral-bg-color: #111827;
            --fc-list-event-hover-bg-color: #374151;
          }
          .fc .fc-button-primary {
            background-color: var(--fc-button-bg-color) !important;
            border-color: var(--fc-button-border-color) !important;
          }
          .fc .fc-button-primary:hover {
            background-color: var(--fc-button-hover-bg-color) !important;
          }
          .fc-event {
            cursor: pointer;
          }
          .fc-event-dragging {
            opacity: 0.7;
          }
          @media (max-width: 768px) {
            .fc .fc-toolbar {
              flex-direction: column;
              gap: 12px;
            }
            .fc .fc-toolbar-title {
              font-size: 1.25rem;
            }
            .fc .fc-button {
              padding: 0.25rem 0.5rem;
              font-size: 0.75rem;
            }
          }
        `}</style>
      </div>
    </div>
  )
}