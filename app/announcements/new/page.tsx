'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', content: '' })
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const announcementId = crypto.randomUUID()
    const { error: aError } = await supabase
      .from('announcements')
      .insert({ id: announcementId, professor_id: user.id, title: form.title, content: form.content })

    if (aError) {
      setError(`공지 작성에 실패했습니다: ${aError.message}`)
      setLoading(false)
      return
    }

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const filePath = `announcements/${announcementId}/${Date.now()}.${ext}`
      const { data: uploadData } = await supabase.storage.from('attachments').upload(filePath, file)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath)
        await supabase.from('announcement_attachments').insert({
          announcement_id: announcementId,
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
      body: JSON.stringify({ type: 'announcement', announcementId, title: form.title }),
    })

    router.push(`/announcements/${announcementId}`)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard/professor" className="text-gray-400 hover:text-gray-600">← 뒤로</Link>
          <h1 className="text-lg font-bold text-gray-800">공지사항 작성</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="공지사항 제목"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              placeholder="공지 내용을 입력하세요..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 첨부 (선택)</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? '등록 중...' : '공지 등록하기'}
          </button>
        </form>
      </div>
    </main>
  )
}
