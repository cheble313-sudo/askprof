'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserMenuProps {
  name: string
  role?: string
}

export default function UserMenu({ name, role }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    await fetch('/api/delete-account', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); setConfirming(false) }}
        className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
      >
        {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            로그아웃
          </button>
          <button
            onClick={handleDeleteAccount}
            className={`w-full text-left px-4 py-3 text-sm transition ${
              confirming
                ? 'bg-red-50 text-red-600 font-medium'
                : 'text-red-400 hover:bg-red-50'
            }`}
          >
            {confirming ? '정말 탈퇴할까요?' : '탈퇴하기'}
          </button>
          {confirming && (
            <button
              onClick={() => setConfirming(false)}
              className="w-full text-left px-4 py-3 text-xs text-gray-400 hover:bg-gray-50 transition border-t border-gray-100"
            >
              취소
            </button>
          )}
        </div>
      )}
    </div>
  )
}
