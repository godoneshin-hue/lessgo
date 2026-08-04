// Catalog icons are now image paths (see state/seed.ts), but challenges saved
// before that change still have an emoji string in their stored appLimits —
// render either shape so old data doesn't break.
export default function AppIcon({ icon, className }: { icon: string; className?: string }) {
  if (icon.startsWith('/')) {
    return <img src={icon} alt="" className={className} />
  }
  return <span className={className}>{icon}</span>
}
