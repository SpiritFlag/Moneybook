'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { Currency } from '@/types/database'

interface CurrencyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currency?: Currency | null
  onSubmit: (data: { name: string; symbol: string; exchangeRate: number }) => void
  onDelete?: () => void
}

export function CurrencyForm({
  open,
  onOpenChange,
  currency,
  onSubmit,
  onDelete,
}: CurrencyFormProps) {
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')

  const isEditing = !!currency

  useEffect(() => {
    if (open) {
      setName(currency?.name || '')
      setSymbol(currency?.symbol || '')
      setExchangeRate(currency?.exchange_rate?.toString() || '')
    }
  }, [open, currency])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !symbol.trim() || !exchangeRate) return

    onSubmit({
      name: name.trim(),
      symbol: symbol.trim(),
      exchangeRate: parseFloat(exchangeRate),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? '보조화폐 수정' : '보조화폐 추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="큐나"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol">단위 기호</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Q"
              autoComplete="off"
            />
            <p className="text-xs text-gray-500">예: 100 Q, 50 큐나</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exchangeRate">환율 (1단위 = N원)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">1 {symbol || '단위'} =</span>
              <Input
                id="exchangeRate"
                type="number"
                step="0.0001"
                min="0"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="21.5"
                className="flex-1"
                autoComplete="off"
              />
              <span className="text-sm text-gray-500">원</span>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete()
                  onOpenChange(false)
                }}
              >
                삭제
              </Button>
            )}
            <Button
              type="submit"
              disabled={!name.trim() || !symbol.trim() || !exchangeRate}
              className="flex-1 bg-pastel-purple hover:bg-pastel-purple/90"
            >
              {isEditing ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
