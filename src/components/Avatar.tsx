interface AvatarProps {
  src?: string
  emoji: string
  size?: number
  className?: string
}

export default function Avatar({ src, emoji, size = 40, className = '' }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.5) }

  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <span
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary-tint ${className}`}
    >
      {emoji}
    </span>
  )
}
