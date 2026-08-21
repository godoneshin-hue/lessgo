import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useStore } from '../state/store'
import { ApiError } from '../lib/api'

export function PremiumSuccess() {
  const [params] = useSearchParams()
  const { confirmPayment } = useStore()
  const [state, setState] = useState<'confirming' | 'done' | 'error'>('confirming')
  const [error, setError] = useState('')

  useEffect(() => {
    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amount = Number(params.get('amount'))
    if (!paymentKey || !orderId || !amount) {
      setState('error')
      setError('결제 정보를 확인하지 못했어요.')
      return
    }
    confirmPayment(paymentKey, orderId, amount)
      .then(() => setState('done'))
      .catch((err) => {
        setState('error')
        setError(err instanceof ApiError ? err.message : '결제 승인에 실패했어요.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col items-center px-5 pb-6 pt-10 text-center">
      {state === 'confirming' && (
        <>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-tint text-3xl">⏳</span>
          <h1 className="mt-4 text-lg font-extrabold text-ink">결제 확인 중이에요…</h1>
        </>
      )}
      {state === 'done' && (
        <>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-tint text-3xl">✅</span>
          <h1 className="mt-4 text-lg font-extrabold text-ink">프리미엄이 시작됐어요!</h1>
          <p className="mt-1 text-sm text-ink-soft">더 많은 챌린지와 통계를 이용해보세요.</p>
          <Link
            to="/me"
            className="mt-5 rounded-full bg-gradient-primary-soft px-6 py-2.5 text-sm font-extrabold text-white shadow-glow active:scale-95"
          >
            마이페이지로
          </Link>
        </>
      )}
      {state === 'error' && (
        <>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-warn-tint text-3xl">⚠️</span>
          <h1 className="mt-4 text-lg font-extrabold text-ink">결제 승인에 실패했어요</h1>
          <p className="mt-1 text-sm text-ink-soft">{error}</p>
          <Link
            to="/premium"
            className="mt-5 rounded-full bg-gradient-primary-soft px-6 py-2.5 text-sm font-extrabold text-white shadow-glow active:scale-95"
          >
            다시 시도하기
          </Link>
        </>
      )}
    </div>
  )
}

export function PremiumFail() {
  const [params] = useSearchParams()
  const message = params.get('message') || '결제가 취소됐어요.'

  return (
    <div className="flex flex-col items-center px-5 pb-6 pt-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-warn-tint text-3xl">⚠️</span>
      <h1 className="mt-4 text-lg font-extrabold text-ink">결제하지 못했어요</h1>
      <p className="mt-1 text-sm text-ink-soft">{message}</p>
      <Link
        to="/premium"
        className="mt-5 rounded-full bg-gradient-primary-soft px-6 py-2.5 text-sm font-extrabold text-white shadow-glow active:scale-95"
      >
        다시 시도하기
      </Link>
    </div>
  )
}
