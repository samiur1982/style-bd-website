'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApp } from '@/lib/AppContext'
import { api, APP_URL } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, Card, PrimaryButton, Modal, Input } from '@/components/ui/Components'
import { CategoryTreeItem, AttributePanel } from '@/components/setup/TaxonomyComponents'
import { MediaPicker } from '@/components/media/MediaPicker'
import { Layers, Ruler, Palette, Plus, Loader2, Sparkles, Save, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

// Predefined professional colors for smart suggestions
const colorSuggestions = [
  { name: 'Red', hex: '#FF0000' }, { name: 'Blue', hex: '#0000FF' }, { name: 'Green', hex: '#008000' },
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Navy Blue', hex: '#000080' },
  { name: 'Royal Blue', hex: '#4169E1' }, { name: 'Sky Blue', hex: '#87CEEB' }, { name: 'Maroon', hex: '#800000' },
  { name: 'Olive', hex: '#808000' }, { name: 'Teal', hex: '#008080' }, { name: 'Purple', hex: '#800080' },
  { name: 'Magenta', hex: '#FF00FF' }, { name: 'Pink', hex: '#FFC0CB' }, { name: 'Orange', hex: '#FFA500' },
  { name: 'Yellow', hex: '#FFFF00' }, { name: 'Gold', hex: '#FFD700' }, { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Gray', hex: '#808080' }, { name: 'Charcoal', hex: '#36454F' }, { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Brown', hex: '#A52A2A' }, { name: 'Cyan', hex: '#00FFFF' }, { name: 'Peach', hex: '#FFE5B4' },
  { name: 'Mint', hex: '#98FF98' }, { name: 'Lavender', hex: '#E6E6FA' }, { name: 'Coral', hex: '#FF7F50' },
  { name: 'Mustard', hex: '#FFDB58' }, { name: 'Crimson', hex: '#DC143C' }, { name: 'Burgundy', hex: '#800020' },
];

type SetupType = 'category' | 'size' | 'color' | 'fabric' | 'brand' | 'attribute'

export default function SetupPage() {
  const { t, language } = useApp()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'categories' | 'attributes' | 'brands' | 'dynamic-attributes'>('categories')
  
  // Modal State
  const [modal, setModal] = useState<{
    open: boolean;
    type: SetupType;
    mode: 'add' | 'edit';
    data: any;
  }>({
    open: false,
    type: 'category',
    mode: 'add',
    data: {}
  })

  // Smart Color State
  const [colorInput, setColorInput] = useState({ name: '', hex: '#000000', type: 'solid', description: '' })
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Size State
  const [sizeInput, setSizeInput] = useState({ name: '', code: '', type: 'apparel' })

  // Fabric State
  const [fabricInput, setFabricInput] = useState({ name: '', description: '' })

  // Brand State
  const [brandInput, setBrandInput] = useState({ name: '', description: '', logo: '' })

  // Attribute State
  const [attributeInput, setAttributeInput] = useState({ 
    name: '', type: 'dropdown' as 'dropdown'|'text'|'number', values: [] as string[], category_ids: [] as number[] 
  })

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false)

  // Queries
  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      const res = await api.get('/categories?tree=1')
      return res.data
    }
  })

  const { data: sizes, isLoading: loadingSizes } = useQuery({
    queryKey: ['sizes'],
    queryFn: async () => {
      const res = await api.get('/sizes')
      return res.data
    }
  })

  const { data: colors, isLoading: loadingColors } = useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      const res = await api.get('/colors')
      return res.data
    }
  })

  const { data: fabrics, isLoading: loadingFabrics } = useQuery({
    queryKey: ['fabrics'],
    queryFn: async () => {
      const res = await api.get('/fabrics')
      return res.data
    }
  })

  const { data: brands, isLoading: loadingBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await api.get('/brands')).data
  })

  const { data: dynamicAttributes, isLoading: loadingDynAttrs } = useQuery({
    queryKey: ['attributes'],
    queryFn: async () => (await api.get('/attributes')).data
  })

  // Mutations
  const categoryMutation = useMutation({
    mutationFn: (data: any) => {
      if (modal.mode === 'edit') {
        if (data instanceof FormData) {
          data.append('_method', 'PUT')
          return api.post(`/categories/${modal.data.id}`, data)
        }
        return api.put(`/categories/${modal.data.id}`, data)
      }
      return api.post('/categories', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-tree'] })
      toast.success(`Category ${modal.mode === 'edit' ? 'updated' : 'added'} successfully`)
      closeModal()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Something went wrong')
    }
  })

  const sizeMutation = useMutation({
    mutationFn: (data: any) => {
      if (modal.mode === 'edit') return api.put(`/sizes/${modal.data.id}`, data)
      return api.post('/sizes', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] })
      toast.success(`Size ${modal.mode === 'edit' ? 'updated' : 'saved'}`)
      closeModal()
    }
  })

  const colorMutation = useMutation({
    mutationFn: (data: any) => {
      if (modal.mode === 'edit') return api.put(`/colors/${modal.data.id}`, data)
      return api.post('/colors', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] })
      toast.success(`Color ${modal.mode === 'edit' ? 'updated' : 'saved'}`)
      closeModal()
    }
  })

  const fabricMutation = useMutation({
    mutationFn: (data: any) => {
      if (modal.mode === 'edit') return api.put(`/fabrics/${modal.data.id}`, data)
      return api.post('/fabrics', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabrics'] })
      toast.success(`Fabric/Material ${modal.mode === 'edit' ? 'updated' : 'saved'}`)
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: SetupType, id: number }) => {
      const endpoint = type === 'category' ? `/categories/${id}` : 
                      type === 'size' ? `/sizes/${id}` : 
                      type === 'color' ? `/colors/${id}` : 
                      type === 'fabric' ? `/fabrics/${id}` :
                      type === 'brand' ? `/brands/${id}` :
                      `/attributes/${id}`
      return api.delete(endpoint)
    },
    onSuccess: (_, variables) => {
      const qKey = variables.type === 'category' ? 'categories-tree' : 
                   variables.type === 'attribute' ? 'attributes' :
                   variables.type + 's'
      queryClient.invalidateQueries({ queryKey: [qKey] })
      toast.success(`${variables.type.charAt(0).toUpperCase() + variables.type.slice(1)} deleted`)
    }
  })

  const brandMutation = useMutation({
    mutationFn: (data: any) => {
      if (modal.mode === 'edit') return api.put(`/brands/${modal.data.id}`, data)
      return api.post('/brands', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      toast.success(`Brand ${modal.mode === 'edit' ? 'updated' : 'saved'}`)
      closeModal()
    }
  })

  const attributeMutation = useMutation({
    mutationFn: (data: any) => {
      if (modal.mode === 'edit') return api.put(`/attributes/${modal.data.id}`, data)
      return api.post('/attributes', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] })
      toast.success(`Attribute ${modal.mode === 'edit' ? 'updated' : 'saved'}`)
      closeModal()
    }
  })

  const openModal = (type: SetupType, mode: 'add' | 'edit' = 'add', data: any = {}) => {
    setModal({ open: true, type, mode, data })
    if (type === 'color') {
      setColorInput({
        name: data.name || '',
        hex: data.hex_code || '#000000',
        type: data.type || 'solid',
        description: data.description || ''
      })
      setShowSuggestions(false)
    } else if (type === 'size') {
      setSizeInput({
        name: data.name || '',
        code: data.code || '',
        type: data.type || 'apparel'
      })
    } else if (type === 'fabric') {
      setFabricInput({
        name: data.name || '',
        description: data.description || ''
      })
    } else if (type === 'brand') {
      setBrandInput({
        name: data.name || '',
        description: data.description || '',
        logo: data.logo || ''
      })
    } else if (type === 'attribute') {
      setAttributeInput({
        name: data.name || '',
        type: data.type || 'dropdown',
        values: data.values?.map((v: any) => v.value) || [],
        category_ids: data.categories?.map((c: any) => c.id) || []
      })
    }
  }

  const closeModal = () => {
    setModal(prev => ({ ...prev, open: false, data: {} }))
  }

  const findCategoryById = (id: number, cats: any[] = categories || []): any => {
    for (const cat of cats) {
      if (cat.id === id) return cat
      if (cat.children) {
        const found = findCategoryById(id, cat.children)
        if (found) return found
      }
    }
    return null
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const data = Object.fromEntries(formData.entries())

    if (modal.type === 'category') {
      const slug = formData.get('name')?.toString().toLowerCase().replace(/ /g, '-')
      formData.append('slug', slug || '')
      if (modal.data.parent_id) {
        formData.set('parent_id', modal.data.parent_id.toString())
      }
      // Remove empty image file to avoid Laravel validation error
      const imageFile = formData.get('image') as File
      if (imageFile && imageFile.size === 0) {
        formData.delete('image')
      }

      categoryMutation.mutate(formData)
    } else if (modal.type === 'size') {
      sizeMutation.mutate(data)
    } else if (modal.type === 'color') {
      colorMutation.mutate(data)
    } else if (modal.type === 'fabric') {
      fabricMutation.mutate(data)
    } else if (modal.type === 'brand') {
      brandMutation.mutate(data)
    } else if (modal.type === 'attribute') {
      attributeMutation.mutate({ ...attributeInput, ...data })
    }
  }

  return (
    <DashboardLayout title={t('taxonomy_setup')}>
      <div className="page-container max-w-7xl mx-auto">
        <PageHeader 
          title={t('product_setup_mgmt')} 
          subtitle={t('product_setup_subtitle')}
          actions={
            <div className="flex bg-muted p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'categories' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('categories')}
              </button>
              <button 
                onClick={() => setActiveTab('attributes')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'attributes' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('fashion_specs')}
              </button>
              <button 
                onClick={() => setActiveTab('brands')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'brands' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('brands')}
              </button>
              <button 
                onClick={() => setActiveTab('dynamic-attributes')}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'dynamic-attributes' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('dynamic_attributes')}
              </button>
            </div>
          }
        />

        {activeTab === 'categories' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <Card className="lg:col-span-2 min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">{t('category_hierarchy')}</h2>
                    <p className="text-xs text-muted-foreground">{t('manage_nested_categories')}</p>
                  </div>
                </div>
                <PrimaryButton onClick={() => openModal('category', 'add')}>
                  <Plus className="w-4 h-4" /> {t('root_category')}
                </PrimaryButton>
              </div>

              {loadingCats ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <div className="space-y-1">
                    {categories?.map((cat: any) => (
                      <CategoryTreeItem 
                        key={cat.id} 
                        category={cat} 
                        onAdd={(parentId) => openModal('category', 'add', { parent_id: parentId })}
                        onEdit={(cat) => openModal('category', 'edit', cat)}
                        onDelete={(id) => deleteMutation.mutate({ type: 'category', id })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{t('pro_tip')}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Hierarchical categories improve SEO and help customers find products faster. Use clear, descriptive names.
                </p>
              </Card>
              
              <Card>
                <h3 className="font-semibold mb-3">{t('quick_actions')}</h3>
                <div className="space-y-2">
                  <button onClick={() => { setActiveTab('attributes'); openModal('fabric', 'add'); }} className="w-full text-left p-2.5 text-sm hover:bg-muted rounded-xl transition-all border border-border/40 hover:border-primary/30 flex justify-between items-center">
                    <span>{t('manage_fabrics')}</span>
                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button className="w-full text-left p-2.5 text-sm hover:bg-muted rounded-xl transition-all border border-border/40 hover:border-primary/30">{t('bulk_import')} {t('categories')}</button>
                  <button className="w-full text-left p-2.5 text-sm hover:bg-muted rounded-xl transition-all border border-border/40 hover:border-primary/30">Optimize Slugs</button>
                </div>
              </Card>
            </div>
          </div>
        ) : activeTab === 'attributes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in min-h-[600px]">
            <AttributePanel 
              title={t('sizes')} 
              items={sizes || []} 
              icon={Ruler}
              onAdd={() => openModal('size', 'add')}
              onEdit={(item) => openModal('size', 'edit', item)}
              onDelete={(id) => deleteMutation.mutate({ type: 'size', id })}
              renderItem={(item) => (
                <>
                  <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-xs font-bold font-mono border border-border/50 shadow-sm">
                    {item.code || item.name?.toString()?.substring(0, 2) || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{item.name}</p>
                      {item.type === 'numeric' && (
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">Numeric</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                      {item.type === 'numeric' ? (item.code ? `Unit: ${item.code}` : 'No Unit') : item.code}
                    </p>
                  </div>
                </>
              )}
            />

            <AttributePanel 
              title={t('colors')} 
              items={colors || []} 
              icon={Palette}
              onAdd={() => openModal('color', 'add')}
              onEdit={(item) => openModal('color', 'edit', item)}
              onDelete={(id) => deleteMutation.mutate({ type: 'color', id })}
              renderItem={(item) => (
                <>
                  {item.type === 'multi' ? (
                    <div 
                      className="w-9 h-9 rounded-xl border-2 border-border shadow-md flex items-center justify-center bg-muted text-[10px] font-bold" 
                      title={item.description}
                    >
                      M
                    </div>
                  ) : (
                    <div 
                      className="w-9 h-9 rounded-xl border-2 border-border shadow-md ring-2 ring-background ring-offset-1" 
                      style={{ backgroundColor: item.hex_code || '#ccc' }} 
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{item.name}</p>
                      {item.type === 'multi' && (
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">Multi</span>
                      )}
                    </div>
                    {item.type === 'multi' && item.description ? (
                      <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{item.description}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">{item.hex_code}</p>
                    )}
                  </div>
                </>
              )}
            />

            <AttributePanel 
              title={t('fabrics')} 
              items={fabrics || []} 
              icon={Layers}
              onAdd={() => openModal('fabric', 'add')}
              onEdit={(item) => openModal('fabric', 'edit', item)}
              onDelete={(id) => deleteMutation.mutate({ type: 'fabric', id })}
              renderItem={(item) => (
                <>
                  <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-xs font-bold font-mono border border-border/50 shadow-sm text-muted-foreground">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    {item.description ? (
                      <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{item.description}</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">No description</p>
                    )}
                  </div>
                </>
              )}
            />
          </div>
        ) : activeTab === 'brands' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in min-h-[600px]">
             <AttributePanel 
              title={t('registered_brands')} 
              items={brands || []} 
              icon={Sparkles}
              onAdd={() => openModal('brand', 'add')}
              onEdit={(item) => openModal('brand', 'edit', item)}
              onDelete={(id) => deleteMutation.mutate({ type: 'brand', id })}
              renderItem={(item) => (
                <>
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border overflow-hidden">
                    {item.logo ? <img src={item.logo} alt="" className="w-full h-full object-contain" /> : <Sparkles className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.description || 'No description'}</p>
                  </div>
                </>
              )}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in min-h-[600px]">
            <AttributePanel 
              title={t('category_attributes')} 
              items={dynamicAttributes || []} 
              icon={Layers}
              onAdd={() => openModal('attribute', 'add')}
              onEdit={(item) => openModal('attribute', 'edit', item)}
              onDelete={(id) => deleteMutation.mutate({ type: 'attribute', id })}
              renderItem={(item) => (
                <>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground border border-border px-1 rounded">{item.type}</span>
                      <span className="text-[9px] uppercase font-bold text-primary bg-primary/5 px-1 rounded">{item.categories?.length || 0} Categories</span>
                    </div>
                  </div>
                </>
              )}
            />
          </div>
        )}

        {/* Dynamic Modal for all Setup Types */}
        <Modal 
          isOpen={modal.open} 
          onClose={closeModal}
          title={`${modal.mode === 'add' ? t('add_new') : t('edit')} ${t(modal.type)}`}
          footer={
            <>
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t('cancel')}</button>
              <PrimaryButton onClick={() => (document.getElementById('setup-form') as HTMLFormElement)?.requestSubmit()} className="!px-6">
                <Save className="w-4 h-4" /> {t('save')} {t(modal.type)}
              </PrimaryButton>
            </>
          }
        >
          <form id="setup-form" onSubmit={handleFormSubmit} className="space-y-4">
            {modal.type === 'category' && (
              <>
                {modal.data.parent_id && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">{t('adding_under')}</p>
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-semibold">{findCategoryById(modal.data.parent_id)?.name || 'Parent Category'}</span>
                    </div>
                  </div>
                )}
                {!modal.data.parent_id && modal.mode === 'add' && (
                  <div className="p-3 rounded-xl bg-accent/50 border border-border/50 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('type')}</p>
                    <span className="text-sm font-semibold">{t('root_category')}</span>
                  </div>
                )}
                <Input label={t('category_name_en')} name="name" defaultValue={modal.data.name} required placeholder="e.g. Mens Clothing" />
                <Input label={t('category_name_bn')} name="name_bn" defaultValue={modal.data.name_bn} placeholder="যেমন: ছেলেদের পোশাক" />
                <div className="space-y-4 py-4 border-y border-border/50 my-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Option 1: Upload from PC</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="file" 
                        name="image" 
                        accept="image/*" 
                        className="input flex-1 file:bg-primary file:text-white file:border-0 file:px-3 file:py-1 file:rounded-lg file:mr-4 file:cursor-pointer"
                      />
                      {modal.data.image_url && (
                         <div className="w-14 h-14 rounded-xl border border-border overflow-hidden bg-muted shadow-sm flex-shrink-0">
                            <img src={`${APP_URL}${modal.data.image_url}`} alt="" className="w-full h-full object-cover" />
                         </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-muted-foreground"><span className="bg-card px-3">OR</span></div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Option 2: Browse from Media Manager</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        name="image_url" 
                        id="image_url_input"
                        defaultValue={modal.data.image_url} 
                        placeholder="Select image or paste path..."
                        className="input flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Browse Media
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Tip: Click "Browse Media" to select an existing image from your library</p>
                  </div>
                </div>

                <MediaPicker 
                  isOpen={isMediaPickerOpen}
                  onClose={() => setIsMediaPickerOpen(false)}
                  onSelect={(path) => {
                    const input = document.getElementById('image_url_input') as HTMLInputElement
                    if (input) input.value = path
                    setModal(prev => ({ ...prev, data: { ...prev.data, image_url: path } }))
                  }}
                />
                <Input label={t('order')} name="order" type="number" defaultValue={modal.data.order || 0} />
              </>
            )}
            {modal.type === 'size' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('size_format')}</label>
                  <select 
                    name="type" 
                    className="input" 
                    value={sizeInput.type} 
                    onChange={(e) => setSizeInput(prev => ({ ...prev, type: e.target.value as 'apparel' | 'numeric' }))}
                  >
                    <option value="apparel">{t('standard_apparel')}</option>
                    <option value="numeric">{t('numeric_measurement')}</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {sizeInput.type === 'numeric' ? t('measurement_value') : t('size_name')}
                  </label>
                  <input
                    name="name"
                    className="input"
                    value={sizeInput.name}
                    onChange={(e) => setSizeInput(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder={sizeInput.type === 'numeric' ? 'e.g. 42 or 38.5' : 'e.g. Extra Large'}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {sizeInput.type === 'numeric' ? t('measurement_unit') : t('size_code')}
                  </label>
                  <input
                    name="code"
                    className="input"
                    value={sizeInput.code}
                    onChange={(e) => setSizeInput(prev => ({ ...prev, code: e.target.value }))}
                    placeholder={sizeInput.type === 'numeric' ? 'e.g. Inch, cm' : 'e.g. XL'}
                  />
                </div>

                <Input label="Order" name="order" type="number" defaultValue={modal.data.order || 0} />
              </>
            )}
            {modal.type === 'color' && (
              <>
                <div className="space-y-1.5 relative">
                  <label className="text-sm font-medium text-foreground">{t('color')} {t('customer_name')}</label>
                  <input
                    name="name"
                    className="input"
                    value={colorInput.name}
                    onChange={(e) => {
                      setColorInput(prev => ({ ...prev, name: e.target.value }))
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    required
                    placeholder="e.g. Navy Blue or Plaid"
                    autoComplete="off"
                  />
                  {showSuggestions && colorInput.name.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {colorSuggestions
                        .filter(c => c.name.toLowerCase().includes(colorInput.name.toLowerCase()))
                        .map((c, i) => (
                          <div 
                            key={i} 
                            className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                            onClick={() => {
                              setColorInput({ name: c.name, hex: c.hex, type: 'solid', description: '' })
                              setShowSuggestions(false)
                            }}
                          >
                            <div className="w-5 h-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: c.hex }} />
                            <span className="text-sm font-medium">{c.name}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t('type')}</label>
                  <select 
                    name="type" 
                    className="input" 
                    value={colorInput.type} 
                    onChange={(e) => setColorInput(prev => ({ ...prev, type: e.target.value as 'solid' | 'multi' }))}
                  >
                    <option value="solid">{t('solid_color')}</option>
                    <option value="multi">{t('multi_color')}</option>
                  </select>
                </div>

                <Input 
                  label={colorInput.type === 'multi' ? 'Primary Hex Code (Optional)' : 'Hex Code'} 
                  name="hex_code" 
                  type="color" 
                  value={colorInput.hex} 
                  onChange={(e: any) => setColorInput(prev => ({ ...prev, hex: e.target.value }))}
                  className="h-12 w-full p-1 cursor-pointer" 
                />

                {colorInput.type === 'multi' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-sm font-medium text-foreground">{t('pattern_description')}</label>
                    <textarea 
                      name="description" 
                      className="input min-h-[80px]" 
                      value={colorInput.description}
                      onChange={(e) => setColorInput(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g. Red and black checkered pattern" 
                    />
                  </div>
                )}

                <Input label="Order" name="order" type="number" defaultValue={modal.data.order || 0} />
              </>
            )}
            {modal.type === 'fabric' && (
              <>
                <Input 
                  label="Fabric / Material Name" 
                  name="name" 
                  value={fabricInput.name} 
                  onChange={(e: any) => setFabricInput(prev => ({ ...prev, name: e.target.value }))}
                  required 
                  placeholder="e.g. Cotton or Denim" 
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Description (Optional)</label>
                  <textarea 
                    name="description" 
                    className="input min-h-[80px]" 
                    value={fabricInput.description}
                    onChange={(e) => setFabricInput(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g. 100% Organic Cotton" 
                  />
                </div>
              </>
            )}
            {modal.type === 'brand' && (
              <>
                <Input label="Brand Name" name="name" value={brandInput.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrandInput(p => ({ ...p, name: e.target.value }))} required />
                <Input label="Logo URL (Optional)" name="logo" value={brandInput.logo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrandInput(p => ({ ...p, logo: e.target.value }))} placeholder="https://..." />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Brand Description</label>
                  <textarea name="description" className="input min-h-[100px]" value={brandInput.description} onChange={e => setBrandInput(p => ({ ...p, description: e.target.value }))} />
                </div>
              </>
            )}
            {modal.type === 'attribute' && (
              <div className="space-y-4">
                <Input label="Attribute Name" value={attributeInput.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttributeInput(p => ({ ...p, name: e.target.value }))} placeholder="e.g. RAM, Material" required />
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Input Type</label>
                  <select className="input" value={attributeInput.type} onChange={e => setAttributeInput(p => ({ ...p, type: e.target.value as any }))}>
                    <option value="dropdown">Dropdown (Select from list)</option>
                    <option value="text">Free Text</option>
                    <option value="number">Number</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Associated Categories</label>
                  <div className="p-3 rounded-xl border border-border max-h-40 overflow-y-auto space-y-2">
                    {categories?.map((cat: any) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded transition-colors">
                        <input type="checkbox" checked={attributeInput.category_ids.includes(cat.id)}
                          onChange={e => {
                            const ids = e.target.checked ? [...attributeInput.category_ids, cat.id] : attributeInput.category_ids.filter(id => id !== cat.id)
                            setAttributeInput(p => ({ ...p, category_ids: ids }))
                          }}
                        />
                        <span className="text-xs">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Select which categories this attribute should appear in.</p>
                </div>

                {attributeInput.type === 'dropdown' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Options (one per line)</label>
                    <textarea 
                      className="input min-h-[100px]" 
                      placeholder="e.g.&#10;8GB&#10;16GB&#10;32GB"
                      value={attributeInput.values.join('\n')}
                      onChange={e => setAttributeInput(p => ({ ...p, values: e.target.value.split('\n') }))}
                    />
                  </div>
                )}
              </div>
            )}
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
