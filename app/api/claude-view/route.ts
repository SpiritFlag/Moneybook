import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // API 키 검증 (쿼리 파라미터)
  const { searchParams } = new URL(request.url)
  const claudeKey = searchParams.get('key')
  const secretKey = process.env.CLAUDE_SECRET_KEY

  if (!secretKey || claudeKey !== secretKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Service Role 키로 Supabase 클라이언트 생성 (RLS 우회)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 모든 데이터 병렬 조회
    const [
      transactionsResult,
      expenseCategoriesResult,
      incomeCategoriesResult,
      assetsResult,
      assetCategoriesResult,
      transfersResult,
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('expense_categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('income_categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('assets')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('asset_categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    // 에러 체크
    const errors = [
      transactionsResult.error,
      expenseCategoriesResult.error,
      incomeCategoriesResult.error,
      assetsResult.error,
      assetCategoriesResult.error,
      transfersResult.error,
    ].filter(Boolean)

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Database error', details: errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      transactions: transactionsResult.data,
      expense_categories: expenseCategoriesResult.data,
      income_categories: incomeCategoriesResult.data,
      assets: assetsResult.data,
      asset_categories: assetCategoriesResult.data,
      transfers: transfersResult.data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
