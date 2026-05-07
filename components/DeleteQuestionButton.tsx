'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteQuestionButton({ questionId }: { questionId: string }) {
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    const supabase = createClient()
    await supabase.from('questions').delete().eq('id', questionId)
    router.push('/dashboard')
  }

  return (
    <button
      onClick={handleDelete}
      className={`text-xs px-3 py-1 rounded-lg transition ${
        confirming
          ? 'bg-red-500 text-white'
          : 'text-red-400 hover:bg-red-50 border border-red-200'
      }`}
    >
      {confirming ? '정말 삭제?' : '질문 삭제'}
    </button>
  )
}
