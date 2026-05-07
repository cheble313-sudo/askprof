import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: announcement } = await supabase
    .from('announcements')
    .select('*, attachments:announcement_attachments(*)')
    .eq('id', id)
    .single()

  if (!announcement) redirect('/dashboard')

  const backHref = profile?.role === 'professor' ? '/dashboard/professor' : '/dashboard'

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={backHref} className="text-gray-400 hover:text-gray-600">← 뒤로</Link>
          <h1 className="text-lg font-bold text-gray-800">공지사항</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">{announcement.title}</h2>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(announcement.created_at).toLocaleString('ko-KR')}
            </p>
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {announcement.content}
          </p>

          {announcement.attachments?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <p className="text-xs font-medium text-gray-500">첨부파일</p>
              {announcement.attachments.map((att: any) => (
                <a
                  key={att.id}
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-indigo-600 hover:underline bg-indigo-50 px-3 py-2 rounded-lg"
                >
                  📎 {att.file_name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
