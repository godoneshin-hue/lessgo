import { useEffect, useMemo, useState, type FormEvent } from 'react'
import * as api from '../lib/api'
import type { ApiChallenge, ApiFeedback, ApiLog, ApiUser, ApiVerification } from '../lib/api'
import Avatar from '../components/Avatar'
import AppIcon from '../components/AppIcon'
import { pickAvatarEmoji } from '../state/seed'
import { minutesToLabel } from '../lib/date'

type Section = 'overview' | 'data' | 'logs'
type Entity = 'users' | 'challenges' | 'verifications' | 'feedback' | null

const CATEGORY_LABEL: Record<string, string> = {
  friends: '친구 대결',
  class: '반대항전',
  school: '학교대항전',
}

const LOG_ICON: Record<string, string> = {
  'user.signup': '🆕',
  'user.login': '🔑',
  'challenge.create': '🚩',
  'challenge.join': '🤝',
  'admin.delete_user': '🗑️',
  'admin.delete_challenge': '🗑️',
  'feedback.submit': '💬',
}

const FEEDBACK_CATEGORY_LABEL: Record<string, string> = {
  design: '디자인',
  function: '기능',
  other: '기타',
}

export default function Admin() {
  const [section, setSection] = useState<Section>('overview')
  const [entity, setEntity] = useState<Entity>(null)
  const [users, setUsers] = useState<ApiUser[] | null>(null)
  const [challenges, setChallenges] = useState<ApiChallenge[] | null>(null)
  const [logs, setLogs] = useState<ApiLog[] | null>(null)
  const [verifications, setVerifications] = useState<ApiVerification[] | null>(null)
  const [feedback, setFeedback] = useState<ApiFeedback[] | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [confirmTarget, setConfirmTarget] = useState<
    { kind: 'user' | 'challenge' | 'verification'; id: string; label: string } | null
  >(null)
  const [unlocked, setUnlocked] = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState('')

  function loadAll() {
    Promise.all([
      api.adminGetUsers(),
      api.adminGetChallenges(),
      api.adminGetLogs(),
      api.adminGetVerifications(),
      api.adminGetFeedback(),
    ])
      .then(([u, c, l, v, f]) => {
        setUsers(u.users)
        setChallenges(c.challenges)
        setLogs(l.logs)
        setVerifications(v.verifications)
        setFeedback(f.feedback)
        setError('')
      })
      .catch((err) => {
        if (err instanceof api.ApiError && err.message === '비밀번호가 틀렸어요.') {
          sessionStorage.removeItem('lessgo_admin_pw')
          setUnlocked(false)
          setPwError('비밀번호가 틀렸어요.')
          return
        }
        setError('백엔드 서버에 연결하지 못했어요.')
      })
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('lessgo_admin_pw')
    if (saved) {
      api.setAdminPassword(saved)
      setUnlocked(true)
    }
  }, [])

  useEffect(() => {
    if (unlocked) loadAll()
  }, [unlocked])

  function handleUnlock(e: FormEvent) {
    e.preventDefault()
    api.setAdminPassword(pwInput)
    sessionStorage.setItem('lessgo_admin_pw', pwInput)
    setPwError('')
    setUnlocked(true)
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F5FA] px-6">
        <form onSubmit={handleUnlock} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <p className="text-base font-bold text-[#1B2333]">관리자 비밀번호</p>
          <input
            type="password"
            autoFocus
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            className="mt-4 w-full rounded-xl border border-[#E2E6F0] px-3 py-2.5 text-sm"
            placeholder="비밀번호 입력"
          />
          {pwError && <p className="mt-2 text-sm text-red-600">{pwError}</p>}
          <button type="submit" className="mt-4 w-full rounded-xl bg-[#1B2333] py-2.5 text-sm font-bold text-white">
            입장
          </button>
        </form>
      </div>
    )
  }

  async function handleDelete() {
    if (!confirmTarget) return
    try {
      if (confirmTarget.kind === 'user') await api.adminDeleteUser(confirmTarget.id)
      else if (confirmTarget.kind === 'challenge') await api.adminDeleteChallenge(confirmTarget.id)
      else await api.adminDeleteVerification(confirmTarget.id)
      setConfirmTarget(null)
      loadAll()
    } catch {
      setError('삭제하지 못했어요.')
      setConfirmTarget(null)
    }
  }

  const totalStake = challenges?.reduce((sum, c) => sum + c.donationAmount, 0) ?? 0

  return (
    <div className="flex min-h-screen bg-[#F3F5FA] text-[#1B2333]">
      <Sidebar
        section={section}
        onSection={(s) => {
          setSection(s)
          setEntity(null)
        }}
        userCount={users?.length}
        challengeCount={challenges?.length}
      />

      <main className="flex-1 px-6 py-8 sm:px-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {section === 'overview' && (
          <Overview users={users} challenges={challenges} logs={logs} totalStake={totalStake} />
        )}

        {section === 'data' && !entity && (
          <DataHome
            userCount={users?.length}
            challengeCount={challenges?.length}
            verificationCount={verifications?.length}
            feedbackCount={feedback?.length}
            onOpen={(e) => {
              setEntity(e)
              setSearch('')
            }}
          />
        )}

        {section === 'data' && entity === 'users' && (
          <UsersTable
            users={users}
            search={search}
            onSearch={setSearch}
            onBack={() => setEntity(null)}
            onDelete={(u) => setConfirmTarget({ kind: 'user', id: u.id, label: u.name })}
          />
        )}

        {section === 'data' && entity === 'challenges' && (
          <ChallengesTable
            challenges={challenges}
            search={search}
            onSearch={setSearch}
            onBack={() => setEntity(null)}
            onDelete={(c) => setConfirmTarget({ kind: 'challenge', id: c.id, label: c.title })}
          />
        )}

        {section === 'data' && entity === 'verifications' && (
          <VerificationsTable
            verifications={verifications}
            search={search}
            onSearch={setSearch}
            onBack={() => setEntity(null)}
            onDelete={(v) => setConfirmTarget({ kind: 'verification', id: v.id, label: `${v.userName ?? v.userId} · ${v.date}` })}
          />
        )}

        {section === 'data' && entity === 'feedback' && (
          <FeedbackTable feedback={feedback} search={search} onSearch={setSearch} onBack={() => setEntity(null)} />
        )}

        {section === 'logs' && <LogsView logs={logs} />}
      </main>

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-base font-bold text-[#1B2333]">정말 삭제할까요?</p>
            <p className="mt-1 text-sm text-[#6B7690]">
              "{confirmTarget.label}"{' '}
              {confirmTarget.kind === 'user' ? '계정을' : confirmTarget.kind === 'challenge' ? '챌린지를' : '인증 기록을'}{' '}
              영구적으로 삭제해요.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="flex-1 rounded-xl border border-[#E2E6F0] py-2.5 text-sm font-bold text-[#4A5370]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Sidebar({
  section,
  onSection,
  userCount,
  challengeCount,
}: {
  section: Section
  onSection: (s: Section) => void
  userCount?: number
  challengeCount?: number
}) {
  const items: { key: Section; label: string; icon: string; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'data', label: 'Data', icon: '🗂️', badge: (userCount ?? 0) + (challengeCount ?? 0) },
    { key: 'logs', label: 'Logs', icon: '📜' },
  ]

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-[#E2E6F0] bg-white px-3 py-6">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary-soft text-xs font-black text-white">
          L
        </span>
        <div>
          <p className="text-sm font-extrabold leading-none text-[#1B2333]">LessGo</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9AA3BD]">Dashboard</p>
        </div>
      </div>

      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSection(item.key)}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
            section === item.key ? 'bg-primary-tint text-primary-ink' : 'text-[#4A5370] hover:bg-[#F3F5FA]'
          }`}
        >
          <span className="text-base">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && (
            <span className="rounded-full bg-[#E2E6F0] px-1.5 py-0.5 text-[10px] font-bold text-[#4A5370]">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </aside>
  )
}

function Overview({
  users,
  challenges,
  logs,
  totalStake,
}: {
  users: ApiUser[] | null
  challenges: ApiChallenge[] | null
  logs: ApiLog[] | null
  totalStake: number
}) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-[#1B2333]">Overview</h1>
      <p className="mt-1 text-sm text-[#6B7690]">가입자와 챌린지 현황을 한눈에 확인해요.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="가입자" value={users ? String(users.length) : '—'} />
        <StatTile label="챌린지" value={challenges ? String(challenges.length) : '—'} />
        <StatTile
          label="그룹 챌린지"
          value={challenges ? String(challenges.filter((c) => c.mode === 'group').length) : '—'}
        />
        <StatTile label="내기 총액(설정 기준)" value={`${totalStake.toLocaleString()}캐시`} accent />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-bold text-[#1B2333]">최근 활동</h2>
        <div className="rounded-2xl border border-[#E2E6F0] bg-white">
          {logs === null && <p className="p-5 text-sm text-[#9AA3BD]">불러오는 중…</p>}
          {logs?.length === 0 && <p className="p-5 text-sm text-[#9AA3BD]">아직 활동이 없어요.</p>}
          {logs?.slice(0, 6).map((log, i) => (
            <div
              key={log.id}
              className={`flex items-center gap-3 px-5 py-3 ${i > 0 ? 'border-t border-[#EEF0F6]' : ''}`}
            >
              <span className="text-base">{LOG_ICON[log.type] ?? '•'}</span>
              <span className="flex-1 text-sm text-[#4A5370]">{log.message}</span>
              <span className="text-xs tabular-nums text-[#9AA3BD]">{relativeTime(log.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#E2E6F0] bg-white p-4">
      <p className="text-xs font-bold text-[#9AA3BD]">{label}</p>
      <p className={`mt-1 text-xl font-black tabular-nums ${accent ? 'text-primary-ink' : 'text-[#1B2333]'}`}>
        {value}
      </p>
    </div>
  )
}

function DataHome({
  userCount,
  challengeCount,
  verificationCount,
  feedbackCount,
  onOpen,
}: {
  userCount?: number
  challengeCount?: number
  verificationCount?: number
  feedbackCount?: number
  onOpen: (e: 'users' | 'challenges' | 'verifications' | 'feedback') => void
}) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-[#1B2333]">Data</h1>
      <p className="mt-1 text-sm text-[#6B7690]">앱의 모든 테이블이 카드로 표시돼요. 카드를 눌러 레코드를 확인하세요.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <EntityCard
          icon="👤"
          name="Users"
          count={userCount}
          description="가입자 계정 · 이름, 학교, 전화번호 등 개인정보"
          onClick={() => onOpen('users')}
        />
        <EntityCard
          icon="🚩"
          name="Challenges"
          count={challengeCount}
          description="생성된 챌린지 · 참여자, 목표, 내기 금액"
          onClick={() => onOpen('challenges')}
        />
        <EntityCard
          icon="✅"
          name="Verifications"
          count={verificationCount}
          description="일일 인증 기록 · 취소는 여기서만 가능해요"
          onClick={() => onOpen('verifications')}
        />
        <EntityCard
          icon="💬"
          name="Feedback"
          count={feedbackCount}
          description="유저가 보낸 피드백 · 분류, 내용, 보낸 사람"
          onClick={() => onOpen('feedback')}
        />
      </div>
    </div>
  )
}

function EntityCard({
  icon,
  name,
  count,
  description,
  onClick,
}: {
  icon: string
  name: string
  count?: number
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-[#E2E6F0] bg-white p-5 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-tint text-lg">{icon}</span>
        <span className="text-2xl font-black tabular-nums text-[#1B2333]">{count ?? '—'}</span>
      </div>
      <p className="mt-3 text-sm font-bold text-[#1B2333]">{name}</p>
      <p className="mt-0.5 text-xs text-[#9AA3BD]">{description}</p>
    </button>
  )
}

function TableToolbar({
  onBack,
  search,
  onSearch,
  label,
}: {
  onBack: () => void
  search: string
  onSearch: (v: string) => void
  label: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button type="button" onClick={onBack} className="text-sm font-bold text-[#6B7690] hover:text-[#1B2333]">
        ← Data
      </button>
      <h1 className="text-2xl font-extrabold tracking-tight text-[#1B2333]">{label}</h1>
      <div className="ml-auto flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="검색…"
          className="w-48 rounded-lg border border-[#E2E6F0] bg-white px-3 py-2 text-sm text-[#1B2333] outline-none focus:border-primary"
        />
      </div>
    </div>
  )
}

function signupInfo(u: ApiUser): string {
  if (u.authProvider === 'phone') return u.phone
  const id = u.oauthId?.split(':')[1] ?? ''
  if (u.authProvider === 'google') return u.email || `Google · ${id}`
  if (u.authProvider === 'kakao') return u.email || `카카오 · ${id}`
  return ''
}

function UsersTable({
  users,
  search,
  onSearch,
  onBack,
  onDelete,
}: {
  users: ApiUser[] | null
  search: string
  onSearch: (v: string) => void
  onBack: () => void
  onDelete: (u: ApiUser) => void
}) {
  const filtered = useMemo(() => {
    if (!users) return []
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      [u.name, u.school, u.grade, signupInfo(u)].some((field) => field.toLowerCase().includes(q)),
    )
  }, [users, search])

  return (
    <div>
      <TableToolbar onBack={onBack} search={search} onSearch={onSearch} label="Users" />
      <div className="overflow-x-auto rounded-2xl border border-[#E2E6F0] bg-white">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#E2E6F0] text-left text-xs uppercase tracking-wide text-[#9AA3BD]">
              <Th />
              <Th>이름</Th>
              <Th>학교</Th>
              <Th>학년</Th>
              <Th>가입정보</Th>
              <Th>초대코드</Th>
              <Th>가입일</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-[#F0F2F8] last:border-0 hover:bg-[#FAFBFD]">
                <Td>
                  <Avatar src={u.avatar} emoji={pickAvatarEmoji(u.name)} size={28} />
                </Td>
                <Td className="font-semibold text-[#1B2333]">{u.name}</Td>
                <Td>{u.school}</Td>
                <Td>{u.grade}</Td>
                <Td className="tabular-nums">{signupInfo(u)}</Td>
                <Td>{u.inviteCode || '—'}</Td>
                <Td className="tabular-nums text-[#9AA3BD]">{formatDate(u.createdAt)}</Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => onDelete(u)}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </Td>
              </tr>
            ))}
            {users !== null && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#9AA3BD]">
                  결과가 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ChallengesTable({
  challenges,
  search,
  onSearch,
  onBack,
  onDelete,
}: {
  challenges: ApiChallenge[] | null
  search: string
  onSearch: (v: string) => void
  onBack: () => void
  onDelete: (c: ApiChallenge) => void
}) {
  const filtered = useMemo(() => {
    if (!challenges) return []
    const q = search.trim().toLowerCase()
    if (!q) return challenges
    return challenges.filter((c) => [c.title, c.creatorName, c.shareCode].some((f) => f.toLowerCase().includes(q)))
  }, [challenges, search])

  return (
    <div>
      <TableToolbar onBack={onBack} search={search} onSearch={onSearch} label="Challenges" />
      <div className="overflow-x-auto rounded-2xl border border-[#E2E6F0] bg-white">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#E2E6F0] text-left text-xs uppercase tracking-wide text-[#9AA3BD]">
              <Th>제목</Th>
              <Th>유형</Th>
              <Th>만든 사람</Th>
              <Th>기간</Th>
              <Th>목표</Th>
              <Th>인원</Th>
              <Th>내기 금액</Th>
              <Th>코드</Th>
              <Th>생성일</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-[#F0F2F8] last:border-0 hover:bg-[#FAFBFD]">
                <Td className="font-semibold text-[#1B2333]">{c.title}</Td>
                <Td>{c.mode === 'solo' ? '개인' : CATEGORY_LABEL[c.category ?? 'friends']}</Td>
                <Td>{c.creatorName}</Td>
                <Td className="tabular-nums">{c.periodDays}일</Td>
                <Td className="tabular-nums">{c.goalMinutes ? minutesToLabel(c.goalMinutes) : '—'}</Td>
                <Td className="tabular-nums">
                  {c.mode === 'group'
                    ? (c.teams ? c.teams.reduce((a, t) => a + t.memberCount, 0) : c.participants.length)
                    : 1}
                  {c.maxParticipants ? ` / ${c.maxParticipants}` : ''}
                </Td>
                <Td className="tabular-nums text-amber-600">
                  {c.donationAmount > 0 ? `${c.donationAmount.toLocaleString()}캐시 / ${c.donationPeriod === 'week' ? '주' : '일'}` : '—'}
                </Td>
                <Td className="tabular-nums">{c.shareCode}</Td>
                <Td className="tabular-nums text-[#9AA3BD]">{formatDate(c.createdAt)}</Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => onDelete(c)}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </Td>
              </tr>
            ))}
            {challenges !== null && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-[#9AA3BD]">
                  결과가 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VerificationsTable({
  verifications,
  search,
  onSearch,
  onBack,
  onDelete,
}: {
  verifications: ApiVerification[] | null
  search: string
  onSearch: (v: string) => void
  onBack: () => void
  onDelete: (v: ApiVerification) => void
}) {
  const filtered = useMemo(() => {
    if (!verifications) return []
    const q = search.trim().toLowerCase()
    if (!q) return verifications
    return verifications.filter((v) => [v.userName ?? '', v.date].some((f) => f.toLowerCase().includes(q)))
  }, [verifications, search])

  return (
    <div>
      <TableToolbar onBack={onBack} search={search} onSearch={onSearch} label="Verifications" />
      <div className="overflow-x-auto rounded-2xl border border-[#E2E6F0] bg-white">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#E2E6F0] text-left text-xs uppercase tracking-wide text-[#9AA3BD]">
              <Th>사용자</Th>
              <Th>날짜</Th>
              <Th>사용 시간</Th>
              <Th>앱</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-b border-[#F0F2F8] last:border-0 hover:bg-[#FAFBFD]">
                <Td className="font-semibold text-[#1B2333]">{v.userName ?? v.userId}</Td>
                <Td className="tabular-nums">{v.date}</Td>
                <Td className="tabular-nums">{minutesToLabel(v.usedMinutes)}</Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {v.apps.length === 0 && <span className="text-[#9AA3BD]">—</span>}
                    {v.apps.map((a) => (
                      <span key={a.name} className="flex items-center gap-1 rounded-full bg-[#F3F5FA] px-2 py-1 text-xs">
                        <AppIcon icon={a.icon} className="h-3.5 w-3.5" />
                        {a.name} {minutesToLabel(a.minutes)}
                      </span>
                    ))}
                  </div>
                </Td>
                <Td>
                  <button
                    type="button"
                    onClick={() => onDelete(v)}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </Td>
              </tr>
            ))}
            {verifications !== null && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#9AA3BD]">
                  결과가 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FeedbackTable({
  feedback,
  search,
  onSearch,
  onBack,
}: {
  feedback: ApiFeedback[] | null
  search: string
  onSearch: (v: string) => void
  onBack: () => void
}) {
  const filtered = useMemo(() => {
    if (!feedback) return []
    const q = search.trim().toLowerCase()
    if (!q) return feedback
    return feedback.filter((f) => [f.userName, f.message].some((field) => field.toLowerCase().includes(q)))
  }, [feedback, search])

  return (
    <div>
      <TableToolbar onBack={onBack} search={search} onSearch={onSearch} label="Feedback" />
      <div className="overflow-x-auto rounded-2xl border border-[#E2E6F0] bg-white">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#E2E6F0] text-left text-xs uppercase tracking-wide text-[#9AA3BD]">
              <Th>보낸 사람</Th>
              <Th>분류</Th>
              <Th>내용</Th>
              <Th>보낸 시간</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-b border-[#F0F2F8] last:border-0 hover:bg-[#FAFBFD]">
                <Td className="font-semibold text-[#1B2333]">{f.userName}</Td>
                <Td>
                  <span className="rounded-full bg-primary-tint px-2 py-1 text-xs font-bold text-primary-ink">
                    {FEEDBACK_CATEGORY_LABEL[f.category] ?? f.category}
                  </span>
                </Td>
                <Td className="whitespace-normal">{f.message}</Td>
                <Td className="tabular-nums text-[#9AA3BD]">{formatDateTime(f.createdAt)}</Td>
              </tr>
            ))}
            {feedback !== null && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#9AA3BD]">
                  결과가 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LogsView({ logs }: { logs: ApiLog[] | null }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-[#1B2333]">Logs</h1>
      <p className="mt-1 text-sm text-[#6B7690]">가입, 로그인, 챌린지 생성/참여 등 앱에서 일어난 모든 활동이에요.</p>

      <div className="mt-6 rounded-2xl border border-[#E2E6F0] bg-white">
        {logs === null && <p className="p-5 text-sm text-[#9AA3BD]">불러오는 중…</p>}
        {logs?.length === 0 && <p className="p-5 text-sm text-[#9AA3BD]">아직 기록된 활동이 없어요.</p>}
        {logs?.map((log, i) => (
          <div key={log.id} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-[#EEF0F6]' : ''}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F5FA] text-sm">
              {LOG_ICON[log.type] ?? '•'}
            </span>
            <span className="flex-1 text-sm text-[#4A5370]">{log.message}</span>
            <span className="shrink-0 text-xs tabular-nums text-[#9AA3BD]">{formatDateTime(log.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-[#4A5370] ${className}`}>{children}</td>
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  return `${Math.floor(hr / 24)}일 전`
}
