'use client'

import { useApp } from '@/lib/AppContext'
import { Sun, Moon, Bell, Search, Menu, Command } from 'lucide-react'
import { useState, useEffect } from 'react'

interface TopBarProps { title?: string }

export default function TopBar({ title }: TopBarProps) {
  const { theme, toggleTheme, language, setLanguage, toggleSidebar, t } = useApp()
  const [search, setSearch] = useState('')
  const [notifications] = useState(5)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header
      suppressHydrationWarning
      className="fixed top-0 right-0 z-40 h-16 flex items-center justify-between px-8 gap-6
        bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
      style={{
        left: 'var(--sidebar-width)',
        transition: mounted ? 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      {/* Left Section: Title & Mobile Toggle */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar} 
          className="p-2 rounded-lg hover:bg-accent transition-colors lg:hidden text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-xl font-black text-foreground tracking-tight hidden sm:block">{title}</h1>
        )}
      </div>

      {/* Middle Section: Professional Search */}
      <div className="flex-1 max-w-md hidden md:flex items-center gap-3 header-search">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('search')}
        />
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-bold text-muted-foreground">
          <Command className="w-2.5 h-2.5" />
          <span>K</span>
        </div>
      </div>

      {/* Right Section: Controls */}
      <div className="flex items-center gap-3">
        {/* Professional Language Switcher */}
        <div className="lang-toggle">
          <button
            onClick={() => setLanguage('bn')}
            className={language === 'bn' ? 'active' : 'text-muted-foreground'}
          >
            বাং
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={language === 'en' ? 'active' : 'text-muted-foreground'}
          >
            EN
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-accent transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl hover:bg-accent transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-border">
          <Bell className="w-4 h-4" />
          {notifications > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive ring-2 ring-background shadow-lg animate-pulse" />
          )}
        </button>

        {/* User Profile (Premium) */}
        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border group cursor-pointer">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-xs font-black text-white shadow-lg group-hover:scale-105 transition-transform">
              A
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="text-xs font-black text-foreground leading-none tracking-tight">{t('admin_user')}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">{t('super_admin')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
