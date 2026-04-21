import { MessageBubble } from './MessageBubble'

export function MessageGroup({ date, messages, userId }: any) {
  return (
    <div className="space-y-3">
      <div className="text-center text-xs text-zinc-400 my-2">{date}</div>

      {messages.map((msg: any) => (
        <MessageBubble
          key={msg.id}
          msg={msg}
          isMine={msg.author_id === userId}
        />
      ))}
    </div>
  )
}
