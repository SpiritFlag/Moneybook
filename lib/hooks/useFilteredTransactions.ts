'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Transaction, Transfer } from '@/types/database'

export function useTransactionsByAsset(assetId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['transactions-by-asset', assetId],
    queryFn: async () => {
      if (!assetId) return { transactions: [], transfers: [] }

      // 해당 자산의 거래
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('asset_id', assetId)
        .order('transaction_date', { ascending: false })
        .order('sort_order', { ascending: true })

      if (txError) throw txError

      // 해당 자산 관련 이체 (출금 또는 입금)
      const { data: transfers, error: trError } = await supabase
        .from('transfers')
        .select('*')
        .or(`from_asset_id.eq.${assetId},to_asset_id.eq.${assetId}`)
        .order('transfer_date', { ascending: false })
        .order('sort_order', { ascending: true })

      if (trError) throw trError

      return {
        transactions: transactions as Transaction[],
        transfers: transfers as Transfer[],
      }
    },
    enabled: !!assetId,
  })
}

export function useTransactionsByCategory(categoryId: string | null, type: 'income' | 'expense') {
  const supabase = createClient()

  return useQuery({
    queryKey: ['transactions-by-category', categoryId, type],
    queryFn: async () => {
      if (!categoryId) return []

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('category_id', categoryId)
        .eq('type', type)
        .order('transaction_date', { ascending: false })
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as Transaction[]
    },
    enabled: !!categoryId,
  })
}
