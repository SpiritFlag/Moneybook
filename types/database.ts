export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      asset_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          currency_id: string | null
          name: string
          initial_balance: number
          sort_order: number
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          currency_id?: string | null
          name: string
          initial_balance?: number
          sort_order?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          currency_id?: string | null
          name?: string
          initial_balance?: number
          sort_order?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      income_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          emoji: string
          sort_order: number
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          emoji?: string
          sort_order?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          emoji?: string
          sort_order?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      expense_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          emoji: string
          sort_order: number
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          emoji?: string
          sort_order?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          emoji?: string
          sort_order?: number
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      currencies: {
        Row: {
          id: string
          user_id: string
          name: string
          symbol: string
          exchange_rate: number
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          symbol: string
          exchange_rate: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          symbol?: string
          exchange_rate?: number
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          transaction_date: string
          asset_id: string
          category_id: string
          amount: number
          adjustment_amount: number
          adjustment_memo: string | null
          original_amount: number | null
          original_adjustment_amount: number | null
          original_currency_id: string | null
          exchange_rate: number | null
          title: string
          memo: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          transaction_date: string
          asset_id: string
          category_id: string
          amount: number
          adjustment_amount?: number
          adjustment_memo?: string | null
          original_amount?: number | null
          original_adjustment_amount?: number | null
          original_currency_id?: string | null
          exchange_rate?: number | null
          title: string
          memo?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          transaction_date?: string
          asset_id?: string
          category_id?: string
          amount?: number
          adjustment_amount?: number
          adjustment_memo?: string | null
          original_amount?: number | null
          original_adjustment_amount?: number | null
          original_currency_id?: string | null
          exchange_rate?: number | null
          title?: string
          memo?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      transfers: {
        Row: {
          id: string
          user_id: string
          transfer_date: string
          from_asset_id: string
          to_asset_id: string
          amount: number
          original_amount: number | null
          original_currency_id: string | null
          exchange_rate: number | null
          from_adjustment_amount: number
          from_adjustment_is_plus: boolean
          from_adjustment_memo: string | null
          to_adjustment_amount: number
          to_adjustment_is_plus: boolean
          to_adjustment_memo: string | null
          title: string | null
          memo: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transfer_date: string
          from_asset_id: string
          to_asset_id: string
          amount: number
          original_amount?: number | null
          original_currency_id?: string | null
          exchange_rate?: number | null
          from_adjustment_amount?: number
          from_adjustment_is_plus?: boolean
          from_adjustment_memo?: string | null
          to_adjustment_amount?: number
          to_adjustment_is_plus?: boolean
          to_adjustment_memo?: string | null
          title?: string | null
          memo?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transfer_date?: string
          from_asset_id?: string
          to_asset_id?: string
          amount?: number
          original_amount?: number | null
          original_currency_id?: string | null
          exchange_rate?: number | null
          from_adjustment_amount?: number
          from_adjustment_is_plus?: boolean
          from_adjustment_memo?: string | null
          to_adjustment_amount?: number
          to_adjustment_is_plus?: boolean
          to_adjustment_memo?: string | null
          title?: string | null
          memo?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 편의를 위한 타입 별칭
export type AssetCategory = Database['public']['Tables']['asset_categories']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type IncomeCategory = Database['public']['Tables']['income_categories']['Row']
export type ExpenseCategory = Database['public']['Tables']['expense_categories']['Row']
export type Currency = Database['public']['Tables']['currencies']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Transfer = Database['public']['Tables']['transfers']['Row']

// 자산과 잔고 정보를 포함한 타입
export type AssetWithBalance = Asset & {
  current_balance: number
}

// 거래 + 관련 정보 포함 타입
export type TransactionWithDetails = Transaction & {
  asset: Asset
  category: IncomeCategory | ExpenseCategory
}

// 이체 + 관련 정보 포함 타입
export type TransferWithDetails = Transfer & {
  from_asset: Asset
  to_asset: Asset
}

// 가계부 통합 항목 타입
export type LedgerEntry =
  | { type: 'income' | 'expense'; data: TransactionWithDetails }
  | { type: 'transfer'; data: TransferWithDetails }
