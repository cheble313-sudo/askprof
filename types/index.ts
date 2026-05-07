export type Role = 'professor' | 'student'
export type QuestionStatus = 'pending' | 'answered'
export type AuthorType = 'professor' | 'student' | 'anonymous'

export interface Profile {
  id: string
  email: string
  name: string
  role: Role
  is_active: boolean
  created_at: string
}

export interface Question {
  id: string
  student_id: string | null
  anonymous_email: string | null
  anonymous_token: string | null
  is_anonymous: boolean
  status: QuestionStatus
  created_at: string
  updated_at: string
  messages?: Message[]
  student?: Profile
}

export interface Message {
  id: string
  question_id: string
  author_id: string | null
  author_type: AuthorType
  content: string
  created_at: string
  attachments?: Attachment[]
  author?: Profile
}

export interface Attachment {
  id: string
  message_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  created_at: string
}

export interface Announcement {
  id: string
  professor_id: string
  title: string
  content: string
  created_at: string
  attachments?: AnnouncementAttachment[]
  professor?: Profile
}

export interface AnnouncementAttachment {
  id: string
  announcement_id: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
}
