'use client'

import { useApp } from '@/lib/AppContext'
import { api } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, PrimaryButton, SectionHeader } from '@/components/ui/Components'
import { useEffect, useState } from 'react'
import { Plus, Tag, Trash2, Edit, X, Save, Copy, CheckCircle, Search, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type CouponType = 'percentage' | 'flat' | 'free_shipping'
type Coupon = {
  id: number; code: string; type: CouponType; value: number; min_order: number;
  usage_limit: number; used_count: number; expires_at: string; active: boolean; description: string;
}

const getTypes = (t: any): Record<CouponType, { label: string; cls: string }> => ({
  percentage:    { label: `% ${t('discount')}`, cls: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' },
  flat:          { label: `৳ ${t('flat')}`, cls: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30' },
  free_shipping: { label: `🚚 ${t('free')}`, cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' },
})

const EMPTY_COUPON: Omit<Coupon, 'id' | 'used_count'> = {
  code: '', type: 'percentage', value: 10, min_order: 0, usage_limit: 100,
  expires_at: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  active: true, description: '',
}

function CouponModal({ coupon, onSave, onClose }: {
  coupon: Coupon | null; onSave: (c: Coupon) => Promise<void>; onClose: () => void
}) {
  const { t } = useApp()
  const [form, setForm] = useState<Omit<Coupon, 'id' | 'used_count'>>(coupon ?? EMPTY_COUPON)
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave({ ...form, id: coupon?.id || 0, used_count: coupon?.used_count ?? 0 } as Coupon)
    } finally {
      setLoading(false)
    }
  }

  const discount = form.type === 'percentage' ? `${form.value}%` : form.type === 'flat' ? `৳${form.value}` : t('free_shipping')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground">{coupon ? t('edit_coupon') : t('create_new_coupon')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('discount')}: <strong>{discount}</strong></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-colors outline-none"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">{t('coupon_code')} *</label>
            <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} className="input font-mono text-lg tracking-widest" placeholder="EID2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('coupon_type')}</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="input">
                <option value="percentage">{t('percentage_off')}</option>
                <option value="flat">{t('flat_off')}</option>
                <option value="free_shipping">{t('free_shipping')}</option>
              </select>
            </div>
            {form.type !== 'free_shipping' && (
              <div>
                <label className="label">{form.type === 'percentage' ? t('percentage') : t('amount')} ({form.type === 'percentage' ? '%' : '৳'})</label>
                <input type="number" value={form.value} onChange={e => set('value', +e.target.value)} className="input" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('min_order')} (৳)</label>
              <input type="number" value={form.min_order} onChange={e => set('min_order', +e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">{t('usage_limit')}</label>
              <input type="number" value={form.usage_limit} onChange={e => set('usage_limit', +e.target.value)} className="input" />
            </div>
          </div>
          <div>
            <label className="label">{t('expiry_date')}</label>
            <input type="date" value={form.expires_at ? form.expires_at.split(' ')[0] : ''} onChange={e => set('expires_at', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">{t('description')}</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} className="input" placeholder={`${t('coupon')} ${t('description')}...`} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set('active', !form.active)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.active ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-foreground">{form.active ? t('active_caps') : t('inactive_caps')}</span>
          </label>
        </div>
        <div className="flex gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors outline-none">{t('cancel')}</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 outline-none">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('save')}
          </button>
        </div>
        <style>{`.label { display:block; font-size:.8125rem; font-weight:500; color:var(--color-foreground); margin-bottom:.375rem; } .input { width:100%; padding:.625rem .875rem; border-radius:.625rem; border:1px solid var(--color-border); background:var(--color-muted); color:var(--color-foreground); font-size:.875rem; outline:none; }`}</style>
      </div>
    </div>
  )
}

export default function CouponsPage() {
  const { t } = useApp()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Coupon | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const filtered = coupons.filter(c => c.code.includes(search.toUpperCase()) || (c.description && c.description.includes(search)))

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await api.get('/coupons')
      setCoupons(res.data)
    } catch (e) {
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (c: Coupon) => {
    try {
      if (modal === 'edit') {
        await api.put(`/coupons/${c.id}`, c)
        toast.success('Coupon updated')
      } else {
        await api.post('/coupons', c)
        toast.success('Coupon created')
      }
      fetchCoupons()
      setModal(null); setSelected(null)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error saving coupon')
    }
  }

  const toggleActive = async (id: number) => {
    const coupon = coupons.find(c => c.id === id)
    if (!coupon) return
    try {
      await api.put(`/coupons/${id}`, { ...coupon, active: !coupon.active })
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c))
      toast.success(coupon.active ? 'Coupon deactivated' : 'Coupon activated')
    } catch (e) {
      toast.error('Failed to update status')
    }
  }

  const deleteCoupon = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    try {
      await api.delete(`/coupons/${id}`)
      setCoupons(prev => prev.filter(c => c.id !== id))
      toast.success('Coupon deleted')
    } catch (e) {
      toast.error('Failed to delete coupon')
    }
  }

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000)
  }

  const stats = { active: coupons.filter(c => c.active).length, totalUsed: coupons.reduce((a, c) => a + Number(c.used_count || 0), 0), expired: coupons.filter(c => new Date(c.expires_at) < new Date()).length }

  return (
    <DashboardLayout title={t('coupons')}>
      <div className="page-container">
        <PageHeader title={t('coupons')} subtitle={t('coupons_subtitle')}
          actions={<PrimaryButton onClick={() => { setSelected(null); setModal('create') }}><Plus className="w-4 h-4" /> {t('new_coupon')}</PrimaryButton>}
        />

        <div className="grid grid-cols-3 gap-3">
          {[[t('active_coupons'), stats.active, 'text-emerald-600 dark:text-emerald-400'], [t('total_used'), stats.totalUsed, 'text-blue-600 dark:text-blue-400'], [t('expired'), stats.expired, 'text-red-600 dark:text-red-400']].map(([l, v, cls]) => (
            <div key={l as string} className="glass-card p-4">
              <p className={`text-2xl font-bold ${cls}`}>{v}</p>
              <p className="text-xs text-muted-foreground mt-1">{l as string}</p>
            </div>
          ))}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-muted border border-border mb-4 focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_coupons')}
              className="bg-transparent flex-1 outline-none text-sm text-foreground placeholder:text-muted-foreground" />
          </div>

          <div className="space-y-3">
            {filtered.map(c => {
              const expired = new Date(c.expires_at) < new Date()
              const usagePct = Math.min((Number(c.used_count || 0) / Number(c.usage_limit || 1)) * 100, 100)
              const typeConf = getTypes(t)[c.type]
              return (
                <div key={c.id} className={`p-4 rounded-2xl border ${c.active && !expired ? 'border-border' : 'border-dashed border-border opacity-60'} bg-card shadow-card`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <button onClick={() => copyCode(c.id, c.code)}
                          className="flex items-center gap-2 font-mono font-bold text-lg text-foreground hover:text-primary transition-colors outline-none">
                          {c.code}
                          {copiedId === c.id ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 opacity-50" />}
                        </button>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConf.cls}`}>{typeConf.label} {c.type !== 'free_shipping' && (c.type === 'percentage' ? `${c.value}%` : `৳${c.value}`)}</span>
                        {expired && <span className="badge-danger">{t('expired')}</span>}
                        {!c.active && !expired && <span className="badge-warning">{t('inactive_caps')}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
                        <span>{t('min_order')}: <strong className="text-foreground">৳{Number(c.min_order || 0).toLocaleString()}</strong></span>
                        <span>{t('expires')}: <strong className="text-foreground">{c.expires_at ? c.expires_at.split(' ')[0] : '-'}</strong></span>
                        <span>{t('usage')}: <strong className="text-foreground">{c.used_count}/{c.usage_limit}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${usagePct >= 100 ? 'bg-red-500' : usagePct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${usagePct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{usagePct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 items-center pt-1">
                      <button onClick={() => toggleActive(c.id)} title={c.active ? t('deactivate') : t('activate')}
                        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 outline-none ${c.active ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${c.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <button onClick={() => { setSelected(c); setModal('edit') }}
                        className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground outline-none">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteCoupon(c.id)}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-muted-foreground hover:text-red-500 outline-none">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <CouponModal coupon={modal === 'edit' ? selected : null} onSave={handleSave} onClose={() => { setModal(null); setSelected(null) }} />
      )}
    </DashboardLayout>
  )
}
