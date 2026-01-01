'use client'

import { use } from 'react'
import { useIncomeCategories, useExpenseCategories } from '@/lib/hooks/useCategories'
import { useTransactionsByCategory } from '@/lib/hooks/useFilteredTransactions'
import { FilteredLedger } from '@/components/ledger/FilteredLedger'

interface CategoryDetailPageProps {
  params: Promise<{ type: string; id: string }>
}

export default function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { type, id } = use(params)
  const categoryType = type as 'income' | 'expense'

  const { data: incomeCategories = [] } = useIncomeCategories()
  const { data: expenseCategories = [] } = useExpenseCategories()
  const { data: transactions = [], isLoading } = useTransactionsByCategory(id, categoryType)

  const categories = categoryType === 'income' ? incomeCategories : expenseCategories
  const category = categories.find((c) => c.id === id)

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!category) {
    return (
      <div className="p-4 text-center text-gray-500">
        분류를 찾을 수 없어요
      </div>
    )
  }

  const typeLabel = categoryType === 'income' ? '수입' : '지출'
  const title = `${category.name} (${typeLabel})`

  return (
    <FilteredLedger
      title={title}
      transactions={transactions}
    />
  )
}
