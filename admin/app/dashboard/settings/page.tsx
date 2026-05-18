'use client'

import { useState } from 'react'
import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, SectionHeader } from '@/components/ui/Components'
import {
  Store, User, Bell, Lock, Palette, Globe, CreditCard,
  CheckCircle, Save, Eye, EyeOff, Shield, Smartphone,
  Zap, Image as ImageIcon, Layout
} from 'lucide-react'
import { MediaPicker } from '@/components/media/MediaPicker'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, APP_URL } from '@/lib/api'
import { toast } from 'sonner'

type Tab = 'store' | 'appearance' | 'account' | 'notifications' | 'security' | 'integrations'

const getTabs = (t: any) => [
  { id: 'store',         label: t('store_info'),     icon: Store },
  { id: 'appearance',    label: 'Appearance',        icon: Palette },
  { id: 'account',       label: t('account'),       icon: User },
  { id: 'notifications', label: t('notifications'),     icon: Bell },
  { id: 'security',      label: t('security'),       icon: Lock },
  { id: 'integrations',  label: t('integrations'),    icon: Zap },
]

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  const { t } = useApp()
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
        saved
          ? 'bg-emerald-500 text-white shadow-lg scale-95'
          : 'bg-primary text-white hover:opacity-90 shadow-sm'
      }`}>
      {saved ? <><CheckCircle className="w-4 h-4" /> {t('saved_successfully')}</> : <><Save className="w-4 h-4" /> {t('save_changes')}</>}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { t, theme, toggleTheme, language, setLanguage } = useApp()
  const TABS = getTabs(t)
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('store')
  const [saved, setSaved] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Store settings state
  const [store, setStore] = useState({
    name: '',
    nameBn: '',
    tagline: "",
    email: '',
    phone: '',
    address: '',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
    freeShippingThreshold: 2000,
  })

  const [appearance, setAppearance] = useState({
    homeBgImage: '',
    homeBgColor: '#000000',
    categoryBgImage: '',
    categoryBgColor: '#ffffff',
    globalBgImage: '',
    globalBgColor: '#ffffff',
  })

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false)
  const [activeMediaField, setActiveMediaField] = useState<'home' | 'global' | 'category'>('home')

  // Fetch settings from API
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings')
      const data = res.data
      setStore({
        name: data.store_name || 'Style-BD',
        nameBn: data.store_name_bn || 'স্টাইল-বিডি',
        tagline: data.store_tagline || "Bangladesh's Premium Fashion Brand",
        email: data.store_email || 'hello@style-bd.com',
        phone: data.store_phone || '01700000000',
        address: data.store_address || 'Mirpur, Dhaka-1216',
        currency: data.store_currency || 'BDT',
        timezone: data.store_timezone || 'Asia/Dhaka',
        freeShippingThreshold: parseInt(data.free_shipping_threshold || '2000'),
      })
      
      setIntegrations(prev => ({
        ...prev,
        whatsapp: data.whatsapp_number || '01700000000',
      }))

      setAppearance({
        homeBgImage: data.home_bg_image || '',
        homeBgColor: data.home_bg_color || '#000000',
        categoryBgImage: data.category_bg_image || '',
        categoryBgColor: data.category_bg_color || '#ffffff',
        globalBgImage: data.global_bg_image || '',
        globalBgColor: data.global_bg_color || '#ffffff',
      })
      
      return data
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/settings', data)
    },
    onSuccess: () => {
      setSaved(true)
      toast.success(t('saved_successfully'))
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setTimeout(() => setSaved(false), 2500)
    }
  })

  const save = () => {
    const payload = {
      store_name: store.name,
      store_name_bn: store.nameBn,
      store_tagline: store.tagline,
      store_email: store.email,
      store_phone: store.phone,
      store_address: store.address,
      store_currency: store.currency,
      store_timezone: store.timezone,
      free_shipping_threshold: store.freeShippingThreshold.toString(),
      whatsapp_number: integrations.whatsapp,
      home_bg_image: appearance.homeBgImage,
      home_bg_color: appearance.homeBgColor,
      category_bg_image: appearance.categoryBgImage,
      category_bg_color: appearance.categoryBgColor,
      global_bg_image: appearance.globalBgImage,
      global_bg_color: appearance.globalBgColor,
    }
    saveMutation.mutate(payload)
  }

  // Notification state
  const [notif, setNotif] = useState({
    newOrder: true,
    lowStock: true,
    newCustomer: false,
    orderDelivered: true,
    emailSummary: true,
    smsAlerts: false,
  })

  // Integration state
  const [integrations, setIntegrations] = useState({
    whatsapp: '01700000000',
  })

  return (
    <DashboardLayout title={t('settings')}>
      <div className="page-container">
        <PageHeader
          title={t('settings')}
          subtitle={t('settings_subtitle')}
        />

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Sidebar tabs */}
          <div className="lg:w-52 flex-shrink-0">
            <nav className="glass-card p-2 space-y-1 lg:sticky lg:top-4">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id as Tab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    tab === t.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}>
                  <t.icon className="w-4 h-4 flex-shrink-0" />
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content area */}
          <div className="flex-1 space-y-5">

            {/* ═══ STORE INFO ═══ */}
            {tab === 'store' && (
              <>
                <div className="glass-card p-6 space-y-5">
                  <SectionHeader title={t('brand_info')} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label={`${t('shop')} ${t('customer_name')} (English)`}>
                      <input className="input" value={store.name} onChange={e => setStore(p => ({ ...p, name: e.target.value }))} />
                    </Field>
                    <Field label={`${t('shop')} ${t('customer_name')} (বাংলা)`}>
                      <input className="input" value={store.nameBn} onChange={e => setStore(p => ({ ...p, nameBn: e.target.value }))} />
                    </Field>
                    <Field label={t('tagline')}>
                      <input className="input" value={store.tagline} onChange={e => setStore(p => ({ ...p, tagline: e.target.value }))} />
                    </Field>
                    <Field label={t('email')}>
                      <input type="email" className="input" value={store.email} onChange={e => setStore(p => ({ ...p, email: e.target.value }))} />
                    </Field>
                    <Field label={t('phone_number')}>
                      <input className="input" value={store.phone} onChange={e => setStore(p => ({ ...p, phone: e.target.value }))} />
                    </Field>
                    <Field label={t('address')}>
                      <input className="input" value={store.address} onChange={e => setStore(p => ({ ...p, address: e.target.value }))} />
                    </Field>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-5">
                  <SectionHeader title={t('regional_settings')} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label={t('currency')}>
                      <select className="input" value={store.currency} onChange={e => setStore(p => ({ ...p, currency: e.target.value }))}>
                        <option value="BDT">৳ BDT — Bangladeshi Taka</option>
                        <option value="USD">$ USD — US Dollar</option>
                      </select>
                    </Field>
                    <Field label={t('timezone')}>
                      <select className="input" value={store.timezone} onChange={e => setStore(p => ({ ...p, timezone: e.target.value }))}>
                        <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </Field>
                    <Field label={t('free_shipping_threshold')}>
                      <input type="number" className="input" value={store.freeShippingThreshold}
                        onChange={e => setStore(p => ({ ...p, freeShippingThreshold: +e.target.value }))} />
                    </Field>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <SectionHeader title={t('theme_and_language')} />
                  <div className="flex flex-wrap gap-4 items-center">
                    <div>
                      <p className="label">{t('theme')}</p>
                      <div className="flex items-center gap-2 p-1 bg-muted rounded-xl border border-border">
                        {(['light', 'dark'] as const).map(m => (
                          <button key={m} onClick={() => { if ((theme === 'dark') !== (m === 'dark')) toggleTheme() }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              (m === 'dark') === (theme === 'dark')
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground'
                            }`}>
                            {m === 'light' ? `☀️ ${t('light')}` : `🌙 ${t('dark')}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="label">ভাষা</p>
                      <div className="flex items-center gap-2 p-1 bg-muted rounded-xl border border-border">
                        {(['bn', 'en'] as const).map(l => (
                          <button key={l} onClick={() => setLanguage(l)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              language === l
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground'
                            }`}>
                            {l === 'bn' ? 'বাংলা' : 'English'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-3">
                  {saveMutation.isPending && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}<SaveButton saved={saved} onClick={save} />
                </div>
              </>
            )}

            {/* ═══ APPEARANCE ═══ */}
            {tab === 'appearance' && (
              <>
                <div className="glass-card p-6 space-y-6">
                  <SectionHeader title="Homepage Customization" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Field label="Homepage Background Image">
                        <div className="flex gap-2">
                          <input 
                            className="input flex-1" 
                            value={appearance.homeBgImage} 
                            onChange={e => setAppearance(p => ({ ...p, homeBgImage: e.target.value }))}
                            placeholder="/images/hero/custom.jpg"
                          />
                          <button 
                            onClick={() => { setActiveMediaField('home'); setIsMediaPickerOpen(true); }}
                            className="px-3 py-2 bg-accent rounded-xl hover:bg-accent/80 transition-colors"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </Field>
                      <Field label="Homepage Background Color">
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            className="w-12 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden" 
                            value={appearance.homeBgColor} 
                            onChange={e => setAppearance(p => ({ ...p, homeBgColor: e.target.value }))} 
                          />
                          <input 
                            type="text" 
                            className="input flex-1 font-mono" 
                            value={appearance.homeBgColor} 
                            onChange={e => setAppearance(p => ({ ...p, homeBgColor: e.target.value }))} 
                          />
                        </div>
                      </Field>
                    </div>
                    <div className="flex items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/30 p-4">
                      {appearance.homeBgImage ? (
                        <img src={`${APP_URL}${appearance.homeBgImage}`} className="max-h-40 rounded-lg shadow-lg" alt="Preview" />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Palette className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-xs italic">Homepage Preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-6">
                  <SectionHeader title="Category Page Customization" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Field label="Category Page Background Image">
                        <div className="flex gap-2">
                          <input 
                            className="input flex-1" 
                            value={appearance.categoryBgImage} 
                            onChange={e => setAppearance(p => ({ ...p, categoryBgImage: e.target.value }))}
                            placeholder="/images/main_bg/custom.jpg"
                          />
                          <button 
                            onClick={() => { setActiveMediaField('category'); setIsMediaPickerOpen(true); }}
                            className="px-3 py-2 bg-accent rounded-xl hover:bg-accent/80 transition-colors"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </Field>
                      <Field label="Category Page Background Color">
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            className="w-12 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden" 
                            value={appearance.categoryBgColor} 
                            onChange={e => setAppearance(p => ({ ...p, categoryBgColor: e.target.value }))} 
                          />
                          <input 
                            type="text" 
                            className="input flex-1 font-mono" 
                            value={appearance.categoryBgColor} 
                            onChange={e => setAppearance(p => ({ ...p, categoryBgColor: e.target.value }))} 
                          />
                        </div>
                      </Field>
                    </div>
                    <div className="flex items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/30 p-4">
                      {appearance.categoryBgImage ? (
                        <img src={`${APP_URL}${appearance.categoryBgImage}`} className="max-h-40 rounded-lg shadow-lg" alt="Preview" />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Layout className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-xs italic">Category Preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-6">
                  <SectionHeader title="Global / Other Pages Style" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Field label="Global Background Image">
                        <div className="flex gap-2">
                          <input 
                            className="input flex-1" 
                            value={appearance.globalBgImage} 
                            onChange={e => setAppearance(p => ({ ...p, globalBgImage: e.target.value }))}
                            placeholder="/images/main_bg/custom.jpg"
                          />
                          <button 
                            onClick={() => { setActiveMediaField('global'); setIsMediaPickerOpen(true); }}
                            className="px-3 py-2 bg-accent rounded-xl hover:bg-accent/80 transition-colors"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </Field>
                      <Field label="Global Background Color">
                        <div className="flex items-center gap-3">
                          <input 
                            type="color" 
                            className="w-12 h-10 rounded-lg cursor-pointer border-0 p-0 overflow-hidden" 
                            value={appearance.globalBgColor} 
                            onChange={e => setAppearance(p => ({ ...p, globalBgColor: e.target.value }))} 
                          />
                          <input 
                            type="text" 
                            className="input flex-1 font-mono" 
                            value={appearance.globalBgColor} 
                            onChange={e => setAppearance(p => ({ ...p, globalBgColor: e.target.value }))} 
                          />
                        </div>
                      </Field>
                    </div>
                    <div className="flex items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/30 p-4">
                      {appearance.globalBgImage ? (
                        <img src={`${APP_URL}${appearance.globalBgImage}`} className="max-h-40 rounded-lg shadow-lg" alt="Preview" />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-xs italic">Global Preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <MediaPicker 
                  isOpen={isMediaPickerOpen}
                  onClose={() => setIsMediaPickerOpen(false)}
                  onSelect={(path) => {
                    if (activeMediaField === 'home') setAppearance(p => ({ ...p, homeBgImage: path }))
                    else if (activeMediaField === 'category') setAppearance(p => ({ ...p, categoryBgImage: path }))
                    else setAppearance(p => ({ ...p, globalBgImage: path }))
                  }}
                />

                <div className="flex justify-end items-center gap-3">
                  {saveMutation.isPending && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}<SaveButton saved={saved} onClick={save} />
                </div>
              </>
            )}

            {/* ═══ ACCOUNT ═══ */}
            {tab === 'account' && (
              <>
                <div className="glass-card p-6 space-y-5">
                  <SectionHeader title={t('profile_info')} />
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">A</div>
                    <div>
                      <p className="font-bold text-foreground">Admin</p>
                      <p className="text-sm text-muted-foreground">admin@style-bd.com</p>
                      <button className="mt-2 text-xs text-primary font-medium hover:underline">{t('change_photo')}</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label={t('customer_name')}><input className="input" defaultValue="Admin" /></Field>
                    <Field label={t('email')}><input type="email" className="input" defaultValue="admin@style-bd.com" /></Field>
                    <Field label={t('phone')}><input className="input" defaultValue="01700000000" /></Field>
                    <Field label={t('role')}>
                      <input className="input" value="Super Admin" readOnly />
                    </Field>
                  </div>
                </div>
                <div className="flex justify-end items-center gap-3">
                  {saveMutation.isPending && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}<SaveButton saved={saved} onClick={save} />
                </div>
              </>
            )}

            {/* ═══ NOTIFICATIONS ═══ */}
            {tab === 'notifications' && (
              <div className="glass-card p-6 space-y-5">
                <SectionHeader title={t('notification_preferences')} />
                <div className="space-y-4">
                  {([
                    ['newOrder',       'নতুন অর্ডার',          'প্রতিটি নতুন অর্ডারে তাৎক্ষণিক সতর্কতা'],
                    ['lowStock',       'কম স্টক সতর্কতা',       'স্টক থ্রেশহোল্ডের নিচে নামলে'],
                    ['newCustomer',    'নতুন গ্রাহক',           'নতুন গ্রাহক নিবন্ধিত হলে'],
                    ['orderDelivered', 'অর্ডার বিতরণ',         'অর্ডার সফলভাবে বিতরণ হলে'],
                    ['emailSummary',   'দৈনিক ইমেইল সারাংশ', 'প্রতিদিন সকালে বিক্রয় সারাংশ'],
                    ['smsAlerts',      'SMS সতর্কতা',           'জরুরি বিষয়ে SMS নোটিফিকেশন'],
                  ] as [keyof typeof notif, string, string][]).map(([key, title, desc]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <button onClick={() => setNotif(p => ({ ...p, [key]: !p[key] }))}
                        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${notif[key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notif[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end items-center gap-3">
                  {saveMutation.isPending && <span className="text-xs text-muted-foreground animate-pulse">Saving notifications...</span>}
                  {saveMutation.isPending && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}<SaveButton saved={saved} onClick={save} />
                </div>
              </div>
            )}

            {/* ═══ SECURITY ═══ */}
            {tab === 'security' && (
              <>
                <div className="glass-card p-6 space-y-5">
                  <SectionHeader title={t('change_password')} />
                  <div className="space-y-4 max-w-md">
                    <Field label={t('current_password')}>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} className="input pr-10" placeholder={t('current_password')} />
                        <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </Field>
                    <Field label={t('new_password')}>
                      <input type={showPass ? 'text' : 'password'} className="input" placeholder={`${t('new_password')} (8+ characters)`} />
                    </Field>
                    <Field label={t('confirm_password')}>
                      <input type={showPass ? 'text' : 'password'} className="input" placeholder={t('confirm_password')} />
                    </Field>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <SectionHeader title={t('session_management')} />
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('current_session_secure')}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">SSL Encrypted · Dhaka, Bangladesh</p>
                    </div>
                  </div>
                  <button className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors">{t('logout_all')}</button>
                </div>

                <div className="flex justify-end items-center gap-3">
                  {saveMutation.isPending && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}<SaveButton saved={saved} onClick={save} />
                </div>
              </>
            )}

            {/* ═══ INTEGRATIONS ═══ */}
            {tab === 'integrations' && (
              <>
                <div className="glass-card p-6 space-y-5">
                  <SectionHeader title={t('social_media')} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="WhatsApp নম্বর">
                      <input className="input" placeholder="017XXXXXXXX"
                        value={integrations.whatsapp}
                        onChange={e => setIntegrations(p => ({ ...p, whatsapp: e.target.value }))} />
                    </Field>
                    <Field label="Facebook Page URL">
                      <input className="input" placeholder="https://facebook.com/style-bd" />
                    </Field>
                    <Field label="Instagram Handle">
                      <input className="input" placeholder="@style_bd" />
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-3">
                  {saveMutation.isPending && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}<SaveButton saved={saved} onClick={save} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
