'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit2, Coins } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CurrencyForm } from '@/components/currency/CurrencyForm'
import {
  useCurrencies,
  useCreateCurrency,
  useUpdateCurrency,
  useDeleteCurrency,
} from '@/lib/hooks/useCurrencies'
import type { Currency } from '@/types/database'

export default function SettingsCurrenciesPage() {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null)

  const { data: currencies = [], isLoading } = useCurrencies()
  const createCurrency = useCreateCurrency()
  const updateCurrency = useUpdateCurrency()
  const deleteCurrency = useDeleteCurrency()

  const handleCreate = (data: { name: string; symbol: string; exchangeRate: number }) => {
    createCurrency.mutate(data, {
      onSuccess: () => toast.success('보조화폐가 추가되었습니다'),
      onError: () => toast.error('추가에 실패했습니다'),
    })
  }

  const handleUpdate = (data: { name: string; symbol: string; exchangeRate: number }) => {
    if (!editingCurrency) return
    updateCurrency.mutate({ id: editingCurrency.id, ...data }, {
      onSuccess: () => toast.success('수정되었습니다'),
      onError: () => toast.error('수정에 실패했습니다'),
    })
  }

  const handleDelete = () => {
    if (!editingCurrency) return
    deleteCurrency.mutate({ id: editingCurrency.id }, {
      onSuccess: () => toast.success('삭제되었습니다'),
      onError: (error) => toast.error(error.message),
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/settings')}
            className="h-8 w-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-800">보조화폐</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingCurrency(null)
            setFormOpen(true)
          }}
          className="text-pastel-purple border-pastel-purple hover:bg-pastel-purple/10"
        >
          <Plus className="w-4 h-4 mr-1" />
          추가
        </Button>
      </div>

      <Card className="p-2">
        {currencies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Coins className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>보조화폐가 없습니다</p>
            <p className="text-sm mt-1">게임 머니나 포인트 등을 추가해보세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {currencies.map((currency) => (
              <div
                key={currency.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-pastel-purple/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800">{currency.name}</p>
                  <p className="text-sm text-gray-500">
                    1 {currency.symbol} = {currency.exchange_rate.toLocaleString()}원
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingCurrency(currency)
                    setFormOpen(true)
                  }}
                  className="text-gray-500"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CurrencyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        currency={editingCurrency}
        onSubmit={editingCurrency ? handleUpdate : handleCreate}
        onDelete={editingCurrency ? handleDelete : undefined}
      />
    </div>
  )
}
