export function TypingIndicator({ user }: { user: string | null }) {
  if (!user) return null

  return (
    <div className="text-xs text-zinc-500 px-4 pb-2 animate-pulse">
      {user} печатает…
    </div>
  )
}
