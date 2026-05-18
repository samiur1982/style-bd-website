'use client'

import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, PrimaryButton, StatusBadge, SectionHeader } from '@/components/ui/Components'
import { useState } from 'react'
import {
  Search, Plus, Users, Star, ShoppingCart, TrendingUp, Phone, Mail,
  MapPin, Calendar, X, Edit, Save, MessageSquare, Package, ChevronRight, Download
} from 'lucide-react'

type Segment = 'vip' | 'regular' | 'new' | 'at_risk' | 'inactive'
type Customer = {
  id: number; name: string; email: string; phone: string; address: string;
  segment: Segment; totalOrders: number; totalSpent: number; avgOrder: number;
  lastOrder: string; joinedAt: string; note: string;
}

const INIT_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Fatema Khatun', email: 'fatema@example.com', phone: '01712345678', address: 'Mirpur, Dhaka', segment: 'vip', totalOrders: 18, totalSpent: 52400, avgOrder: 2911, lastOrder: '03 Apr 2026', joinedAt: 'Jan 2025', note: 'Prefers Kurti. Always pays on delivery.' },
  { id: 2, name: 'Nasrin Akter', email: 'nasrin@example.com', phone: '01898765432', address: 'Dhanmondi, Dhaka', segment: 'vip', totalOrders: 12, totalSpent: 41200, avgOrder: 3433, lastOrder: '02 Apr 2026', joinedAt: 'Mar 2025', note: 'High-value customer. Buys Borkha frequently.' },
  { id: 3, name: 'Rima Begum', email: 'rima@example.com', phone: '01534567891', address: 'Chittagong', segment: 'regular', totalOrders: 6, totalSpent: 16800, avgOrder: 2800, lastOrder: '01 Apr 2026', joinedAt: 'Jun 2025', note: '' },
  { id: 4, name: 'Sadia Islam', email: 'sadia@example.com', phone: '01623456789', address: 'Sylhet', segment: 'regular', totalOrders: 4, totalSpent: 10400, avgOrder: 2600, lastOrder: '31 Mar 2026', joinedAt: 'Aug 2025', note: '' },
  { id: 5, name: 'Meherun Nessa', email: 'meherun@example.com', phone: '01745678901', address: 'Rajshahi', segment: 'new', totalOrders: 2, totalSpent: 3600, avgOrder: 1800, lastOrder: '30 Mar 2026', joinedAt: 'Mar 2026', note: 'Referred by Fatema.' },
  { id: 6, name: 'Sharmin Akter', email: 'sharmin@example.com', phone: '01856789012', address: 'Khulna', segment: 'at_risk', totalOrders: 8, totalSpent: 22400, avgOrder: 2800, lastOrder: '15 Feb 2026', joinedAt: 'Jan 2025', note: 'Cancelled last order. Follow up.' },
  { id: 7, name: 'Tahmina Parvin', email: 'tahmina@example.com', phone: '01967890123', address: 'Comilla', segment: 'inactive', totalOrders: 3, totalSpent: 8700, avgOrder: 2900, lastOrder: '10 Jan 2026', joinedAt: 'Sep 2024', note: '' },
]

const getSegmentConfig = (t: any) => ({
  vip:      { label: `⭐ ${t('vip')}`, cls: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' },
  regular:  { label: `✅ ${t('regular')}`, cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' },
  new:      { label: `🆕 ${t('new')}`, cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' },
  at_risk:  { label: `⚠ ${t('at_risk')}`, cls: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' },
  inactive: { label: `💤 ${t('inactive')}`, cls: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400' },
})

const ORDERS_MAP: Record<number, { id: string; product: string; amount: string; status: string; date: string }[]> = {
  1: [
    { id: '#ORD-1051', product: 'Kurti (M, Red)', amount: '৳2,400', status: 'pending', date: '03 Apr' },
    { id: '#ORD-1038', product: 'Salowar-Kamiz 2pc', amount: '৳2,500', status: 'delivered', date: '15 Mar' },
    { id: '#ORD-1022', product: 'Kurti Premium', amount: '৳2,200', status: 'delivered', date: '02 Mar' },
  ],
  2: [
    { id: '#ORD-1050', product: 'Borkha (XL, Black)', amount: '৳3,500', status: 'confirmed', date: '02 Apr' },
    { id: '#ORD-1035', product: 'Party Borkha', amount: '৳4,800', status: 'delivered', date: '12 Mar' },
  ],
}

function SegmentBadge({ segment }: { segment: Segment }) {
  const { t } = useApp()
  const SEGMENT_CONFIG = getSegmentConfig(t)
  const cfg = SEGMENT_CONFIG[segment]
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
}

function CustomerDrawer({ customer, onClose, onEdit }: {
  customer: Customer; onClose: () => void; onEdit: (c: Customer) => void
}) {
  const { t } = useApp()
  const orders = ORDERS_MAP[customer.id] ?? []
  return (
    <div className="fixed inset-0 z-50 flex bg-black/60" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full max-w-md ml-auto h-full flex flex-col overflow-y-auto border-l border-border shadow-2xl bg-card"
        style={{ animation: 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        {/* Profile Header */}
        <div className="relative bg-gradient-to-br from-[hsl(var(--primary))] to-blue-400 p-6 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mb-3">
            {customer.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold">{customer.name}</h2>
          <p className="text-white/70 text-sm">{customer.email}</p>
          <div className="mt-3">
            <SegmentBadge segment={customer.segment} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 border-b border-border">
          {[
            { label: t('total_orders'), value: customer.totalOrders },
            { label: t('total_spent'), value: `৳${(customer.totalSpent/1000).toFixed(1)}k` },
            { label: t('avg_order'), value: `৳${customer.avgOrder.toLocaleString()}` },
          ].map(s => (
            <div key={s.label} className="p-4 text-center border-r last:border-r-0 border-border">
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Contact Info */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">{t('contact_info')}</p>
            <div className="space-y-2.5">
              {[
                { icon: Phone, label: customer.phone },
                { icon: Mail, label: customer.email },
                { icon: MapPin, label: customer.address },
                { icon: Calendar, label: `${t('joined')}: ${customer.joinedAt} · ${t('last_order')}: ${customer.lastOrder}` },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <item.icon className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">{t('note')}</p>
            <div className="p-3 rounded-xl bg-muted border border-border text-sm text-muted-foreground">
              {customer.note || <span className="italic opacity-50">{t('no_notes')}</span>}
            </div>
          </div>

          {/* Order History */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">{t('order_history')}</p>
            {orders.length > 0 ? (
              <div className="space-y-2">
                {orders.map((o, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-primary">{o.id}</span>
                        <span className="text-xs text-muted-foreground">{o.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{o.product}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-foreground">{o.amount}</p>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground text-sm">{t('no_orders_found')}</div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors">
              <MessageSquare className="w-4 h-4" /> {t('message')}
            </button>
            <button onClick={() => onEdit(customer)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
              <Edit className="w-4 h-4" /> {t('edit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditCustomerModal({ customer, onSave, onClose }: {
  customer: Customer; onSave: (c: Customer) => void; onClose: () => void
}) {
  const { t } = useApp()
  const [form, setForm] = useState(customer)
  const set = (k: keyof Customer, v: unknown) => setForm(p => ({ ...p, [k]: v }))
  const SEGMENT_CONFIG = getSegmentConfig(t)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-border bg-card shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-bold text-foreground">{t('edit')} {t('customer')}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-4">
          {([[t('customer_name'), 'name', 'text'], [t('phone_number'), 'phone', 'tel'], [t('email'), 'email', 'email'], [t('address'), 'address', 'text']] as [string, keyof Customer, string][]).map(([label, k, type]) => (
            <div key={k}>
              <label className="label">{label}</label>
              <input type={type} value={form[k] as string} onChange={e => set(k, e.target.value)} className="input" />
            </div>
          ))}
          <div>
            <label className="label">{t('segment')}</label>
            <select value={form.segment} onChange={e => set('segment', e.target.value)} className="input">
              {Object.entries(SEGMENT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('note')}</label>
            <textarea rows={2} value={form.note} onChange={e => set('note', e.target.value)} className="input resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">{t('cancel')}</button>
          <button onClick={() => onSave(form)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" /> {t('save_customer')}
          </button>
        </div>
        <style>{`.label { display:block; font-size:.8125rem; font-weight:500; color:var(--color-foreground); margin-bottom:.375rem; } .input { width:100%; padding:.625rem .875rem; border-radius:.625rem; border:1px solid var(--color-border); background:var(--color-muted); color:var(--color-foreground); font-size:.875rem; outline:none; }`}</style>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const { t, language } = useApp()
  const [customers, setCustomers] = useState<Customer[]>(INIT_CUSTOMERS)
  const [search, setSearch] = useState('')
  const [segFilter, setSegFilter] = useState<'all' | Segment>('all')
  const SEGMENT_CONFIG = getSegmentConfig(t)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [editing, setEditing] = useState<Customer | null>(null)

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email.includes(search)
    const matchSeg = segFilter === 'all' || c.segment === segFilter
    return matchSearch && matchSeg
  })

  const stats = {
    total: customers.length,
    totalRevenue: customers.reduce((a, c) => a + c.totalSpent, 0),
    vip: customers.filter(c => c.segment === 'vip').length,
    atRisk: customers.filter(c => c.segment === 'at_risk' || c.segment === 'inactive').length,
    avgLifetimeValue: Math.round(customers.reduce((a, c) => a + c.totalSpent, 0) / customers.length),
  }

  const handleSave = (c: Customer) => {
    setCustomers(prev => prev.map(x => x.id === c.id ? c : x))
    setEditing(null); setSelected(null)
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Address', 'Segment', 'Total Orders', 'Total Spent (BDT)', 'Avg Order Value (BDT)', 'Last Order Date', 'Joined Date', 'Note']
    const rows = filtered.map(c => [
      c.id,
      `"${c.name}"`,
      `="${c.phone}"`, // Force Excel to treat as string to preserve leading zero
      c.email,
      `"${c.address}"`,
      c.segment,
      c.totalOrders,
      c.totalSpent,
      c.avgOrder,
      c.lastOrder,
      c.joinedAt,
      `"${c.note}"`
    ])
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    // Add UTF-8 BOM so Excel properly reads non-ASCII characters (like Bangla text)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Customers_Export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DashboardLayout title={t('customers')}>
      <div className="page-container">
        <PageHeader
          title={t('customers')}
          subtitle={`${customers.length}${language === 'bn' ? 'জন' : ''} ${t('customers')} · Total LTV ৳${(stats.totalRevenue / 1000).toFixed(0)}k`}
          actions={
            <div className="flex items-center gap-3">
              <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors outline-none">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <PrimaryButton>
                <Plus className="w-4 h-4" /> {t('new')} {t('customer')}
              </PrimaryButton>
            </div>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('total_customers'), value: stats.total, icon: Users, cls: 'from-blue-500 to-blue-600' },
            { label: `${t('vip')} ${t('customers')}`, value: stats.vip, icon: Star, cls: 'from-yellow-500 to-amber-500' },
            { label: t('total_revenue'), value: `৳${(stats.totalRevenue / 1000).toFixed(0)}k`, icon: TrendingUp, cls: 'from-emerald-500 to-green-600' },
            { label: `Avg ${t('ltv')}`, value: `৳${stats.avgLifetimeValue.toLocaleString()}`, icon: ShoppingCart, cls: 'from-purple-500 to-violet-600' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.cls} flex items-center justify-center shadow-md flex-shrink-0`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Segment filter */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSegFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${segFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {t('all_customers')} ({customers.length})
          </button>
          {Object.entries(SEGMENT_CONFIG).map(([k, v]) => {
            const count = customers.filter(c => c.segment === k).length
            return (
              <button key={k} onClick={() => setSegFilter(k as Segment)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${segFilter === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {v.label} ({count})
              </button>
            )
          })}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-muted border border-border mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('search_customers')}
              className="bg-transparent flex-1 outline-none text-sm text-foreground placeholder:text-muted-foreground" />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[t('customer'), t('phone'), t('segment'), t('orders'), t('total_spent'), t('last_order'), ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">{t('no_customers_found')}</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3"><SegmentBadge segment={c.segment} /></td>
                    <td className="px-4 py-3 font-semibold text-foreground">{c.totalOrders}{language === 'bn' ? 'টি' : ''}</td>
                    <td className="px-4 py-3 font-semibold text-primary">৳{c.totalSpent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.lastOrder}</td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && !editing && (
        <CustomerDrawer customer={selected} onClose={() => setSelected(null)} onEdit={c => setEditing(c)} />
      )}
      {editing && (
        <EditCustomerModal customer={editing} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </DashboardLayout>
  )
}
