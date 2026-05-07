'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewQuestionPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('질문 내용을 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const questionId = crypto.randomUUID()
    const messageId = crypto.randomUUID()

    const { error: qError } = await supabase
      .from('questions')
      .insert({ id: questionId, student_id: user.id, is_anonymous: isAnonymous, status: 'pending' })

    if (qError) {
      setError(`질문 생성 실패: ${qError.message}`)
      setLoading(false)
      return
    }

    const { error: mError } = await supabase
      .from('messages')
      .insert({ id: messageId, question_id: questionId, author_id: user.id, author_type: 'student', content })

    if (mError) {
      setError(`메시지 전송 실패: ${mError.message}`)
      setLoading(false)
      return
    }

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const filePath = `${questionId}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file)
      if (uploadError) {
        setError(`파일 업로드 실패: ${uploadError.message}`)
        setLoading(false)
        return
      }
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath)
        const { error: attError } = await supabase.from('attachments').insert({
          message_id: messageId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        })
        if (attError) {
          setError(`파일 정보 저장 실패: ${attError.message}`)
          setLoading(false)
          return
        }
      }
    }

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'new_question', questionId, hasFiles: files.length > 0 }),
    })

    router.push(`/questions/${questionId}`)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-lg font-bold text-gray-800">새 질문하기</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">질문 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="교수님께 질문할 내용을 적어주세요..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">파일 첨부 (선택)</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              accept=".jpg,.jpeg,.png,.gif,.pdf,.ppt,.pptx,.doc,.docx,.zip,.txt"
            />
            {files.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{files.length}개 파일 선택됨</p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">익명으로 질문하기</span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? '질문 제출 중...' : '질문 제출'}
          </button>
        </form>
      </div>
    </main>
  )
}
