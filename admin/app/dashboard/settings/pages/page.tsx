'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, SectionHeader } from '@/components/ui/Components'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { FileText, Pencil, Save, ChevronLeft, Globe } from 'lucide-react'
import RichTextEditor from '@/components/ui/RichTextEditor'

interface PageData {
  id: number
  slug: string
  title_en: string
  title_bn: string
  content_en: string
  content_bn: string
  updated_at: string
}

export default function PagesManagement() {
  const { t, language } = useApp()
  const queryClient = useQueryClient()
  const [editingPage, setEditingPage] = useState<PageData | null>(null)
  const [formData, setFormData] = useState<Partial<PageData>>({})
  const [activeTab, setActiveTab] = useState<'en' | 'bn'>('en')

  const { data: pages = [], isLoading } = useQuery<PageData[]>({
    queryKey: ['admin-pages'],
    queryFn: async () => (await api.get('/pages')).data,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PageData>) => {
      return api.put(`/pages/${data.id}`, data)
    },
    onSuccess: () => {
      toast.success('Page updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] })
      setEditingPage(null)
    },
    onError: () => toast.error('Failed to update page')
  })

  const handleEdit = (page: PageData) => {
    setEditingPage(page)
    setFormData({
      id: page.id,
      title_en: page.title_en,
      title_bn: page.title_bn,
      content_en: page.content_en || '',
      content_bn: page.content_bn || ''
    })
    setActiveTab('en')
  }

  const handleSave = () => {
    if (!formData.title_en || !formData.title_bn) {
      toast.error('Both English and Bengali titles are required')
      return
    }
    updateMutation.mutate(formData)
  }

  if (editingPage) {
    return (
      <DashboardLayout title={language === 'en' ? 'Edit Page' : 'পেজ এডিট করুন'}>
        <div className="page-container">
          <PageHeader
            title={language === 'en' ? `Edit: ${editingPage.title_en}` : `এডিট: ${editingPage.title_bn}`}
            subtitle={language === 'en' ? 'Update page content and title' : 'পেজের কনটেন্ট এবং টাইটেল আপডেট করুন'}
            actions={
              <div className="flex gap-2">
                <button onClick={() => setEditingPage(null)} className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-accent transition-colors">
                  {language === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {updateMutation.isPending ? <span className="animate-pulse">...</span> : <Save className="w-4 h-4" />}
                  {language === 'en' ? 'Save Changes' : 'সেভ করুন'}
                </button>
              </div>
            }
          />

          <div className="glass-card p-6">
            <div className="flex gap-2 mb-6 border-b border-border pb-4">
              <button
                onClick={() => setActiveTab('en')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'en' ? 'bg-primary text-white shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Globe className="w-4 h-4" /> English
              </button>
              <button
                onClick={() => setActiveTab('bn')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'bn' ? 'bg-primary text-white shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Globe className="w-4 h-4" /> বাংলা (Bengali)
              </button>
            </div>

            <div className="space-y-6">
              {activeTab === 'en' ? (
                <>
                  <div>
                    <label className="label">Page Title (English) *</label>
                    <input 
                      value={formData.title_en} 
                      onChange={e => setFormData(p => ({ ...p, title_en: e.target.value }))} 
                      className="input" 
                      placeholder="e.g. About Us"
                    />
                  </div>
                  <div>
                    <label className="label">Page Content (English)</label>
                    <RichTextEditor
                      value={formData.content_en || ''}
                      onChange={val => setFormData(p => ({ ...p, content_en: val }))}
                      placeholder="Write the page content in English..."
                      rows={15}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label">Page Title (Bengali) *</label>
                    <input 
                      value={formData.title_bn} 
                      onChange={e => setFormData(p => ({ ...p, title_bn: e.target.value }))} 
                      className="input" 
                      placeholder="e.g. আমাদের সম্পর্কে"
                    />
                  </div>
                  <div>
                    <label className="label">Page Content (Bengali)</label>
                    <RichTextEditor
                      value={formData.content_bn || ''}
                      onChange={val => setFormData(p => ({ ...p, content_bn: val }))}
                      placeholder="বাংলায় পেজের কনটেন্ট লিখুন..."
                      rows={15}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={language === 'en' ? 'Pages Management' : 'পেজ ম্যানেজমেন্ট'}>
      <div className="page-container">
        <PageHeader
          title={language === 'en' ? 'Pages' : 'পেজসমূহ'}
          subtitle={language === 'en' ? 'Manage your storefront pages like About Us, Privacy Policy, etc.' : 'আপনার স্টোরফ্রন্টের পেজগুলো পরিচালনা করুন (যেমন: আমাদের সম্পর্কে, শর্তাবলী ইত্যাদি)'}
        />

        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading pages...</div>
          ) : (
            <div className="divide-y divide-border">
              {pages.map(page => (
                <div key={page.id} className="p-5 flex items-center justify-between hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-[15px]">{language === 'en' ? page.title_en : page.title_bn}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">/{page.slug}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleEdit(page)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50 text-foreground text-xs font-semibold hover:bg-primary hover:text-white transition-all opacity-80 group-hover:opacity-100"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {language === 'en' ? 'Edit' : 'এডিট'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`.label { display:block; font-size:.8125rem; font-weight:500; color:hsl(var(--foreground)); margin-bottom:.375rem; } .input { width:100%; padding:.625rem .875rem; border-radius:.625rem; border:1px solid hsl(var(--border)); background:hsl(var(--muted)); color:hsl(var(--foreground)); font-size:.875rem; outline:none; }`}</style>
    </DashboardLayout>
  )
}
