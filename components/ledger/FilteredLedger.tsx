'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, ChevronLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAssets } from '@/lib/hooks/useAssets'
import { useIncomeCategories, useExpenseCategories } from '@/lib/hooks/useCategories'
import { formatDateString } from '@/lib/utils/date'
import { formatCurrency, getEffectiveAmount } from '@/lib/utils/currency'
import type { Transaction, Transfer, Asset, IncomeCategory, ExpenseCategory } from '@/types/database'

interface LedgerEntry {
  id: string
  date: string
  sortOrder: number
  type: 'income' | 'expense' | 'transfer'
  data: Transaction | Transfer
}

interface FilteredLedgerProps {
  title: string
  transactions: Transaction[]
  transfers?: Transfer[]
  assetId?: string
}

export function FilteredLedger({ title, transactions, transfers = [], assetId }: FilteredLedgerProps) {
  const router = useRouter()
  const { data: assets = [] } = useAssets()
  const { data: incomeCategories = [] } = useIncomeCategories()
  const { data: expenseCategories = [] } = useExpenseCategories()

  const getAssetName = (id: string) => assets.find((a) => a.id === id)?.name || ''
  const getCategoryName = (id: string, type: 'income' | 'expense') => {
    const cats = type === 'income' ? incomeCategories : expenseCategories
    return cats.find((c) => c.id === id)?.name || ''
  }

  // 통합 엔트리 생성 및 날짜별 그룹핑
  const { entriesByDate, totalSummary } = useMemo(() => {
    const entries: LedgerEntry[] = [
      ...transactions.map((tx) => ({
        id: `tx-${tx.id}`,
        date: tx.transaction_date,
        sortOrder: tx.sort_order,
        type: tx.type as 'income' | 'expense',
        data: tx,
      })),
      ...transfers.map((tr) => ({
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

    // 합계 계산
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
      totalSummary: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
    }
  }, [transactions, transfers])

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

  const handleEntryClick = (entry: LedgerEntry) => {
    if (entry.type === 'transfer') {
      router.push(`/input/${entry.id.replace('tr-', '')}?type=transfer`)
    } else {
      router.push(`/input/${entry.id.replace('tx-', '')}?type=transaction`)
    }
  }

  const sortedDates = Object.keys(entriesByDate).sort((a, b) => b.localeCompare(a))

  const renderEntry = (entry: LedgerEntry) => {
    if (entry.type === 'transfer') {
      const transfer = entry.data as Transfer
      const isOutgoing = assetId === transfer.from_asset_id

      return (
        <div
          key={entry.id}
          onClick={() => handleEntryClick(entry)}
          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-transfer/50 cursor-pointer"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-transfer/30 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{getAssetName(transfer.from_asset_id)}</span>
              <span>→</span>
              <span>{getAssetName(transfer.to_asset_id)}</span>
            </div>
            {transfer.title && (
              <p className="text-gray-700 truncate">{transfer.title}</p>
            )}
          </div>
          <span className={isOutgoing ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
            {isOutgoing ? '-' : '+'}{formatCurrency(transfer.amount)}
          </span>
        </div>
      )
    }

    const transaction = entry.data as Transaction
    const effectiveAmount = getEffectiveAmount(transaction.amount, transaction.adjustment_amount)
    const isIncome = transaction.type === 'income'

    return (
      <div
        key={entry.id}
        onClick={() => handleEntryClick(entry)}
        className={`flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 cursor-pointer ${
          isIncome ? 'hover:border-income/50' : 'hover:border-expense/50'
        }`}
      >
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isIncome ? 'bg-income/30' : 'bg-expense/30'
        }`}>
          <span className={`text-xs font-medium ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
            {isIncome ? '+' : '-'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{getCategoryName(transaction.category_id, transaction.type)}</span>
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
            {isIncome ? '+' : '-'}{formatCurrency(effectiveAmount)}
          </span>
          {transaction.adjustment_amount > 0 && (
            <p className="text-xs text-gray-400">
              ({transaction.type === 'income' ? '공제' : '할인'} {formatCurrency(transaction.adjustment_amount)})
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-600">+{formatCurrency(totalSummary.income)}</span>
            <span className="text-red-600">-{formatCurrency(totalSummary.expense)}</span>
            <span className={totalSummary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}>
              {totalSummary.balance >= 0 ? '+' : ''}{formatCurrency(totalSummary.balance)}
            </span>
          </div>
        </div>
      </div>

      {/* 거래 목록 */}
      {sortedDates.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <p>거래가 없어요</p>
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
                  {formatDateString(date, 'yyyy.M.d (EEE)')}
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
              <div className="p-2 space-y-2">
                {dateEntries.map(renderEntry)}
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}
