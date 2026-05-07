'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AnonymousPage() {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [form, setForm] = useState({ email: '', content: '' })
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.email.trim() || !form.content.trim()) {
      setError('이메일과 질문 내용을 모두 입력해주세요.')
      return
    }

    setLoading(true)

    const supabase = createClient()

    // UUID를 클라이언트에서 직접 생성 (SELECT 없이 처리)
    const questionId = crypto.randomUUID()
    const messageId = crypto.randomUUID()

    const { error: qError } = await supabase
      .from('questions')
      .insert({ id: questionId, anonymous_email: form.email, is_anonymous: true, status: 'pending' })

    if (qError) {
      setError('질문 생성에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    const { error: mError } = await supabase
      .from('messages')
      .insert({ id: messageId, question_id: questionId, author_type: 'anonymous', content: form.content })

    if (mError) {
      setError('메시지 전송에 실패했습니다.')
      setLoading(false)
      return
    }

    for (const file of files) {
      const filePath = `anon/${questionId}/${Date.now()}_${file.name}`
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

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'new_question',
        questionId,
        hasFiles: files.length > 0,
        isAnonymous: true,
        anonymousEmail: form.email,
      }),
    })

    setStep('success')
    setLoading(false)
  }

  if (step === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">질문이 전달됐어요!</h2>
          <p className="text-gray-500 text-sm">
            교수님이 답변하시면 <strong>{form.email}</strong>로<br />
            알림을 보내드립니다.
          </p>
          <Link href="/" className="mt-6 block text-indigo-600 font-medium hover:underline text-sm">
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">←</Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">익명 질문하기</h1>
            <p className="text-xs text-gray-400">로그인 없이 질문할 수 있어요</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 <span className="text-gray-400 font-normal">(답변 알림 수신용)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="답변을 받을 이메일 주소"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">질문 내용</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
              placeholder="궁금한 내용을 자유롭게 적어주세요..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 첨부 (선택)</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              accept=".jpg,.jpeg,.png,.gif,.pdf,.ppt,.pptx,.doc,.docx,.zip,.txt"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? '전송 중...' : '익명으로 질문 전송'}
          </button>
        </form>
      </div>
    </main>
  )
}
