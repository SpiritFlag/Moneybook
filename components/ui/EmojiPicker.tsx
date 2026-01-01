'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// 카테고리별 이모지 목록
const emojiCategories = {
  '음식': ['🍚', '🍜', '🍔', '🍕', '🍣', '🍰', '🍩', '☕', '🍺', '🥗'],
  '쇼핑': ['🛒', '👕', '👗', '👟', '💄', '💍', '🎁', '📦', '🛍️', '💳'],
  '교통': ['🚗', '🚌', '🚇', '✈️', '🚕', '🚲', '⛽', '🛵', '🚆', '🛫'],
  '주거': ['🏠', '💡', '🔑', '🛋️', '🚿', '🧹', '🪴', '🛏️', '🚰', '📺'],
  '건강': ['💊', '🏥', '🩺', '💪', '🧘', '🏃', '🦷', '👓', '🩹', '💉'],
  '문화': ['🎬', '📚', '🎵', '🎮', '🎨', '📷', '🎭', '🎤', '🎧', '🎪'],
  '교육': ['📖', '✏️', '🎓', '💻', '📝', '🔬', '📐', '🧮', '📌', '🎒'],
  '금융': ['💰', '💵', '🏦', '📈', '💳', '🪙', '💎', '📊', '🧾', '💸'],
  '기타': ['⭐', '❤️', '✨', '🔥', '⚡', '🌈', '🎯', '🏆', '🎊', '🌟'],
}

interface EmojiPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (emoji: string) => void
  currentEmoji?: string
}

export function EmojiPicker({
  open,
  onOpenChange,
  onSelect,
  currentEmoji,
}: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('음식')

  const handleSelect = (emoji: string) => {
    onSelect(emoji)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>이모지 선택</DialogTitle>
        </DialogHeader>

        {/* 카테고리 탭 */}
        <div className="flex flex-wrap gap-1 pb-2 border-b border-gray-100">
          {Object.keys(emojiCategories).map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category
                ? 'bg-pastel-purple hover:bg-pastel-purple/90 text-xs px-2 h-7'
                : 'text-xs px-2 h-7'
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {/* 이모지 그리드 */}
        <div className="grid grid-cols-5 gap-2 py-2">
          {emojiCategories[selectedCategory as keyof typeof emojiCategories].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSelect(emoji)}
              className={`w-12 h-12 text-2xl rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center
                ${currentEmoji === emoji ? 'bg-pastel-purple/20 ring-2 ring-pastel-purple' : ''}
              `}
            >
              {emoji}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
