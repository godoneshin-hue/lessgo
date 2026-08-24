const MODEL = 'gemini-2.5-flash'

// Screenshots are always sent as data URLs from the browser file input.
function parseDataUrl(dataUrl) {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl)
  if (!match) return null
  return { mimeType: match[1], data: match[2] }
}

export async function analyzeScreenTimeImages(images, trackedAppNames, todayLabel) {
  const parts = []
  for (const dataUrl of images) {
    const parsed = parseDataUrl(dataUrl)
    if (parsed) parts.push({ inline_data: { mime_type: parsed.mimeType, data: parsed.data } })
  }
  if (parts.length === 0) return { isAuthentic: false, totalMinutes: null, apps: [], hasPerAppBreakdown: false, dateMatches: null }

  const prompt = `이 이미지가 아이폰의 "스크린타임" 설정 화면 또는 안드로이드의 "디지털 웰빙" 사용 시간 화면을 실제로 촬영/캡처한 스크린샷인지부터 판단해. 종이에 손으로 쓴 숫자, 다른 앱 화면, 메모장, 편집되었거나 그럴듯하게 조작된 이미지, 스크린타임 화면과 무관한 사진은 전부 진짜가 아니야 — 실제 iOS/Android 시스템 UI(상태바, 앱 아이콘, 시스템 폰트, 시스템 고유의 그래프/리스트 레이아웃)가 뚜렷이 보여야 진짜로 인정해. 조금이라도 의심되면 안전하게 가짜(false)로 판단해.

진짜라고 판단했을 때만 아래 정보를 채워:
오늘 날짜는 ${todayLabel}이고, 이 사용자가 추적 중인 앱 목록: ${trackedAppNames.join(', ')}.

1. 오늘의 전체 스마트폰 사용 시간 총합(분 단위)이 보이면 totalMinutes에 넣어줘. 안 보이면 null.
2. 위 추적 앱 목록 중, 스크린샷에 앱별 사용 시간이 따로 나와있는 게 있으면 apps 배열에 넣어줘. 스크린샷엔 앱 이름이 영어(예: Instagram, YouTube, KakaoTalk)로 나올 수 있는데, 반드시 추적 목록에 있는 한국어 이름 그대로 매칭해서 넣어줘 (목록에 없는 앱은 무시). 분 단위 정수로.
3. 앱별 세부 내역이 화면에 하나라도 있었으면 hasPerAppBreakdown을 true로, 총 사용시간만 있고 앱별 내역이 전혀 없었으면 false로.
4. 화면에 날짜나 요일이 표시돼 있으면(예: "오늘", "Today", 구체적 날짜, 요일별 그래프에서 선택된 날) 그게 ${todayLabel}과 같은 날인지 dateMatches에 true/false로 넣어줘. 스크린샷에 날짜 정보가 전혀 없어서 판단할 수 없으면 null로 해줘.

isAuthentic이 false면 다른 필드는 다 빈 값/null로 둬도 돼.

반드시 JSON만 응답해.`

  const body = {
    contents: [{ parts: [{ text: prompt }, ...parts] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          isAuthentic: { type: 'boolean' },
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
          dateMatches: { type: 'boolean', nullable: true },
        },
        required: ['isAuthentic', 'apps', 'hasPerAppBreakdown'],
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
  const isAuthentic = Boolean(parsed.isAuthentic)
  return {
    isAuthentic,
    totalMinutes: isAuthentic && typeof parsed.totalMinutes === 'number' ? parsed.totalMinutes : null,
    apps: isAuthentic ? (parsed.apps ?? []).filter((a) => trackedSet.has(a.name)) : [],
    hasPerAppBreakdown: isAuthentic && Boolean(parsed.hasPerAppBreakdown),
    dateMatches: isAuthentic && typeof parsed.dateMatches === 'boolean' ? parsed.dateMatches : null,
  }
}
