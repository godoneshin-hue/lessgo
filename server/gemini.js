const MODEL = 'gemini-2.5-flash'

// Screenshots are always sent as data URLs from the browser file input.
function parseDataUrl(dataUrl) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  return { mimeType: match[1], data: match[2] }
}

export async function analyzeScreenTimeImages(images, trackedAppNames) {
  const parts = []
  for (const dataUrl of images) {
    const parsed = parseDataUrl(dataUrl)
    if (parsed) parts.push({ inline_data: { mime_type: parsed.mimeType, data: parsed.data } })
  }
  if (parts.length === 0) return { totalMinutes: null, apps: [], hasPerAppBreakdown: false }

  const prompt = `아이폰/안드로이드 스크린타임(사용 시간) 설정 화면 스크린샷이야. 이 사용자가 추적 중인 앱 목록: ${trackedAppNames.join(', ')}.

스크린샷에서:
1. 오늘의 전체 스마트폰 사용 시간 총합(분 단위)이 보이면 totalMinutes에 넣어줘. 안 보이면 null.
2. 위 추적 앱 목록 중, 스크린샷에 앱별 사용 시간이 따로 나와있는 게 있으면 apps 배열에 넣어줘. 스크린샷엔 앱 이름이 영어(예: Instagram, YouTube, KakaoTalk)로 나올 수 있는데, 반드시 추적 목록에 있는 한국어 이름 그대로 매칭해서 넣어줘 (목록에 없는 앱은 무시). 분 단위 정수로.
3. 앱별 세부 내역이 화면에 하나라도 있었으면 hasPerAppBreakdown을 true로, 총 사용시간만 있고 앱별 내역이 전혀 없었으면 false로.

반드시 JSON만 응답해.`

  const body = {
    contents: [{ parts: [{ text: prompt }, ...parts] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          totalMinutes: { type: 'integer', nullable: true },
          apps: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, minutes: { type: 'integer' } },
              required: ['name', 'minutes'],
            },
          },
          hasPerAppBreakdown: { type: 'boolean' },
        },
        required: ['apps', 'hasPerAppBreakdown'],
      },
    },
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )
  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')

  const parsed = JSON.parse(text)
  const trackedSet = new Set(trackedAppNames)
  return {
    totalMinutes: typeof parsed.totalMinutes === 'number' ? parsed.totalMinutes : null,
    apps: (parsed.apps ?? []).filter((a) => trackedSet.has(a.name)),
    hasPerAppBreakdown: Boolean(parsed.hasPerAppBreakdown),
  }
}
