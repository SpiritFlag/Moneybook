'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { AssetCategory, Asset } from '@/types/database'

export function useAssetCategories() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['asset-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as AssetCategory[]
    },
  })
}

export function useAssets() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('is_deleted', false)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as Asset[]
    },
  })
}

export function useAssetsWithBalance() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['assets-with-balance'],
    queryFn: async () => {
      // 자산 조회
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('is_deleted', false)
        .order('sort_order', { ascending: true })

      if (assetsError) throw assetsError
      const assets = assetsData as Asset[]

      // 거래 조회 (보조화폐용 original_amount도 함께)
      const { data: transactionsData, error: txError } = await supabase
        .from('transactions')
        .select('asset_id, type, amount, adjustment_amount, original_amount, original_adjustment_amount')

      if (txError) throw txError
      const transactions = transactionsData as {
        asset_id: string
        type: string
        amount: number
        adjustment_amount: number
        original_amount: number | null
        original_adjustment_amount: number | null
      }[]

      // 이체 조회
      const { data: transfersData, error: trError } = await supabase
        .from('transfers')
        .select('from_asset_id, to_asset_id, amount')

      if (trError) throw trError
      const transfers = transfersData as { from_asset_id: string; to_asset_id: string; amount: number }[]

      // 통화 정보 조회
      const { data: currenciesData } = await supabase
        .from('currencies')
        .select('id, exchange_rate')
      const currencies = (currenciesData || []) as { id: string; exchange_rate: number }[]

      // 잔고 계산
      return assets.map((asset) => {
        let balance = asset.initial_balance
        const currency = asset.currency_id ? currencies.find(c => c.id === asset.currency_id) : null

        // 수입/지출 반영
        transactions?.forEach((tx) => {
          if (tx.asset_id === asset.id) {
            // 보조화폐 자산이면 original_amount 사용, 아니면 amount 사용
            const txAmount = tx.original_amount ?? tx.amount
            const txAdjustment = tx.original_adjustment_amount ?? tx.adjustment_amount ?? 0
            const effectiveAmount = txAmount - txAdjustment

            if (tx.type === 'income') {
              balance += effectiveAmount
            } else {
              balance -= effectiveAmount
            }
          }
        })

        // 이체 반영 - 보조화폐 자산이면 환율로 나눠서 계산
        transfers?.forEach((tr) => {
          if (tr.from_asset_id === asset.id) {
            const transferAmount = currency
              ? Math.round(tr.amount / currency.exchange_rate)
              : tr.amount
            balance -= transferAmount
          }
          if (tr.to_asset_id === asset.id) {
            const transferAmount = currency
              ? Math.round(tr.amount / currency.exchange_rate)
              : tr.amount
            balance += transferAmount
          }
        })

        return { ...asset, current_balance: balance }
      })
    },
  })
}

export function useCreateAssetCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 최대 sort_order 조회
      const { data: existing } = await supabase
        .from('asset_categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)

      const existingData = existing as { sort_order: number }[] | null
      const nextOrder = existingData && existingData.length > 0 ? existingData[0].sort_order + 1 : 0

      const { data, error } = await supabase
        .from('asset_categories')
        .insert({ user_id: user.id, name, sort_order: nextOrder })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] })
    },
  })
}

export function useUpdateAssetCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('asset_categories')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] })
    },
  })
}

export function useDeleteAssetCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // 속한 자산이 있는지 확인
      const { data: assets } = await supabase
        .from('assets')
        .select('id')
        .eq('category_id', id)
        .eq('is_deleted', false)
        .limit(1)

      if (assets && assets.length > 0) {
        throw new Error('자산이 있는 분류는 삭제할 수 없습니다')
      }

      const { error } = await supabase
        .from('asset_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] })
    },
  })
}

export function useCreateAsset() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      categoryId,
      name,
      initialBalance = 0,
      currencyId = null,
    }: {
      categoryId: string
      name: string
      initialBalance?: number
      currencyId?: string | null
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 최대 sort_order 조회
      const { data: existing } = await supabase
        .from('assets')
        .select('sort_order')
        .eq('category_id', categoryId)
        .order('sort_order', { ascending: false })
        .limit(1)

      const existingData = existing as { sort_order: number }[] | null
      const nextOrder = existingData && existingData.length > 0 ? existingData[0].sort_order + 1 : 0

      const { data, error } = await supabase
        .from('assets')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          name,
          initial_balance: initialBalance,
          currency_id: currencyId,
          sort_order: nextOrder,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['assets-with-balance'] })
    },
  })
}

export function useUpdateAsset() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      name,
      initialBalance,
      categoryId,
      currencyId,
    }: {
      id: string
      name?: string
      initialBalance?: number
      categoryId?: string
      currencyId?: string | null
    }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (name !== undefined) updates.name = name
      if (initialBalance !== undefined) updates.initial_balance = initialBalance
      if (categoryId !== undefined) updates.category_id = categoryId
      if (currencyId !== undefined) updates.currency_id = currencyId

      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['assets-with-balance'] })
    },
  })
}

export function useDeleteAsset() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // Soft delete
      const { error } = await supabase
        .from('assets')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['assets-with-balance'] })
    },
  })
}

export function useReorderAssets() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assets: { id: string; sort_order: number; category_id?: string }[]) => {
      const updates = assets.map((asset) =>
        supabase
          .from('assets')
          .update({
            sort_order: asset.sort_order,
            ...(asset.category_id && { category_id: asset.category_id }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', asset.id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['assets-with-balance'] })
    },
  })
}

export function useReorderAssetCategories() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categories: { id: string; sort_order: number }[]) => {
      const updates = categories.map((cat) =>
        supabase
          .from('asset_categories')
          .update({ sort_order: cat.sort_order, updated_at: new Date().toISOString() })
          .eq('id', cat.id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] })
    },
  })
}
