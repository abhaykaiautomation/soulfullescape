import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['600', '700', '800'],
})

export const metadata: Metadata = {
  title: {
    default: 'Soulfullescape — Escape. Connect. Recharge.',
    template: '%s — Soulfullescape',
  },
  description:
    'Private day trips to a hidden gem destination in Puerto Rico. Nature, music, kayaking, food, and unforgettable group experiences.',
  openGraph: {
    title: 'Soulfullescape — Escape. Connect. Recharge.',
    description: 'Private day trips to a hidden gem in Puerto Rico.',
    url: 'https://soulfullescape.com',
    siteName: 'Soulfullescape',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Soulfullescape — Escape. Connect. Recharge.',
    description: 'Private day trips to a hidden gem in Puerto Rico.',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
