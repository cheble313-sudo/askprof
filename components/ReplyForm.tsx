'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ReplyFormProps {
  questionId: string
  userRole: string
}

export default function ReplyForm({ questionId, userRole }: ReplyFormProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const messageId = crypto.randomUUID()
    const { error: mError } = await supabase
      .from('messages')
      .insert({ id: messageId, question_id: questionId, author_id: user.id, author_type: userRole, content })

    if (mError) {
      setError(`전송에 실패했습니다: ${mError.message}`)
      setLoading(false)
      return
    }

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const filePath = `${questionId}/${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage.from('attachments').upload(filePath, file)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath)
        await supabase.from('attachments').insert({
          message_id: messageId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        })
      }
    }

    if (userRole === 'professor') {
      await supabase
        .from('questions')
        .update({ status: 'answered', updated_at: new Date().toISOString() })
        .eq('id', questionId)

      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'new_answer', questionId, hasFiles: files.length > 0 }),
      })
    } else {
      await supabase
        .from('questions')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', questionId)
    }

    setContent('')
    setFiles([])
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow-sm space-y-3 border-t-4 border-indigo-200">
      <p className="text-xs font-medium text-gray-500">
        {userRole === 'professor' ? '답변 작성' : '추가 질문'}
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder={userRole === 'professor' ? '답변을 입력하세요...' : '추가 질문을 입력하세요...'}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
      />

      <input
        type="file"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
        className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        accept=".jpg,.jpeg,.png,.gif,.pdf,.ppt,.pptx,.doc,.docx,.zip,.txt"
      />

      {files.length > 0 && (
        <p className="text-xs text-gray-400">{files.length}개 파일 선택됨</p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || !content.trim()}
        className={`w-full py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
          userRole === 'professor'
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {loading ? '전송 중...' : userRole === 'professor' ? '답변하기' : '추가 질문하기'}
      </button>
    </form>
  )
}
