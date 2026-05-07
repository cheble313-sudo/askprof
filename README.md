# AskProf - 강남대학교 익명 Q&A 플랫폼

교수님과 학생 간의 익명 질의응답 서비스입니다.  
대놓고 질문하기 어려운 학생도 부담 없이 질문하고, 교수님은 즉시 알림을 받아 답변할 수 있습니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 익명 질문 | 로그인 학생은 익명/실명 선택, 비로그인도 이메일만으로 질문 가능 |
| 1:1 스레드 | 질문과 답변이 하나의 스레드에 이어서 진행 |
| 파일 첨부 | 이미지, PDF, PPT, ZIP 등 다양한 형식 업로드 |
| 이메일 알림 | 새 질문/답변 시 관련자에게 이메일 자동 발송 |
| 공지사항 | 교수님이 공지 등록 시 전체 학생에게 이메일 알림 |
| 역할 자동 판별 | 교번(1로 시작)으로 교수/학생 자동 구분 |

---

## 계정 구조

- **교수님**: 교번이 `1`로 시작하는 `@kangnam.ac.kr` 이메일
- **학생**: 학번이 `2`로 시작하는 `@kangnam.ac.kr` 이메일
- **익명 방문자**: 이메일만 입력하여 비로그인 질문 가능

> Gmail, Naver 등 외부 이메일은 사용할 수 없습니다.

---

## 기술 스택

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend / DB**: Supabase (PostgreSQL + Auth + Storage)
- **이메일 알림**: Supabase 이메일 (추후 Resend 확장 예정)
- **배포**: Vercel (Frontend) + Supabase (Backend)

---

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일에 아래 값을 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxx...
```

### 3. Supabase DB 설정

Supabase 대시보드 → SQL Editor에서 아래 SQL을 실행합니다.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('professor', 'student')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  anonymous_email TEXT,
  anonymous_token UUID DEFAULT gen_random_uuid(),
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('professor', 'student', 'anonymous')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE announcement_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL
);

CREATE TABLE email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_question', 'new_answer', 'announcement')),
  reference_id UUID NOT NULL,
  has_files BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Supabase Storage 버킷 생성

Supabase 대시보드 → Storage → `attachments` 버킷 생성 (Public)

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 페이지 구조

```
/                        → 랜딩 페이지 (로그인/회원가입/익명질문)
/login                   → 로그인
/signup                  → 회원가입
/dashboard               → 학생 대시보드 (내 질문 목록)
/dashboard/professor     → 교수님 대시보드 (전체 질문 관리)
/questions/new           → 새 질문 작성
/questions/[id]          → 질문 스레드 (답변 포함)
/announcements/new       → 공지사항 작성 (교수님 전용)
/announcements/[id]      → 공지사항 상세
/anonymous               → 비로그인 익명 질문
```

---

## 향후 계획

- Resend를 통한 실제 이메일 발송 구현
- SMS / 카카오 알림톡 알림 추가
- 반(Class) 단위 관리 기능
- 교수님 대시보드 통계 강화
