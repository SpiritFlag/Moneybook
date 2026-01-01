'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ArrowRightLeft, X } from 'lucide-react'
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

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTransactions, useTransfers, useReorderTransactions, useReorderTransfers } from '@/lib/hooks/useTransactions'
import { useAssets } from '@/lib/hooks/useAssets'
import { useIncomeCategories, useExpenseCategories } from '@/lib/hooks/useCategories'
import { useCurrencies } from '@/lib/hooks/useCurrencies'
import { getCurrentYearMonth, getPreviousMonth, getNextMonth, formatDateString } from '@/lib/utils/date'
import { formatCurrency, getEffectiveAmount } from '@/lib/utils/currency'
import type { Transaction, Transfer, Asset, IncomeCategory, ExpenseCategory, Currency } from '@/types/database'

interface LedgerEntry {
  id: string
  date: string
  sortOrder: number
  type: 'income' | 'expense' | 'transfer'
  data: Transaction | Transfer
}

interface SortableEntryProps {
  entry: LedgerEntry
  assets: Asset[]
  currencies: Currency[]
  incomeCategories: IncomeCategory[]
  expenseCategories: ExpenseCategory[]
  onClick: () => void
}

function SortableEntry({ entry, assets, currencies, incomeCategories, expenseCategories, onClick }: SortableEntryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'manipulation',
  }

  // 드래그 중이면 클릭 무시
  const handleClick = () => {
    if (!isDragging) {
      onClick()
    }
  }

  const getAssetName = (id: string) => assets.find((a) => a.id === id)?.name || ''
  const getCategory = (id: string, type: 'income' | 'expense') => {
    const cats = type === 'income' ? incomeCategories : expenseCategories
    return cats.find((c) => c.id === id)
  }
  // 보조화폐가 있는 경우 원본 금액 + 환산 금액 표시
  const formatAmountWithOriginal = (
    amount: number,
    originalAmount: number | null,
    originalCurrencyId: string | null
  ) => {
    if (originalAmount && originalCurrencyId) {
      const currency = currencies.find((c) => c.id === originalCurrencyId)
      if (currency) {
        return {
          main: `${originalAmount.toLocaleString()} ${currency.symbol}`,
          sub: `≈${formatCurrency(amount)}`,
        }
      }
    }
    return { main: formatCurrency(amount), sub: null }
  }

  if (entry.type === 'transfer') {
    const transfer = entry.data as Transfer
    const amountDisplay = formatAmountWithOriginal(
      transfer.amount,
      transfer.original_amount,
      transfer.original_currency_id
    )

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-transfer/50 cursor-pointer"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-transfer/30 flex items-center justify-center">
          <ArrowRightLeft className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{getAssetName(transfer.from_asset_id)}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{getAssetName(transfer.to_asset_id)}</span>
          </div>
          {transfer.title && (
            <p className="text-gray-700 truncate">{transfer.title}</p>
          )}
        </div>
        <div className="text-right">
          <span className="text-gray-600 font-medium">{amountDisplay.main}</span>
          {amountDisplay.sub && (
            <p className="text-xs text-gray-400">{amountDisplay.sub}</p>
          )}
        </div>
      </div>
    )
  }

  const transaction = entry.data as Transaction
  const effectiveAmount = getEffectiveAmount(transaction.amount, transaction.adjustment_amount)
  const originalEffectiveAmount = transaction.original_amount
    ? getEffectiveAmount(transaction.original_amount, transaction.original_adjustment_amount || 0)
    : null
  const isIncome = transaction.type === 'income'
  const category = getCategory(transaction.category_id, transaction.type)

  const amountDisplay = formatAmountWithOriginal(
    effectiveAmount,
    originalEffectiveAmount,
    transaction.original_currency_id
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 cursor-pointer ${
        isIncome ? 'hover:border-income/50' : 'hover:border-expense/50'
      }`}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xl">
        {category?.emoji || (isIncome ? '💰' : '📦')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{category?.name || ''}</span>
          <span className="text-gray-300">|</span>
          <span>{getAssetName(transaction.asset_id)}</span>
        </div>
        <p className="text-gray-700 truncate">{transaction.title}</p>
        {transaction.memo && (
          <p className="text-xs text-gray-400 truncate">{transaction.memo}</p>
        )}
      </div>
      <div className="text-right">
        <span className={`font-medium ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
          {isIncome ? '+' : '-'}{amountDisplay.main}
        </span>
        {amountDisplay.sub && (
          <p className="text-xs text-gray-400">{amountDisplay.sub}</p>
        )}
        {transaction.adjustment_amount > 0 && transaction.original_adjustment_amount && (
          <p className="text-xs text-gray-400">
            ({transaction.type === 'income' ? '공제' : '할인'} {transaction.original_adjustment_amount.toLocaleString()})
          </p>
        )}
        {transaction.adjustment_amount > 0 && !transaction.original_adjustment_amount && (
          <p className="text-xs text-gray-400">
            ({transaction.type === 'income' ? '공제' : '할인'} {formatCurrency(transaction.adjustment_amount)})
          </p>
        )}
      </div>
    </div>
  )
}

function LedgerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterType = searchParams.get('type') as 'income' | 'expense' | null
  const filterCategoryId = searchParams.get('category')

  const { year: currentYear, month: currentMonth } = getCurrentYearMonth()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)

  const { data: transactions = [], isLoading: txLoading } = useTransactions(year, month)
  const { data: transfers = [], isLoading: trLoading } = useTransfers(year, month)
  const { data: assets = [] } = useAssets()
  const { data: incomeCategories = [] } = useIncomeCategories()
  const { data: expenseCategories = [] } = useExpenseCategories()
  const { data: currencies = [] } = useCurrencies()

  // 필터링된 분류 정보
  const filterCategory = useMemo(() => {
    if (!filterCategoryId) return null
    if (filterType === 'income') {
      return incomeCategories.find((c) => c.id === filterCategoryId)
    }
    return expenseCategories.find((c) => c.id === filterCategoryId)
  }, [filterCategoryId, filterType, incomeCategories, expenseCategories])

  const clearFilter = () => {
    router.push('/ledger')
  }

  const reorderTransactions = useReorderTransactions()
  const reorderTransfers = useReorderTransfers()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 1000, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // 통합 엔트리 생성 및 날짜별 그룹핑
  const { entriesByDate, monthSummary } = useMemo(() => {
    // 필터링 적용
    let filteredTransactions = transactions
    if (filterCategoryId && filterType) {
      filteredTransactions = transactions.filter((tx) =>
        tx.type === filterType && tx.category_id === filterCategoryId
      )
    }

    // 필터 적용시 이체는 제외
    const filteredTransfers = filterCategoryId ? [] : transfers

    const entries: LedgerEntry[] = [
      ...filteredTransactions.map((tx) => ({
        id: `tx-${tx.id}`,
        date: tx.transaction_date,
        sortOrder: tx.sort_order,
        type: tx.type as 'income' | 'expense',
        data: tx,
      })),
      ...filteredTransfers.map((tr) => ({
        id: `tr-${tr.id}`,
        date: tr.transfer_date,
        sortOrder: tr.sort_order,
        type: 'transfer' as const,
        data: tr,
      })),
    ]

    // 날짜별 그룹핑
    const grouped: Record<string, LedgerEntry[]> = {}
    entries.forEach((entry) => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = []
      }
      grouped[entry.date].push(entry)
    })

    // 각 날짜 내에서 sort_order로 정렬
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.sortOrder - b.sortOrder)
    })

    // 월별 합계 계산
    let totalIncome = 0
    let totalExpense = 0
    transactions.forEach((tx) => {
      const effective = getEffectiveAmount(tx.amount, tx.adjustment_amount)
      if (tx.type === 'income') {
        totalIncome += effective
      } else {
        totalExpense += effective
      }
    })

    return {
      entriesByDate: grouped,
      monthSummary: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
    }
  }, [transactions, transfers, filterCategoryId, filterType])

  // 날짜별 합계 계산
  const getDailySummary = (dateEntries: LedgerEntry[]) => {
    let income = 0
    let expense = 0
    dateEntries.forEach((entry) => {
      if (entry.type === 'income') {
        const tx = entry.data as Transaction
        income += getEffectiveAmount(tx.amount, tx.adjustment_amount)
      } else if (entry.type === 'expense') {
        const tx = entry.data as Transaction
        expense += getEffectiveAmount(tx.amount, tx.adjustment_amount)
      }
    })
    return { income, expense, balance: income - expense }
  }

  const handlePrevMonth = () => {
    const prev = getPreviousMonth(year, month)
    setYear(prev.year)
    setMonth(prev.month)
  }

  const handleNextMonth = () => {
    const next = getNextMonth(year, month)
    setYear(next.year)
    setMonth(next.month)
  }

  const handleDragEnd = (event: DragEndEvent, date: string) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const entries = entriesByDate[date]
    const oldIndex = entries.findIndex((e) => e.id === active.id)
    const newIndex = entries.findIndex((e) => e.id === over.id)

    const newOrder = arrayMove(entries, oldIndex, newIndex)

    // 거래와 이체 분리해서 순서 업데이트
    const txUpdates: { id: string; sort_order: number }[] = []
    const trUpdates: { id: string; sort_order: number }[] = []

    newOrder.forEach((entry, index) => {
      if (entry.id.startsWith('tx-')) {
        txUpdates.push({ id: entry.id.replace('tx-', ''), sort_order: index })
      } else {
        trUpdates.push({ id: entry.id.replace('tr-', ''), sort_order: index })
      }
    })

    if (txUpdates.length > 0) {
      reorderTransactions.mutate(txUpdates)
    }
    if (trUpdates.length > 0) {
      reorderTransfers.mutate(trUpdates)
    }
  }

  const handleEntryClick = (entry: LedgerEntry) => {
    if (entry.type === 'transfer') {
      router.push(`/input/${entry.id.replace('tr-', '')}?type=transfer`)
    } else {
      router.push(`/input/${entry.id.replace('tx-', '')}?type=transaction`)
    }
  }

  const isLoading = txLoading || trLoading
  const sortedDates = Object.keys(entriesByDate).sort((a, b) => b.localeCompare(a))

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

  return (
    <div className="p-4 space-y-4">
      {/* 필터 표시 */}
      {filterCategory && (
        <div className="flex items-center gap-2 px-3 py-2 bg-pastel-purple/20 rounded-lg">
          <span className="text-xl">{filterCategory.emoji}</span>
          <span className="font-medium text-gray-700">{filterCategory.name}</span>
          <span className="text-sm text-gray-500">
            ({filterType === 'income' ? '수입' : '지출'})
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="ml-auto h-7 px-2"
          >
            <X className="w-4 h-4" />
            필터 해제
          </Button>
        </div>
      )}

      {/* 월 선택 헤더 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">{year}년 {month}월</h2>
            <div className="flex items-center justify-center gap-4 text-sm mt-1">
              <span className="text-green-600">+{formatCurrency(monthSummary.income)}</span>
              <span className="text-red-600">-{formatCurrency(monthSummary.expense)}</span>
              <span className={monthSummary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}>
                {monthSummary.balance >= 0 ? '+' : ''}{formatCurrency(monthSummary.balance)}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* 거래 목록 */}
      {sortedDates.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <p>이 달에는 거래가 없어요</p>
          <p className="text-sm mt-1">입력 메뉴에서 거래를 추가해보세요</p>
        </Card>
      ) : (
        sortedDates.map((date) => {
          const dateEntries = entriesByDate[date]
          const dailySummary = getDailySummary(dateEntries)

          return (
            <Card key={date} className="overflow-hidden">
              {/* 날짜 헤더 */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="font-medium text-gray-700">
                  {formatDateString(date, 'M월 d일 (EEE)')}
                </span>
                <div className="flex items-center gap-3 text-sm">
                  {dailySummary.income > 0 && (
                    <span className="text-green-600">+{formatCurrency(dailySummary.income)}</span>
                  )}
                  {dailySummary.expense > 0 && (
                    <span className="text-red-600">-{formatCurrency(dailySummary.expense)}</span>
                  )}
                </div>
              </div>

              {/* 거래 목록 */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, date)}
              >
                <SortableContext
                  items={dateEntries.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="p-2 space-y-2">
                    {dateEntries.map((entry) => (
                      <SortableEntry
                        key={entry.id}
                        entry={entry}
                        assets={assets}
                        currencies={currencies}
                        incomeCategories={incomeCategories}
                        expenseCategories={expenseCategories}
                        onClick={() => handleEntryClick(entry)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </Card>
          )
        })
      )}
    </div>
  )
}

export default function LedgerPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 space-y-4">
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      }
    >
      <LedgerContent />
    </Suspense>
  )
}
