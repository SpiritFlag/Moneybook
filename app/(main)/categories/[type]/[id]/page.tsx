'use client'

import { use } from 'react'
import { redirect } from 'next/navigation'

interface CategoryDetailPageProps {
  params: Promise<{ type: string; id: string }>
}

export default function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { type, id } = use(params)
  redirect(`/ledger?type=${type}&category=${id}`)
}
