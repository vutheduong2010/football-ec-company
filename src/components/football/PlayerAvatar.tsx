import { useState } from 'react'

const DEFAULT_AVATAR = `${import.meta.env.BASE_URL}default-avatar.svg`

export function PlayerAvatar({
  src,
  alt = '',
  title,
  className = '',
}: {
  src?: string
  alt?: string
  title?: string
  className?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const resolvedSrc = src && failedSrc !== src ? src : DEFAULT_AVATAR

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      title={title}
      loading="lazy"
      decoding="async"
      onError={() => src && setFailedSrc(src)}
      className={`shrink-0 object-cover ${className}`}
    />
  )
}
