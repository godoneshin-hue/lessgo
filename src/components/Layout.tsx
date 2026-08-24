import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import ToastStack from './ToastStack'
import UpdateBanner from './UpdateBanner'

export default function Layout() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-bg sm:flex sm:items-center sm:justify-center sm:bg-[#F0E1D5] sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 hidden h-72 w-72 rounded-full bg-primary-tint opacity-70 blur-3xl sm:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -right-16 hidden h-80 w-80 rounded-full bg-warn-tint opacity-60 blur-3xl sm:block"
      />

      <div className="app-shell relative mx-auto flex h-[100dvh] w-full max-w-shell flex-col overflow-hidden bg-bg sm:h-shell sm:rounded-[36px] sm:border sm:border-line sm:shadow-card">
        <TopBar />
        <main className="no-scrollbar relative flex-1 overflow-y-auto pb-nav">
          <Outlet />
        </main>
        <BottomNav />
        <ToastStack />
        <UpdateBanner />
      </div>
    </div>
  )
}
