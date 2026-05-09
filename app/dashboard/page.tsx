import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UserMenu from '@/components/UserMenu'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'professor') redirect('/dashboard/professor')

  const displayName = profile?.name || user.user_metadata?.name || ''

  const { data: questions } = await supabase
    .from('questions')
    .select('*, messages(id, content, author_type, created_at)')
    .eq('student_id', user.id)
    .order('updated_at', { ascending: false })

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-700">AskProf</h1>
            <p className="text-xs text-gray-500">{displayName}님 환영합니다</p>
          </div>
          <UserMenu name={displayName} role="student" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Link
          href="/questions/new"
          className="block w-full bg-indigo-600 text-white text-center py-4 rounded-2xl font-medium hover:bg-indigo-700 transition shadow"
        >
          + 새 질문하기
        </Link>

        {announcements && announcements.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">📢 공지사항</h2>
            <div className="space-y-2">
              {announcements.map((a) => (
                <Link
                  key={a.id}
                  href={`/announcements/${a.id}`}
                  className="block bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:bg-yellow-100 transition"
                >
                  <p className="text-sm font-medium text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(a.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">내 질문 목록</h2>
          {questions && questions.length > 0 ? (
            <div className="space-y-3">
              {questions.map((q: any) => (
                <Link
                  key={q.id}
                  href={`/questions/${q.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {q.messages?.[0]?.content || '(내용 없음)'}
                    </p>
                    <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                      q.status === 'answered'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {q.status === 'answered' ? '답변완료' : '답변대기'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {q.is_anonymous && <span className="text-xs text-gray-400">익명</span>}
                    <span className="text-xs text-gray-400">
                      {new Date(q.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                    </span>
                    {q.messages?.length > 1 && (
                      <span className="text-xs text-indigo-500">답변 {q.messages.length - 1}개</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm shadow-sm">
              아직 질문이 없습니다.<br />궁금한 점을 질문해보세요!
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
