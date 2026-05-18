'use client'

import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, PageHeader, StatusBadge, DataTable, SectionHeader } from '@/components/ui/Components'
import { Save, RefreshCw, CheckCircle, Radio, Tag, BarChart2, ShoppingCart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function TrackingPage() {
  const { t } = useApp()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    pixel_id: '',
    gtm_id: '',
    clarity_id: '',
    tiktok_pixel: '',
    ga4_id: '',
    custom_head: '',
    custom_body: '',
  })

  // Fetch tracking settings from API
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings')
      const data = res.data
      setForm({
        pixel_id: data.facebook_pixel || '',
        gtm_id: data.gtm_id || '',
        clarity_id: data.clarity_id || '',
        tiktok_pixel: data.tiktok_pixel || '',
        ga4_id: data.google_analytics || '',
        custom_head: data.custom_head || '',
        custom_body: data.custom_body || '',
      })
      return data
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/settings', payload)
    },
    onSuccess: () => {
      setSaved(true)
      toast.success('পরিবর্তন সফলভাবে সেভ করা হয়েছে!')
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setTimeout(() => setSaved(false), 2500)
    },
    onError: () => {
      toast.error('সেভ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।')
    }
  })

  const handleSave = () => {
    const payload = {
      facebook_pixel: form.pixel_id,
      gtm_id: form.gtm_id,
      clarity_id: form.clarity_id,
      tiktok_pixel: form.tiktok_pixel,
      google_analytics: form.ga4_id,
      custom_head: form.custom_head,
      custom_body: form.custom_body,
    }
    saveMutation.mutate(payload)
  }

  const trackingCards = [
    {
      label: 'Facebook Pixel', key: 'pixel_id', icon: '📘',
      help: 'Meta Events Manager থেকে Pixel ID কপি করুন',
      color: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10',
    },
    {
      label: 'Google Tag Manager', key: 'gtm_id', icon: '🏷️',
      help: 'GTM Container ID (GTM-XXXXXXX ফরম্যাটে)',
      color: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10',
    },
    {
      label: 'Microsoft Clarity', key: 'clarity_id', icon: '🔍',
      help: 'Clarity Project ID (clarity.microsoft.com থেকে)',
      color: 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10',
    },
    {
      label: 'TikTok Pixel', key: 'tiktok_pixel', icon: '🎵',
      help: 'TikTok Ads Manager থেকে Pixel Code',
      color: 'border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-900/10',
    },
    {
      label: 'Google Analytics 4', key: 'ga4_id', icon: '📊',
      help: 'GA4 Measurement ID (G-XXXXXXXXXX)',
      color: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10',
    },
  ]

  return (
    <DashboardLayout title={t('tracking')}>
      <div className="page-container">
        <PageHeader
          title={t('tracking')}
          subtitle="Facebook Pixel, GTM, Clarity ও অন্যান্য ট্র্যাকিং স্ক্রিপ্ট পরিচালনা করুন"
          actions={
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                saved
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-glow'
              }`}
            >
              {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'সেভ করা হয়েছে!' : 'পরিবর্তন সেভ করুন'}
            </button>
          }
        />

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <Radio className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground">
            এখানে যে স্ক্রিপ্টগুলো দেওয়া হবে, সেগুলো স্বয়ংক্রিয়ভাবে আপনার <strong>ওয়েবসাইটের প্রতিটি পেজে</strong> ইনজেক্ট হবে।
            Purchase, Add to Cart, Page View ইভেন্ট সব Pixel-এ পাঠানো হবে।
          </p>
        </div>

        {/* Event tracking chips */}
        <div className="flex flex-wrap gap-2">
          {['PageView', 'AddToCart', 'Purchase', 'InitiateCheckout', 'CompleteRegistration', 'Search', 'ViewContent'].map(e => (
            <div key={e} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-medium text-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {e}
            </div>
          ))}
        </div>

        {/* Tracking cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trackingCards.map(card => (
            <div key={card.key} className={`rounded-2xl border p-5 ${card.color}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">{card.label}</p>
                  <p className="text-xs text-muted-foreground">{card.help}</p>
                </div>
                <div className="ml-auto">
                  <div className={`w-2 h-2 rounded-full ${form[card.key as keyof typeof form] ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                </div>
              </div>
              <input
                value={form[card.key as keyof typeof form]}
                onChange={e => setForm(prev => ({ ...prev, [card.key]: e.target.value }))}
                placeholder={`${card.label} ID যোগ করুন...`}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono"
              />
            </div>
          ))}
        </div>

        {/* Custom Script */}
        <Card>
          <SectionHeader title="কাস্টম স্ক্রিপ্ট" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{'<head>'} কাস্টম কোড</label>
              <textarea
                value={form.custom_head}
                onChange={e => setForm(prev => ({ ...prev, custom_head: e.target.value }))}
                rows={5}
                placeholder="<!-- head tag-এর ভেতরে যোগ করুন -->"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 font-mono resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{'<body>'} কাস্টম কোড</label>
              <textarea
                value={form.custom_body}
                onChange={e => setForm(prev => ({ ...prev, custom_body: e.target.value }))}
                rows={5}
                placeholder="<!-- body tag-এর ভেতরে যোগ করুন -->"
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 font-mono resize-none"
              />
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
