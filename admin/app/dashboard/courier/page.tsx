'use client'

import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, SectionHeader } from '@/components/ui/Components'
import { useState } from 'react'
import { Truck, Package, MapPin, Phone, CheckCircle, Clock, AlertTriangle, ExternalLink, Plus } from 'lucide-react'

type CourierStatus = 'active' | 'inactive' | 'not_configured'
type Courier = {
  id: string; name: string; nameBn: string; logo: string; status: CourierStatus;
  apiKey: string; secretKey: string; baseUrl: string; testMode: boolean;
  deliveryCharge: number; codCharge: number; avgDays: string;
}

const INIT_COURIERS: Courier[] = [
  { id: 'steadfast', name: 'Steadfast', nameBn: 'স্টেডফাস্ট', logo: '📦', status: 'not_configured', apiKey: '', secretKey: '', baseUrl: 'https://portal.steadfast.com.bd/api/v1', testMode: true, deliveryCharge: 120, codCharge: 1, avgDays: '1-3' },
  { id: 'pathao', name: 'Pathao', nameBn: 'পাঠাও', logo: '🚴', status: 'not_configured', apiKey: '', secretKey: '', baseUrl: 'https://merchant.pathao.com/api/v1', testMode: true, deliveryCharge: 70, codCharge: 1, avgDays: '1-2' },
  { id: 'redx', name: 'RedX', nameBn: 'রেডএক্স', logo: '🔴', status: 'not_configured', apiKey: '', secretKey: '', baseUrl: 'https://openapi.redx.com.bd/v1.0.0-beta', testMode: true, deliveryCharge: 60, codCharge: 1, avgDays: '2-4' },
  { id: 'sundarban', name: 'Sundarban', nameBn: 'সুন্দরবন', logo: '🌿', status: 'not_configured', apiKey: '', secretKey: '', baseUrl: '', testMode: false, deliveryCharge: 100, codCharge: 1, avgDays: '2-5' },
]

function CourierCard({ courier, onUpdate }: { courier: Courier; onUpdate: (c: Courier) => void }) {
  const { t } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState(courier)
  const [saved, setSaved] = useState(false)

  const set = (k: keyof Courier, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    const status: CourierStatus = form.apiKey ? 'active' : 'not_configured'
    const updated = { ...form, status }
    onUpdate(updated)
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const statusConfig = {
    active: { label: t('connected'), cls: 'badge-success' },
    inactive: { label: t('temporarily_closed'), cls: 'badge-warning' },
    not_configured: { label: t('not_configured'), cls: 'badge-danger' },
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-3xl w-12 h-12 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center">{courier.logo}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[hsl(var(--foreground))]">{courier.name}</h3>
              <span className={statusConfig[courier.status].cls}>{statusConfig[courier.status].label}</span>
            </div>
            <div className="flex gap-4 text-xs text-[hsl(var(--muted-foreground))] mt-1">
              <span>{t('delivery')}: ৳{courier.deliveryCharge}</span>
              <span>COD: {courier.codCharge}%</span>
              <span>{t('time')}: {courier.avgDays} {t('days')}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)}
          className="px-4 py-2 rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-sm font-medium hover:bg-[hsl(var(--primary)/0.2)] transition-colors">
          {expanded ? t('cancel') : t('configure')}
        </button>
      </div>

      {expanded && (
        <div className="mt-5 pt-5 border-t border-[hsl(var(--border))] space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">{t('api_security_hint')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">API Key</label>
              <input type="password" value={form.apiKey} onChange={e => set('apiKey', e.target.value)} className="input font-mono" placeholder="Enter your API key..." />
            </div>
            <div>
              <label className="label">Secret Key</label>
              <input type="password" value={form.secretKey} onChange={e => set('secretKey', e.target.value)} className="input font-mono" placeholder="Enter your secret key..." />
            </div>
            <div>
              <label className="label">{t('delivery_charge')} (৳)</label>
              <input type="number" value={form.deliveryCharge} onChange={e => set('deliveryCharge', +e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">COD {t('charge')} (%)</label>
              <input type="number" value={form.codCharge} onChange={e => set('codCharge', +e.target.value)} className="input" step="0.1" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set('testMode', !form.testMode)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.testMode ? 'bg-amber-500' : 'bg-[hsl(var(--primary))]'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.testMode ? 'translate-x-0.5' : 'translate-x-5'}`} />
            </div>
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">{form.testMode ? `🧪 ${t('test_mode')}` : `🚀 ${t('live_mode')}`}</span>
          </label>

          <div className="flex gap-3">
            <button onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-[hsl(var(--primary))] text-white hover:opacity-90'}`}>
              {saved ? <><CheckCircle className="w-4 h-4" /> {t('saved_successfully')}</> : t('save_settings')}
            </button>
            {courier.baseUrl && (
              <a href={courier.baseUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--accent))] transition-colors text-[hsl(var(--muted-foreground))]">
                <ExternalLink className="w-4 h-4" /> {t('open_portal')}
              </a>
            )}
          </div>
        </div>
      )}
      <style>{`.label { display:block; font-size:.8125rem; font-weight:500; color:hsl(var(--foreground)); margin-bottom:.375rem; } .input { width:100%; padding:.625rem .875rem; border-radius:.625rem; border:1px solid hsl(var(--border)); background:hsl(var(--muted)); color:hsl(var(--foreground)); font-size:.875rem; outline:none; }`}</style>
    </div>
  )
}

export default function CourierPage() {
  const { t, language } = useApp()
  const [couriers, setCouriers] = useState<Courier[]>(INIT_COURIERS)

  const updateCourier = (updated: Courier) => setCouriers(prev => prev.map(c => c.id === updated.id ? updated : c))

  const active = couriers.filter(c => c.status === 'active').length

  return (
    <DashboardLayout title={t('courier')}>
      <div className="page-container">
        <PageHeader title={t('courier')} subtitle={t('courier_management')} />

        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800">
          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {active > 0 ? `${active}${language === 'bn' ? 'টি' : ''} ${t('courier_connected_hint')}` : t('no_courier_hint')}
          </p>
        </div>

        <div className="space-y-4">
          {couriers.map(c => <CourierCard key={c.id} courier={c} onUpdate={updateCourier} />)}
        </div>

        {/* How it works */}
        <div className="glass-card p-6">
          <SectionHeader title={t('how_it_works')} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {[
              { icon: Plus, step: '১', title: t('step_1_title'), desc: t('step_1_desc') },
              { icon: Package, step: '২', title: t('step_2_title'), desc: t('step_2_desc') },
              { icon: MapPin, step: '৩', title: t('step_3_title'), desc: t('step_3_desc') },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] text-white font-bold text-sm flex items-center justify-center flex-shrink-0">{s.step}</div>
                <div>
                  <p className="font-semibold text-sm text-[hsl(var(--foreground))] mb-1">{s.title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
