'use client'

import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { TransactionForm } from '@/components/transaction/TransactionForm'
import { useTransaction, useTransfer } from '@/lib/hooks/useTransactions'

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default function EditPage({ params }: EditPageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const type = searchParams.get('type')

  const { data: transaction, isLoading: txLoading } = useTransaction(
    type === 'transaction' ? id : null
  )
  const { data: transfer, isLoading: trLoading } = useTransfer(
    type === 'transfer' ? id : null
  )

  const isLoading = txLoading || trLoading

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return <TransactionForm transaction={transaction} transfer={transfer} />
}
