'use client'

import { useState, useEffect } from 'react'
import { Modal, Input, PrimaryButton } from '@/components/ui/Components'
import { useApp } from '@/lib/AppContext'
import { Plus, Trash2, Search, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function OrderFormModal({ isOpen, onClose, initialData, onSubmit, isSubmitting }: any) {
  const { t } = useApp()
  const isEdit = !!initialData
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    address: '',
    district: 'Dhaka',
    payment_method: 'cod',
    order_notes: '',
    items: [] as { product_id: number, name: string, quantity: number, unit_price: number, discount: number }[]
  })

  const [productSearch, setProductSearch] = useState('')

  const { data: productsData, isLoading: searching } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: async () => {
      if (!productSearch || productSearch.length < 2) return []
      const res = await api.get(`/products?search=${productSearch}&per_page=5`)
      return res.data.data || []
    },
    enabled: productSearch.length >= 2
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        customer_name: initialData.customer?.name || '',
        customer_phone: initialData.customer?.phone || '',
        customer_email: initialData.customer?.email || '',
        address: initialData.address || '',
        district: initialData.district || 'Dhaka',
        payment_method: initialData.payment_method || 'cod',
        order_notes: initialData.order_notes || '',
        items: initialData.items?.map((i: any) => ({
          product_id: i.product?.id,
          name: i.product?.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount: i.discount || 0
        })) || []
      })
    } else {
      setFormData({
        customer_name: '', customer_phone: '', customer_email: '', address: '', district: 'Dhaka', payment_method: 'cod', order_notes: '', items: []
      })
    }
  }, [initialData, isOpen])

  const addProduct = (p: any) => {
    setFormData(prev => {
      const existing = prev.items.find(i => i.product_id === p.id)
      if (existing) {
        return { ...prev, items: prev.items.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i) }
      }
      return { ...prev, items: [...prev.items, { product_id: p.id, name: p.name, quantity: 1, unit_price: p.regular_price || p.price, discount: 0 }] }
    })
    setProductSearch('')
  }

  const updateQuantity = (id: number, qty: number) => {
    if (qty < 1) return
    setFormData(prev => ({ ...prev, items: prev.items.map(i => i.product_id === id ? { ...i, quantity: qty } : i) }))
  }

  const removeItem = (id: number) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.product_id !== id) }))
  }

  const updateDiscount = (id: number, discount: number) => {
    setFormData(prev => ({ ...prev, items: prev.items.map(i => i.product_id === id ? { ...i, discount: Math.max(0, discount) } : i) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.items.length === 0) {
      toast.error('Please add at least one product')
      return
    }
    onSubmit(formData)
  }

  const subtotal = formData.items.reduce((a, b) => a + (b.quantity * (b.unit_price - b.discount)), 0)
  const delivery = formData.district.toLowerCase() === 'dhaka' ? 60 : 120
  const total = subtotal + delivery

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? t('edit') + ' ' + t('order') : t('add_new') + ' ' + t('order')}
      footer={
        <>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">{t('cancel')}</button>
          <PrimaryButton onClick={() => { document.getElementById('order-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })) }} className="!px-6">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
          </PrimaryButton>
        </>
      }
    >
      <form id="order-form" onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Customer Info */}
        <div className="space-y-4">
          <h3 className="font-semibold border-b border-border pb-2 text-sm text-primary uppercase tracking-wider">{t('customer_info')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('name')} required value={formData.customer_name} onChange={(e: any) => setFormData({...formData, customer_name: e.target.value})} />
            <Input label="Phone" required value={formData.customer_phone} onChange={(e: any) => setFormData({...formData, customer_phone: e.target.value})} />
          </div>
          <Input label="Email (Optional)" type="email" value={formData.customer_email} onChange={(e: any) => setFormData({...formData, customer_email: e.target.value})} />
        </div>

        {/* Shipping Info */}
        <div className="space-y-4">
          <h3 className="font-semibold border-b border-border pb-2 text-sm text-primary uppercase tracking-wider">Shipping Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">District</label>
              <select className="input" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})}>
                <option value="Dhaka">Dhaka</option>
                <option value="Outside Dhaka">Outside Dhaka</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t('payment_method')}</label>
              <select className="input" value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})}>
                <option value="cod">Cash on Delivery (COD)</option>
                <option value="online">Online Payment</option>
              </select>
            </div>
          </div>
          <Input label="Full Address" required value={formData.address} onChange={(e: any) => setFormData({...formData, address: e.target.value})} />
          <Input label={t('order_notes')} value={formData.order_notes} onChange={(e: any) => setFormData({...formData, order_notes: e.target.value})} />
        </div>

        {/* Products */}
        <div className="space-y-4">
          <h3 className="font-semibold border-b border-border pb-2 text-sm text-primary uppercase tracking-wider">{t('products')}</h3>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input 
              type="text" 
              className="input pl-10" 
              placeholder="Search products to add..." 
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
            />
            {productSearch.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {searching ? <div className="p-3 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div> : 
                 productsData?.length === 0 ? <div className="p-3 text-center text-sm text-muted-foreground">No products found</div> :
                 productsData?.map((p: any) => (
                  <div key={p.id} className="p-2.5 hover:bg-muted cursor-pointer flex justify-between items-center" onClick={() => addProduct(p)}>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">৳{p.regular_price || p.price}</p>
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                 ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {formData.items.map(item => (
              <div key={item.product_id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">৳{item.unit_price} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Discount</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">৳</span>
                      <input 
                        type="number" 
                        className="w-20 h-8 pl-5 pr-2 rounded-md bg-background border border-border text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
                        value={item.discount}
                        onChange={(e) => updateDiscount(item.product_id, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Qty</label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-6 h-6 rounded-md bg-background border border-border flex items-center justify-center hover:bg-muted">-</button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-6 h-6 rounded-md bg-background border border-border flex items-center justify-center hover:bg-muted">+</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 w-20">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Total</label>
                    <p className="text-sm font-bold">৳{(item.quantity * (item.unit_price - item.discount)).toLocaleString()}</p>
                  </div>
                  <button type="button" onClick={() => removeItem(item.product_id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors mt-4"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {formData.items.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">No products added yet</div>}
          </div>

          {/* Summary */}
          {formData.items.length > 0 && (
            <div className="p-4 rounded-xl bg-muted/50 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>{t('subtotal')}</span><span>৳{subtotal}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>{t('delivery')}</span><span>৳{delivery}</span></div>
              <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border"><span>{t('total')}</span><span className="text-primary text-base">৳{total}</span></div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
