'use client'

import ProductForm from '@/components/products/ProductForm'
import { useState, useRef, useCallback, useEffect } from 'react'
import ProductImage from '@/components/ui/ProductImage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, Edit, Trash2, Eye, X, Save, Package,
  ChevronLeft, ChevronRight, Grid, List, Upload, AlertTriangle,
  Image as ImageIcon, Images, PlusCircle, Minus, Check, ChevronDown, Copy,
  Sparkles, Layers, RotateCcw, Truck
} from 'lucide-react'

import { useApp } from '@/lib/AppContext'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, PrimaryButton, StatusBadge, CopyableText } from '@/components/ui/Components'

type Variant = { size: string; stock: number }
type SkuVariant = { color: string | null; size: string | null; sku?: string; stock: number; price?: number | null }
type Product = {
  id: number; code: string; name: string; name_bn: string; sku: string;
  category_id: number; category: { id: number; name: string } | null;
  brand_id?: number | null; brand?: { id: number; name: string } | null;
  subtype: string; fabric: string; color: string;
  price: number; regular_price?: number; cost_price: number;
  delivery_inside: number; delivery_outside: number;
  stock: number; low_stock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  publish_status: 'draft' | 'inactive' | 'active';
  short_description: string; short_description_bn: string;
  description: string; description_bn: string;
  image: string; images_json: string[]; image_count: number;
  variants: Variant[]; tags: string[];
  product_variants?: SkuVariant[];
  dynamic_attributes?: any[];
}
type Category = { id: number; name: string; name_bn: string; slug: string; labelName?: string }

/* ── Lightbox ── */
function Lightbox({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx)
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
        <X className="w-6 h-6 text-white" />
      </button>
      <div className="relative max-w-2xl w-full mx-4 flex items-center" onClick={e => e.stopPropagation()}>
        <button disabled={idx === 0} onClick={() => setIdx(i => i - 1)}
          className="absolute left-0 -translate-x-12 p-2 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-20 transition-all z-10">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
          <ProductImage src={images[idx]} alt={`Image ${idx + 1}`} fill sizes="100vw" className="object-cover" />
        </div>
        <button disabled={idx >= images.length - 1} onClick={() => setIdx(i => i + 1)}
          className="absolute right-0 translate-x-12 p-2 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-20 transition-all z-10">
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>
      <div className="absolute bottom-4 flex gap-2">
        {images.map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); setIdx(i) }}
            className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`} />
        ))}
      </div>
      <div className="absolute bottom-10 text-white/60 text-sm">{idx + 1} / {images.length}</div>
    </div>
  )
}

/* ── Product Detail Drawer (View) ── */
function ProductDrawer({ product, onClose, onEdit, onDelete, onDuplicate }: { product: Product; onClose: () => void; onEdit: () => void; onDelete: () => void; onDuplicate?: () => void }) {
  const { t, language } = useApp()
  const [activeImg, setActiveImg] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const margin = product.price && product.cost_price
    ? ((product.price - product.cost_price) / product.price * 100).toFixed(1)
    : '0'
  const imagesJson = Array.isArray(product.images_json) ? product.images_json : [];
  const images = imagesJson.length ? imagesJson : (product.image ? [product.image] : []);

  const { data: colors = [] } = useQuery({
    queryKey: ['colors'],
    queryFn: async () => (await api.get('/colors')).data
  })

  const queryClient = useQueryClient()

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-full max-w-lg mr-auto h-full flex flex-col overflow-y-auto border-r border-border shadow-2xl bg-card"
        style={{ animation: 'slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10 shadow-sm">
          <div>
            <span className="font-mono text-xs font-bold text-primary">{product.code}</span>
            <h3 className="font-bold text-foreground">{language === 'bn' && product.name_bn ? product.name_bn : product.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        {images.length > 0 && (
          <div className="relative w-full aspect-[4/5] bg-muted cursor-zoom-in flex-shrink-0" onClick={() => setLightbox(activeImg)}>
            <ProductImage src={images[activeImg]} alt={product.name} fill sizes="500px" className="object-cover" priority />
            <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{activeImg + 1}/{images.length}</div>
          </div>
        )}

        {images.length > 1 && (
          <div className="flex gap-3 p-4 overflow-x-auto border-b border-border bg-muted/30 flex-shrink-0 min-h-[6rem]">
            {Array.isArray(images) && images.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)}
                className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary ring-2 ring-primary/20 scale-105 shadow-md' : 'border-transparent hover:border-border outline outline-1 outline-border'}`}>
                <ProductImage src={img} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-5 space-y-5 flex-1 break-words">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-primary">৳{Number(product.price).toLocaleString()}</p>
                {product.regular_price && Number(product.regular_price) > Number(product.price) && (
                  <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">৳{Number(product.regular_price).toLocaleString()}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t('cost_price')}: ৳{Number(product.cost_price).toLocaleString()} · {t('margin')}: <span className="text-emerald-500 font-semibold">{margin}%</span></p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={product.status} />
              {product.publish_status === 'draft' && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">📝 Draft</span>}
              {product.publish_status === 'inactive' && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">🔒 Not Published</span>}
              {product.publish_status === 'active' && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">🌍 Published</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[[t('sku'), product.sku], [t('category'), product.category?.name || '—'], [t('color'), product.color], [t('fabric'), product.fabric], [t('subtype'), product.subtype]].map(([l, v]) => (
              <div key={l as string} className="p-2.5 rounded-xl bg-muted border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{l as string}</p>
                <p className="text-sm font-semibold text-foreground truncate" title={v as string}>{v as string || '—'}</p>
              </div>
            ))}
          </div>

          {/* SKU Matrix Display */}
          {product.product_variants && product.product_variants.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                {t('inventory_breakdown')}
              </div>
              <div className="space-y-3">
                {/* Group by color */}
                {Object.entries(
                  product.product_variants.reduce((acc, v) => {
                    const c = v.color || 'No Color';
                    if (!acc[c]) acc[c] = [];
                    acc[c].push(v);
                    return acc;
                  }, {} as Record<string, SkuVariant[]>)
                ).map(([color, variants]) => (
                  <div key={color} className="p-3 rounded-xl border border-border bg-muted/20">
                    <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border border-border/50"
                        style={{ background: colors.find((c: any) => c.name === color)?.hex_code || '#ccc' }} />
                      {color}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {variants.map(v => (
                        <div key={v.size} className="bg-card border border-border rounded-lg p-2 text-center">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{v.size || 'N/A'}</p>
                          <p className={`text-xs font-mono font-bold ${v.stock === 0 ? 'text-red-500' : v.stock <= (product.low_stock || 5) ? 'text-amber-500' : 'text-foreground'}`}>
                            {v.stock} {t('pcs')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy Variants (Fallback) */}
          {!product.product_variants?.length && product.variants?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Sizes & {t('stock')} (Legacy)</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <div key={v.size} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${v.stock === 0 ? 'border-red-300 text-red-500 bg-red-50 dark:bg-red-900/15' : v.stock < 5 ? 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/15' : 'border-border text-foreground bg-muted'}`}>
                    {v.size} · {v.stock} {t('pcs')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(product.short_description || product.short_description_bn) && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 italic">
              <p className="text-sm text-foreground leading-relaxed">
                {language === 'bn' && product.short_description_bn ? product.short_description_bn : product.short_description}
              </p>
            </div>
          )}

          {product.description && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">{t('description')}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {language === 'bn' && product.description_bn ? product.description_bn : product.description}
              </p>
            </div>
          )}

          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map(t => (
                <span key={t} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">#{t}</span>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">
            <Edit className="w-4 h-4" /> {t('edit_product')}
          </button>
          {onDuplicate && (
            <button onClick={onDuplicate}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border text-foreground bg-card rounded-xl text-sm font-semibold hover:bg-accent transition-colors shadow-sm">
              <Copy className="w-4 h-4" /> Duplicate
            </button>
          )}
          <button onClick={onDelete}
            className="p-2.5 rounded-xl border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {lightbox !== null && <Lightbox images={images} startIdx={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

/* ── MAIN PAGE ── */
export default function ProductsPage() {
  const { t } = useApp()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null)
  const [formProduct, setFormProduct] = useState<Product | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setConfirmDelete(null)
      setDrawerProduct(null)
      toast.success(t('product_deleted') || 'Product deleted successfully')
    },
    onError: (err: any) => {
      setConfirmDelete(null)
      toast.error(err.response?.data?.message || 'Failed to delete product')
    }
  })

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => api.post(`/products/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDrawerProduct(null)
      toast.success(t('product_duplicated') || 'Product duplicated successfully')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to duplicate product')
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, publish_status }: { id: number, publish_status: string }) =>
      api.put(`/products/${id}`, { publish_status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, catFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (catFilter !== 'all') params.append('category_id', catFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await api.get(`/products?${params.toString()}&per_page=100`)
      return res.data
    }
  })

  const { data: catData } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      const res = await api.get('/categories?tree=1')
      return res.data
    }
  })

  // Helper to flatten category tree for dropdowns
  const flattenCategories = (cats: any[], depth = 0): any[] => {
    let flat: any[] = []
    for (const cat of cats) {
      flat.push({ ...cat, depth, labelName: `${'—'.repeat(depth)} ${cat.name}`.trim() })
      if (cat.children && cat.children.length > 0) {
        flat = flat.concat(flattenCategories(cat.children, depth + 1))
      }
    }
    return flat
  }

  const products: Product[] = data?.data || []
  const categories = catData ? flattenCategories(catData) : []

  const catOptions = [{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: String(c.id), label: c.labelName }))]

  const stats = {
    total: data?.total || products.length,
    inStock: products.filter(p => p.status === 'in_stock').length,
    lowStock: products.filter(p => p.status === 'low_stock').length,
    outOfStock: products.filter(p => p.status === 'out_of_stock').length,
  }

  return (
    <DashboardLayout title={t('products')}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes slideInLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }
      `}</style>
      <div className="page-container">
        <PageHeader
          title={t('products')}
          subtitle={`${stats.total} Products`}
          actions={
            <>
              <a href="/dashboard/media" className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Upload className="w-4 h-4" /> Media
              </a>
              <button onClick={() => router.push('/dashboard/products/add')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm">
                <Plus className="w-4 h-4" /> New Product
              </button>
            </>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, cls: 'text-primary' },
            { label: 'In Stock', value: stats.inStock, cls: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Low Stock', value: stats.lowStock, cls: 'text-amber-600 dark:text-amber-400' },
            { label: 'Out of Stock', value: stats.outOfStock, cls: 'text-red-600 dark:text-red-400' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4">
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="glass-card p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-muted border border-border">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, SKU, code..."
                className="bg-transparent flex-1 outline-none text-sm text-foreground placeholder:text-muted-foreground" />
              {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl border transition-colors ${viewMode === 'grid' ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground'}`}><Grid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl border transition-colors ${viewMode === 'list' ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground'}`}><List className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {catOptions.map(c => (
              <button key={c.value} onClick={() => setCatFilter(c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${catFilter === c.value ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                {c.label}
              </button>
            ))}
            <div className="w-px bg-border" />
            {[['all', 'All'], ['in_stock', 'In Stock'], ['low_stock', 'Low Stock'], ['out_of_stock', 'Out of Stock']].map(([v, l]) => (
              <button key={v} onClick={() => setStatusFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === v ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                {l}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No products found.</p>
              <button onClick={() => router.push('/dashboard/products/add')} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> Add first product
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => {
                const margin = p.price && p.cost_price ? ((p.price - p.cost_price) / p.price * 100).toFixed(0) : '0'
                return (
                  <div key={p.id} onClick={() => setDrawerProduct(p)}
                    className="group rounded-[10px] border border-border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    <div className="relative w-full overflow-hidden aspect-square">
                      <ProductImage src={p.image} alt={p.name} fill sizes="(max-width:640px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">📷 {p.image_count || 1}</div>
                      {p.status !== 'in_stock' && (
                        <div className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'low_stock' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                          {p.status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                        </div>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(p.id); }}
                        disabled={duplicateMutation.isPending}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                        title="Duplicate Product"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="font-mono text-[10px] text-muted-foreground mb-0.5">{p.code}</p>
                      <h3 className="font-semibold text-sm text-foreground leading-tight mb-1 line-clamp-1">{p.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary text-sm">৳{Number(p.price).toLocaleString()}</span>
                        <span className="text-[11px] text-emerald-500 font-semibold">{margin}%</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{p.fabric}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-foreground">{p.stock} pcs</span>
                          {p.product_variants && p.product_variants.length > 0 && (
                            <span className="text-[9px] text-primary font-bold uppercase tracking-tighter">
                              {p.product_variants.length} Variants
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {['Product', 'Code/SKU', 'Price', 'Stock', 'Status', t('action'), 'Visibility'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} onClick={() => setDrawerProduct(p)}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-[10px] overflow-hidden border border-border flex-shrink-0">
                            <ProductImage src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.name_bn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <CopyableText text={p.code} className="font-mono text-xs font-bold text-primary">
                          {p.code}
                        </CopyableText>
                        <CopyableText text={p.sku} className="font-mono text-[10px] text-muted-foreground">
                          {p.sku}
                        </CopyableText>
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground">৳{Number(p.price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        <div className="flex flex-col">
                          <span>{p.stock}</span>
                          {p.product_variants && p.product_variants.length > 0 && (
                            <span className="text-[10px] text-primary font-bold">{p.product_variants.length} SKU Variants</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={e => { e.stopPropagation(); setDrawerProduct(p) }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); setFormProduct(p) }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Edit Product">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); duplicateMutation.mutate(p.id) }}
                            disabled={duplicateMutation.isPending}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                            title="Duplicate Product">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={e => {
                            e.stopPropagation();
                            setConfirmDelete(p.id)
                          }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-accent transition-colors z-10"
                            title="Delete Product"
                            disabled={deleteMutation.isPending && confirmDelete === p.id}>
                            <Trash2 className="w-4 h-4 pointer-events-none" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={p.publish_status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => {
                            e.stopPropagation();
                            updateStatusMutation.mutate({ id: p.id, publish_status: e.target.value });
                          }}
                          disabled={updateStatusMutation.isPending}
                          className="text-[10px] font-semibold text-foreground bg-card border border-border rounded-lg px-2 py-1 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors cursor-pointer"
                        >
                          <option value="draft">📝 Draft</option>
                          <option value="inactive">🔒 Not Published</option>
                          <option value="active">🌍 Published</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {drawerProduct && !formProduct && (
        <ProductDrawer
          key={`view-${drawerProduct.id}`}
          product={drawerProduct}
          onClose={() => setDrawerProduct(null)}
          onEdit={() => { setFormProduct(drawerProduct); setDrawerProduct(null) }}
          onDelete={() => setConfirmDelete(drawerProduct.id)}
          onDuplicate={() => duplicateMutation.mutate(drawerProduct.id)}
        />
      )}

      {formProduct && (
        <ProductForm
          key={`edit-${formProduct.id}`}
          initial={formProduct}
          categories={categories}
          onClose={() => setFormProduct(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Delete Product"
          message={t('delete_confirm')}
          onConfirm={() => deleteMutation.mutate(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </DashboardLayout>
  )
}

function ConfirmModal({ title, message, onConfirm, onCancel, isPending }: {
  title: string, message: string, onConfirm: () => void, onCancel: () => void, isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3 w-full">
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground font-medium hover:bg-accent transition-colors">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isPending}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
