'use client'

import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader } from '@/components/ui/Components'
import { useState } from 'react'
import { ShoppingBag, Mail, MessageSquare, Phone, Clock, X, CheckCircle, TrendingUp } from 'lucide-react'

type Cart = {
  id: number; name: string; phone: string; email: string; items: string[];
  value: number; abandondedAt: string; hoursAgo: number; recovered: boolean; contacted: boolean
}

const INIT_CARTS: Cart[] = [
  { id: 1, name: 'Anonymous #A332', phone: '', email: '', items: ['Borkha (XL)', 'Kurti (M)'], value: 4700, abandondedAt: '2026-04-03 01:00', hoursAgo: 2, recovered: false, contacted: false },
  { id: 2, name: 'Sharmin Akter', phone: '01856789012', email: 'sharmin@example.com', items: ['Party Borkha', 'Salowar-Kamiz 2pc', 'Kurti Premium'], value: 10100, abandondedAt: '2026-04-02 23:00', hoursAgo: 4, recovered: false, contacted: true },
  { id: 3, name: 'Anonymous #A291', phone: '', email: '', items: ['Pant-Kamiz 2pc (S)'], value: 2800, abandondedAt: '2026-04-02 21:00', hoursAgo: 6, recovered: false, contacted: false },
  { id: 4, name: 'Rima Begum', phone: '01534567891', email: 'rima@example.com', items: ['Kurti (L, Blue)', 'Kurti Premium'], value: 3400, abandondedAt: '2026-04-02 19:00', hoursAgo: 8, recovered: true, contacted: true },
  { id: 5, name: 'Anonymous #A255', phone: '', email: '', items: ['Borkha (M)'], value: 3500, abandondedAt: '2026-04-02 15:00', hoursAgo: 12, recovered: false, contacted: false },
]

export default function AbandonedCartPage() {
  const { t, language } = useApp()
  const [carts, setCarts] = useState<Cart[]>(INIT_CARTS)
  const [sentId, setSentId] = useState<number | null>(null)

  const markContacted = (id: number) => {
    setCarts(prev => prev.map(c => c.id === id ? { ...c, contacted: true } : c))
    setSentId(id); setTimeout(() => setSentId(null), 2000)
  }
  const markRecovered = (id: number) => setCarts(prev => prev.map(c => c.id === id ? { ...c, recovered: true } : c))
  const dismiss = (id: number) => setCarts(prev => prev.filter(c => c.id !== id))

  const active = carts.filter(c => !c.recovered)
  const recovered = carts.filter(c => c.recovered)
  const totalRecoverable = active.reduce((a, c) => a + c.value, 0)
  const totalRecovered = recovered.reduce((a, c) => a + c.value, 0)

  return (
    <DashboardLayout title={t('abandoned_cart')}>
      <div className="page-container">
        <PageHeader title={t('abandoned_cart')} subtitle={t('abandoned_cart_subtitle')} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('abandoned_cart'), value: active.length, cls: 'text-amber-600 dark:text-amber-400' },
            { label: t('potential_recovery'), value: `৳${totalRecoverable.toLocaleString()}`, cls: 'text-blue-600 dark:text-blue-400' },
            { label: t('recovered_carts'), value: recovered.length, cls: 'text-emerald-600 dark:text-emerald-400' },
            { label: t('recovered_value'), value: `৳${totalRecovered.toLocaleString()}`, cls: 'text-purple-600 dark:text-purple-400' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4">
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recovery rate bar */}
        {carts.length > 0 && (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{t('recovery_rate')}</span>
              </div>
              <span className="text-sm font-bold text-emerald-500">{((recovered.length / carts.length) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(recovered.length / carts.length) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Active carts */}
        <div>
          <h2 className="text-base font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-500" /> {t('active_abandoned_carts')} ({active.length})
          </h2>
          <div className="space-y-3">
            {active.length === 0 ? (
              <div className="glass-card p-8 text-center text-[hsl(var(--muted-foreground))]">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p>{t('all_recovered_hint')}</p>
              </div>
            ) : active.map(c => (
              <div key={c.id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-[hsl(var(--foreground))]">{c.name}</h3>
                      <span className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <Clock className="w-3 h-3" /> {c.hoursAgo} {t('hours_ago')}
                      </span>
                      {c.contacted && <span className="badge-primary">{t('contacted')}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {c.items.map((item, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-xs text-[hsl(var(--foreground))]">{item}</span>
                      ))}
                    </div>
                    <p className="text-xl font-bold text-[hsl(var(--primary))]">৳{c.value.toLocaleString()}</p>
                  </div>
                  <button onClick={() => dismiss(c.id)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors text-[hsl(var(--muted-foreground))]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[hsl(var(--border))]">
                  {c.email && (
                    <button onClick={() => markContacted(c.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${sentId === c.id ? 'bg-emerald-500 text-white' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40'}`}>
                      {sentId === c.id ? <CheckCircle className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                      {sentId === c.id ? t('email_sent') : t('send_recovery_email')}
                    </button>
                  )}
                  {c.phone && (
                    <button onClick={() => markContacted(c.id)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors">
                      <Phone className="w-3.5 h-3.5" /> {t('send_sms')}
                    </button>
                  )}
                  <button onClick={() => markRecovered(c.id)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-medium hover:bg-[hsl(var(--primary)/0.2)] transition-colors ml-auto">
                    <CheckCircle className="w-3.5 h-3.5" /> {t('mark_recovered')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recovered */}
        {recovered.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> {t('recovered_carts')} ({recovered.length})
            </h2>
            <div className="space-y-2">
              {recovered.map(c => (
                <div key={c.id} className="glass-card p-4 opacity-70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-[hsl(var(--foreground))]">{c.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{c.items.join(', ')}</p>
                    </div>
                  </div>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">৳{c.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
