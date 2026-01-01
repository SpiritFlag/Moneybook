import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-20 max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
