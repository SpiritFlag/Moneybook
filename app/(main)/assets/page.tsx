'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, ChevronRight, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AssetForm } from '@/components/asset/AssetForm'
import { AssetCategoryForm } from '@/components/asset/AssetCategoryForm'
import {
  useAssetCategories,
  useAssetsWithBalance,
  useCreateAssetCategory,
  useUpdateAssetCategory,
  useDeleteAssetCategory,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useReorderAssets,
} from '@/lib/hooks/useAssets'
import { formatCurrency } from '@/lib/utils/currency'
import { useCurrencies } from '@/lib/hooks/useCurrencies'
import type { AssetCategory, Asset, Currency } from '@/types/database'

type AssetWithBalance = Asset & { current_balance: number }

interface SortableAssetItemProps {
  asset: AssetWithBalance
  currencies: Currency[]
  onEdit: () => void
  onClick: () => void
}

function SortableAssetItem({ asset, currencies, onEdit, onClick }: SortableAssetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const currency = currencies.find((c) => c.id === asset.currency_id)
  const krwAmount = currency ? Math.round(asset.current_balance * currency.exchange_rate) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100 hover:border-pastel-purple/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <button
        onClick={onClick}
        className="flex-1 flex items-center justify-between text-left"
      >
        <span className="font-medium text-gray-700">{asset.name}</span>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className={asset.current_balance >= 0 ? 'text-gray-800' : 'text-red-500'}>
              {currency
                ? `${asset.current_balance.toLocaleString()} ${currency.symbol}`
                : formatCurrency(asset.current_balance)
              }
            </span>
            {krwAmount !== null && (
              <p className="text-xs text-gray-400">≈{formatCurrency(krwAmount)}</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        className="p-1 text-gray-400 hover:text-gray-600"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function AssetsPage() {
  const router = useRouter()
  const { data: categories = [], isLoading: categoriesLoading } = useAssetCategories()
  const { data: currencies = [] } = useCurrencies()
  const { data: assets = [], isLoading: assetsLoading } = useAssetsWithBalance()

  const [categoryFormOpen, setCategoryFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null)
  const [assetFormOpen, setAssetFormOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<AssetWithBalance | null>(null)
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const createCategory = useCreateAssetCategory()
  const updateCategory = useUpdateAssetCategory()
  const deleteCategory = useDeleteAssetCategory()
  const createAsset = useCreateAsset()
  const updateAsset = useUpdateAsset()
  const deleteAsset = useDeleteAsset()
  const reorderAssets = useReorderAssets()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 1000, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // 카테고리별 자산 그룹핑
  const assetsByCategory = useMemo(() => {
    const grouped: Record<string, AssetWithBalance[]> = {}
    categories.forEach((cat) => {
      grouped[cat.id] = assets
        .filter((a) => a.category_id === cat.id)
        .sort((a, b) => a.sort_order - b.sort_order)
    })
    return grouped
  }, [categories, assets])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // 다른 카테고리로 이동 처리는 여기서
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const activeAsset = assets.find((a) => a.id === active.id)
    const overAsset = assets.find((a) => a.id === over.id)

    if (!activeAsset || !overAsset) return

    // 같은 카테고리 내 순서 변경
    if (activeAsset.category_id === overAsset.category_id) {
      const categoryAssets = assetsByCategory[activeAsset.category_id]
      const oldIndex = categoryAssets.findIndex((a) => a.id === active.id)
      const newIndex = categoryAssets.findIndex((a) => a.id === over.id)

      const newOrder = arrayMove(categoryAssets, oldIndex, newIndex)
      const updates = newOrder.map((asset, index) => ({
        id: asset.id,
        sort_order: index,
      }))

      reorderAssets.mutate(updates)
    } else {
      // 다른 카테고리로 이동
      const updates = [{
        id: activeAsset.id,
        sort_order: overAsset.sort_order,
        category_id: overAsset.category_id,
      }]

      reorderAssets.mutate(updates, {
        onSuccess: () => toast.success('자산이 이동되었습니다'),
      })
    }
  }

  const handleCreateCategory = (name: string) => {
    createCategory.mutate({ name }, {
      onSuccess: () => toast.success('자산 분류가 추가되었습니다'),
      onError: () => toast.error('추가에 실패했습니다'),
    })
  }

  const handleUpdateCategory = (name: string) => {
    if (!editingCategory) return
    updateCategory.mutate({ id: editingCategory.id, name }, {
      onSuccess: () => toast.success('수정되었습니다'),
      onError: () => toast.error('수정에 실패했습니다'),
    })
  }

  const handleDeleteCategory = () => {
    if (!editingCategory) return
    deleteCategory.mutate({ id: editingCategory.id }, {
      onSuccess: () => toast.success('삭제되었습니다'),
      onError: (error) => toast.error(error.message),
    })
  }

  const handleCreateAsset = (data: { name: string; initialBalance: number; categoryId: string; currencyId: string | null }) => {
    createAsset.mutate({
      categoryId: data.categoryId,
      name: data.name,
      initialBalance: data.initialBalance,
      currencyId: data.currencyId,
    }, {
      onSuccess: () => toast.success('자산이 추가되었습니다'),
      onError: () => toast.error('추가에 실패했습니다'),
    })
  }

  const handleUpdateAsset = (data: { name: string; initialBalance: number; categoryId: string; currencyId: string | null }) => {
    if (!editingAsset) return
    updateAsset.mutate({
      id: editingAsset.id,
      name: data.name,
      initialBalance: data.initialBalance,
      categoryId: data.categoryId,
      currencyId: data.currencyId,
    }, {
      onSuccess: () => toast.success('수정되었습니다'),
      onError: () => toast.error('수정에 실패했습니다'),
    })
  }

  const handleDeleteAsset = () => {
    if (!editingAsset) return
    deleteAsset.mutate({ id: editingAsset.id }, {
      onSuccess: () => toast.success('삭제되었습니다'),
      onError: () => toast.error('삭제에 실패했습니다'),
    })
  }

  const isLoading = categoriesLoading || assetsLoading

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">자산 관리</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingCategory(null)
            setCategoryFormOpen(true)
          }}
          className="text-pastel-purple border-pastel-purple hover:bg-pastel-purple/10"
        >
          <Plus className="w-4 h-4 mr-1" />
          분류 추가
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {categories.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p>아직 자산 분류가 없어요</p>
            <p className="text-sm mt-1">분류를 추가해서 자산을 관리해보세요</p>
          </Card>
        ) : (
          categories.map((category) => {
            const categoryAssets = assetsByCategory[category.id] || []
            const hasAssets = categoryAssets.length > 0

            return (
              <Card key={category.id} className="overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100">
                  <h3 className="font-medium text-gray-700">{category.name}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingCategory(category)
                        setCategoryFormOpen(true)
                      }}
                      className="h-8 px-2 text-gray-500"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDefaultCategoryId(category.id)
                        setEditingAsset(null)
                        setAssetFormOpen(true)
                      }}
                      className="h-8 px-2 text-pastel-purple"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-2 space-y-2">
                  {categoryAssets.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-4">
                      자산이 없습니다
                    </p>
                  ) : (
                    <SortableContext
                      items={categoryAssets.map((a) => a.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {categoryAssets.map((asset) => (
                        <SortableAssetItem
                          key={asset.id}
                          asset={asset}
                          currencies={currencies}
                          onEdit={() => {
                            setEditingAsset(asset)
                            setAssetFormOpen(true)
                          }}
                          onClick={() => router.push(`/assets/${asset.id}`)}
                        />
                      ))}
                    </SortableContext>
                  )}
                </div>
              </Card>
            )
          })
        )}
      </DndContext>

      <AssetCategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        category={editingCategory}
        onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
        onDelete={editingCategory ? handleDeleteCategory : undefined}
        canDelete={editingCategory ? !(assetsByCategory[editingCategory.id]?.length > 0) : true}
      />

      <AssetForm
        open={assetFormOpen}
        onOpenChange={setAssetFormOpen}
        asset={editingAsset}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        onSubmit={editingAsset ? handleUpdateAsset : handleCreateAsset}
        onDelete={editingAsset ? handleDeleteAsset : undefined}
      />
    </div>
  )
}
