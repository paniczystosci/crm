export function MessageBubble({ msg, isMine }: any) {
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'justify-end' : ''}`}>
      {!isMine && (
        <img
          src={msg.author_avatar || '/avatar.png'}
          className="w-7 h-7 rounded-full"
        />
      )}

      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isMine ? 'bg-rose-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
        }`}
      >
        {msg.message}

        {msg.image_url && (
          <img
            src={msg.image_url}
            className="mt-2 rounded-xl max-h-64 object-cover cursor-pointer"
            onClick={() => window.open(msg.image_url, '_blank')}
          />
        )}

        <div className="text-[10px] opacity-70 mt-1 text-right">
          {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}
