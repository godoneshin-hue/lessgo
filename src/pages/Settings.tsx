import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../state/store'
import { ApiError } from '../lib/api'
import { ChatIcon, ChevronRightIcon } from '../components/icons'

const SCHOOL_LEVELS: { label: string; full: string; grades: number[] | null }[] = [
  { label: '중학생', full: '중학교', grades: [1, 2, 3] },
  { label: '고등학생', full: '고등학교', grades: [1, 2, 3] },
  { label: '대학생', full: '대학교', grades: [1, 2, 3, 4] },
  { label: '성인', full: '성인', grades: null },
]

function levelForGrade(grade: string) {
  return SCHOOL_LEVELS.find((l) => grade.startsWith(l.full)) ?? null
}

function gradeNumForGrade(grade: string) {
  const match = grade.match(/(\d+)학년/)
  return match ? Number(match[1]) : null
}

export default function Settings() {
  const navigate = useNavigate()
  const { profile, pushToast, updateProfile, deleteAccount } = useStore()

  const [name, setName] = useState(profile.name)
  const [school, setSchool] = useState(profile.school)
  const [schoolLevel, setSchoolLevel] = useState(levelForGrade(profile.grade))
  const [gradeNum, setGradeNum] = useState<number | null>(gradeNumForGrade(profile.grade))
  const [saving, setSaving] = useState(false)

  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const grade = schoolLevel
    ? schoolLevel.grades
      ? gradeNum
        ? `${schoolLevel.full} ${gradeNum}학년`
        : ''
      : schoolLevel.full
    : ''

  const canSave = name.trim().length > 0 && school.trim().length > 0 && grade.length > 0 && !saving

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    try {
      await updateProfile({ name: name.trim(), school: school.trim(), grade })
      pushToast('내 정보가 저장됐어요')
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '저장하지 못했어요.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteAccount()
      navigate('/welcome')
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : '탈퇴하지 못했어요. 다시 시도해주세요.')
      setDeleting(false)
    }
  }

  return (
    <div className="px-5 pb-6 pt-1">
      <div className="mb-3 flex items-center gap-2">
        <Link
          to="/me"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:text-ink"
          aria-label="뒤로 가기"
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </Link>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">설정</h1>
      </div>

      <Link
        to="/feedback"
        className="mb-4 flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-card active:scale-[0.99]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg text-ink-soft">
          <ChatIcon className="h-4 w-4" />
        </span>
        <span className="flex-1 text-sm font-semibold text-ink">피드백 보내기</span>
        <ChevronRightIcon className="h-4 w-4 text-ink-faint" />
      </Link>

      <form onSubmit={handleSave} className="space-y-4 rounded-3xl bg-surface p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">내 정보</p>

        <Field label="이름 (본명)">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            autoComplete="name"
            className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-base text-ink outline-none focus:border-primary"
          />
        </Field>

        <Field label="학교">
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="OO중학교"
            className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-base text-ink outline-none focus:border-primary"
          />
        </Field>

        <Field label="학년">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {SCHOOL_LEVELS.map((level) => (
                <button
                  key={level.label}
                  type="button"
                  onClick={() => {
                    setSchoolLevel(level)
                    setGradeNum(null)
                  }}
                  className={`rounded-xl border px-3 py-3 text-sm font-bold transition-colors ${
                    schoolLevel?.label === level.label
                      ? 'border-primary bg-primary-tint text-primary-ink'
                      : 'border-line text-ink-soft'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
            {schoolLevel?.grades && (
              <div className="flex gap-1.5">
                {schoolLevel.grades.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGradeNum(n)}
                    className={`flex-1 rounded-xl border py-3 text-sm font-bold transition-colors ${
                      gradeNum === n ? 'border-primary bg-primary-tint text-primary-ink' : 'border-line text-ink-soft'
                    }`}
                  >
                    {n}학년
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>

        <button
          type="submit"
          disabled={!canSave}
          className="w-full rounded-2xl bg-gradient-primary-soft py-3.5 text-sm font-extrabold text-white shadow-glow transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:bg-none disabled:text-ink-faint disabled:shadow-none"
        >
          {saving ? '저장 중…' : '저장하기'}
        </button>
      </form>

      <section className="mt-4 rounded-3xl border border-warn/30 bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-warn-text">위험 구역</p>
        <p className="mt-1 text-sm text-ink-soft">
          회원 탈퇴하면 계정, 챌린지, 인증 기록, 캐시가 전부 삭제되고 되돌릴 수 없어요.
        </p>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 w-full rounded-2xl border border-warn py-3 text-sm font-bold text-warn-text active:scale-[0.99]"
          >
            회원 탈퇴
          </button>
        ) : (
          <div className="mt-4 space-y-2.5 rounded-2xl bg-warn-tint p-4">
            <p className="text-sm font-bold text-warn-text">정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없어요.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="flex-1 rounded-xl bg-surface py-2.5 text-sm font-bold text-ink-soft disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-warn py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {deleting ? '탈퇴 처리 중…' : '탈퇴하기'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-bold text-ink-soft">{label}</span>
      <div className="mt-2">{children}</div>
    </div>
  )
}
