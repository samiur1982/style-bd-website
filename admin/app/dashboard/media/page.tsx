'use client'

import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, ConfirmationModal } from '@/components/ui/Components'
import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  Search, Upload, Grid, Rows3, Trash2, X, Download, Copy,
  CheckCircle, ZoomIn, ZoomOut, RotateCw, Filter, FolderOpen,
  Images, HardDrive, ChevronLeft, ChevronRight, Edit3, Check, LayoutGrid
} from 'lucide-react'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import ImageEditor from '@/components/media/ImageEditor'
import confetti from 'canvas-confetti'

export type MediaItem = {
  id: string; src: string; path: string; name: string; product: string; productCode: string;
  size: string; dimensions: string; format: string; index: number;
}



/* ── Image Lightbox ── */
function Lightbox({ items, startId, onClose, onDelete }: { items: MediaItem[]; startId: string; onClose: () => void; onDelete: (path: string) => void }) {
  const [current, setCurrent] = useState(items.findIndex(m => m.id === startId))
  const [zoom, setZoom] = useState(1)
  const [rotate, setRotate] = useState(0)
  const m = items[current]

  return (
    <div className="fixed inset-0 z-[100] bg-black/96 flex flex-col" onClick={onClose}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="text-white font-mono text-sm font-bold">{m.productCode}</span>
          <span className="text-white/50 text-sm">{m.name}</span>
          <span className="text-white/40 text-xs">{m.dimensions} · {m.size}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.25, 3))} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="ズームイン"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
          <button onClick={() => setRotate(r => r + 90)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="Rotate"><RotateCw className="w-4 h-4" /></button>
          <span className="text-white/40 text-xs px-2">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onDelete(m.path);
            }} 
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500 text-white transition-colors ml-2" 
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/30 text-white transition-colors ml-2"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden" onClick={onClose}>
        <button disabled={current === 0} onClick={e => { e.stopPropagation(); setCurrent(c => c-1); setZoom(1); setRotate(0) }}
          className="absolute left-3 p-3 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-20 transition-all text-white z-10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div onClick={e => e.stopPropagation()} 
          className="relative overflow-hidden rounded-lg shadow-2xl"
          style={{ width: `min(60vw, ${600 * zoom}px)`, aspectRatio: '4/5', transform: `scale(${zoom}) rotate(${rotate}deg)`, transition: 'transform 0.3s ease' }}>
          <Image src={m.src} alt={m.name} fill className="object-cover" sizes="60vw" unoptimized />
        </div>
        <button disabled={current >= items.length - 1} onClick={e => { e.stopPropagation(); setCurrent(c => c+1); setZoom(1); setRotate(0) }}
          className="absolute right-3 p-3 rounded-full bg-white/10 hover:bg-white/25 disabled:opacity-20 transition-all text-white z-10">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Strip */}
      <div className="flex gap-2 px-4 py-3 bg-black/80 border-t border-white/10 overflow-x-auto" onClick={e => e.stopPropagation()}>
        {items.map((item, i) => (
          <button key={item.id} onClick={() => { setCurrent(i); setZoom(1); setRotate(0) }}
            className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-white scale-110 shadow-lg' : 'border-white/20 hover:border-white/50'}`}
            style={{ width: 40, height: 50 }}>
            <Image src={item.src} alt="" fill className="object-cover" sizes="40px" />
          </button>
        ))}
      </div>
      {/* Counter */}
      <div className="text-center text-white/40 text-xs pb-2">{current+1} / {items.length}</div>
    </div>
  )
}

/* ── MAIN MEDIA PAGE ── */
export default function MediaPage() {
  const { t, language } = useApp()
  const { data: items = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ['media'],
    queryFn: async () => (await api.get('/media')).data
  })
  const PRODUCT_CODES = ['all', ...Array.from(new Set(items.map(m => m.productCode)))]
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'masonry'>('grid')
  const [gridSize, setGridSize] = useState(6) // 2-6 columns
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [editing, setEditing] = useState<MediaItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // ── Mutations ───────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async ({ files, folder, overwritePath }: { files: FileList | File[], folder?: string, overwritePath?: string }) => {
      const formData = new FormData()
      Array.from(files).forEach(f => formData.append('images[]', f))
      if (folder) formData.append('folder', folder)
      if (overwritePath) formData.append('overwrite_path', overwritePath)
      
      return (await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })).data
    },
    onMutate: async ({ files, overwritePath }) => {
      await queryClient.cancelQueries({ queryKey: ['media'] })
      const previousMedia = queryClient.getQueryData(['media'])
      
      // If overwriting, we don't necessarily want to add a NEW item to the list optimistically
      // but rather update the existing one. For simplicity, we'll just show the pulse on the existing one if possible.
      // However, the current optimistic logic adds a new one. Let's stick to it for now but improve it.
      
      if (files instanceof FileList || Array.isArray(files)) {
        const optimisticItems = Array.from(files).map((f, i) => ({
          id: overwritePath ? `over-${overwritePath}` : `temp-${Date.now()}-${i}`,
          src: URL.createObjectURL(f),
          path: overwritePath || f.name,
          name: overwritePath ? overwritePath.split('/').pop() : f.name,
          product: 'Updating...',
          productCode: 'TEMP',
          size: `${Math.round(f.size/1024)}KB`,
          dimensions: 'Pending',
          format: f.type.split('/')[1],
          index: -1,
          isOptimistic: true
        }))

        if (overwritePath) {
           // Mark the existing item as optimistic
           queryClient.setQueryData(['media'], (old: any) => 
              old?.map((item: any) => item.path === overwritePath ? { ...item, isOptimistic: true } : item)
           )
        } else {
           queryClient.setQueryData(['media'], (old: any) => [...optimisticItems, ...(old || [])])
        }
      }
      return { previousMedia }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      clearSelected()
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#6366f1', '#a855f7', '#ec4899'] })
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['media'], context.previousMedia)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (paths: string[]) => {
      return (await api.delete('/media/delete', { data: { paths } })).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      clearSelected()
    }
  })

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadMutation.mutate({ files: e.target.files })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) uploadMutation.mutate({ files: e.dataTransfer.files })
  }

  const handleSaveEditedImage = async (blob: Blob, fileName: string) => {
    const file = new File([blob], fileName, { type: blob.type })
    // If the productCode is 'all' or empty, use 'products' as default folder
    const folder = editing?.productCode && editing.productCode !== 'all' ? editing.productCode.toLowerCase() : undefined
    const overwritePath = editing?.path // Preserve original link
    
    setEditing(null) // Instant close
    uploadMutation.mutate({ files: [file], folder, overwritePath }) // Background upload
  }

  const filtered = items.filter(m => {
    const matchSearch = m.name.includes(search) || m.product.toLowerCase().includes(search.toLowerCase()) || m.productCode.includes(search.toUpperCase())
    const matchProd = productFilter === 'all' || m.productCode === productFilter
    return matchSearch && matchProd
  })

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelected(prev => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
    } else {
      setLightbox(id)
    }
  }

  const copyPath = (src: string, id: string) => {
    navigator.clipboard.writeText(src)
    setCopied(id); setTimeout(() => setCopied(null), 2000)
  }

  const selectAll = () => setSelected(new Set(filtered.map(m => m.id)))
  const clearSelected = () => setSelected(new Set())

  const gridCols: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  }

  const stats = {
    total: items.length,
    products: new Set(items.map(m => m.productCode)).size,
    totalSize: items.reduce((a, m) => {
      const kb = parseFloat(m.size.replace('KB',''))
      return a + kb
    }, 0),
  }

  return (
    <DashboardLayout title={t('media_manager')}>
      <div className="page-container">
        <PageHeader
          title={t('media_manager')}
          subtitle={`${stats.total}${language === 'bn' ? 'টি' : ''} ${t('product_images')} · ${stats.products}${language === 'bn' ? 'টি' : ''} ${t('product')} · ~${(stats.totalSize/1024).toFixed(1)} MB`}
          actions={
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow">
              <Upload className="w-4 h-4" /> {t('upload_image')}
            </button>
          }
        />
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Images, label: t('total_images'), value: stats.total, cls: 'text-[hsl(var(--primary))]' },
            { icon: FolderOpen, label: t('product_folders'), value: stats.products, cls: 'text-purple-600 dark:text-purple-400' },
            { icon: HardDrive, label: t('total_size'), value: `~${(stats.totalSize/1024).toFixed(1)} MB`, cls: 'text-emerald-600 dark:text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.cls} flex-shrink-0`} />
              <div><p className={`text-xl font-bold ${s.cls}`}>{s.value}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p></div>
            </div>
          ))}
        </div>

        {/* Drop Zone */}
        <div 
          onDragOver={e => { e.preventDefault(); setDragOver(true) }} 
          onDragLeave={() => setDragOver(false)} 
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all relative overflow-hidden ${dragOver ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] scale-[1.01]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] hover:bg-[hsl(var(--muted)/0.3)]'}`}>
          {uploadMutation.isPending && (
            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 z-10 flex flex-col items-center justify-center animate-fade-in">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs font-bold text-primary">{t('uploading')}</p>
            </div>
          )}
          <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${dragOver ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`} />
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{t('drag_drop_hint')}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{t('max_size_hint')}</p>
        </div>

        {/* Toolbar */}
        <div className="glass-card p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))]">
              <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_media')}
                className="bg-transparent flex-1 outline-none text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]" />
              {search && <button onClick={() => setSearch('')} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"><X className="w-3.5 h-3.5" /></button>}
            </div>

            {/* Grid size slider */}
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input type="range" min={2} max={6} value={gridSize} onChange={e => setGridSize(+e.target.value)}
                className="w-24 accent-[hsl(var(--primary))] cursor-pointer" title={t('grid_size')} />
              <span className="text-xs text-[hsl(var(--muted-foreground))] w-4">{gridSize}</span>
            </div>

            <div className="flex gap-1.5">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode==='grid' ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}><Grid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode==='list' ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}><Rows3 className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('masonry')} className={`p-2 rounded-lg transition-colors ${viewMode==='masonry' ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}><LayoutGrid className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Product filter chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {PRODUCT_CODES.map(code => {
              const count = code === 'all' ? items.length : items.filter(m => m.productCode === code).length
              return (
                <button key={code} onClick={() => setProductFilter(code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${productFilter === code ? 'bg-[hsl(var(--primary))] text-white shadow-sm' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
                  {code === 'all' ? t('all') : code} <span className="opacity-60">({count})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selection bar */}
        {selected.size > 0 && (
          <div className="sticky top-0 z-[60] flex items-center justify-between px-5 py-3 rounded-xl bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.3)] backdrop-blur-md animate-in fade-in slide-in-from-top-2 shadow-sm mb-4">
            <span className="text-sm font-semibold text-[hsl(var(--primary))]">
              {selected.size}{language === 'bn' ? 'টি' : ''} {t('images_selected')}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={selectAll} 
                className="px-3 py-1.5 rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] text-xs font-medium hover:bg-[hsl(var(--primary)/0.25)] transition-colors"
              >
                {t('select_all')}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const paths = items.filter(m => selected.has(m.id)).map(m => m.path);
                  setConfirmDelete(paths);
                }}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {deleteMutation.isPending ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )} 
                <span>{t('delete')}</span>
              </button>
              <button 
                onClick={clearSelected} 
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══ MEDIA CONTENT ═══ */}
        {viewMode === 'list' ? (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                  <th className="px-4 py-3 w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={(e) => e.target.checked ? selectAll() : clearSelected()}
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Image</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Product / Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Details</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className={`border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors ${selected.has(item.id) ? 'bg-[hsl(var(--primary)/0.05)]' : ''}`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        checked={selected.has(item.id)}
                        onChange={() => {
                          setSelected(prev => {
                            const next = new Set(prev)
                            next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                            return next
                          })
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative w-10 h-12 rounded-lg overflow-hidden border border-[hsl(var(--border))] cursor-pointer" onClick={() => setLightbox(item.id)}>
                        <Image src={item.src} alt="" fill className="object-cover" sizes="40px" unoptimized />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-[hsl(var(--foreground))]">{item.productCode}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate max-w-[200px]">{item.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-[hsl(var(--foreground))]">{item.dimensions}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-mono">{item.format} · {item.size}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(item)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors" title="Edit ছবি">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => copyPath(item.src, item.id)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors">
                          {copied === item.id ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setConfirmDelete([item.path]);
                          }} 
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={viewMode === 'masonry' ? "columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3" : `grid gap-3 ${gridCols[gridSize] || gridCols[3]}`}>
            {filtered.map(item => {
              const isSelected = selected.has(item.id)
              const isCopied = copied === item.id
              return (
                <div key={item.id}
                  className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer mb-3 break-inside-avoid
                    ${isSelected ? 'border-[hsl(var(--primary))] shadow-glow' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.4)] hover:shadow-card-hover hover:-translate-y-0.5'}`}>

                  {/* Image */}
                  <div className="relative w-full" style={viewMode === 'masonry' ? { height: 'auto', minHeight: '150px' } : { aspectRatio: '4/5' }} onClick={e => toggleSelect(item.id, e)}>
                    <Image src={item.src} alt={item.name} 
                      width={400} height={500} unoptimized
                      sizes={`(max-width:640px) ${Math.floor(100/2)}vw, ${Math.floor(100/gridSize)}vw`}
                      className={`object-cover group-hover:scale-105 transition-transform duration-500 w-full h-auto ${(item as any).isOptimistic ? 'opacity-50 blur-sm grayscale animate-pulse' : ''}`} />

                    {(item as any).isOptimistic && (
                      <div className="absolute inset-0 flex items-center justify-center">
                         <span className="bg-primary/80 text-white text-[8px] font-black uppercase px-2 py-1 rounded shadow-lg animate-bounce">Uploading...</span>
                      </div>
                    )}

                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2 z-20" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-white/40 bg-black/20 text-primary focus:ring-primary cursor-pointer transition-all hover:scale-110"
                        checked={isSelected}
                        onChange={(e) => {
                          setSelected(prev => {
                            const next = new Set(prev)
                            next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                            return next
                          })
                        }}
                      />
                    </div>

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-[10px] text-white/80 truncate">{item.name}</p>
                          <div className="flex gap-1.5 ml-2">
                            <button onClick={e => { e.stopPropagation(); setEditing(item) }}
                            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 transition-colors" title="Edit ছবি">
                            <Edit3 className="w-3.5 h-3.5 text-white" />
                          </button>
                            <button onClick={e => { e.stopPropagation(); copyPath(item.src, item.id) }}
                              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 transition-colors" title="Path কপি">
                              {isCopied ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white" />}
                            </button>
                            <a href={item.src} download onClick={e => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 transition-colors" title="ডাউনলোড">
                               <Download className="w-3 h-3 text-white" />
                             </a>
                             <button onClick={e => { e.stopPropagation(); setConfirmDelete([item.path]) }}
                               className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 transition-colors" title="Delete">
                               <Trash2 className="w-3.5 h-3.5 text-white" />
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>

                  {/* Meta */}
                  <div className="px-3 py-2 bg-[hsl(var(--card))]">
                    <p className="font-mono text-[10px] font-bold text-[hsl(var(--primary))] truncate">{item.productCode}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{item.product}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-[hsl(var(--muted-foreground))]">WebP · {item.size}</span>
                      <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{item.dimensions}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Images className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
            <p className="text-[hsl(var(--muted-foreground))]">{t('no_orders_found')}</p>
          </div>
        )}

        <div className="text-center text-xs text-[hsl(var(--muted-foreground))] pb-2">
          {filtered.length}{language === 'bn' ? 'টি' : ''} {t('product_images')} · Ctrl+Click to select multiple · Click to view
        </div>
      </div>

      {lightbox && (
        <Lightbox
          items={filtered}
          startId={lightbox}
          onClose={() => setLightbox(null)}
          onDelete={(path) => {
            deleteMutation.mutate([path])
            setLightbox(null)
          }}
        />
      )}
      {editing && (
        <ImageEditor 
          item={editing}
          onClose={() => setEditing(null)}
          onSave={handleSaveEditedImage}
        />
      )}

      <ConfirmationModal 
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteMutation.mutate(confirmDelete)
            setConfirmDelete(null)
          }
        }}
        isLoading={deleteMutation.isPending}
        title={t('delete') || 'Delete Assets'}
        message={`Are you sure you want to delete ${confirmDelete?.length || 0} items? This action cannot be undone.`}
      />
    </DashboardLayout>
  )
}
