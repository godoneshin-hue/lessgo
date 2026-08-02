import { Link } from 'react-router-dom'

export default function Welcome() {
  return (
    <div className="flex h-full flex-col justify-between px-6 pb-8 pt-14">
      <div />

      <div className="flex flex-col items-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary-soft text-2xl font-black text-white shadow-glow">
          L
        </span>
        <p className="font-display mt-4 text-2xl font-extrabold tracking-tight text-ink">LessGo</p>
      </div>

      <div className="space-y-3">
        <Link
          to="/signup"
          className="flex w-full items-center justify-center rounded-2xl bg-gradient-primary-soft py-3.5 text-sm font-extrabold text-white shadow-glow transition-transform active:scale-[0.99]"
        >
          회원가입하고 시작하기
        </Link>
        <Link
          to="/login"
          className="flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-bold text-ink-soft transition-colors active:scale-[0.99]"
        >
          이미 계정이 있어요
        </Link>
      </div>
    </div>
  )
}
