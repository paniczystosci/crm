import { createNavigation } from 'next-intl/navigation'
import { locales, defaultLocale } from './config'

export const { Link, usePathname, useRouter, redirect, permanentRedirect } = createNavigation({
  locales,
  defaultLocale
})