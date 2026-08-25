import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadPaymentWidget, type PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk'
import { useStore } from '../state/store'
import * as api from '../lib/api'
import { ApiError } from '../lib/api'
import { ChevronRightIcon } from '../components/icons'

// Toss's own public documentation test client key — safe to ship, since it
// only unlocks their sandbox. Swap for the real key (from Toss's 전자결제
// 신청) via VITE_TOSS_CLIENT_KEY once that's issued.
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm'

export default function Premium() {
  const navigate = useNavigate()
  const { profile, pushToast } = useStore()
  const [ready, setReady] = useState(false)
  const [paying, setPaying] = useState(false)
  const widgetRef = useRef<PaymentWidgetInstance | null>(null)
  const orderRef = useRef<{ orderId: string; amount: number; orderName: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function setup() {
      try {
        const order = await api.createPaymentOrder(profile.apiKey)
        if (cancelled) return
        orderRef.current = order
        const widget = await loadPaymentWidget(TOSS_CLIENT_KEY, profile.id)
        if (cancelled) return
        widgetRef.current = widget
        widget.renderPaymentMethods('#toss-payment-method', { value: order.amount })
        widget.renderAgreement('#toss-agreement')
        setReady(true)
      } catch {
        pushToast('결제 화면을 불러오지 못했어요. 다시 시도해주세요.')
      }
    }
    setup()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handlePay() {
    const order = orderRef.current
    const widget = widgetRef.current
    if (!order || !widget) return
    setPaying(true)
    try {
      await widget.requestPayment({
        orderId: order.orderId,
        orderName: order.orderName,
        customerName: profile.name,
        successUrl: `${window.location.origin}/premium/success`,
        failUrl: `${window.location.origin}/premium/fail`,
      })
    } catch (err) {
      // requestPayment rejects when the user just closes the payment sheet —
      // Toss's own errorCode distinguishes that from a real failure.
      if (err instanceof Error && (err as { code?: string }).code !== 'USER_CANCEL') {
        pushToast(err instanceof ApiError ? err.message : '결제를 시작하지 못했어요.')
      }
      setPaying(false)
    }
  }

  return (
    <div className="px-5 pb-6 pt-1">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:text-ink"
          aria-label="뒤로 가기"
        >
          <ChevronRightIcon className="h-5 w-5 rotate-180" />
        </button>
        <h1 className="text-lg font-extrabold tracking-tight text-ink">프리미엄 시작하기</h1>
      </div>

      <div className="rounded-3xl bg-surface p-5 shadow-card">
        <p className="text-sm font-bold text-ink">LessGo 프리미엄 · 월 3,900원</p>
        <p className="mt-1 text-xs text-ink-soft">친구 챌린지 무제한, 기부 챌린지 무제한, 전체 기간 통계</p>
      </div>

      <div id="toss-payment-method" className="mt-4" />
      <div id="toss-agreement" className="mt-3" />

      <button
        type="button"
        onClick={handlePay}
        disabled={!ready || paying}
        className="mt-5 w-full rounded-2xl bg-gradient-primary-soft py-3.5 text-sm font-extrabold text-white shadow-glow transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:bg-none disabled:text-ink-faint disabled:shadow-none"
      >
        {paying ? '결제 진행 중…' : '3,900원 결제하기'}
      </button>
    </div>
  )
}
