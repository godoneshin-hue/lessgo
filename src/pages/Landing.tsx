import { Link } from 'react-router-dom'
import { CameraIcon, ChartIcon, FlagIcon, FlameIcon, GiftIcon } from '../components/icons'

const STEPS = [
  {
    n: '01',
    title: '목표를 정해요',
    desc: '인스타그램, 유튜브, 틱톡… 줄이고 싶은 앱마다 하루 사용 시간 목표를 직접 정해요.',
  },
  {
    n: '02',
    title: '매일 인증해요',
    desc: '스크린타임 캡처 한 장이면 끝. AI가 진짜 스크린타임 화면인지, 오늘 날짜가 맞는지 확인해요.',
  },
  {
    n: '03',
    title: '친구랑 같이 해요',
    desc: '그룹 챌린지를 만들어서 같이 도전하고, 누가 제일 잘 지켰는지 순위로 확인해요.',
  },
]

const FEATURES = [
  {
    icon: CameraIcon,
    title: 'AI 스크린타임 인증',
    desc: '아무 사진이나 올린다고 통과되지 않아요. 실제 스크린타임 화면인지 AI가 매번 확인해요.',
  },
  {
    icon: FlameIcon,
    title: '연속 기록 & 뱃지',
    desc: '매일 인증하면 캐시가 쌓이고, 연속 기록에 따라 뱃지가 풀려요. 전체 기록은 달력으로 한눈에.',
  },
  {
    icon: FlagIcon,
    title: '친구 · 반 · 학교 챌린지',
    desc: '단둘이도, 반 전체로도, 학교 대항으로도. 그룹을 만들고 링크만 공유하면 바로 초대돼요.',
  },
  {
    icon: GiftIcon,
    title: '기부 · 내기 (캐시)',
    desc: '목표를 못 지키면 정해둔 캐시가 쌓여요. 실제 돈이 아니라 앱 안에서만 쓰는 캐시예요.',
  },
]

export default function Landing() {
  return (
    <div className="bg-bg">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#3A1E0C] via-[#7A3505] to-[#FF7A1F] px-6 pb-20 pt-8 text-white sm:px-10 sm:pb-28 sm:pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-[#FFA05C] opacity-30 blur-3xl"
        />
        <nav className="relative mx-auto flex max-w-5xl items-center justify-between">
          <span className="flex items-center gap-2 font-display text-lg font-black tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-sm">L</span>
            LessGo
          </span>
          <Link
            to="/login"
            className="rounded-full border border-white/25 px-4 py-2 text-sm font-bold text-white/90 transition-colors hover:bg-white/10"
          >
            로그인
          </Link>
        </nav>

        <div className="relative mx-auto mt-16 max-w-3xl text-center sm:mt-24">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">스마트폰 사용 시간 챌린지</p>
          <h1 className="mt-4 text-balance font-display text-[clamp(2.2rem,7vw+0.5rem,4.2rem)] font-black leading-[1.05] tracking-tight">
            눈 떠보니 새벽 2시,
            <br />
            릴스만 보다가.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-[clamp(1rem,1.5vw+0.6rem,1.25rem)] leading-relaxed text-white/85">
            혼자 줄이려면 3일이면 끝나요. 친구랑 목표를 걸고, 매일 인증하고, AI가 확인해주면 얘기가 달라져요.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="w-full rounded-2xl bg-white px-8 py-4 text-base font-extrabold text-primary-deep shadow-glow transition-transform active:scale-[0.98] sm:w-auto"
            >
              무료로 시작하기
            </Link>
            <a
              href="#how"
              className="w-full rounded-2xl border border-white/30 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              어떻게 되는지 보기
            </a>
          </div>
        </div>
      </header>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-5xl px-6 py-20 sm:px-10 sm:py-28">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-primary-ink">사용 방법</p>
        <h2 className="mt-3 max-w-md text-balance font-display text-[clamp(1.6rem,2.5vw+1rem,2.4rem)] font-black leading-tight tracking-tight text-ink">
          3단계면 충분해요
        </h2>

        <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative">
              <span className="font-display text-5xl font-black text-primary-tint">{s.n}</span>
              <h3 className="mt-3 text-lg font-extrabold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div aria-hidden className="mt-8 hidden h-px w-full bg-line sm:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features — asymmetric, not a uniform grid */}
      <section className="bg-surface px-6 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-primary-ink">기능</p>
          <h2 className="mt-3 max-w-md text-balance font-display text-[clamp(1.6rem,2.5vw+1rem,2.4rem)] font-black leading-tight tracking-tight text-ink">
            그냥 타이머 앱이 아니에요
          </h2>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              const featured = i === 0
              return (
                <div
                  key={f.title}
                  className={
                    featured
                      ? 'rounded-3xl bg-gradient-to-br from-primary-light to-primary-deep p-8 text-white shadow-pop sm:col-span-2'
                      : 'rounded-2xl border border-line bg-bg p-7'
                  }
                >
                  <span
                    className={
                      featured
                        ? 'flex h-11 w-11 items-center justify-center rounded-full bg-white/20'
                        : 'flex h-11 w-11 items-center justify-center rounded-full bg-primary-tint text-primary-ink'
                    }
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className={featured ? 'mt-4 text-xl font-extrabold' : 'mt-4 text-base font-extrabold text-ink'}>
                    {f.title}
                  </h3>
                  <p className={featured ? 'mt-2 max-w-md text-sm leading-relaxed text-white/85' : 'mt-2 text-sm leading-relaxed text-ink-soft'}>
                    {f.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stat callout */}
      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 rounded-3xl bg-ink px-8 py-14 text-center text-white sm:flex-row sm:justify-around sm:text-left">
          <Stat n="10" unit="분 단위" label="AI가 앱별 사용 시간을 정확히 읽어요" />
          <div aria-hidden className="hidden h-16 w-px bg-white/15 sm:block" />
          <Stat n="3" unit="가지 모드" label="혼자 · 친구 · 그룹, 원하는 방식으로" />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-24 pt-4 text-center sm:px-10">
        <ChartIcon className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mx-auto mt-5 max-w-lg text-balance font-display text-[clamp(1.6rem,2.5vw+1rem,2.2rem)] font-black leading-tight tracking-tight text-ink">
          오늘부터, 친구랑 같이 줄여봐요
        </h2>
        <Link
          to="/signup"
          className="mt-8 inline-flex rounded-2xl bg-gradient-primary-soft px-10 py-4 text-base font-extrabold text-white shadow-glow transition-transform active:scale-[0.98]"
        >
          무료로 시작하기
        </Link>
      </section>

      <footer className="border-t border-line px-6 py-8 text-center text-xs text-ink-faint sm:px-10">
        © {new Date().getFullYear()} LessGo
      </footer>
    </div>
  )
}

function Stat({ n, unit, label }: { n: string; unit: string; label: string }) {
  return (
    <div>
      <p className="font-display text-4xl font-black tabular-nums">
        {n}
        <span className="ml-1 text-lg font-bold text-white/60">{unit}</span>
      </p>
      <p className="mt-1.5 max-w-[220px] text-sm text-white/70">{label}</p>
    </div>
  )
}
