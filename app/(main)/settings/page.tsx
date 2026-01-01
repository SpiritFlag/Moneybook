'use client'

import { useRouter } from 'next/navigation'
import { Tag, Coins, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'

const settingsItems = [
  {
    href: '/settings/categories',
    label: '분류 관리',
    description: '수입/지출 분류 추가 및 편집',
    icon: Tag,
  },
  {
    href: '/settings/currencies',
    label: '보조화폐',
    description: '보조화폐 단위 및 환율 설정',
    icon: Coins,
  },
]

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">설정</h2>

      <Card className="divide-y divide-gray-100">
        {settingsItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pastel-purple/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-pastel-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          )
        })}
      </Card>
    </div>
  )
}
