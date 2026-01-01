-- ============================================
-- Moneybook 가계부 DB 스키마
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. 자산 분류 테이블
CREATE TABLE IF NOT EXISTS asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 자산 테이블
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES asset_categories(id) ON DELETE RESTRICT,
  name VARCHAR(50) NOT NULL,
  initial_balance BIGINT NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 수입 분류 테이블
CREATE TABLE IF NOT EXISTS income_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 지출 분류 테이블
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 거래 테이블 (수입/지출)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  transaction_date DATE NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL,
  amount BIGINT NOT NULL,
  adjustment_amount BIGINT NOT NULL DEFAULT 0,
  adjustment_memo TEXT,
  title VARCHAR(100) NOT NULL,
  memo TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 이체 테이블
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transfer_date DATE NOT NULL,
  from_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  to_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL,
  title VARCHAR(100),
  memo TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_assets CHECK (from_asset_id != to_asset_id)
);

-- ============================================
-- 인덱스
-- ============================================

-- 거래 조회 최적화
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_asset ON transactions(asset_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id, transaction_date DESC);

-- 이체 조회 최적화
CREATE INDEX IF NOT EXISTS idx_transfers_user_date ON transfers(user_id, transfer_date DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_from_asset ON transfers(from_asset_id, transfer_date DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_to_asset ON transfers(to_asset_id, transfer_date DESC);

-- 자산 정렬
CREATE INDEX IF NOT EXISTS idx_assets_sort ON assets(user_id, category_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_asset_categories_sort ON asset_categories(user_id, sort_order);

-- 분류 정렬
CREATE INDEX IF NOT EXISTS idx_income_categories_sort ON income_categories(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_expense_categories_sort ON expense_categories(user_id, sort_order);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- asset_categories 정책
DROP POLICY IF EXISTS "Users can manage own asset_categories" ON asset_categories;
CREATE POLICY "Users can manage own asset_categories" ON asset_categories
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- assets 정책
DROP POLICY IF EXISTS "Users can manage own assets" ON assets;
CREATE POLICY "Users can manage own assets" ON assets
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- income_categories 정책
DROP POLICY IF EXISTS "Users can manage own income_categories" ON income_categories;
CREATE POLICY "Users can manage own income_categories" ON income_categories
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- expense_categories 정책
DROP POLICY IF EXISTS "Users can manage own expense_categories" ON expense_categories;
CREATE POLICY "Users can manage own expense_categories" ON expense_categories
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- transactions 정책
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
CREATE POLICY "Users can manage own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- transfers 정책
DROP POLICY IF EXISTS "Users can manage own transfers" ON transfers;
CREATE POLICY "Users can manage own transfers" ON transfers
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
