// src/app/actions/createUser.ts
'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

export async function createNewUser(
  fullName: string,
  email: string,
  role: 'admin' | 'cleaner'
) {
  try {
    // 1. Создаём пользователя в Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: '123456',           // временный пароль
      email_confirm: true,
    })

    if (authError) {
      console.error('Auth createUser error:', authError)
      return { success: false, error: authError.message }
    }

    // 2. Создаём профиль в таблице profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName.trim(),
        role: role,
      })

    if (profileError) {
      console.error('Profile insert error:', profileError)
      return { 
        success: false, 
        error: 'Пользователь создан, но не удалось создать профиль' 
      }
    }

    return { 
      success: true, 
      message: `Пользователь ${fullName} успешно создан!\nEmail: ${email}\nВременный пароль: 123456` 
    }

  } catch (err: any) {
    console.error('Unexpected error in createNewUser:', err)
    return { success: false, error: err.message || 'Неизвестная ошибка' }
  }
}