'use client'

import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, SectionHeader } from '@/components/ui/Components'
import { useState } from 'react'
import { Megaphone, Globe, Globe2, CheckCircle, TrendingUp, BarChart3, Plus, Save } from 'lucide-react'

export default function MarketingPage() {
  const { t, language } = useApp()
  const [campaigns] = useState([
    { name: 'Eid Collection Launch', platform: 'Facebook', status: 'active', spend: 5000, reach: 48200, clicks: 1240, conv: 43, roas: 8.6 },
    { name: 'Borkha Season Sale', platform: 'Google', status: 'active', spend: 3000, reach: 21500, clicks: 890, conv: 28, roas: 7.2 },
    { name: 'Kurti Restock Alert', platform: 'Facebook', status: 'paused', spend: 1500, reach: 9800, clicks: 320, conv: 12, roas: 5.4 },
  ])

  const [adForm, setAdForm] = useState({ headline: '', body: '', cta: 'Shop Now', budget: 1000, duration: 7, platform: 'Facebook' })
  const set = (k: string, v: unknown) => setAdForm(p => ({ ...p, [k]: v }))
  const [adSaved, setAdSaved] = useState(false)

  const handleAdSave = () => { setAdSaved(true); setTimeout(() => setAdSaved(false), 2500) }

  return (
    <DashboardLayout title={t('marketing')}>
      <div className="page-container">
        <PageHeader title={t('marketing')} subtitle={t('campaign_mgmt')} />

        {/* Campaign Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('total_ad_spend'), value: `৳${(9500).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}`, cls: 'text-red-600 dark:text-red-400' },
            { label: t('total_reach'), value: (79500).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US'), cls: 'text-blue-600 dark:text-blue-400' },
            { label: t('total_clicks'), value: (2450).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US'), cls: 'text-purple-600 dark:text-purple-400' },
            { label: t('avg_roas'), value: (7.4).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') + 'x', cls: 'text-emerald-600 dark:text-emerald-400' },
          ].map(s => (<div key={s.label} className="glass-card p-4"><p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p><p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p></div>))}
        </div>

        {/* Active Campaigns */}
        <div className="glass-card p-5">
          <SectionHeader title={t('active_campaigns')} action={<button className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-medium hover:bg-[hsl(var(--primary)/0.2)] transition-colors"><Plus className="w-3.5 h-3.5" /> {t('new_campaign')}</button>} />
          <div className="space-y-3">
            {campaigns.map((camp, i) => (
              <div key={i} className="p-4 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${camp.platform === 'Facebook' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      {camp.platform === 'Facebook' ? <Globe2 className="w-4 h-4 text-blue-600" /> : <Globe className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[hsl(var(--foreground))]">{camp.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{camp.platform}</p>
                    </div>
                  </div>
                  <span className={camp.status === 'active' ? 'badge-success' : 'badge-warning'}>{camp.status === 'active' ? t('running') : t('paused')}</span>
                </div>
                <div className="grid grid-cols-5 gap-3 text-center">
                  {[[t('spend'), `৳${camp.spend.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}`], [t('reach'), camp.reach.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')], [t('clicks'), camp.clicks.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')], [t('conversion'), camp.conv.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')], [t('roas'), `${camp.roas.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}x`]].map(([l, v]) => (
                    <div key={l as string}>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{l}</p>
                      <p className="font-bold text-sm text-[hsl(var(--foreground))]">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ad Creator */}
        <div className="glass-card p-5">
          <SectionHeader title={t('ad_creator')} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <div>
                <label className="label">{t('platform')}</label>
                <select value={adForm.platform} onChange={e => set('platform', e.target.value)} className="input">
                  <option>Facebook</option><option>Instagram</option><option>Google</option><option>TikTok</option>
                </select>
              </div>
              <div>
                <label className="label">{t('ad_headline')}</label>
                <input value={adForm.headline} onChange={e => set('headline', e.target.value)} className="input" placeholder="৫০% ছাড়ে পান আমাদের নতুন কুর্তি কালেকশন!" />
              </div>
              <div>
                <label className="label">{t('ad_body')}</label>
                <textarea rows={3} value={adForm.body} onChange={e => set('body', e.target.value)} className="input resize-none" placeholder="আমাদের নতুন ঈদ কালেকশন এখন অর্ডার করুন..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('budget_per_day')}</label>
                  <input type="number" value={adForm.budget} onChange={e => set('budget', +e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">{t('duration_days')}</label>
                  <input type="number" value={adForm.duration} onChange={e => set('duration', +e.target.value)} className="input" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))]">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">{t('total_budget')}</span>
                <span className="font-bold text-[hsl(var(--foreground))]">৳{(adForm.budget * adForm.duration).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</span>
              </div>
              <button onClick={handleAdSave}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${adSaved ? 'bg-emerald-500 text-white' : 'bg-[hsl(var(--primary))] text-white hover:opacity-90'}`}>
                {adSaved ? <><CheckCircle className="w-4 h-4" /> {t('saved_successfully')}</> : <><Megaphone className="w-4 h-4" /> {t('start_campaign')}</>}
              </button>
            </div>

            {/* Preview */}
            <div>
              <p className="label mb-3">{t('ad_preview')}</p>
              <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2 p-3 border-b border-[hsl(var(--border))]">
                  <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-white text-xs font-bold">SB</div>
                  <div className="flex-1">
                    <p className="font-semibold text-xs text-[hsl(var(--foreground))]">style-bd</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{t('sponsored')} · {adForm.platform}</p>
                  </div>
                </div>
                <div className="h-32 bg-gradient-to-br from-[hsl(var(--primary))] to-blue-400 flex items-center justify-center text-white text-4xl">👗</div>
                <div className="p-3">
                  <p className="font-bold text-sm text-[hsl(var(--foreground))]">{adForm.headline || t('ad_placeholder_title')}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">{adForm.body || t('ad_placeholder_body')}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">style-bd.com</span>
                    <button className="px-3 py-1 rounded-lg bg-[hsl(var(--primary))] text-white text-xs font-semibold">{adForm.cta}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`.label { display:block; font-size:.8125rem; font-weight:500; color:hsl(var(--foreground)); margin-bottom:.375rem; } .input { width:100%; padding:.625rem .875rem; border-radius:.625rem; border:1px solid hsl(var(--border)); background:hsl(var(--muted)); color:hsl(var(--foreground)); font-size:.875rem; outline:none; }`}</style>
    </DashboardLayout>
  )
}
