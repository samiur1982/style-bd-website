'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import ProductImage from '@/components/ui/ProductImage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X, Save, Package, Upload, AlertTriangle,
  Image as ImageIcon, Images, RotateCcw, Truck, ChevronDown, Sparkles, Layers
} from 'lucide-react'
import { useApp } from '@/lib/AppContext'
import { api } from '@/lib/api'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-border bg-muted/30 animate-pulse" style={{ minHeight: 120 }} />
  ),
})

export type Variant = { size: string; stock: number }
export type SkuVariant = { color: string | null; size: string | null; sku?: string; stock: number; price?: number | null }
export type Product = {
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
export type Category = { id: number; name: string; name_bn: string; slug: string; labelName?: string }

const SUBTYPES = ['Casual', 'Formal', 'Semi-Formal', 'Festive', 'Party', 'Office', 'Wedding', 'Ethnic']

export function emptyForm() {
  return {
    name: '', name_bn: '', code: '', sku: '', category_id: '', brand_id: '',
    price: '', regular_price: '', cost_price: '',
    delivery_inside: '60', delivery_outside: '120',
    stock: '', low_stock: '10',
    status: 'in_stock', publish_status: 'draft', subtype: 'Casual', fabric: 'Cotton', color: '',
    short_description: '', short_description_bn: '',
    description: '', description_bn: '',
    image: '', images_json: [] as string[],
    variants: [] as Variant[], tags: '',
    dynamic_attributes: [] as any[],
  }
}

export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type.includes('svg')) return resolve(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1080
        const scale = Math.min(MAX_WIDTH / img.width, 1)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const outputType = 'image/webp';
                           
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: outputType }))
          } else {
            resolve(file)
          }
        }, outputType, 0.85)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

function ColorSelect({ colors, value, onChange, labelCls, inputCls }: any) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const selected = colors.find((c: any) => c.name === value)

  return (
    <div className="relative">
      <label className={labelCls}>{t('color')}</label>
      <div
        onClick={() => setOpen(!open)}
        className={`${inputCls} flex items-center justify-between cursor-pointer`}
      >
        <div className="flex items-center gap-2">
          {selected ? (
            <>
              <div
                className="w-4 h-4 rounded-full border border-border/50 shadow-sm"
                style={{ background: selected.type === 'multi' ? `repeating-linear-gradient(45deg, ${selected.hex_code}, ${selected.hex_code} 4px, transparent 4px, transparent 8px)` : selected.hex_code }}
              />
              <span className="truncate">{selected.name} {selected.type === 'multi' && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">(Multi)</span>}</span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">{t('search')} {t('color')}</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 opacity-50" />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100">
            <div
              onClick={() => { onChange(''); setOpen(false) }}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors ${value === '' ? 'bg-primary/10 text-primary font-medium' : ''}`}
            >
              <span className="text-sm text-muted-foreground">{t('search')} {t('color')}</span>
            </div>
            {colors.map((c: any) => (
              <div
                key={c.id}
                onClick={() => { onChange(c.name); setOpen(false) }}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors ${value === c.name ? 'bg-primary/10 text-primary font-medium' : ''}`}
              >
                <div
                  className="w-4 h-4 rounded-full border border-border/50 shadow-sm shrink-0"
                  style={{ background: c.type === 'multi' ? `repeating-linear-gradient(45deg, ${c.hex_code}, ${c.hex_code} 4px, transparent 4px, transparent 8px)` : c.hex_code }}
                />
                <span className="text-sm truncate">{c.name} {c.type === 'multi' && <span className="text-[10px] text-muted-foreground ml-1 uppercase">(Multi)</span>}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function VariantMatrix({
  colors, sizes, variants, onChange
}: {
  colors: any[]; sizes: any[];
  variants: SkuVariant[];
  onChange: (variants: SkuVariant[]) => void
}) {
  const { t } = useApp()
  const [selColors, setSelColors] = useState<string[]>(() => {
    const cs = [...new Set(variants.map(v => v.color).filter(Boolean))] as string[]
    return cs
  })
  const [selSizes, setSelSizes] = useState<string[]>(() => {
    const ss = [...new Set(variants.map(v => v.size).filter(Boolean))] as string[]
    return ss
  })

  const rebuildMatrix = (cols: string[], rows: string[]) => {
    if (cols.length === 0 && rows.length === 0) {
      onChange([])
      return
    }
    if (cols.length === 0) {
      const newV = rows.map(size => {
        const existing = variants.find(v => v.size === size && !v.color)
        return { color: null, size, stock: existing?.stock ?? 0 }
      })
      onChange(newV)
      return
    }
    if (rows.length === 0) {
      const newV = cols.map(color => {
        const existing = variants.find(v => v.color === color && !v.size)
        return { color, size: null, stock: existing?.stock ?? 0 }
      })
      onChange(newV)
      return
    }
    const newV: SkuVariant[] = []
    for (const color of cols) {
      for (const size of rows) {
        const existing = variants.find(v => v.color === color && v.size === size)
        newV.push({ color, size, stock: existing?.stock ?? 0 })
      }
    }
    onChange(newV)
  }

  const toggleColor = (name: string) => {
    const next = selColors.includes(name) ? selColors.filter(c => c !== name) : [...selColors, name]
    setSelColors(next)
    rebuildMatrix(next, selSizes)
  }

  const toggleSize = (name: string) => {
    const next = selSizes.includes(name) ? selSizes.filter(s => s !== name) : [...selSizes, name]
    setSelSizes(next)
    rebuildMatrix(selColors, next)
  }

  const setStock = (color: string | null, size: string | null, stock: number) => {
    onChange(variants.map(v =>
      v.color === color && v.size === size ? { ...v, stock } : v
    ))
  }

  const getStock = (color: string | null, size: string | null) =>
    variants.find(v => v.color === color && v.size === size)?.stock ?? 0

  const getColorSwatch = (name: string) => {
    const c = colors.find((c: any) => c.name === name)
    if (!c) return '#ccc'
    return c.type === 'multi'
      ? `repeating-linear-gradient(45deg, ${c.hex_code}, ${c.hex_code} 3px, transparent 3px, transparent 7px)`
      : c.hex_code
  }

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0)

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Colors for this product</span>
          {selColors.length > 0 && (
            <button
              type="button"
              onClick={() => { setSelColors([]); rebuildMatrix([], selSizes); }}
              className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
            >
              <RotateCcw className="w-3 h-3" />
              {t('clear_all')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {colors.map((c: any) => {
            const active = selColors.includes(c.name)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleColor(c.name)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${active
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
              >
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: getColorSwatch(c.name) }} />
                {c.name}
                {active && <X className="w-3 h-3 ml-0.5" />}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sizes for this product</span>
          {selSizes.length > 0 && (
            <button
              type="button"
              onClick={() => { setSelSizes([]); rebuildMatrix(selColors, []); }}
              className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
            >
              <RotateCcw className="w-3 h-3" />
              {t('clear_all')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {sizes.map((s: any) => {
            const active = selSizes.includes(s.name)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSize(s.name)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold font-mono transition-all ${active
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
              >
                {s.name}
                {active && <span className="ml-1 text-[10px]">✕</span>}
              </button>
            )
          })}
        </div>
      </div>

      {variants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 text-muted-foreground font-semibold w-36">Color \ Size</th>
                {selSizes.length > 0
                  ? selSizes.map(s => (
                    <th key={s} className="p-2 text-center font-bold font-mono bg-muted/50 rounded-t-lg border border-border/50">{s}</th>
                  ))
                  : <th className="p-2 text-center font-bold bg-muted/50 border border-border/50">Stock</th>
                }
              </tr>
            </thead>
            <tbody>
              {selColors.length > 0
                ? selColors.map(color => (
                  <tr key={color}>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-border/50 shrink-0" style={{ background: getColorSwatch(color) }} />
                        <span className="font-semibold truncate max-w-[80px]" title={color}>{color}</span>
                      </div>
                    </td>
                    {selSizes.length > 0
                      ? selSizes.map(size => (
                        <td key={size} className="p-1">
                          <input
                            type="number"
                            min={0}
                            value={getStock(color, size) || ''}
                            onChange={e => setStock(color, size, Number(e.target.value))}
                            className="w-full text-center bg-card border border-border rounded-lg px-1 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            placeholder="0"
                          />
                        </td>
                      ))
                      : (
                        <td className="p-1">
                          <input
                            type="number"
                            min={0}
                            value={getStock(color, null) || ''}
                            onChange={e => setStock(color, null, Number(e.target.value))}
                            className="w-full text-center bg-card border border-border rounded-lg px-1 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            placeholder="0"
                          />
                        </td>
                      )
                    }
                  </tr>
                ))
                : selSizes.map(size => (
                  <tr key={size}>
                    <td className="p-2 font-bold font-mono">{size}</td>
                    <td className="p-1">
                      <input
                        type="number"
                        min={0}
                        value={getStock(null, size) || ''}
                        onChange={e => setStock(null, size, Number(e.target.value))}
                        className="w-full text-center bg-card border border-border rounded-lg px-1 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))
              }
              <tr className="border-t-2 border-primary/20">
                <td className="p-2 text-xs font-bold text-primary">{t('total')} {t('stock')}</td>
                <td colSpan={Math.max(selSizes.length, 1)} className="p-2 text-center text-sm font-bold text-primary">{totalStock}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {variants.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
          Select at least one color or size above to build the inventory matrix.
        </p>
      )}
    </div>
  )
}

function MediaPickerModal({ onClose, onSelect }: { onClose: () => void, onSelect: (paths: string[]) => void }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['media'],
    queryFn: async () => (await api.get('/media')).data
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (path: string) => {
    const next = new Set(selected)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    setSelected(next)
  }

  return (
    <div className="fixed inset-0 z-[100] flex bg-black/60 items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl bg-card rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Select Media</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {items.map((item: any) => {
                const isSel = selected.has(item.path)
                return (
                  <div key={item.id} onClick={() => toggle(item.path)}
                    className={`relative aspect-[4/5] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${isSel ? 'border-primary shadow-glow' : 'border-transparent hover:border-primary/50'}`}>
                    <ProductImage src={item.src} alt={item.name} fill className="object-cover" sizes="20vw" />
                    {isSel && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-white drop-shadow-md" /></div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border bg-card flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 font-semibold text-muted-foreground hover:bg-accent rounded-xl transition-colors">Cancel</button>
            <button onClick={() => { onSelect(Array.from(selected)); onClose() }} disabled={selected.size === 0}
              className="px-6 py-2 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductForm({
  initial, onClose, categories, isFullPage = false
}: {
  initial: Product | null; onClose: () => void; categories: Category[]; isFullPage?: boolean
}) {
  const { t } = useApp()
  const queryClient = useQueryClient()
  const isEdit = !!initial
  const [form, setForm] = useState(() => {
    if (!initial) return emptyForm();

    const imagesJson = Array.isArray(initial.images_json) ? initial.images_json : [];
    const variantsArr = Array.isArray(initial.variants) ? initial.variants : [];
    const dynAttrs = Array.isArray(initial.dynamic_attributes) ? initial.dynamic_attributes : [];

    let tagsStr = '';
    if (Array.isArray(initial.tags)) {
      tagsStr = initial.tags.join(', ');
    } else if (typeof initial.tags === 'string') {
      tagsStr = initial.tags;
    }

    return {
      name: initial.name || '',
      name_bn: initial.name_bn || '',
      code: initial.code || '',
      sku: initial.sku || '',
      category_id: String(initial.category_id || ''),
      brand_id: String(initial.brand_id || ''),
      price: String(initial.price || ''),
      regular_price: String(initial.regular_price || ''),
      cost_price: String(initial.cost_price || ''),
      delivery_inside: String(initial.delivery_inside || 60),
      delivery_outside: String(initial.delivery_outside || 120),
      stock: String(initial.stock || 0),
      low_stock: String(initial.low_stock || 10),
      status: initial.status || 'in_stock',
      publish_status: initial.publish_status || 'draft',
      subtype: initial.subtype || 'Casual',
      fabric: initial.fabric || 'Cotton',
      color: initial.color || '',
      short_description: initial.short_description || '',
      short_description_bn: initial.short_description_bn || '',
      description: initial.description || '',
      description_bn: initial.description_bn || '',
      image: initial.image || '',
      images_json: imagesJson,
      variants: variantsArr,
      tags: tagsStr,
      dynamic_attributes: dynAttrs,
    }
  })

  const [skuVariants, setSkuVariants] = useState<SkuVariant[]>(
    () => (initial?.product_variants || []).map(v => ({ ...v }))
  )

  const mainCategories = categories.filter(c => !c.parent_id)
  const [selectedMainCat, setSelectedMainCat] = useState(() => {
    if (!form.category_id) return '';
    const selected = categories.find(c => String(c.id) === String(form.category_id));
    if (selected && selected.parent_id) {
      // If it's a subcategory, find its parent (assuming 2 levels)
      return String(selected.parent_id);
    }
    return String(form.category_id);
  });
  const subCategories = categories.filter(c => String(c.parent_id) === String(selectedMainCat));

  const handleMainCatChange = (val: string) => {
    setSelectedMainCat(val);
    set('category_id', val);
    setForm(p => ({ ...p, dynamic_attributes: [] }));
  };

  const handleSubCatChange = (val: string) => {
    set('category_id', val ? val : selectedMainCat);
    setForm(p => ({ ...p, dynamic_attributes: [] }));
  };

  const matrixColors = [...new Set(skuVariants.map(v => v.color).filter(Boolean))] as string[]
  const matrixTotal = skuVariants.reduce((sum, v) => sum + v.stock, 0)
  const hasMatrix = skuVariants.length > 0
  const lowThreshold = Number(form.low_stock) || 10

  const computedStatus: 'in_stock' | 'low_stock' | 'out_of_stock' =
    matrixTotal === 0 ? 'out_of_stock' :
      matrixTotal <= lowThreshold ? 'low_stock' : 'in_stock'

  useEffect(() => {
    if (matrixColors.length === 0) return
    const colorValue = matrixColors.length > 1 ? 'Multi' : matrixColors[0]
    setForm(f => f.color === colorValue ? f : { ...f, color: colorValue })
  }, [skuVariants])

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const { data: sizes = [] } = useQuery({ queryKey: ['sizes'], queryFn: async () => (await api.get('/sizes')).data })
  const { data: colors = [] } = useQuery({ queryKey: ['colors'], queryFn: async () => (await api.get('/colors')).data })
  const { data: fabrics = [] } = useQuery({ queryKey: ['fabrics'], queryFn: async () => (await api.get('/fabrics')).data })
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: async () => (await api.get('/brands')).data })

  const { data: catAttributes = [] } = useQuery({
    queryKey: ['category-attributes', form.category_id],
    queryFn: async () => {
      if (!form.category_id) return []
      return (await api.get(`/attributes/category/${form.category_id}`)).data
    },
    enabled: !!form.category_id
  })

  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      const compressedFiles = await Promise.all(Array.from(files).map(f => compressImage(f)))
      compressedFiles.forEach(f => formData.append('images[]', f))
      formData.append('folder', form.code || 'general')
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const { files: uploaded, first_path } = res.data
      const paths = uploaded.map((f: any) => f.path)
      setForm(prev => ({
        ...prev,
        image: prev.image || first_path || paths[0] || prev.image,
        images_json: [...prev.images_json, ...paths],
        image_count: prev.images_json.length + paths.length,
      } as any))
    } catch (e: any) {
      setUploadError(e?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [form.code])

  const mutation = useMutation({
    mutationFn: async () => {
      const totalStock = hasMatrix ? matrixTotal : Number(form.stock)
      const finalStatus = hasMatrix ? computedStatus : form.status

      const payload = {
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
        price: Number(form.price),
        regular_price: form.regular_price ? Number(form.regular_price) : null,
        cost_price: Number(form.cost_price),
        delivery_inside: Number(form.delivery_inside),
        delivery_outside: Number(form.delivery_outside),
        stock: totalStock,
        low_stock: Number(form.low_stock),
        status: finalStatus,
        image: form.images_json[0] || form.image,
        image_count: form.images_json.length || 1,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        product_variants: skuVariants,
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        dynamic_attributes: form.dynamic_attributes
      }
      if (isEdit) {
        return api.put(`/products/${initial!.id}`, payload)
      } else {
        return api.post('/products', payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    }
  })

  const inputCls = "w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground"
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider"
  const STATUSES = [
    { value: 'in_stock', label: t('in_stock') },
    { value: 'low_stock', label: t('low_stock') },
    { value: 'out_of_stock', label: t('out_of_stock') },
  ]

  const FormContent = (
    <div className={`flex flex-col h-full ${isFullPage ? 'bg-background' : 'bg-card'}`}>
      {!isFullPage && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card sticky top-0 z-10">
          <h2 className="font-bold text-foreground text-lg">{isEdit ? t('edit_product') : t('new_product')}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-5 space-y-6 ${isFullPage ? 'max-w-4xl mx-auto w-full' : ''}`}>
        {/* Image Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelCls}>{t('product_images')}</label>
          </div>
          {form.images_json.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
              {form.images_json.map((url, i) => (
                <div key={i} className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${i === 0 ? 'border-primary ring-2 ring-primary/25' : 'border-border hover:border-primary/40'}`} style={{ aspectRatio: '3/4' }}>
                  <ProductImage src={url} alt={`Image ${i + 1}`} fill sizes="120px" className="object-cover w-full h-full" />
                  {i === 0 && <div className="absolute top-0 left-0 right-0 flex justify-center"><span className="bg-primary text-[#0B0E14] text-[9px] font-black px-2 py-0.5 rounded-b-lg shadow-sm tracking-wide">★ {t('main')}</span></div>}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                    {i !== 0 && <button type="button" onClick={e => { e.stopPropagation(); const newArr = [...form.images_json]; newArr.splice(i, 1); newArr.unshift(url); setForm(prev => ({ ...prev, images_json: newArr, image: newArr[0] })) }} className="bg-primary text-[#0B0E14] text-[10px] font-black px-2 py-1 rounded-lg shadow-lg hover:brightness-110 transition-all active:scale-95">{t('set_main')}</button>}
                    <button type="button" onClick={e => { e.stopPropagation(); const newArr = form.images_json.filter((_, idx) => idx !== i); setForm(prev => ({ ...prev, images_json: newArr, image: newArr[0] ?? '' })) }} className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg hover:bg-red-600 transition-all active:scale-95">Remove</button>
                  </div>
                </div>
              ))}
              <div onClick={() => fileRef.current?.click()} className="rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-muted-foreground hover:text-primary" style={{ aspectRatio: '3/4' }}>
                <ImageIcon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">Add More</span>
              </div>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors mb-3">
              <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">{t('upload_hint')}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setShowPicker(true)} type="button" className="px-3 py-2 text-xs font-semibold rounded-xl border border-primary/20 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5"><Images className="w-3.5 h-3.5" /> {t('browse_media')}</button>
            <button onClick={() => fileRef.current?.click()} type="button" className="px-3 py-2 text-xs font-semibold rounded-xl border border-border text-foreground hover:bg-accent transition-colors flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> {t('upload')}</button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('product_name')} *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Floral Kurti" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('product_name_bn')}</label>
            <input className={inputCls} value={form.name_bn} onChange={e => set('name_bn', e.target.value)} placeholder="যেমন: ফুলের কুর্তি" />
          </div>
          <div><label className={labelCls}>{t('product_code')}</label><input className={inputCls} value={form.code} onChange={e => set('code', e.target.value)} placeholder="TOPS-800" /></div>
          <div><label className={labelCls}>{t('sku')}</label><input className={inputCls} value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="KRT-800" /></div>
        </div>

        {/* Category & Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelCls}>Main {t('category')} *</label>
              <select className={inputCls} value={selectedMainCat} onChange={e => handleMainCatChange(e.target.value)}>
                <option value="">Select Main...</option>
                {mainCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {subCategories.length > 0 && (
              <div className="flex-1 animate-fade-in">
                <label className={labelCls}>Sub Category</label>
                <select className={inputCls} value={form.category_id === selectedMainCat ? '' : form.category_id} onChange={e => handleSubCatChange(e.target.value)}>
                  <option value="">Select Sub...</option>
                  {subCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>{t('brand')}</label>
            <select className={inputCls} value={form.brand_id} onChange={e => set('brand_id', e.target.value)}>
              <option value="">{t('search')} {t('brand')}</option>
              {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {/* Inventory Matrix */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 rounded bg-primary/20"><Package className="w-3.5 h-3.5 text-primary" /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{t('inventory_and_sku_matrix')}</span>
          </div>
          <VariantMatrix colors={colors} sizes={sizes} variants={skuVariants} onChange={setSkuVariants} />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-3 gap-4">
          <div><label className={labelCls}>{t('selling_price')} (৳) *</label><input type="number" className={inputCls} value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" /></div>
          <div><label className={labelCls}>{t('regular_price')} (৳)</label><input type="number" className={inputCls} value={form.regular_price} onChange={e => set('regular_price', e.target.value)} placeholder="MRP" /></div>
          <div><label className={labelCls}>{t('cost_price')} (৳)</label><input type="number" className={inputCls} value={form.cost_price} onChange={e => set('cost_price', e.target.value)} placeholder="0" /></div>
        </div>

        {/* Delivery */}
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 grid grid-cols-2 gap-4">
          <div className="col-span-2 flex items-center gap-2 mb-1">
            <Truck className="w-3.5 h-3.5 text-amber-500" /><span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{t('delivery_charge')} Profile</span>
          </div>
          <div><label className={labelCls}>{t('delivery_inside')} (৳)</label><input type="number" className={inputCls} value={form.delivery_inside} onChange={e => set('delivery_inside', e.target.value)} /></div>
          <div><label className={labelCls}>{t('delivery_outside')} (৳)</label><input type="number" className={inputCls} value={form.delivery_outside} onChange={e => set('delivery_outside', e.target.value)} /></div>
        </div>

        {/* Status */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
          <div className="flex gap-2">
            {[{ v: 'draft', l: 'Keep In Draft', i: '📝' }, { v: 'inactive', l: 'Not Published', i: '🔒' }, { v: 'active', l: 'Published', i: '🌍' }].map(s => (
              <button key={s.v} onClick={() => set('publish_status', s.v)} type="button" className={`flex-1 flex flex-col items-center py-3 rounded-xl border text-xs font-bold transition-all ${form.publish_status === s.v ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-card border-border text-muted-foreground hover:bg-accent/50'}`}>
                <span className="text-sm">{s.i}</span><span className="text-center">{s.l}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stock Threshold */}
        <div className="grid grid-cols-2 gap-4">
          {!hasMatrix && <div><label className={labelCls}>{t('total_stock')}</label><input type="number" className={inputCls} value={form.stock} onChange={e => set('stock', e.target.value)} /></div>}
          <div className={hasMatrix ? 'col-span-2' : ''}><label className={labelCls}>{t('low_stock_threshold')}</label><input type="number" className={inputCls} value={form.low_stock} onChange={e => set('low_stock', e.target.value)} /></div>
        </div>

        {/* Descriptions */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Short {t('description')} (EN)</label>
              <RichTextEditor
                value={form.short_description}
                onChange={v => set('short_description', v)}
                placeholder="Short product summary in English..."
                rows={4}
              />
            </div>
            <div>
              <label className={labelCls}>Short {t('description')} (BN)</label>
              <RichTextEditor
                value={form.short_description_bn}
                onChange={v => set('short_description_bn', v)}
                placeholder="পণ্যের সংক্ষিপ্ত বিবরণ বাংলায়..."
                rows={4}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('description')} (EN)</label>
              <RichTextEditor
                value={form.description}
                onChange={v => set('description', v)}
                placeholder="Full product description in English with HTML support..."
                rows={7}
              />
            </div>
            <div>
              <label className={labelCls}>{t('description')} (BN)</label>
              <RichTextEditor
                value={form.description_bn}
                onChange={v => set('description_bn', v)}
                placeholder="পণ্যের সম্পূর্ণ বিবরণ বাংলায়..."
                rows={7}
              />
            </div>
          </div>
        </div>

        {/* Save Button for Full Page */}
        {isFullPage && (
          <div className="pt-6 border-t border-border flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-border text-muted-foreground font-medium hover:bg-accent transition-colors">{t('cancel')}</button>
             <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.price} className="px-10 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg">
                {mutation.isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : (isEdit ? 'Save Changes' : 'Create Product')}
             </button>
          </div>
        )}
      </div>

      {!isFullPage && (
        <div className="px-5 py-4 border-t border-border bg-card flex gap-3 sticky bottom-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-accent transition-colors">{t('cancel')}</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.price} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">
            {mutation.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Create Product'}</>}
          </button>
        </div>
      )}

      {showPicker && <MediaPickerModal onClose={() => setShowPicker(false)} onSelect={(paths) => setForm(prev => ({ ...prev, image: prev.image || paths[0] || prev.image, images_json: [...prev.images_json, ...paths], image_count: prev.images_json.length + paths.length } as any))} />}
    </div>
  )

  if (isFullPage) return FormContent

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-xl mr-auto h-full flex flex-col border-r border-border shadow-2xl bg-card overflow-hidden" style={{ animation: 'slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        {FormContent}
      </div>
    </div>
  )
}
