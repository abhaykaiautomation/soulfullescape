import { AdminGuard } from '@/components/auth/AdminGuard'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s — Admin' },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <AdminSidebar />
        <div className="flex-1 overflow-auto bg-gray-50">
          {children}
        </div>
      </div>
    </AdminGuard>
  )
}
