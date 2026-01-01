'use client'

import { use } from 'react'
import { useAssets, useAssetsWithBalance } from '@/lib/hooks/useAssets'
import { useTransactionsByAsset } from '@/lib/hooks/useFilteredTransactions'
import { FilteredLedger } from '@/components/ledger/FilteredLedger'
import { formatCurrency } from '@/lib/utils/currency'

interface AssetDetailPageProps {
  params: Promise<{ id: string }>
}

export default function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = use(params)

  const { data: assetsWithBalance = [] } = useAssetsWithBalance()
  const { data, isLoading } = useTransactionsByAsset(id)

  const asset = assetsWithBalance.find((a) => a.id === id)

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="p-4 text-center text-gray-500">
        자산을 찾을 수 없어요
      </div>
    )
  }

  const title = `${asset.name} (${formatCurrency(asset.current_balance)})`

  return (
    <FilteredLedger
      title={title}
      transactions={data?.transactions || []}
      transfers={data?.transfers || []}
      assetId={id}
    />
  )
}
