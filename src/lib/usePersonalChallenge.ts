import { useStore } from '../state/store'

/**
 * A "개인 챌린지" (solo challenge) now stands in for what used to be a
 * separate personal Goal — this hook finds the user's most recent one so
 * Home/Verify/Stats can show progress against it without a separate concept.
 */
export function usePersonalChallenge() {
  const { challenges } = useStore()
  const personalChallenge = challenges?.find((c) => c.mode === 'solo') ?? null

  return { challenges, personalChallenge, loading: challenges === null }
}
