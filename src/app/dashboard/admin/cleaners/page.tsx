// src/app/dashboard/admin/cleaners/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { UserPlus } from 'lucide-react'
import { createNewUser } from '@/app/actions/createUser'   // ← Server Action

type Cleaner = {
  id: string
  full_name: string | null
  role: 'admin' | 'cleaner'
}

export default function AdminCleaners() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'cleaner' as 'admin' | 'cleaner'
  })

  const supabase = createClient()

  useEffect(() => {
    fetchCleaners()
  }, [])

  async function fetchCleaners() {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')

    if (error) {
      console.error('Ошибка загрузки сотрудников:', error)
    } else {
      setCleaners(data || [])
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name || !formData.email) return

    setSubmitting(true)

    const result = await createNewUser(
      formData.full_name.trim(),
      formData.email.trim().toLowerCase(),
      formData.role
    )

    if (result.success) {
      alert(result.message || 'Пользователь успешно создан!')
      setFormData({ full_name: '', email: '', role: 'cleaner' })
      setShowForm(false)
      fetchCleaners() // обновляем список
    } else {
      alert('Ошибка: ' + (result.error || 'Неизвестная ошибка'))
    }

    setSubmitting(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Команда</h1>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition"
        >
          <UserPlus size={20} />
          Добавить сотрудника
        </button>
      </div>

      {/* Форма добавления */}
      {showForm && (
        <div className="card p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-6">Добавить нового сотрудника</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">ФИО</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-blue-500"
                placeholder="Иванова Анна Сергеевна"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-rose-500"
                placeholder="anna@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Роль</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'cleaner' })}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-rose-500"
              >
                <option value="cleaner">Клинер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 text-white py-3.5 rounded-2xl font-medium transition"
              >
                {submitting ? 'Создаём...' : 'Создать сотрудника'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setFormData({ full_name: '', email: '', role: 'cleaner' })
                }}
                className="flex-1 py-3.5 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Отмена
              </button>
            </div>
          </form>

          <p className="text-xs text-zinc-500 mt-6">
            Временный пароль: <strong>123456</strong><br />
            Пользователь сможет сменить его после первого входа.
          </p>
        </div>
      )}

      {/* Список сотрудников */}
      <div className="card">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="font-semibold text-xl">Список сотрудников</h2>
          <div className="text-sm text-zinc-500">{cleaners.length} человек</div>
        </div>

        {loading ? (
          <div className="p-12 text-center">Загрузка...</div>
        ) : cleaners.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">Пока нет сотрудников</div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {cleaners.map((person) => (
              <div key={person.id} className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-medium text-lg">{person.full_name || 'Без имени'}</div>
                  <div className="text-sm text-zinc-500 font-mono">{person.id}</div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`px-5 py-1.5 text-sm rounded-full font-medium ${
                    person.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {person.role === 'admin' ? 'Администратор' : 'Клинер'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}