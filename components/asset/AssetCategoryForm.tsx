'use client'

import { useState } from 'react'
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
import type { AssetCategory } from '@/types/database'

interface AssetCategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: AssetCategory | null
  onSubmit: (name: string) => void
  onDelete?: () => void
  canDelete?: boolean
}

export function AssetCategoryForm({
  open,
  onOpenChange,
  category,
  onSubmit,
  onDelete,
  canDelete = true,
}: AssetCategoryFormProps) {
  const [name, setName] = useState(category?.name || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSubmit(name.trim())
    onOpenChange(false)
    setName('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? '자산 분류 수정' : '자산 분류 추가'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">분류 이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 은행, 카드, 현금"
              required
            />
          </div>
          <DialogFooter className="flex gap-2">
            {category && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete()
                  onOpenChange(false)
                }}
                className="mr-auto"
                disabled={!canDelete}
                title={!canDelete ? '자산이 있는 분류는 삭제할 수 없습니다' : undefined}
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
  )
}
