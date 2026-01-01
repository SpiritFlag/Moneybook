'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getMonthRange } from '@/lib/utils/date'
import type { Transaction, Transfer, Asset, IncomeCategory, ExpenseCategory } from '@/types/database'

export interface TransactionFormData {
  type: 'income' | 'expense'
  transactionDate: string
  assetId: string
  categoryId: string
  amount: number
  adjustmentAmount?: number
  adjustmentMemo?: string
  title: string
  memo?: string
}

export interface TransferFormData {
  transferDate: string
  fromAssetId: string
  toAssetId: string
  amount: number
  title?: string
  memo?: string
}

export function useTransactions(year: number, month: number) {
  const supabase = createClient()
  const { start, end } = getMonthRange(year, month)

  return useQuery({
    queryKey: ['transactions', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', start)
        .lte('transaction_date', end)
        .order('transaction_date', { ascending: false })
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as Transaction[]
    },
  })
}

export function useTransfers(year: number, month: number) {
  const supabase = createClient()
  const { start, end } = getMonthRange(year, month)

  return useQuery({
    queryKey: ['transfers', year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .gte('transfer_date', start)
        .lte('transfer_date', end)
        .order('transfer_date', { ascending: false })
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as Transfer[]
    },
  })
}

export function useTransaction(id: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Transaction
    },
    enabled: !!id,
  })
}

export function useTransfer(id: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['transfer', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Transfer
    },
    enabled: !!id,
  })
}

export function useCreateTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 같은 날짜의 최대 sort_order 조회
      const { data: existing } = await supabase
        .from('transactions')
        .select('sort_order')
        .eq('transaction_date', data.transactionDate)
        .order('sort_order', { ascending: false })
        .limit(1)

      const existingData = existing as { sort_order: number }[] | null
      const nextOrder = existingData && existingData.length > 0 ? existingData[0].sort_order + 1 : 0

      const { data: result, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: data.type,
          transaction_date: data.transactionDate,
          asset_id: data.assetId,
          category_id: data.categoryId,
          amount: data.amount,
          adjustment_amount: data.adjustmentAmount || 0,
          adjustment_memo: data.adjustmentMemo || null,
          title: data.title,
          memo: data.memo || null,
          sort_order: nextOrder,
        })
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['assets-with-balance'] })
    },
  })
}

export function useUpdateTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: TransactionFormData & { id: string }) => {
      const { data: result, error } = await supabase
        .from('transactions')
        .update({
          type: data.type,
          transaction_date: data.transactionDate,
          asset_id: data.assetId,
          category_id: data.categoryId,
          amount: data.amount,
          adjustment_amount: data.adjustmentAmount || 0,
          adjustment_memo: data.adjustmentMemo || null,
          title: data.title,
          memo: data.memo || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction'] })
      queryClient.invalidateQueries({ queryKey: ['assets-with-balance'] })
    },
  })
}

export function useDeleteTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['assets-with-balance'] })
    },
  })
}

export function useCreateTransfer() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TransferFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 같은 날짜의 최대 sort_order 조회
      const { data: existing } = await supabase
        .from('transfers')
        .select('sort_order')
        .eq('transfer_date', data.transferDate)
        .order('sort_order', { ascending: false })
        .limit(1)

      const existingData = existing as { sort_order: number }[] | null
      const nextOrder = existingData && existingData.length > 0 ? existingData[0].sort_order + 1 : 0

      const { data: result, error } = await supabase
        .from('transfers')
        .insert({
          user_id: user.id,
          transfer_date: data.transferDate,
          from_asset_id: data.fromAssetId,
          to_asset_id: data.toAssetId,
          amount: data.amount,
          title: data.title || null,
          memo: data.memo || null,
          sort_order: nextOrder,
        })
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['assets-with-balance'] })
    },
  })
}

export function useUpdateTransfer() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: TransferFormData & { id: string }) => {
      const { data: result, error } = await supabase
        .from('transfers')
        .update({
          transfer_date: data.transferDate,
          from_asset_id: data.fromAssetId,
          to_asset_id: data.toAssetId,
          amount: data.amount,
          title: data.title || null,
          memo: data.memo || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['transfer'] })
      queryClient.invalidateQueries({ queryKey: ['assets-with-balance'] })
    },
  })
}

export function useDeleteTransfer() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('transfers')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['assets-with-balance'] })
    },
  })
}

export function useReorderTransactions() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transactions: { id: string; sort_order: number }[]) => {
      const updates = transactions.map((tx) =>
        supabase
          .from('transactions')
          .update({ sort_order: tx.sort_order, updated_at: new Date().toISOString() })
          .eq('id', tx.id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useReorderTransfers() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transfers: { id: string; sort_order: number }[]) => {
      const updates = transfers.map((tr) =>
        supabase
          .from('transfers')
          .update({ sort_order: tr.sort_order, updated_at: new Date().toISOString() })
          .eq('id', tr.id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
    },
  })
}
