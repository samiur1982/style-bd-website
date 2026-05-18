'use client'

import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function DashboardLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={`min-h-screen bg-background ${!mounted ? 'no-transitions' : ''}`} suppressHydrationWarning>
      <Sidebar />
      <div
        suppressHydrationWarning
        className="min-h-screen"
        style={{
          marginLeft: 'var(--sidebar-width)',
          paddingTop: '64px',
          transition: mounted ? 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        <TopBar title={title} />
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}
