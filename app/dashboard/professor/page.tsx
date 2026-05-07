import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UserMenu from '@/components/UserMenu'

export default async function ProfessorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'professor') redirect('/dashboard')

  const displayName = profile?.name || user.user_metadata?.name || ''

  const { data: questions } = await supabase
    .from('questions')
    .select('*, student:student_id(name, email), messages(id, content, author_type, created_at)')
    .order('updated_at', { ascending: false })

  const pending = questions?.filter((q) => q.status === 'pending') || []
  const answered = questions?.filter((q) => q.status === 'answered') || []

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-purple-700">AskProf</h1>
            <p className="text-xs text-gray-500">{displayName} 교수님</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/announcements/new"
              className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition"
            >
              공지 작성
            </Link>
            <UserMenu name={displayName} role="professor" />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-yellow-500">{pending.length}</p>
            <p className="text-xs text-gray-500 mt-1">답변 대기</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-500">{answered.length}</p>
            <p className="text-xs text-gray-500 mt-1">답변 완료</p>
          </div>
        </div>

        {pending.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">⏳ 답변 대기 ({pending.length})</h2>
            <div className="space-y-3">
              {pending.map((q: any) => (
                <Link
                  key={q.id}
                  href={`/questions/${q.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition border-l-4 border-yellow-400"
                >
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {q.messages?.[0]?.content || '(내용 없음)'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">
                      {q.is_anonymous ? '익명' : (q.student?.name || '학생')}
                    </span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(q.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {answered.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">✅ 답변 완료 ({answered.length})</h2>
            <div className="space-y-3">
              {answered.map((q: any) => (
                <Link
                  key={q.id}
                  href={`/questions/${q.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition opacity-75"
                >
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {q.messages?.[0]?.content || '(내용 없음)'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">
                      {q.is_anonymous ? '익명' : (q.student?.name || '학생')}
                    </span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(q.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {(!questions || questions.length === 0) && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm shadow-sm">
            아직 질문이 없습니다.
          </div>
        )}
      </div>
    </main>
  )
}
