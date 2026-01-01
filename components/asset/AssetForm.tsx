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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { parseCurrency, formatNumber } from '@/lib/utils/currency'
import type { Asset, AssetCategory } from '@/types/database'

interface AssetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: Asset | null
  categories: AssetCategory[]
  defaultCategoryId?: string
  onSubmit: (data: { name: string; initialBalance: number; categoryId: string }) => void
  onDelete?: () => void
}

export function AssetForm({
  open,
  onOpenChange,
  asset,
  categories,
  defaultCategoryId,
  onSubmit,
  onDelete,
}: AssetFormProps) {
  const [name, setName] = useState('')
  const [balanceInput, setBalanceInput] = useState('')
  const [isNegative, setIsNegative] = useState(false)
  const [categoryId, setCategoryId] = useState('')

  // 폼이 열릴 때마다 값 초기화
  useEffect(() => {
    if (open) {
      setName(asset?.name || '')
      const balance = asset?.initial_balance || 0
      setIsNegative(balance < 0)
      setBalanceInput(balance !== 0 ? formatNumber(Math.abs(balance)) : '')
      setCategoryId(asset?.category_id || defaultCategoryId || '')
    }
  }, [open, asset, defaultCategoryId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !categoryId) return

    const amount = parseCurrency(balanceInput)
    onSubmit({
      name: name.trim(),
      initialBalance: isNegative ? -amount : amount,
      categoryId,
    })
    onOpenChange(false)
    setName('')
    setBalanceInput('')
  }

  const handleBalanceChange = (value: string) => {
    const num = parseCurrency(value)
    setBalanceInput(num === 0 && value !== '0' ? '' : formatNumber(num))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{asset ? '자산 수정' : '자산 추가'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">자산 분류</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="분류 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">자산 이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 신한은행, 국민카드"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">시작 금액</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="balance"
                  type="text"
                  inputMode="numeric"
                  value={balanceInput}
                  onChange={(e) => handleBalanceChange(e.target.value)}
                  placeholder="0"
                  className={`pr-8 ${isNegative ? 'text-red-500' : ''}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  원
                </span>
              </div>
              <Button
                type="button"
                variant={isNegative ? "destructive" : "outline"}
                onClick={() => setIsNegative(!isNegative)}
                className="px-3 shrink-0"
              >
                {isNegative ? '−' : '+/−'}
              </Button>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {asset && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete()
                  onOpenChange(false)
                }}
                className="mr-auto"
              >
                삭제
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" className="bg-pastel-purple hover:bg-pastel-purple/80 text-gray-800">
              {asset ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
