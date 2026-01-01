'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  title?: string
}

export function Header({ title = 'Moneybook' }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-40">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-gray-500 hover:text-gray-700"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
