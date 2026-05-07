import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendEmail(to: string, subject: string, html: string) {
  try {
    await resend.emails.send({
      from: 'AskProf <onboarding@resend.dev>',
      to,
      subject,
      html,
    })
  } catch (e) {
    console.error('[EMAIL ERROR]', e)
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, questionId, announcementId, hasFiles, isAnonymous, anonymousEmail } = body

  const supabase = await createClient()

  try {
    if (type === 'new_question') {
      const { data: professors } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('role', 'professor')
        .eq('is_active', true)

      if (professors) {
        for (const professor of professors) {
          await supabase.from('email_logs').insert({
            recipient_email: professor.email,
            type: 'new_question',
            reference_id: questionId,
            has_files: hasFiles || false,
          })

          await sendEmail(
            professor.email,
            '[AskProf] 새 질문이 도착했습니다',
            `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
                <h2 style="color:#7c3aed">새 질문이 도착했습니다 📬</h2>
                <p>${professor.name} 교수님, 학생으로부터 새 질문이 접수됐습니다.</p>
                ${hasFiles ? '<p>📎 파일 첨부 있음</p>' : ''}
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/professor"
                   style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:white;border-radius:8px;text-decoration:none">
                  대시보드에서 확인하기
                </a>
              </div>
            `
          )
        }
      }
    }

    if (type === 'new_answer') {
      const { data: question } = await supabase
        .from('questions')
        .select('student_id, anonymous_email')
        .eq('id', questionId)
        .single()

      if (question) {
        let recipientEmail = question.anonymous_email

        if (!recipientEmail && question.student_id) {
          const { data: student } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', question.student_id)
            .single()
          recipientEmail = student?.email
        }

        if (recipientEmail) {
          await supabase.from('email_logs').insert({
            recipient_email: recipientEmail,
            type: 'new_answer',
            reference_id: questionId,
            has_files: hasFiles || false,
          })

          await sendEmail(
            recipientEmail,
            '[AskProf] 질문에 답변이 달렸습니다',
            `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
                <h2 style="color:#4f46e5">답변이 도착했습니다 ✅</h2>
                <p>교수님이 질문에 답변하셨습니다.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/questions/${questionId}"
                   style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none">
                  답변 확인하기
                </a>
              </div>
            `
          )
        }
      }
    }

    if (type === 'announcement') {
      const { data: students } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'student')
        .eq('is_active', true)

      if (students) {
        for (const student of students) {
          await supabase.from('email_logs').insert({
            recipient_email: student.email,
            type: 'announcement',
            reference_id: announcementId,
            has_files: false,
          })

          await sendEmail(
            student.email,
            '[AskProf] 새 공지사항이 등록됐습니다',
            `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
                <h2 style="color:#d97706">새 공지사항 📢</h2>
                <p>교수님이 새 공지사항을 등록하셨습니다.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/announcements/${announcementId}"
                   style="display:inline-block;margin-top:16px;padding:12px 24px;background:#d97706;color:white;border-radius:8px;text-decoration:none">
                  공지 확인하기
                </a>
              </div>
            `
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notify error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
