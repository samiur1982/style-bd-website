'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProductImage from '@/components/ui/ProductImage'
import {
  Star, StarOff, GripVertical, Search, X, CheckCircle,
  Sparkles, RefreshCcw, ArrowUpDown, Package
} from 'lucide-react'

type Product = {
  id: number
  name: string
  name_bn?: string
  code: string
  image: string
  price: number
  status: string
  publish_status: string
  is_new_arrival: boolean
  new_arrival_order: number
  category?: { name: string } | null
}

export default function NewArrivalsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)

  // Fetch ALL products
  const { data, isLoading } = useQuery({
    queryKey: ['all-products-for-new-arrivals'],
    queryFn: async () => {
      const res = await api.get('/products?per_page=200')
      return res.data.data as Product[]
    }
  })

  const allProducts: Product[] = data || []

  // Separate into selected new arrivals (ordered) and the rest
  const newArrivals = allProducts
    .filter(p => p.is_new_arrival)
    .sort((a, b) => a.new_arrival_order - b.new_arrival_order)

  const filteredOthers = allProducts
    .filter(p => !p.is_new_arrival && p.publish_status === 'active')
    .filter(p =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase())
    )

  // Toggle new arrival
  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.post(`/products/${id}/toggle-new-arrival`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-products-for-new-arrivals'] })
      toast.success('Updated!')
    },
    onError: () => toast.error('Failed to update')
  })

  // Reorder
  const reorderMutation = useMutation({
    mutationFn: (ids: number[]) => api.post('/products/reorder-new-arrivals', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-products-for-new-arrivals'] })
      toast.success('Order saved!')
    },
    onError: () => toast.error('Failed to save order')
  })

  // Drag-and-drop handlers
  const handleDragStart = (id: number) => setDraggedId(id)
  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault()
    setDragOverId(id)
  }
  const handleDrop = (targetId: number) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }
    const reordered = [...newArrivals]
    const fromIdx = reordered.findIndex(p => p.id === draggedId)
    const toIdx = reordered.findIndex(p => p.id === targetId)
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    setDraggedId(null)
    setDragOverId(null)
    reorderMutation.mutate(reordered.map(p => p.id))
  }
  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <DashboardLayout title="New Arrivals Manager">
      <div className="page-container space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              New Arrivals Manager
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose which products appear in the homepage "New Arrivals" section and drag to reorder them.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted border border-border rounded-xl px-4 py-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span><strong className="text-foreground">{newArrivals.length}</strong> products selected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: Selected New Arrivals (Drag to reorder) */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h2 className="font-bold text-foreground">
                  Selected New Arrivals
                </h2>
                <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                  {newArrivals.length} / 8
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowUpDown className="w-3 h-3" />
                Drag to reorder
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : newArrivals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <StarOff className="w-12 h-12 text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">No products selected yet.</p>
                <p className="text-muted-foreground text-xs mt-1">Add products from the right panel.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {newArrivals.map((p, idx) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => handleDragStart(p.id)}
                    onDragOver={e => handleDragOver(e, p.id)}
                    onDrop={() => handleDrop(p.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing select-none
                      ${draggedId === p.id ? 'opacity-40 scale-95' : ''}
                      ${dragOverId === p.id && draggedId !== p.id
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                        : 'border-border bg-card hover:bg-accent/50'
                      }`}
                  >
                    {/* Position badge */}
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white text-xs font-black flex-shrink-0">
                      {idx + 1}
                    </span>

                    {/* Grip */}
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                    {/* Image */}
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0">
                      <ProductImage src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.code}</p>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-bold text-primary flex-shrink-0">৳{Number(p.price).toLocaleString()}</span>

                    {/* Remove button */}
                    <button
                      onClick={() => toggleMutation.mutate(p.id)}
                      disabled={toggleMutation.isPending}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                      title="Remove from New Arrivals"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {reorderMutation.isPending && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <RefreshCcw className="w-3 h-3 animate-spin" />
                    Saving order...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: All Active Products (Add) */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              All Products
              <span className="text-xs bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full">
                {filteredOthers.length} available
              </span>
            </h2>

            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="bg-transparent flex-1 outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredOthers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm">No products found.</p>
                </div>
              ) : (
                filteredOthers.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors group"
                  >
                    {/* Image */}
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0">
                      <ProductImage src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {p.code} · {p.category?.name || '—'}
                      </p>
                    </div>

                    {/* Price */}
                    <span className="text-sm font-bold text-primary flex-shrink-0">৳{Number(p.price).toLocaleString()}</span>

                    {/* Add button */}
                    <button
                      onClick={() => toggleMutation.mutate(p.id)}
                      disabled={toggleMutation.isPending}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                      title="Add to New Arrivals"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">How it works</p>
            <p className="text-muted-foreground mt-0.5">
              Products you add here will appear in the <strong>"New Arrivals"</strong> section on the homepage in the exact order shown.
              If fewer than 8 products are selected, the system will auto-fill with the latest active products.
              The homepage shows <strong>up to 8 products</strong> in a 4-column grid.
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
