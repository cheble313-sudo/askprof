import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ReplyForm from '@/components/ReplyForm'
import DeleteQuestionButton from '@/components/DeleteQuestionButton'
import FileAttachment from '@/components/FileAttachment'

export default async function QuestionThreadPage({
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
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: question } = await supabase
    .from('questions')
    .select('*, student:student_id(id, name, email), messages(*, author:author_id(name, role), attachments(*))')
    .eq('id', id)
    .single()

  if (!question) redirect('/dashboard')

  if (profile?.role === 'student' && question.student_id !== user.id) {
    redirect('/dashboard')
  }

  const messages = [...(question.messages || [])].sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const backHref = profile?.role === 'professor' ? '/dashboard/professor' : '/dashboard'

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={backHref} className="text-gray-400 hover:text-gray-600">← 뒤로</Link>
          <div className="flex items-center gap-2 flex-1">
            <h1 className="text-lg font-bold text-gray-800">질문 스레드</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              question.status === 'answered'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {question.status === 'answered' ? '답변완료' : '답변대기'}
            </span>
          </div>
          {(profile?.role === 'professor' || question.student_id === user!.id) && (
            <DeleteQuestionButton questionId={id} />
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {messages.map((msg: any) => (
          <div
            key={msg.id}
            className={`rounded-2xl p-4 ${
              msg.author_type === 'professor'
                ? 'bg-purple-50 border border-purple-100'
                : 'bg-white border border-gray-100 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                msg.author_type === 'professor'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {msg.author_type === 'professor'
                  ? '교수님'
                  : question.is_anonymous
                  ? '익명 학생'
                  : msg.author?.name || '학생'}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(msg.created_at).toLocaleString('ko-KR')}
              </span>
            </div>

            <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>

            {msg.attachments?.length > 0 && (
              <div className="mt-3 space-y-2">
                {msg.attachments.map((att: any) => (
                  <FileAttachment
                    key={att.id}
                    url={att.file_url}
                    name={att.file_name}
                    size={att.file_size}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        <ReplyForm questionId={id} userRole={profile?.role || 'student'} />
      </div>
    </main>
  )
}
