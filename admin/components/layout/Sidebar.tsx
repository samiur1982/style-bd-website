'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useApp } from '@/lib/AppContext'
import {
  LayoutDashboard, ShoppingCart, Package, Users, BarChart3,
  Megaphone, Truck, CreditCard, Tag, ShoppingBag, Settings,
  Radio, Sparkles, ChevronLeft, ChevronRight, PlusCircle,
  Store, ChevronDown, Menu, Star, UserCog, FileText
} from 'lucide-react'

interface NavItem {
  key: string
  href: string
  icon: any
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    key: 'orders',
    href: '/dashboard/orders',
    icon: ShoppingCart,
    children: [
      { key: 'orders_list', href: '/dashboard/orders', icon: ShoppingCart },
      { key: 'fake_customers', href: '/dashboard/orders/fake-customers', icon: Users },
    ]
  },
  {
    key: 'products',
    href: '/dashboard/products',
    icon: Package,
    children: [
      { key: 'products_list', href: '/dashboard/products', icon: Package },
      { key: 'add_new_product', href: '/dashboard/products/add', icon: PlusCircle },
      { key: 'new_arrivals', href: '/dashboard/new-arrivals', icon: Star },
      { key: 'setup', href: '/dashboard/setup', icon: Sparkles },
    ]
  },
  { key: 'media', href: '/dashboard/media', icon: ShoppingBag },
  { key: 'customers', href: '/dashboard/customers', icon: Users },
  { key: 'analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { key: 'marketing', href: '/dashboard/marketing', icon: Megaphone },
  { key: 'courier', href: '/dashboard/courier', icon: Truck },
  { key: 'payments', href: '/dashboard/payments', icon: CreditCard },
  { key: 'coupons', href: '/dashboard/coupons', icon: Tag },
  { key: 'abandoned_cart', href: '/dashboard/abandoned-cart', icon: ShoppingBag },
]

const settingsItems: NavItem[] = [
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
  { key: 'tracking', href: '/dashboard/settings/tracking', icon: Radio },
  { key: 'users', href: '/dashboard/settings/users', icon: UserCog },
  { key: 'pages', href: '/dashboard/settings/pages', icon: FileText },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, t } = useApp()
  const pathname = usePathname()
  const router = useRouter()
  const [openMenus, setOpenMenus] = useState<string[]>([])

  // Auto-open menu based on current path
  useEffect(() => {
    const activeItem = navItems.find(item =>
      item.children?.some(child => pathname.startsWith(child.href))
    )
    if (activeItem && !openMenus.includes(activeItem.key)) {
      setOpenMenus([activeItem.key])
    }
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const toggleMenu = (key: string) => {
    setOpenMenus(prev =>
      prev.includes(key) ? [] : [key] // Accordion behavior: only one open at a time
    )
  }

  const renderNavItem = (item: NavItem, isChild = false) => {
    const Icon = item.icon
    const isAnyChildActive = item.children?.some(child => pathname === child.href)
    const active = isActive(item.href) || isAnyChildActive
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openMenus.includes(item.key)

    if (hasChildren) {
      return (
        <div key={item.key} className="flex flex-col">
          <div className="relative group">
            <button
              onClick={() => {
                if (sidebarCollapsed) {
                  toggleSidebar()
                  setOpenMenus([item.key])
                } else {
                  toggleMenu(item.key)
                }
              }}
              className={`sidebar-link w-full ${active ? 'active shadow-sm bg-primary/10' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="sidebar-text">{t(item.key)}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 sidebar-hide-when-collapsed ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className="sidebar-tooltip">{t(item.key)}</div>
          </div>

          {isOpen && !sidebarCollapsed && (
            <div className="sidebar-submenu animate-in fade-in slide-in-from-top-2 duration-300">
              {item.children!.map(child => (
                <Link
                  key={child.key}
                  href={child.href}
                  className={`sidebar-link-child flex items-center gap-2 group/child ${isActive(child.href) ? 'text-primary font-black bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive(child.href) ? 'bg-primary scale-110' : 'bg-border group-hover/child:bg-muted-foreground'}`} />
                  {t(child.key)}
                </Link>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <div key={item.key} className="relative group">
        <Link
          href={item.href}
          className={`sidebar-link ${active ? 'active' : ''} ${isChild ? 'sidebar-link-child' : ''}`}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="sidebar-text">{t(item.key)}</span>
          </div>
        </Link>
        <div className="sidebar-tooltip">{t(item.key)}</div>
      </div>
    )
  }

  return (
    <aside
      suppressHydrationWarning
      className="fixed top-0 left-0 h-screen z-50 flex flex-col bg-card border-r border-border shadow-2xl"
      style={{
        width: 'var(--sidebar-width)',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* ── Logo Header ── */}
      <div className="sidebar-logo-row flex items-center h-16 border-b border-border px-4">
        <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="sidebar-logo-text min-w-0">
            <p className="text-sm font-black text-foreground leading-none tracking-tight uppercase">{t('style_bd')}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{t('command_center')}</p>
          </div>
        </div>

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
        >
          {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Main Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-visible py-6 space-y-1 custom-scrollbar">
        {navItems.map(item => renderNavItem(item))}

        <div className="my-4 px-6 sidebar-text">
          <div className="h-px bg-border w-full" />
        </div>

        {settingsItems.map(item => renderNavItem(item))}
      </nav>

      {/* ── Status Footer ── */}
      <div className="p-4 border-t border-border sidebar-hide-when-collapsed bg-accent/5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('server_status')}</p>
            <p className="text-xs font-bold text-emerald-500 truncate">Node-Primary: {t('active')}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
