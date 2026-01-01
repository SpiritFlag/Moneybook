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
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import type { IncomeCategory, ExpenseCategory } from '@/types/database'

type Category = IncomeCategory | ExpenseCategory

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  allCategories: Category[]
  type: 'income' | 'expense'
  onSubmit: (data: { name: string; emoji: string }) => void
  onDelete?: (replacementId: string) => void
}

export function CategoryForm({
  open,
  onOpenChange,
  category,
  allCategories,
  type,
  onSubmit,
  onDelete,
}: CategoryFormProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(type === 'income' ? '💰' : '📦')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [replacementId, setReplacementId] = useState('')
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  const otherCategories = allCategories.filter((c) => c.id !== category?.id)

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name)
        setEmoji(category.emoji || (type === 'income' ? '💰' : '📦'))
      } else {
        setName('')
        setEmoji(type === 'income' ? '💰' : '📦')
      }
      setShowDeleteConfirm(false)
      setReplacementId('')
    }
  }, [category, open, type])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSubmit({ name: name.trim(), emoji })
    onOpenChange(false)
  }

  const handleDeleteClick = () => {
    if (otherCategories.length === 0) {
      return
    }
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (!replacementId || !onDelete) return
    onDelete(replacementId)
    onOpenChange(false)
  }

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>분류 삭제</DialogTitle>
            <DialogDescription>
              이 분류의 모든 거래를 어떤 분류로 이동할까요?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              <p className="font-medium">{category?.emoji} {category?.name}</p>
              <p className="text-yellow-700 mt-1">
                이 분류를 삭제하면 해당 거래들이 선택한 분류로 이동됩니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label>대체할 분류 선택</Label>
              <Select value={replacementId} onValueChange={setReplacementId}>
                <SelectTrigger>
                  <SelectValue placeholder="분류 선택" />
                </SelectTrigger>
                <SelectContent>
                  {otherCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={!replacementId}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {type === 'income' ? '수입' : '지출'} 분류 {category ? '수정' : '추가'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>이모지</Label>
              <button
                type="button"
                onClick={() => setEmojiPickerOpen(true)}
                className="w-16 h-16 text-3xl rounded-lg border-2 border-dashed border-gray-200 hover:border-pastel-purple hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                {emoji}
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">분류 이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'income' ? '예: 급여, 부수입' : '예: 식비, 교통비'}
                required
              />
            </div>
            <DialogFooter className="flex gap-2">
              {category && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  className="mr-auto"
                  disabled={otherCategories.length === 0}
                  title={otherCategories.length === 0 ? '다른 분류가 없어 삭제할 수 없습니다' : undefined}
                >
                  삭제
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button type="submit" className="bg-pastel-purple hover:bg-pastel-purple/80 text-gray-800">
                {category ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <EmojiPicker
        open={emojiPickerOpen}
        onOpenChange={setEmojiPickerOpen}
        onSelect={setEmoji}
        currentEmoji={emoji}
      />
    </>
  )
}
