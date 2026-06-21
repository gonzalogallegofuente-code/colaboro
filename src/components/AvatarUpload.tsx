'use client'

import { useRef, useState } from 'react'

// Permite hacerse una foto (cámara del móvil) y usarla de avatar. La recorta
// en cuadrado 256×256 en el navegador y la guarda como data URL en un campo
// oculto que viaja con el formulario del hijo. Si no hay foto, vale el emoji.
export function AvatarUpload({ emoji, initialUrl }: { emoji: string; initialUrl: string | null }) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [cleared, setCleared] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    const objUrl = URL.createObjectURL(file)
    const img = new Image()
    await new Promise((res, rej) => {
      img.onload = () => res(null)
      img.onerror = rej
      img.src = objUrl
    })
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
    URL.revokeObjectURL(objUrl)
    let data = canvas.toDataURL('image/webp', 0.82)
    if (!data.startsWith('data:image/webp')) data = canvas.toDataURL('image/jpeg', 0.82)
    setUrl(data)
    setCleared(false)
  }

  function remove() {
    setUrl(null)
    setCleared(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-indigo-50 ring-2 ring-indigo-100"
        aria-label="Cambiar avatar"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-16 w-16 object-cover" />
        ) : (
          <span className="text-4xl">{emoji}</span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={onFile}
      />
      <div className="flex gap-2 text-[11px] font-semibold">
        <button type="button" onClick={() => fileRef.current?.click()} className="text-indigo-600">
          📷 Foto
        </button>
        {url && (
          <button type="button" onClick={remove} className="text-gray-400">
            Quitar
          </button>
        )}
      </div>
      <input type="hidden" name="avatarUrl" value={url ?? ''} />
      <input type="hidden" name="clearAvatar" value={cleared ? '1' : '0'} />
    </div>
  )
}
