'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, BookOpen, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'

const navItems = [
  { href: ROUTES.admin, label: 'Dashboard', icon: LayoutDashboard },
  { href: ROUTES.adminTrips, label: 'Trips', icon: CalendarDays },
  { href: ROUTES.adminBookings, label: 'Bookings', icon: BookOpen },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 bg-navy min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-white/10">
        <Link
          href={ROUTES.home}
          className="flex items-center gap-2 text-white font-display font-bold text-lg"
        >
          <Waves size={20} className="text-teal-light" aria-hidden />
          Soulfullescape
        </Link>
        <p className="text-white/40 text-xs mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === ROUTES.admin ? pathname === ROUTES.admin : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-teal/20 text-teal-light'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
