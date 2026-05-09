'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteAnnouncementButton({ announcementId }: { announcementId: string }) {
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    const supabase = createClient()
    await supabase.from('announcements').delete().eq('id', announcementId)
    router.push('/dashboard/professor')
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
      {confirming ? '정말 삭제?' : '공지 삭제'}
    </button>
  )
}
