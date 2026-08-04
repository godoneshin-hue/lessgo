import { PHOTO_PRESETS, BACKGROUND_PRESETS, toBackgroundStyle } from '../state/seed'
import { fileToAvatarDataUrl, fileToScreenshotDataUrl } from '../lib/image'
import { CameraIcon } from './icons'

export default function ChallengeAppearancePicker({
  photo,
  onPhoto,
  background,
  onBackground,
  memo,
  onMemo,
}: {
  photo: string
  onPhoto: (v: string) => void
  background: string
  onBackground: (v: string) => void
  memo: string
  onMemo: (v: string) => void
}) {
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onPhoto(await fileToAvatarDataUrl(file, 160))
  }

  async function handleBackgroundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onBackground(await fileToScreenshotDataUrl(file, 900))
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-bold text-ink">챌린지 사진</p>
        <div className="mt-2.5 flex items-center gap-2.5">
          <span
            className="h-14 w-14 shrink-0 rounded-full border-2 border-white bg-cover bg-center shadow-card"
            style={toBackgroundStyle(photo || PHOTO_PRESETS[0])}
          />
          <div className="flex flex-1 flex-wrap gap-2">
            {PHOTO_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onPhoto(color)}
                aria-label="기본 사진 선택"
                className={`h-8 w-8 rounded-full transition-transform active:scale-90 ${photo === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                style={{ background: color }}
              />
            ))}
            <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-line text-ink-faint hover:border-primary hover:text-primary-ink">
              <CameraIcon className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-ink">배경 사진</p>
        <div
          className="mt-2.5 h-16 w-full rounded-2xl border border-line bg-cover bg-center"
          style={toBackgroundStyle(background || BACKGROUND_PRESETS[0])}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {BACKGROUND_PRESETS.map((grad) => (
            <button
              key={grad}
              type="button"
              onClick={() => onBackground(grad)}
              aria-label="기본 배경 선택"
              className={`h-8 w-8 rounded-lg transition-transform active:scale-90 ${background === grad ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              style={{ background: grad }}
            />
          ))}
          <label className="flex h-8 items-center gap-1 rounded-lg border border-dashed border-line px-2.5 text-[11px] font-semibold text-ink-faint hover:border-primary hover:text-primary-ink">
            사진보관함에서 추가하기
            <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
          </label>
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-ink">메모 (선택)</p>
        <input
          value={memo}
          onChange={(e) => onMemo(e.target.value)}
          placeholder="짧은 메모를 남겨보세요"
          maxLength={60}
          className="mt-2.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink outline-none focus:border-primary"
        />
      </div>
    </div>
  )
}
