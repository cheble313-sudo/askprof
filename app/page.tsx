import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'professor') redirect('/dashboard/professor')
    else redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">AskProf</h1>
          <p className="text-gray-500 text-sm">강남대학교 익명 Q&A 플랫폼</p>
        </div>

        <p className="text-gray-600 mb-8 text-sm leading-relaxed">
          궁금한 점을 익명으로 질문하고<br />
          교수님께 빠르게 답변 받아보세요.
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="block w-full border-2 border-indigo-600 text-indigo-600 py-3 rounded-xl font-medium hover:bg-indigo-50 transition"
          >
            회원가입
          </Link>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="text-xs text-gray-400 bg-white px-2">또는</span>
            </div>
          </div>
          <Link
            href="/anonymous"
            className="block w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition text-sm"
          >
            로그인 없이 익명 질문하기
          </Link>
        </div>
      </div>
    </main>
  )
}
