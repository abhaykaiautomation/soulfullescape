import Link from 'next/link'
import { Waves } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <Waves size={56} className="text-teal mb-6" aria-hidden />
      <h1 className="font-display font-bold text-navy text-4xl mb-3">Page not found</h1>
      <p className="text-gray-500 mb-8">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link href="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  )
}
