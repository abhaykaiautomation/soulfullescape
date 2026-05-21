'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Waves, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { firebaseUser, dbUser, signOut } = useAuth()
  const { toast } = useToast()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    toast('Signed out', 'info')
    setUserMenuOpen(false)
    setMobileOpen(false)
  }

  const isAdmin = dbUser?.role === 'ADMIN'

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={ROUTES.home}
            className="flex items-center gap-2 font-display font-bold text-navy text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded"
          >
            <Waves size={24} className="text-teal" aria-hidden />
            Soulfullescape
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href={ROUTES.trips}
              className={cn(
                'text-sm font-medium transition-colors hover:text-teal',
                pathname === ROUTES.trips ? 'text-teal' : 'text-gray-600'
              )}
            >
              Upcoming Trips
            </Link>
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {firebaseUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded-full px-3 py-2"
                  aria-expanded={userMenuOpen}
                >
                  <User size={18} />
                  {dbUser?.name?.split(' ')[0] ?? 'Account'}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    {isAdmin && (
                      <Link
                        href={ROUTES.admin}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LayoutDashboard size={16} />
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href={ROUTES.accountBookings}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User size={16} />
                      My Bookings
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href={ROUTES.login}>
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href={ROUTES.register}>
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-3">
            <Link
              href={ROUTES.trips}
              onClick={() => setMobileOpen(false)}
              className="block px-2 py-2 text-base font-medium text-gray-700 hover:text-teal"
            >
              Upcoming Trips
            </Link>
            {firebaseUser ? (
              <>
                {isAdmin && (
                  <Link
                    href={ROUTES.admin}
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-2 text-base font-medium text-gray-700 hover:text-teal"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  href={ROUTES.accountBookings}
                  onClick={() => setMobileOpen(false)}
                  className="block px-2 py-2 text-base font-medium text-gray-700 hover:text-teal"
                >
                  My Bookings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-2 py-2 text-base font-medium text-red-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link href={ROUTES.login} onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" fullWidth>Sign In</Button>
                </Link>
                <Link href={ROUTES.register} onClick={() => setMobileOpen(false)}>
                  <Button fullWidth>Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
