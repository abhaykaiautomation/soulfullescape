import Link from 'next/link'
import { Waves, Instagram } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-navy text-white/80 mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white mb-3">
              <Waves size={22} className="text-teal-light" aria-hidden />
              <span className="font-display font-bold text-lg">Soulfullescape</span>
            </div>
            <p className="text-sm leading-relaxed">
              Escape. Connect. Recharge.
              <br />
              A hidden destination in Puerto Rico.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">
              Explore
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/trips" className="hover:text-teal-light transition-colors">
                  Upcoming Trips
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-teal-light transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">
              Connect
            </h3>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm hover:text-teal-light transition-colors"
            >
              <Instagram size={16} aria-hidden />
              @soulfullescape
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Soulfullescape. All rights reserved.</p>
          <p>Puerto Rico, USA</p>
        </div>
      </div>
    </footer>
  )
}
