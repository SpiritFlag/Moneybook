'use client'

import { useState } from 'react'
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
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, Plus, GripVertical, ChevronRight, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryForm } from '@/components/category/CategoryForm'
import {
  useIncomeCategories,
  useExpenseCategories,
  useCreateIncomeCategory,
  useCreateExpenseCategory,
  useUpdateIncomeCategory,
  useUpdateExpenseCategory,
  useDeleteIncomeCategory,
  useDeleteExpenseCategory,
  useReorderIncomeCategories,
  useReorderExpenseCategories,
} from '@/lib/hooks/useCategories'
import type { IncomeCategory, ExpenseCategory } from '@/types/database'

type Category = IncomeCategory | ExpenseCategory

interface SortableCategoryItemProps {
  category: Category
  type: 'income' | 'expense'
  onEdit: () => void
  onClick: () => void
}

function SortableCategoryItem({ category, type, onEdit, onClick }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const bgColor = type === 'income' ? 'hover:border-income/50' : 'hover:border-expense/50'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100 ${bgColor} transition-colors`}
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
        className="flex-1 flex items-center gap-2 text-left"
      >
        <span className="text-xl">{category.emoji}</span>
        <span className="font-medium text-gray-700">{category.name}</span>
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
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </div>
  )
}

export default function SettingsCategoriesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const { data: incomeCategories = [], isLoading: incomeLoading } = useIncomeCategories()
  const { data: expenseCategories = [], isLoading: expenseLoading } = useExpenseCategories()

  const createIncome = useCreateIncomeCategory()
  const createExpense = useCreateExpenseCategory()
  const updateIncome = useUpdateIncomeCategory()
  const updateExpense = useUpdateExpenseCategory()
  const deleteIncome = useDeleteIncomeCategory()
  const deleteExpense = useDeleteExpenseCategory()
  const reorderIncome = useReorderIncomeCategories()
  const reorderExpense = useReorderExpenseCategories()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 1000, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent, type: 'income' | 'expense') => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const categories = type === 'income' ? incomeCategories : expenseCategories
    const reorder = type === 'income' ? reorderIncome : reorderExpense

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)

    const newOrder = arrayMove(categories, oldIndex, newIndex)
    const updates = newOrder.map((cat, index) => ({
      id: cat.id,
      sort_order: index,
    }))

    reorder.mutate(updates)
  }

  const handleCreate = (data: { name: string; emoji: string }) => {
    const mutation = activeTab === 'income' ? createIncome : createExpense
    mutation.mutate(data, {
      onSuccess: () => toast.success('분류가 추가되었습니다'),
      onError: () => toast.error('추가에 실패했습니다'),
    })
  }

  const handleUpdate = (data: { name: string; emoji: string }) => {
    if (!editingCategory) return
    const mutation = activeTab === 'income' ? updateIncome : updateExpense
    mutation.mutate({ id: editingCategory.id, ...data }, {
      onSuccess: () => toast.success('수정되었습니다'),
      onError: () => toast.error('수정에 실패했습니다'),
    })
  }

  const handleDelete = (replacementId: string) => {
    if (!editingCategory) return
    const mutation = activeTab === 'income' ? deleteIncome : deleteExpense
    mutation.mutate({ id: editingCategory.id, replacementId }, {
      onSuccess: () => toast.success('삭제되었습니다'),
      onError: () => toast.error('삭제에 실패했습니다'),
    })
  }

  const isLoading = incomeLoading || expenseLoading

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const currentCategories = activeTab === 'income' ? incomeCategories : expenseCategories

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
          <h2 className="text-lg font-semibold text-gray-800">분류 관리</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingCategory(null)
            setFormOpen(true)
          }}
          className="text-pastel-purple border-pastel-purple hover:bg-pastel-purple/10"
        >
          <Plus className="w-4 h-4 mr-1" />
          분류 추가
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'income' | 'expense')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="income"
            className="data-[state=active]:bg-income data-[state=active]:text-gray-800"
          >
            수입 분류
          </TabsTrigger>
          <TabsTrigger
            value="expense"
            className="data-[state=active]:bg-expense data-[state=active]:text-gray-800"
          >
            지출 분류
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="mt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, 'income')}
          >
            <Card className="p-2">
              {incomeCategories.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  수입 분류가 없습니다
                </p>
              ) : (
                <SortableContext
                  items={incomeCategories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {incomeCategories.map((category) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        type="income"
                        onEdit={() => {
                          setEditingCategory(category)
                          setFormOpen(true)
                        }}
                        onClick={() => router.push(`/settings/categories/income/${category.id}`)}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </Card>
          </DndContext>
        </TabsContent>

        <TabsContent value="expense" className="mt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, 'expense')}
          >
            <Card className="p-2">
              {expenseCategories.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  지출 분류가 없습니다
                </p>
              ) : (
                <SortableContext
                  items={expenseCategories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {expenseCategories.map((category) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        type="expense"
                        onEdit={() => {
                          setEditingCategory(category)
                          setFormOpen(true)
                        }}
                        onClick={() => router.push(`/settings/categories/expense/${category.id}`)}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </Card>
          </DndContext>
        </TabsContent>
      </Tabs>

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        allCategories={currentCategories}
        type={activeTab}
        onSubmit={editingCategory ? handleUpdate : handleCreate}
        onDelete={editingCategory ? handleDelete : undefined}
      />
    </div>
  )
}
