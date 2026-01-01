'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Currency } from '@/types/database'

export function useCurrencies() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as Currency[]
    },
  })
}

export function useCreateCurrency() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      symbol,
      exchangeRate,
    }: {
      name: string
      symbol: string
      exchangeRate: number
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: existing } = await supabase
        .from('currencies')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)

      const existingData = existing as { sort_order: number }[] | null
      const nextOrder = existingData && existingData.length > 0 ? existingData[0].sort_order + 1 : 0

      const { data, error } = await supabase
        .from('currencies')
        .insert({
          user_id: user.id,
          name,
          symbol,
          exchange_rate: exchangeRate,
          sort_order: nextOrder,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
    },
  })
}

export function useUpdateCurrency() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      name,
      symbol,
      exchangeRate,
    }: {
      id: string
      name: string
      symbol: string
      exchangeRate: number
    }) => {
      const { data, error } = await supabase
        .from('currencies')
        .update({
          name,
          symbol,
          exchange_rate: exchangeRate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
    },
  })
}

export function useDeleteCurrency() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // 해당 보조화폐를 사용하는 자산이 있는지 확인
      const { data: assets } = await supabase
        .from('assets')
        .select('id')
        .eq('currency_id', id)
        .eq('is_deleted', false)
        .limit(1)

      if (assets && assets.length > 0) {
        throw new Error('이 보조화폐를 사용하는 자산이 있어서 삭제할 수 없습니다')
      }

      const { error } = await supabase
        .from('currencies')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
    },
  })
}

export function useReorderCurrencies() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (currencies: { id: string; sort_order: number }[]) => {
      const updates = currencies.map((cur) =>
        supabase
          .from('currencies')
          .update({ sort_order: cur.sort_order, updated_at: new Date().toISOString() })
          .eq('id', cur.id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
    },
  })
}
