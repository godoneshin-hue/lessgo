import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../state/store'
import * as api from '../lib/api'
import { ApiError, type FeedbackCategory } from '../lib/api'
import { ChevronRightIcon } from '../components/icons'

const CATEGORY_OPTIONS: { key: FeedbackCategory; label: string }[] = [
  { key: 'design', label: '디자인' },
  { key: 'function', label: '기능' },
  { key: 'other', label: '기타' },
]

interface ChatMessage {
  from: 'bot' | 'user'
  text: string
}

export default function Feedback() {
  const navigate = useNavigate()
  const { profile } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: '안녕하세요! 어떤 부분에 대한 의견인가요?' },
  ])
  const [category, setCategory] = useState<FeedbackCategory | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function pickCategory(opt: (typeof CATEGORY_OPTIONS)[number]) {
    setCategory(opt.key)
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: opt.label },
      { from: 'bot', text: '어떤 내용인지 편하게 적어주세요.' },
    ])
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || !category || sending) return
    setSending(true)
    setMessages((prev) => [...prev, { from: 'user', text }])
    setInput('')
    try {
      await api.submitFeedback(profile.id, category, text)
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: '소중한 의견 감사해요! 더 나은 LessGo를 만드는 데 큰 도움이 될 거예요 💙' },
      ])
      setDone(true)
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: err instanceof ApiError ? err.message : '앗, 전송하지 못했어요. 다시 시도해주세요.' },
      ])
    } finally {
      setSending(false)
    }
  }

  function resetChat() {
    setMessages([{ from: 'bot', text: '안녕하세요! 어떤 부분에 대한 의견인가요?' }])
    setCategory(null)
    setInput('')
    setDone(false)
  }

  return (
    <div className="flex h-full flex-col px-5 pb-6 pt-1">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:text-ink"
          aria-label="뒤로 가기"
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </button>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">피드백 보내기</h1>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto py-2">
        {messages.map((m, i) => (
          <ChatBubble key={i} from={m.from} text={m.text} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-2 mt-2 flex flex-col gap-2.5">
        {!category && (
          <div className="flex gap-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => pickCategory(opt)}
                className="flex-1 rounded-full border border-primary bg-surface py-2.5 text-sm font-bold text-primary-ink shadow-card active:scale-[0.98]"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {category && !done && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="내용을 입력해주세요"
              autoFocus
              disabled={sending}
              className="flex-1 rounded-full border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-primary disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="shrink-0 rounded-full bg-gradient-primary-soft px-5 py-3 text-sm font-extrabold text-white shadow-glow disabled:cursor-not-allowed disabled:bg-line disabled:bg-none disabled:text-ink-faint disabled:shadow-none"
            >
              {sending ? '전송 중…' : '전송'}
            </button>
          </form>
        )}

        {done && (
          <button
            type="button"
            onClick={resetChat}
            className="w-full rounded-2xl border border-line py-3 text-sm font-bold text-ink-soft hover:border-primary hover:text-primary-ink"
          >
            의견 하나 더 남기기
          </button>
        )}
      </div>
    </div>
  )
}

function ChatBubble({ from, text }: { from: 'bot' | 'user'; text: string }) {
  const isBot = from === 'bot'
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isBot
            ? 'rounded-tl-sm bg-surface text-ink shadow-card'
            : 'rounded-tr-sm bg-gradient-primary-soft text-white shadow-glow'
        }`}
      >
        {text}
      </div>
    </div>
  )
}
