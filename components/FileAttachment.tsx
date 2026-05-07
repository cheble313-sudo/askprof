'use client'

export default function FileAttachment({ url, name, size }: { url: string; name: string; size: number }) {
  const handleDownload = async () => {
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 text-xs text-indigo-600 hover:underline bg-indigo-50 px-3 py-2 rounded-lg w-full text-left"
    >
      📎 {name} ({(size / 1024).toFixed(1)}KB)
    </button>
  )
}
