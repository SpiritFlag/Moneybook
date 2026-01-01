'use client'

import { use } from 'react'
import { redirect } from 'next/navigation'

interface AssetDetailPageProps {
  params: Promise<{ id: string }>
}

export default function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = use(params)
  redirect(`/ledger?asset=${id}`)
}
