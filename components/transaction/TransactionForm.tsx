'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon, Trash2, ArrowRight, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'

import { useAssets, useAssetCategories } from '@/lib/hooks/useAssets'
import { useIncomeCategories, useExpenseCategories } from '@/lib/hooks/useCategories'
import { useCurrencies } from '@/lib/hooks/useCurrencies'
import {
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useCreateTransfer,
  useUpdateTransfer,
  useDeleteTransfer,
  type TransactionFormData,
  type TransferFormData,
} from '@/lib/hooks/useTransactions'
import { toDateString, getKSTToday, fromDateString } from '@/lib/utils/date'
import { formatNumber, parseCurrency } from '@/lib/utils/currency'
import type { Transaction, Transfer } from '@/types/database'

type TransactionType = 'income' | 'expense' | 'transfer'

interface TransactionFormProps {
  transaction?: Transaction | null
  transfer?: Transfer | null
  defaultType?: TransactionType
}

export function TransactionForm({ transaction, transfer, defaultType = 'expense' }: TransactionFormProps) {
  const router = useRouter()
  const isEditing = !!transaction || !!transfer

  // 기본값 설정
  const getInitialType = (): TransactionType => {
    if (transaction) return transaction.type
    if (transfer) return 'transfer'
    return defaultType
  }

  const [type, setType] = useState<TransactionType>(getInitialType())
  const [date, setDate] = useState<Date>(() => {
    if (transaction) return fromDateString(transaction.transaction_date)
    if (transfer) return fromDateString(transfer.transfer_date)
    return getKSTToday()
  })
  const [showCalendar, setShowCalendar] = useState(false)

  const [assetId, setAssetId] = useState(transaction?.asset_id || '')
  const [categoryId, setCategoryId] = useState(transaction?.category_id || '')
  const [fromAssetId, setFromAssetId] = useState(transfer?.from_asset_id || '')
  const [toAssetId, setToAssetId] = useState(transfer?.to_asset_id || '')

  const [amountInput, setAmountInput] = useState(() => {
    // 보조화폐가 있으면 원본 금액을, 없으면 환산된 금액을 표시
    const amount = transaction?.original_amount ?? transaction?.amount ?? 0
    return amount > 0 ? formatNumber(amount) : ''
  })
  const [adjustmentInput, setAdjustmentInput] = useState(() => {
    const adj = transaction?.original_adjustment_amount ?? transaction?.adjustment_amount ?? 0
    return adj > 0 ? formatNumber(adj) : ''
  })
  const [adjustmentMemo, setAdjustmentMemo] = useState(transaction?.adjustment_memo || '')

  // 이체용 금액 상태 (from/to 각각)
  const [fromAmountInput, setFromAmountInput] = useState('')
  const [toAmountInput, setToAmountInput] = useState('')
  const [lastEditedSide, setLastEditedSide] = useState<'from' | 'to'>('from')

  // 이체 조정 필드
  const [fromAdjustmentInput, setFromAdjustmentInput] = useState('')
  const [fromAdjustmentIsPlus, setFromAdjustmentIsPlus] = useState(false)
  const [fromAdjustmentMemo, setFromAdjustmentMemo] = useState('')
  const [toAdjustmentInput, setToAdjustmentInput] = useState('')
  const [toAdjustmentIsPlus, setToAdjustmentIsPlus] = useState(true)
  const [toAdjustmentMemo, setToAdjustmentMemo] = useState('')
  const [title, setTitle] = useState(transaction?.title || transfer?.title || '')
  const [memo, setMemo] = useState(transaction?.memo || transfer?.memo || '')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 데이터 조회
  const { data: assets = [] } = useAssets()
  const { data: assetCategories = [] } = useAssetCategories()
  const { data: incomeCategories = [] } = useIncomeCategories()
  const { data: expenseCategories = [] } = useExpenseCategories()
  const { data: currencies = [] } = useCurrencies()

  // 선택된 자산의 통화 정보 가져오기
  const currencyInfo = useMemo(() => {
    const getAssetCurrency = (id: string) => {
      const asset = assets.find((a) => a.id === id)
      if (!asset?.currency_id) return { symbol: '원', rate: 1, id: null }
      const currency = currencies.find((c) => c.id === asset.currency_id)
      if (!currency) return { symbol: '원', rate: 1, id: null }
      return { symbol: currency.symbol, rate: currency.exchange_rate, id: currency.id }
    }

    // 수입/지출용
    const selectedInfo = assetId ? getAssetCurrency(assetId) : { symbol: '원', rate: 1, id: null }

    // 이체용
    const fromInfo = fromAssetId ? getAssetCurrency(fromAssetId) : { symbol: '원', rate: 1, id: null }
    const toInfo = toAssetId ? getAssetCurrency(toAssetId) : { symbol: '원', rate: 1, id: null }

    return {
      // 수입/지출용
      symbol: selectedInfo.symbol,
      exchangeRate: selectedInfo.rate > 1 ? selectedInfo.rate : null,
      currencyId: selectedInfo.id,
      // 이체용
      from: fromInfo,
      to: toInfo,
    }
  }, [assetId, fromAssetId, toAssetId, assets, currencies])

  const currencySymbol = currencyInfo.symbol

  // 기존 이체 데이터 로드
  useEffect(() => {
    if (transfer) {
      // 조정 필드
      setFromAdjustmentInput(transfer.from_adjustment_amount > 0 ? formatNumber(transfer.from_adjustment_amount) : '')
      setFromAdjustmentIsPlus(transfer.from_adjustment_is_plus)
      setFromAdjustmentMemo(transfer.from_adjustment_memo || '')
      setToAdjustmentInput(transfer.to_adjustment_amount > 0 ? formatNumber(transfer.to_adjustment_amount) : '')
      setToAdjustmentIsPlus(transfer.to_adjustment_is_plus)
      setToAdjustmentMemo(transfer.to_adjustment_memo || '')
    }
  }, [transfer])

  // 자산 선택이 완료된 후 이체 금액 초기화
  useEffect(() => {
    if (transfer && fromAssetId && toAssetId && currencyInfo.from && currencyInfo.to) {
      const krwAmount = transfer.amount

      // from 자산의 통화로 변환
      const fromAmount = currencyInfo.from.rate > 1
        ? Math.round(krwAmount / currencyInfo.from.rate)
        : krwAmount
      setFromAmountInput(fromAmount > 0 ? formatNumber(fromAmount) : '')

      // to 자산의 통화로 변환
      const toAmount = currencyInfo.to.rate > 1
        ? Math.round(krwAmount / currencyInfo.to.rate)
        : krwAmount
      setToAmountInput(toAmount > 0 ? formatNumber(toAmount) : '')
    }
  }, [transfer, fromAssetId, toAssetId, currencyInfo.from?.rate, currencyInfo.to?.rate])

  // 뮤테이션
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const createTransfer = useCreateTransfer()
  const updateTransfer = useUpdateTransfer()
  const deleteTransfer = useDeleteTransfer()

  const isLoading = createTransaction.isPending || updateTransaction.isPending ||
    createTransfer.isPending || updateTransfer.isPending

  // 두 자산의 통화가 다른지 확인 (환전 UI 표시 여부)
  const isDifferentCurrency = useMemo(() => {
    if (type !== 'transfer') return false
    if (!fromAssetId || !toAssetId) return false
    return currencyInfo.from.id !== currencyInfo.to.id ||
           currencyInfo.from.rate !== currencyInfo.to.rate
  }, [type, fromAssetId, toAssetId, currencyInfo.from, currencyInfo.to])

  // 자산 그룹핑
  const groupedAssets = assetCategories.map((cat) => ({
    ...cat,
    assets: assets.filter((a) => a.category_id === cat.id),
  })).filter((g) => g.assets.length > 0)

  const categories = type === 'income' ? incomeCategories : expenseCategories

  // 타입 변경 시 분류 초기화
  useEffect(() => {
    if (!isEditing) {
      setCategoryId('')
    }
  }, [type, isEditing])

  const handleAmountChange = (value: string) => {
    const num = parseCurrency(value)
    setAmountInput(num === 0 && value !== '0' ? '' : formatNumber(num))
  }

  const handleAdjustmentChange = (value: string) => {
    const num = parseCurrency(value)
    setAdjustmentInput(num === 0 && value !== '0' ? '' : formatNumber(num))
  }

  // 이체 금액 핸들러 (환율 자동 계산)
  const handleFromAmountChange = (value: string) => {
    const num = parseCurrency(value)
    setFromAmountInput(num === 0 && value !== '0' ? '' : formatNumber(num))
    setLastEditedSide('from')

    // from → to 변환
    if (num > 0 && currencyInfo.from && currencyInfo.to) {
      const krwAmount = num * currencyInfo.from.rate
      const toAmount = currencyInfo.to.rate > 1
        ? Math.round(krwAmount / currencyInfo.to.rate)
        : Math.round(krwAmount)
      setToAmountInput(formatNumber(toAmount))
    } else {
      setToAmountInput('')
    }
  }

  const handleToAmountChange = (value: string) => {
    const num = parseCurrency(value)
    setToAmountInput(num === 0 && value !== '0' ? '' : formatNumber(num))
    setLastEditedSide('to')

    // to → from 변환
    if (num > 0 && currencyInfo.from && currencyInfo.to) {
      const krwAmount = num * currencyInfo.to.rate
      const fromAmount = currencyInfo.from.rate > 1
        ? Math.round(krwAmount / currencyInfo.from.rate)
        : Math.round(krwAmount)
      setFromAmountInput(formatNumber(fromAmount))
    } else {
      setFromAmountInput('')
    }
  }

  const handleTransferAdjustmentChange = (
    value: string,
    setter: (v: string) => void
  ) => {
    const num = parseCurrency(value)
    setter(num === 0 && value !== '0' ? '' : formatNumber(num))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (type === 'transfer') {
      const fromAmount = parseCurrency(fromAmountInput)
      const toAmount = parseCurrency(toAmountInput)

      if (fromAmount <= 0 || toAmount <= 0) {
        toast.error('금액을 입력해주세요')
        return
      }
      if (!fromAssetId || !toAssetId) {
        toast.error('자산을 선택해주세요')
        return
      }
      if (fromAssetId === toAssetId) {
        toast.error('같은 자산으로 이체할 수 없습니다')
        return
      }

      // 기준 금액 결정 (마지막 수정된 쪽 기준)
      const krwAmount = lastEditedSide === 'from'
        ? Math.round(fromAmount * currencyInfo.from.rate)
        : Math.round(toAmount * currencyInfo.to.rate)

      const data: TransferFormData = {
        transferDate: toDateString(date),
        fromAssetId,
        toAssetId,
        amount: krwAmount,
        title: title || undefined,
        memo: memo || undefined,
        // 조정 정보
        fromAdjustmentAmount: parseCurrency(fromAdjustmentInput),
        fromAdjustmentIsPlus,
        fromAdjustmentMemo: fromAdjustmentMemo || undefined,
        toAdjustmentAmount: parseCurrency(toAdjustmentInput),
        toAdjustmentIsPlus,
        toAdjustmentMemo: toAdjustmentMemo || undefined,
      }

      if (transfer) {
        updateTransfer.mutate({ id: transfer.id, ...data }, {
          onSuccess: () => {
            toast.success('이체가 수정되었습니다')
            router.push('/ledger')
          },
          onError: () => toast.error('수정에 실패했습니다'),
        })
      } else {
        createTransfer.mutate(data, {
          onSuccess: () => {
            toast.success('이체가 등록되었습니다')
            router.push('/ledger')
          },
          onError: () => toast.error('등록에 실패했습니다'),
        })
      }
    } else {
      const amount = parseCurrency(amountInput)
      if (amount <= 0) {
        toast.error('금액을 입력해주세요')
        return
      }
      if (!assetId) {
        toast.error('자산을 선택해주세요')
        return
      }
      if (!categoryId) {
        toast.error('분류를 선택해주세요')
        return
      }
      if (!title.trim()) {
        toast.error('내용을 입력해주세요')
        return
      }

      // 보조화폐인 경우 원화로 환산
      const { exchangeRate, currencyId } = currencyInfo
      const adjustmentAmount = parseCurrency(adjustmentInput)
      const convertedAmount = exchangeRate ? Math.round(amount * exchangeRate) : amount
      const convertedAdjustment = exchangeRate ? Math.round(adjustmentAmount * exchangeRate) : adjustmentAmount

      const data: TransactionFormData = {
        type,
        transactionDate: toDateString(date),
        assetId,
        categoryId,
        amount: convertedAmount,
        adjustmentAmount: convertedAdjustment,
        adjustmentMemo: adjustmentMemo || undefined,
        title: title.trim(),
        memo: memo || undefined,
        // 보조화폐 정보
        originalAmount: exchangeRate ? amount : null,
        originalAdjustmentAmount: exchangeRate && adjustmentAmount > 0 ? adjustmentAmount : null,
        originalCurrencyId: currencyId,
        exchangeRate: exchangeRate,
      }

      if (transaction) {
        updateTransaction.mutate({ id: transaction.id, ...data }, {
          onSuccess: () => {
            toast.success('거래가 수정되었습니다')
            router.push('/ledger')
          },
          onError: () => toast.error('수정에 실패했습니다'),
        })
      } else {
        createTransaction.mutate(data, {
          onSuccess: () => {
            toast.success('거래가 등록되었습니다')
            // 입력 후 폼 초기화
            setAmountInput('')
            setAdjustmentInput('')
            setAdjustmentMemo('')
            setTitle('')
            setMemo('')
          },
          onError: () => toast.error('등록에 실패했습니다'),
        })
      }
    }
  }

  const handleDelete = () => {
    if (transaction) {
      deleteTransaction.mutate({ id: transaction.id }, {
        onSuccess: () => {
          toast.success('거래가 삭제되었습니다')
          router.push('/ledger')
        },
        onError: () => toast.error('삭제에 실패했습니다'),
      })
    } else if (transfer) {
      deleteTransfer.mutate({ id: transfer.id }, {
        onSuccess: () => {
          toast.success('이체가 삭제되었습니다')
          router.push('/ledger')
        },
        onError: () => toast.error('삭제에 실패했습니다'),
      })
    }
  }

  return (
    <div className="p-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 거래 타입 선택 */}
        <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="income"
              className="data-[state=active]:bg-income data-[state=active]:text-gray-800"
              disabled={isEditing && !!transfer}
            >
              수입
            </TabsTrigger>
            <TabsTrigger
              value="expense"
              className="data-[state=active]:bg-expense data-[state=active]:text-gray-800"
              disabled={isEditing && !!transfer}
            >
              지출
            </TabsTrigger>
            <TabsTrigger
              value="transfer"
              className="data-[state=active]:bg-transfer data-[state=active]:text-gray-800"
              disabled={isEditing && !!transaction}
            >
              이체
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 날짜 선택 */}
        <Card className="p-3">
          <button
            type="button"
            onClick={() => setShowCalendar(true)}
            className="flex items-center gap-2 w-full text-left"
          >
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <span className="font-medium">
              {format(date, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
            </span>
          </button>
        </Card>

        <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
          <DialogContent className="max-w-sm p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(d)
                  setShowCalendar(false)
                }
              }}
              locale={ko}
              className="rounded-lg"
            />
          </DialogContent>
        </Dialog>

        {/* 이체 UI */}
        {type === 'transfer' ? (
          <>
            <Card className="p-4 space-y-4">
              {/* 출금 (From) */}
              <div className="space-y-2">
                <Label className="text-red-600">출금</Label>
                <Select value={fromAssetId} onValueChange={setFromAssetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="출금 자산 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedAssets.map((group) => (
                      <div key={group.id}>
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                          {group.name}
                        </div>
                        {group.assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={fromAmountInput}
                    onChange={(e) => handleFromAmountChange(e.target.value)}
                    placeholder="0"
                    className="text-right text-lg font-medium flex-1"
                  />
                  <span className="text-gray-500 shrink-0">
                    {currencyInfo.from.symbol}
                  </span>
                </div>
              </div>

              {/* 화살표 */}
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              {/* 입금 (To) */}
              <div className="space-y-2">
                <Label className="text-green-600">입금</Label>
                <Select value={toAssetId} onValueChange={setToAssetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="입금 자산 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedAssets.map((group) => (
                      <div key={group.id}>
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                          {group.name}
                        </div>
                        {group.assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={toAmountInput}
                    onChange={(e) => handleToAmountChange(e.target.value)}
                    placeholder="0"
                    className="text-right text-lg font-medium flex-1"
                  />
                  <span className="text-gray-500 shrink-0">
                    {currencyInfo.to.symbol}
                  </span>
                </div>
              </div>
            </Card>

            {/* 조정 섹션 (통화가 다를 때만 표시) */}
            {isDifferentCurrency && (
              <Card className="p-4 space-y-4">
                <Label className="text-gray-600 text-sm">조정 (선택)</Label>

                {/* 출금 조정 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-12">출금</span>
                    <Button
                      type="button"
                      variant={fromAdjustmentIsPlus ? 'outline' : 'default'}
                      size="sm"
                      className={`w-8 h-8 p-0 ${!fromAdjustmentIsPlus ? 'bg-red-100 hover:bg-red-200 text-red-600' : ''}`}
                      onClick={() => setFromAdjustmentIsPlus(false)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={fromAdjustmentIsPlus ? 'default' : 'outline'}
                      size="sm"
                      className={`w-8 h-8 p-0 ${fromAdjustmentIsPlus ? 'bg-green-100 hover:bg-green-200 text-green-600' : ''}`}
                      onClick={() => setFromAdjustmentIsPlus(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={fromAdjustmentInput}
                      onChange={(e) => handleTransferAdjustmentChange(e.target.value, setFromAdjustmentInput)}
                      placeholder="0"
                      className="text-right flex-1"
                    />
                    <span className="text-gray-500 text-sm shrink-0">
                      {currencyInfo.from.symbol}
                    </span>
                  </div>
                  {parseCurrency(fromAdjustmentInput) > 0 && (
                    <Input
                      type="text"
                      value={fromAdjustmentMemo}
                      onChange={(e) => setFromAdjustmentMemo(e.target.value)}
                      placeholder="조정 사유 (예: 수수료)"
                      className="text-sm"
                    />
                  )}
                </div>

                {/* 입금 조정 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-12">입금</span>
                    <Button
                      type="button"
                      variant={toAdjustmentIsPlus ? 'outline' : 'default'}
                      size="sm"
                      className={`w-8 h-8 p-0 ${!toAdjustmentIsPlus ? 'bg-red-100 hover:bg-red-200 text-red-600' : ''}`}
                      onClick={() => setToAdjustmentIsPlus(false)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={toAdjustmentIsPlus ? 'default' : 'outline'}
                      size="sm"
                      className={`w-8 h-8 p-0 ${toAdjustmentIsPlus ? 'bg-green-100 hover:bg-green-200 text-green-600' : ''}`}
                      onClick={() => setToAdjustmentIsPlus(true)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={toAdjustmentInput}
                      onChange={(e) => handleTransferAdjustmentChange(e.target.value, setToAdjustmentInput)}
                      placeholder="0"
                      className="text-right flex-1"
                    />
                    <span className="text-gray-500 text-sm shrink-0">
                      {currencyInfo.to.symbol}
                    </span>
                  </div>
                  {parseCurrency(toAdjustmentInput) > 0 && (
                    <Input
                      type="text"
                      value={toAdjustmentMemo}
                      onChange={(e) => setToAdjustmentMemo(e.target.value)}
                      placeholder="조정 사유 (예: 보너스)"
                      className="text-sm"
                    />
                  )}
                </div>
              </Card>
            )}
          </>
        ) : (
          // 수입/지출 자산 선택
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>자산</Label>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {groupedAssets.map((group) => (
                    <div key={group.id}>
                      <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                        {group.name}
                      </div>
                      {group.assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>분류</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
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
          </div>
        )}

        {/* 금액 입력 (수입/지출만) */}
        {type !== 'transfer' && (
          <>
            <div className="space-y-2">
              <Label>금액</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={amountInput}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className="text-right text-lg font-medium flex-1"
                />
                <span className="text-gray-500 shrink-0">
                  {currencySymbol}
                </span>
              </div>
            </div>

            {/* 할인/공제 */}
            <div className="space-y-2">
              <Label>{type === 'income' ? '공제' : '할인'} (선택)</Label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={adjustmentInput}
                    onChange={(e) => handleAdjustmentChange(e.target.value)}
                    placeholder="0"
                    className="text-right"
                  />
                  <span className="text-gray-500 text-sm shrink-0">
                    {currencySymbol}
                  </span>
                </div>
                <Input
                  type="text"
                  value={adjustmentMemo}
                  onChange={(e) => setAdjustmentMemo(e.target.value)}
                  placeholder="메모"
                  className="flex-1"
                />
              </div>
            </div>
          </>
        )}

        {/* 내용 */}
        <div className="space-y-2">
          <Label>{type === 'transfer' ? '내용 (선택)' : '내용'}</Label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'transfer' ? '이체 내용' : '거래 내용'}
          />
        </div>

        {/* 메모 */}
        <div className="space-y-2">
          <Label>메모 (선택)</Label>
          <Textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모를 입력하세요"
            rows={2}
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-4">
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-pastel-purple hover:bg-pastel-purple/80 text-gray-800"
          >
            {isLoading ? '저장 중...' : isEditing ? '수정' : '저장'}
          </Button>
        </div>
      </form>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>삭제 확인</DialogTitle>
            <DialogDescription>
              이 {type === 'transfer' ? '이체' : '거래'}를 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
