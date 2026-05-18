'use client'

import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader } from '@/components/ui/Components'
import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Shield } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

type Gateway = {
  id: string; name: string; nameBn: string; logo: string; type: 'mobile_banking' | 'online_gateway';
  status: 'active' | 'inactive' | 'not_configured'; appKey: string; appSecret: string;
  testMode: boolean; charge: number; chargeType: 'percentage' | 'flat';
}

const INIT_GATEWAYS: Gateway[] = [
  { id: 'bkash', name: 'bKash', nameBn: 'বিকাশ', logo: '📱', type: 'mobile_banking', status: 'not_configured', appKey: '', appSecret: '', testMode: true, charge: 1.85, chargeType: 'percentage' },
  { id: 'nagad', name: 'Nagad', nameBn: 'নগদ', logo: '💰', type: 'mobile_banking', status: 'not_configured', appKey: '', appSecret: '', testMode: true, charge: 1.5, chargeType: 'percentage' },
  { id: 'sslcommerz', name: 'SSLCommerz', nameBn: 'SSLCommerz', logo: '🔒', type: 'online_gateway', status: 'not_configured', appKey: '', appSecret: '', testMode: true, charge: 2.3, chargeType: 'percentage' },
  { id: 'cod', name: 'Cash on Delivery', nameBn: 'ক্যাশ অন ডেলিভারি', logo: '💵', type: 'mobile_banking', status: 'active', appKey: 'N/A', appSecret: 'N/A', testMode: false, charge: 0, chargeType: 'flat' },
]

function GatewayCard({ gateway, onUpdate }: { gateway: Gateway; onUpdate: (g: Gateway) => void }) {
  const { t } = useApp()
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState(gateway)
  const [saved, setSaved] = useState(false)
  const set = (k: keyof Gateway, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  // Update local state when gateway prop changes (e.g., from DB fetch)
  useEffect(() => {
    setForm(gateway)
  }, [gateway])

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/settings', payload)
    },
    onSuccess: () => {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setTimeout(() => setSaved(false), 2500)
    },
    onError: () => {
      toast.error('Failed to save settings')
    }
  })

  const handleSave = () => {
    const status: Gateway['status'] = (form.appKey && form.appKey !== 'N/A') ? 'active' : gateway.id === 'cod' ? 'active' : 'not_configured'
    const updated = { ...form, status }
    onUpdate(updated) // Update parent UI immediately

    // Save to database
    saveMutation.mutate({
      [`gateway_${gateway.id}`]: JSON.stringify(updated)
    })
  }

  const statusCls = { active: 'badge-success', inactive: 'badge-warning', not_configured: 'badge-danger' }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-3xl w-12 h-12 rounded-xl bg-muted flex items-center justify-center">{gateway.logo}</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground">{gateway.name}</h3>
              <span className={statusCls[gateway.status]}>{gateway.status === 'active' ? t('active') : gateway.status === 'inactive' ? t('inactive') : t('not_configured')}</span>
              {gateway.testMode && gateway.status !== 'active' && <span className="badge-warning">{t('test_mode')}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('charge')}: {gateway.charge}{gateway.chargeType === 'percentage' ? '%' : '৳'} · {gateway.type === 'mobile_banking' ? t('mobile_banking') : t('online_gateway')}
            </p>
          </div>
        </div>
        {gateway.id !== 'cod' && (
          <button onClick={() => setExpanded(!expanded)} className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors outline-none focus:outline-none">
            {expanded ? t('cancel') : t('configure')}
          </button>
        )}
      </div>

      {expanded && gateway.id !== 'cod' && (
        <div className="mt-5 pt-5 border-t border-border space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.8125rem] font-medium text-foreground mb-1.5">App Key / Merchant ID</label>
              <input type="password" value={form.appKey} onChange={e => set('appKey', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary/50 font-mono" placeholder="App Key..." />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-medium text-foreground mb-1.5">App Secret / Password</label>
              <input type="password" value={form.appSecret} onChange={e => set('appSecret', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary/50 font-mono" placeholder="App Secret..." />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-medium text-foreground mb-1.5">{t('charge')} ({form.chargeType === 'percentage' ? '%' : '৳'})</label>
              <input type="number" value={form.charge} onChange={e => set('charge', +e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary/50" step="0.1" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set('testMode', !form.testMode)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.testMode ? 'bg-amber-500' : 'bg-primary'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.testMode ? 'translate-x-0.5' : 'translate-x-5'}`} />
            </div>
            <span className="text-sm font-medium text-foreground">{form.testMode ? `🧪 ${t('test_mode')}` : `🚀 ${t('live_mode')}`}</span>
          </label>
          <button onClick={handleSave} disabled={saveMutation.isPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all outline-none focus:outline-none ${saved ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground hover:opacity-90'}`}>
            {saved ? <><CheckCircle className="w-4 h-4" /> {t('saved_successfully')}</> : saveMutation.isPending ? 'Saving...' : t('save_settings')}
          </button>
        </div>
      )}
    </div>
  )
}

export default function PaymentsPage() {
  const { t } = useApp()
  const [gateways, setGateways] = useState<Gateway[]>(INIT_GATEWAYS)

  // Fetch settings from DB and merge into gateways
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings')
      const data = res.data
      
      setGateways(prev => prev.map(g => {
        const key = `gateway_${g.id}`
        if (data[key]) {
          try {
            const parsed = JSON.parse(data[key])
            return { ...g, ...parsed }
          } catch(e) {}
        }
        return g
      }))
      
      return data
    }
  })

  const activeCount = gateways.filter(g => g.status === 'active').length

  return (
    <DashboardLayout title={t('payments')}>
      <div className="page-container">
        <PageHeader title={t('payments')} subtitle={t('payment_gateways')} />

        <div className="grid grid-cols-3 gap-3">
          {[[t('active_gateways'), activeCount, 'text-emerald-600 dark:text-emerald-400'], [t('total_gateways'), gateways.length, 'text-primary'], [t('pending_config'), gateways.filter(g => g.status === 'not_configured').length, 'text-amber-600 dark:text-amber-400']].map(([l, v, cls]) => (
            <div key={l as string} className="glass-card p-4">
              <p className={`text-2xl font-bold ${cls}`}>{v}</p>
              <p className="text-xs text-muted-foreground mt-1">{l as string}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800">
          <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('security_hint')}</p>
        </div>

        <div className="space-y-4">
          {gateways.map(g => <GatewayCard key={g.id} gateway={g} onUpdate={upd => setGateways(prev => prev.map(x => x.id === upd.id ? upd : x))} />)}
        </div>
      </div>
    </DashboardLayout>
  )
}
