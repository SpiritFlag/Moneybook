'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { IncomeCategory, ExpenseCategory } from '@/types/database'

export function useIncomeCategories() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['income-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('income_categories')
        .select('*')
        .eq('is_deleted', false)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as IncomeCategory[]
    },
  })
}

export function useExpenseCategories() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_deleted', false)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as ExpenseCategory[]
    },
  })
}

export function useCreateIncomeCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, emoji = '💰' }: { name: string; emoji?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: existing } = await supabase
        .from('income_categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)

      const existingData = existing as { sort_order: number }[] | null
      const nextOrder = existingData && existingData.length > 0 ? existingData[0].sort_order + 1 : 0

      const { data, error } = await supabase
        .from('income_categories')
        .insert({ user_id: user.id, name, emoji, sort_order: nextOrder })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-categories'] })
    },
  })
}

export function useCreateExpenseCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, emoji = '📦' }: { name: string; emoji?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: existing } = await supabase
        .from('expense_categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)

      const existingData = existing as { sort_order: number }[] | null
      const nextOrder = existingData && existingData.length > 0 ? existingData[0].sort_order + 1 : 0

      const { data, error } = await supabase
        .from('expense_categories')
        .insert({ user_id: user.id, name, emoji, sort_order: nextOrder })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    },
  })
}

export function useUpdateIncomeCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, emoji }: { id: string; name: string; emoji?: string }) => {
      const { data, error } = await supabase
        .from('income_categories')
        .update({ name, emoji, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-categories'] })
    },
  })
}

export function useUpdateExpenseCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, emoji }: { id: string; name: string; emoji?: string }) => {
      const { data, error } = await supabase
        .from('expense_categories')
        .update({ name, emoji, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    },
  })
}

export function useDeleteIncomeCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, replacementId }: { id: string; replacementId: string }) => {
      // 해당 분류의 거래를 대체 분류로 변경
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ category_id: replacementId })
        .eq('category_id', id)
        .eq('type', 'income')

      if (updateError) throw updateError

      // Soft delete
      const { error } = await supabase
        .from('income_categories')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-categories'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useDeleteExpenseCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, replacementId }: { id: string; replacementId: string }) => {
      // 해당 분류의 거래를 대체 분류로 변경
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ category_id: replacementId })
        .eq('category_id', id)
        .eq('type', 'expense')

      if (updateError) throw updateError

      // Soft delete
      const { error } = await supabase
        .from('expense_categories')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useReorderIncomeCategories() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categories: { id: string; sort_order: number }[]) => {
      const updates = categories.map((cat) =>
        supabase
          .from('income_categories')
          .update({ sort_order: cat.sort_order, updated_at: new Date().toISOString() })
          .eq('id', cat.id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income-categories'] })
    },
  })
}

export function useReorderExpenseCategories() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categories: { id: string; sort_order: number }[]) => {
      const updates = categories.map((cat) =>
        supabase
          .from('expense_categories')
          .update({ sort_order: cat.sort_order, updated_at: new Date().toISOString() })
          .eq('id', cat.id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    },
  })
}
