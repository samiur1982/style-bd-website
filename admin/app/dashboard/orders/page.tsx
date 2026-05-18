'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Download, Plus, Eye, Printer, RotateCcw, X,
  ChevronRight, Package, Truck, CheckCircle, XCircle,
  Clock, Phone, MapPin, Pencil, ShieldAlert, AlertTriangle,
  PauseCircle, Navigation, Archive, Building2, Mail, ExternalLink, Globe, Trash2
} from 'lucide-react'

import { useApp } from '@/lib/AppContext'
import { api } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, PrimaryButton, StatusBadge, Modal, DashboardModal, CopyableText, ConfirmationModal } from '@/components/ui/Components'
import { APP_URL } from '@/lib/api'
import { OrderFormModal } from '@/components/orders/OrderFormModal'
import { toast } from 'sonner'

type OrderStatus = 'pending' | 'processing' | 'in_courier' | 'on_the_way' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'on_hold' | 'export'
type Order = {
  id: number;
  customer: {
    id: number;
    name: string;
    phone: string;
    email: string;
    is_fake: boolean;
    fake_reason: string | null;
  };
  items: {
    id: number;
    product: {
      id: number;
      name: string;
      resolved_image?: string;
    };
    quantity: number;
    unit_price: number;
    discount: number;
  }[];
  total_amount: number;
  status: OrderStatus;
  address: string;
  district: string;
  phone_secondary: string | null;
  payment_method: string;
  order_notes: string | null;
  is_high_risk: boolean;
  risk_reasons: string[];
  detection_status?: string;
  potential_duplicates?: any[];
  fb_fbp: string | null;
  fb_fbc: string | null;
  fb_pixel_status: 'hold' | 'sent' | 'blocked';
  created_at: string;
  ip_address: string | null;
}

// Logical fulfillment cycle:
// pending → processing → in_courier → on_the_way → shipped → delivered
// Side exits: on_hold (paused, can resume), cancelled, returned, export (terminal)
const STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'in_courier',
  'on_the_way',
  'shipped',
  'delivered',
  'on_hold',
  'cancelled',
  'returned',
  'export',
]

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  pending: 'processing',
  processing: 'in_courier',
  in_courier: 'on_the_way',
  on_the_way: 'shipped',
  shipped: 'delivered',
  delivered: null,
  on_hold: null,   // must be manually moved
  cancelled: null,
  returned: null,
  export: null,
}

const STATUS_ICONS: Record<OrderStatus, any> = {
  pending: Clock,
  processing: Package,
  in_courier: Building2,
  on_the_way: Navigation,
  shipped: Truck,
  delivered: CheckCircle,
  on_hold: PauseCircle,
  cancelled: XCircle,
  returned: RotateCcw,
  export: Archive,
}

function OrderDrawer({ order, onClose, onStatusChange, onEdit, onCustomerFlag, onPreviewInvoice }: {
  order: Order; onClose: () => void; onStatusChange: (id: number, s: OrderStatus) => void; onEdit: () => void; onCustomerFlag: (id: number, isFake: boolean, reason?: string) => void;
  onPreviewInvoice: (id: number) => void;
}) {
  const { t, language } = useApp()
  const nextStatus = STATUS_FLOW[order.status]

  const nextLabels: Record<string, string> = {
    processing: `✅ ${t('confirm_order')}`,
    in_courier: `🏢 ${t('in_courier')}`,
    on_the_way: `🛵 ${t('on_the_way')}`,
    shipped: `🚚 ${t('send_order')}`,
    delivered: `📦 ${t('delivered_order')}`
  }

  const subtotal = order.items.reduce((a, i) => a + i.quantity * (Number(i.unit_price) - Number(i.discount || 0)), 0)
  const delivery = order.district === 'Dhaka' ? 60 : 120
  // total_amount currently includes shipping in our backend logic
  const total = Number(order.total_amount)

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 print:bg-white print:relative print:inset-auto" onClick={onClose}>
      <style media="print">{`
        body * { visibility: hidden; }
        .invoice-print-area, .invoice-print-area * { visibility: visible; }
        .invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; }
        .no-print { display: none !important; }
      `}</style>
      <div onClick={e => e.stopPropagation()}
        className="invoice-print-area w-full max-w-md ml-auto h-full flex flex-col overflow-y-auto border-l border-border shadow-2xl bg-card print:max-w-full print:w-full print:border-none print:shadow-none"
        style={{ animation: 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))] sticky top-0 bg-[hsl(var(--card))] z-10 print:static print:border-none">
          <div>
            <h3 className="font-bold text-[hsl(var(--foreground))] font-mono">#ORD-{order.id}</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {new Date(order.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <StatusBadge status={order.status} />
            <button onClick={onEdit} className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:opacity-90 hover:scale-105 transition-all">
              <Pencil className="w-3.5 h-3.5" /> {t('edit')}
            </button>
            <button onClick={onClose} className="cursor-pointer p-2 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors"><X className="w-4 h-4 text-[hsl(var(--muted-foreground))]" /></button>
          </div>
        </div>

        {/* Status Timeline — main fulfillment track only */}
        <div className="p-5 border-b border-[hsl(var(--border))] no-print">
          <div className="flex items-center justify-between overflow-x-auto gap-1">
            {(['pending', 'processing', 'in_courier', 'on_the_way', 'shipped', 'delivered'] as OrderStatus[]).map((s, i, arr) => {
              const Icon = STATUS_ICONS[s]
              // A step is "completed" if it's at or before the current main-track status
              const mainTrack: OrderStatus[] = ['pending', 'processing', 'in_courier', 'on_the_way', 'shipped', 'delivered']
              const currentIdx = mainTrack.indexOf(order.status)
              const stepIdx = mainTrack.indexOf(s)
              const completed = currentIdx >= stepIdx
              return (
                <div key={s} className="flex items-center shrink-0">
                  <div className={`flex flex-col items-center gap-1 ${completed ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${completed ? 'bg-[hsl(var(--primary))] text-white' : 'bg-[hsl(var(--muted))] border border-[hsl(var(--border))]'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[8px] font-medium text-center leading-tight">{t(s)}</span>
                  </div>
                  {i < arr.length - 1 && <div className={`w-6 h-0.5 mb-4 mx-0.5 shrink-0 ${completed && currentIdx > stepIdx ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--border))]'}`} />}
                </div>
              )
            })}
          </div>
          {/* Side-state badge for off-track statuses */}
          {(['on_hold', 'cancelled', 'returned', 'export'] as OrderStatus[]).includes(order.status) && (
            <div className="mt-3 flex items-center gap-2">
              {(() => {
                const Icon = STATUS_ICONS[order.status]
                const colors: Record<string, string> = {
                  on_hold: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
                  cancelled: 'bg-red-500/10 text-red-600 border-red-500/30',
                  returned: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
                  export: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
                }
                return (
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${colors[order.status]}`}>
                    <Icon className="w-3.5 h-3.5" /> {t(order.status)}
                  </span>
                )
              })()}
            </div>
          )}
        </div>

        {/* Security Alerts */}
        {order.is_high_risk && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-red-600/10 border border-red-600/30 animate-pulse">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-5 h-5" />
              <div>
                <p className="text-sm font-black uppercase tracking-widest">High Risk Security Alert</p>
                <div className="mt-1 space-y-0.5">
                  {order.risk_reasons && order.risk_reasons.length > 0 ? (
                    order.risk_reasons.map((reason, idx) => (
                      <p key={idx} className="text-[10px] font-bold opacity-90 flex items-center gap-1">
                        • {reason}
                      </p>
                    ))
                  ) : (
                    <p className="text-[10px] font-bold opacity-80">This order matches suspicious patterns.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-5 space-y-5">
          {/* Customer */}
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">{t('customer_info')}</p>
            <div className={`p-3 rounded-xl border space-y-2 ${order.customer.is_fake ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' : 'bg-[hsl(var(--muted))] border border-[hsl(var(--border))]'}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[hsl(var(--foreground))]">{order.customer.name}</p>
                {order.customer.is_fake ? (
                  <button
                    onClick={() => onCustomerFlag(order.customer.id, false)}
                    className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg"
                  >
                    Unflag
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const reason = window.prompt('Reason for flagging this customer?')
                      if (reason !== null) onCustomerFlag(order.customer.id, true, reason)
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-100 px-2 py-1 rounded-lg"
                  >
                    Flag Fake
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 mt-1">
                <CopyableText text={order.customer.phone} className="text-sm text-[hsl(var(--muted-foreground))]">
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{order.customer.phone}</div>
                </CopyableText>

                {order.customer.email && (
                  <CopyableText text={order.customer.email} className="text-sm text-[hsl(var(--muted-foreground))]">
                    <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{order.customer.email}</div>
                  </CopyableText>
                )}

                {order.phone_secondary && (
                  <CopyableText text={order.phone_secondary} className="text-sm text-[hsl(var(--muted-foreground))]">
                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{order.phone_secondary} ({t('support')})</div>
                  </CopyableText>
                )}

                <CopyableText text={`${order.address}, ${order.district}`} className="text-sm text-[hsl(var(--muted-foreground))]">
                  <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 mt-0.5" />{order.address}, {order.district}</div>
                </CopyableText>
              </div>

              {order.customer.is_fake && (
                <div className="mt-2 p-2 rounded-lg bg-red-600 text-white text-[10px] font-bold">
                  ⚠️ {order.customer.fake_reason || 'This customer is flagged as fake.'}
                </div>
              )}
            </div>
          </div>

          {order.order_notes && (
            <div>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">{t('order_notes')}</p>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
                {order.order_notes}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">{t('order_items')}</p>
            <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] last:border-0 bg-[hsl(var(--card))]">
                  <div className="flex items-center gap-3">
                    {item.product?.resolved_image ? (
                      <img src={item.product.resolved_image} alt={item.product?.name || ''} className="w-10 h-12 object-cover rounded-md border border-[hsl(var(--border))]" />
                    ) : (
                      <div className="w-10 h-12 rounded-md bg-[hsl(var(--muted))] border border-[hsl(var(--border))] flex items-center justify-center text-xl">👗</div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">{item.product?.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        ৳{Number(item.unit_price).toLocaleString()}
                        {Number(item.discount) > 0 && <span className="text-red-500 ml-1">- ৳{Number(item.discount).toLocaleString()} discount</span>}
                        <span className="ml-1">× {item.quantity}</span>
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm text-[hsl(var(--foreground))]">৳{(item.quantity * (Number(item.unit_price) - Number(item.discount || 0))).toLocaleString()}</span>
                </div>
              ))}
              <div className="px-4 py-2 bg-[hsl(var(--muted)/0.5)] space-y-1.5 text-sm">
                <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>{t('subtotal')}</span><span>৳{subtotal.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</span></div>
                <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>{t('delivery')}</span><span>৳{delivery.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</span></div>
                <div className="flex justify-between font-bold text-[hsl(var(--foreground))] pt-1 border-t border-[hsl(var(--border))]"><span>{t('total')}</span><span className="text-[hsl(var(--primary))]">৳{total.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</span></div>
                <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))]"><span>{t('payment_method')}: {order.payment_method?.toUpperCase()}</span></div>
              </div>
            </div>
          </div>

          {/* Potential Duplicates */}
          {order.potential_duplicates && order.potential_duplicates.length > 0 && (
            <div>
              <p className="text-sm font-black text-red-600 dark:text-red-400 mb-2 flex items-center gap-2 uppercase tracking-widest">
                <AlertTriangle className="w-4 h-4" /> Potential Duplicates
              </p>
              <div className="space-y-2">
                {order.potential_duplicates.map((dup: any) => (
                  <div key={dup.id} className="p-3 rounded-xl bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900 border-l-4 border-l-red-600">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-primary">#ORD-{dup.id}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(dup.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">৳{Number(dup.total_amount).toLocaleString()}</span>
                      <div className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        {dup.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[hsl(var(--border))] space-y-3 no-print">
          {nextStatus && (
            <button onClick={() => { onStatusChange(order.id, nextStatus) }}
              className="cursor-pointer w-full py-3 rounded-xl bg-[hsl(var(--primary))] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
              {nextLabels[nextStatus]}
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onPreviewInvoice(order.id)}
              className="cursor-pointer flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View
            </button>
            <a
              href={`${APP_URL}/order/invoice/${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>

          <button
            disabled={!order.customer.email}
            onClick={async () => {
              const res = await api.post(`/order/invoice/${order.id}/resend`)
              if (res.data.success) {
                toast.success(res.data.message)
              } else {
                toast.error(res.data.message || 'Failed to send email')
              }
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${order.customer.email
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              }`}
          >
            <Mail className="w-3.5 h-3.5" />
            {order.customer.email ? 'Send Invoice to Email' : 'No Email Provided'}
          </button>

          {['pending', 'processing'].includes(order.status) && (
            <button onClick={() => { onStatusChange(order.id, 'cancelled') }}
              className="cursor-pointer w-full py-2.5 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors">
              ❌ {t('cancel_order')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const { t, language } = useApp()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [previewInvoiceId, setPreviewInvoiceId] = useState<number | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [invoicePopup, setInvoicePopup] = useState<{ isOpen: boolean, url: string } | null>(null)
  
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/orders/${id}`)
    },
    onSuccess: (res, id) => {
      toast.success(res.data?.message || 'Order deleted successfully', { id: `delete-${id}` })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setSelectedOrder(null)
      setOrderToDelete(null)
    },
    onError: (err: any, id) => {
      toast.error(err.response?.data?.message || 'Failed to delete order', { id: `delete-${id}` })
      setOrderToDelete(null)
    }
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return api.post('/orders/bulk-delete', { ids })
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Orders deleted successfully', { id: 'bulk-delete' })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setSelectedOrders([])
      setShowBulkDeleteConfirm(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete orders', { id: 'bulk-delete' })
      setShowBulkDeleteConfirm(false)
    }
  })

  const { data, isLoading } = useQuery({
    queryKey: ['orders', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await api.get(`/orders?${params.toString()}`)
      return res.data
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: OrderStatus }) => {
      return api.put(`/orders/${id}`, { status })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (selectedOrder && selectedOrder.id === variables.id) {
        setSelectedOrder(prev => prev ? { ...prev, status: variables.status } : null)
      }
    }
  })

  const updatePixelStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'hold' | 'sent' | 'blocked' }) => {
      return api.put(`/orders/${id}`, { fb_pixel_status: status })
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (variables.status === 'sent') {
        toast.success('Facebook Purchase event sent successfully!')
      } else {
        toast.success(`Pixel status updated to ${variables.status}`)
      }
      if (selectedOrder && selectedOrder.id === variables.id) {
        setSelectedOrder(res.data)
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update pixel status')
    }
  })

  const saveOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingOrder) return api.put(`/orders/${editingOrder.id}`, data)
      return api.post('/orders', data)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setFormModalOpen(false)
      toast.success(editingOrder ? 'Order updated successfully' : 'Order created successfully')

      if (!editingOrder) {
        const orderData = res.data;
        if (!orderData.customer?.email) {
          setInvoicePopup({ isOpen: true, url: orderData.invoice_url });
        }
      }

      if (selectedOrder && editingOrder && selectedOrder.id === editingOrder.id) {
        setSelectedOrder(res.data)
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error saving order')
    }
  })

  const openNewOrder = () => {
    setEditingOrder(null)
    setFormModalOpen(true)
  }

  const openEditOrder = (order: Order) => {
    setEditingOrder(order)
    setFormModalOpen(true)
  }

  const orders: Order[] = data?.data || []

  const handleStatusChange = (id: number, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus })
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivering: orders.filter(o => o.status === 'shipped').length,
    revenue: orders.filter(o => o.status === 'delivered').reduce((a, o) => a + Number(o.total_amount), 0),
  }

  const handleExport = () => {
    if (!orders.length) {
      toast.error(t('no_orders_found'))
      return
    }
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Items', 'Total', 'Status', 'Date']
    const csv = [
      headers.join(','),
      ...orders.map(o => [
        `#ORD-${o.id}`,
        `"${o.customer.name}"`,
        o.customer.phone,
        `"${o.items.map(i => `${i.product?.name} (x${i.quantity})`).join(' | ')}"`,
        o.total_amount,
        o.status,
        new Date(o.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <DashboardLayout title={t('orders')}>
      <div className="page-container">
        <PageHeader title={t('orders')} subtitle={`${orders.length.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}${language === 'bn' ? 'টি' : ''} ${t('orders')} · ${t('delivered_order')} ৳${stats.revenue.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}`}
          actions={
            <>
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"><Download className="w-4 h-4" /> {t('export')}</button>
              <PrimaryButton onClick={openNewOrder}><Plus className="w-4 h-4" /> {t('new_order')}</PrimaryButton>
            </>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: t('total_orders'), v: stats.total, cls: 'text-[hsl(var(--primary))]' },
            { l: t('pending'), v: stats.pending, cls: 'text-amber-600 dark:text-amber-400' },
            { l: t('shipped'), v: stats.delivering, cls: 'text-blue-600 dark:text-blue-400' },
            { l: t('revenue'), v: `৳${(stats.revenue / 1000).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { maximumFractionDigits: 1 })}k`, cls: 'text-emerald-600 dark:text-emerald-400' },
          ].map(s => (<div key={s.l} className="glass-card p-4"><p className={`text-2xl font-bold ${s.cls}`}>{s.v}</p><p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.l}</p></div>))}
        </div>

        <div className="glass-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-muted border border-border">
              <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_orders')}
                className="bg-transparent flex-1 outline-none text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]" />
            </div>
            <div className="flex flex-wrap gap-1 overflow-x-auto pb-2 sm:pb-0">
              {(['all', ...STATUSES] as const).map(s => {
                const count = data?.status_counts?.[s] || 0
                const active = statusFilter === s
                return (
                  <button key={s} onClick={() => setStatusFilter(s as typeof statusFilter)}
                    className={`group flex items-center gap-1 px-1.5 py-0 h-6 rounded-lg text-[10px] font-black uppercase tracking-tighter whitespace-nowrap transition-all cursor-pointer border ${active ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted/30 border-border/20 text-muted-foreground hover:text-foreground hover:border-border/50 hover:bg-muted/50'}`}>
                    {t(s)}
                    <span className={`inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-md text-[9px] font-black tracking-tighter transition-all ${active
                        ? 'bg-white text-primary'
                        : count > 0
                          ? 'bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                          : 'bg-muted-foreground/5 text-muted-foreground/30 group-hover:bg-muted-foreground/10'
                      }`}>
                      {count.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {selectedOrders.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl">
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {selectedOrders.length} cancelled order{selectedOrders.length > 1 ? 's' : ''} selected
                  </span>
                  <button 
                    type="button"
                    disabled={bulkDeleteMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBulkDeleteConfirm(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-widest bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 
                    {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
                  </button>
                  <button type="button" onClick={() => setSelectedOrders([])} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                </div>
              )}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 w-10">
                        <input 
                          type="checkbox" 
                          disabled={orders.filter((o: any) => o.status === 'cancelled').length === 0}
                          checked={orders.filter((o: any) => o.status === 'cancelled').length > 0 && selectedOrders.length === orders.filter((o: any) => o.status === 'cancelled').length}
                          onChange={(e) => {
                            if(e.target.checked) setSelectedOrders(orders.filter((o: any) => o.status === 'cancelled').map((o: any) => o.id))
                            else setSelectedOrders([])
                          }}
                          className="rounded border-border w-4 h-4 accent-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </th>
                      {[t('order'), t('customer'), t('product'), t('price'), t('date'), t('detection'), 'FB Pixel', t('status'), ''].map((h, idx) => (
                        <th key={idx} className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                <tbody>
                  {orders.length === 0
                    ? <tr><td colSpan={10} className="py-12 text-center text-[hsl(var(--muted-foreground))]">{t('no_orders_found')}</td></tr>
                    : orders.map(o => (
                      <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedOrder(o)}>
                        <td className="px-4 py-3 align-top" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            disabled={o.status !== 'cancelled'}
                            checked={selectedOrders.includes(o.id)}
                            onChange={(e) => {
                              if(e.target.checked) setSelectedOrders(prev => [...prev, o.id])
                              else setSelectedOrders(prev => prev.filter(id => id !== o.id))
                            }}
                            className={`rounded border-border w-4 h-4 accent-primary ${o.status !== 'cancelled' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                          />
                        </td>
                        <td className="px-4 py-3 align-top font-mono text-xs font-bold text-[hsl(var(--primary))] flex items-center gap-2">
                          {o.is_high_risk && (
                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" title="High Risk / Duplicate" />
                          )}
                          #ORD-{o.id}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <CopyableText text={o.customer.name} className="font-medium text-sm text-[hsl(var(--foreground))]">
                            {o.customer.name}
                          </CopyableText>
                          <CopyableText text={o.customer.phone} className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                            {o.customer.phone}
                          </CopyableText>
                          <CopyableText text={`${o.district} | ${o.address}`} className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-relaxed">
                            <div className="line-clamp-2 max-w-[200px]" title={`${o.district} | ${o.address}`}>
                              <strong className="text-[hsl(var(--foreground))] font-bold uppercase tracking-tight">{o.district}</strong> | {o.address}
                            </div>
                          </CopyableText>
                          {o.ip_address && (
                            <p className="text-[9px] text-primary/60 font-mono mt-0.5 flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5" /> {o.ip_address}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-2">
                            {o.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                {item.product?.resolved_image ? (
                                  <img src={item.product.resolved_image} alt="" className="w-10 h-10 rounded-[10px] border border-border object-cover flex-shrink-0 shadow-sm" />
                                ) : (
                                  <div className="w-10 h-10 rounded-[10px] bg-muted border border-border flex items-center justify-center text-xs flex-shrink-0">👗</div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-xs text-[hsl(var(--foreground))] line-clamp-1">{item.product?.name}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    ৳{Number(item.unit_price).toLocaleString()}
                                    {Number(item.discount) > 0 && <span className="text-red-500"> - ৳{Number(item.discount).toLocaleString()}</span>}
                                    <span className="ml-1 font-bold">× {item.quantity}</span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-2">
                            {o.items.map((item, idx) => (
                              <div key={idx} className="flex flex-col">
                                <p className="font-semibold text-xs text-[hsl(var(--foreground))] h-10 flex items-center">
                                  ৳{(item.quantity * (Number(item.unit_price) - Number(item.discount))).toLocaleString()}
                                </p>
                              </div>
                            ))}
                            <div className="pt-1 mt-1 border-t border-border/50">
                              <p className="text-[10px] text-muted-foreground">{t('delivery')}: ৳{(o.district?.toLowerCase() === 'dhaka') ? 60 : 120}</p>
                              <p className="font-black text-sm text-[hsl(var(--primary))] mt-0.5">
                                ৳{Number(o.total_amount).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[hsl(var(--foreground))]">
                              {new Date(o.created_at).toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                              {new Date(o.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {o.is_high_risk ? (
                              <div className="flex flex-wrap gap-1 max-w-[100px]">
                                {o.risk_reasons.map((r, i) => {
                                  let label = 'Pattern'
                                  if (r.toLowerCase().includes('ip')) label = 'IP'
                                  if (r.toLowerCase().includes('phone')) label = 'Phone'
                                  if (r.toLowerCase().includes('history')) label = 'History'
                                  if (r.toLowerCase().includes('manually')) label = 'Admin'
                                  return (
                                    <span key={i} className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-tighter border border-red-500/20">
                                      {label}
                                    </span>
                                  )
                                })}
                              </div>
                            ) : (
                              <div />
                            )}

                            {o.detection_status && (
                              <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap
                                ${o.detection_status === 'Safe' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' :
                                  o.detection_status === 'Old & Safe' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                    o.detection_status === 'New' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                                      o.detection_status === 'Possibly Duplicate' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                        o.detection_status === 'Possible Fake' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' :
                                          'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                }`}
                              >
                                {o.detection_status}
                              </span>
                            )}

                            <button
                              onClick={async () => {
                                const reason = o.customer.is_fake ? '' : (window.prompt('Reason for flagging?') || 'Manual flag from orders list')
                                try {
                                  await api.post(`/customers/${o.customer.id}/toggle-fake`, {
                                    is_fake: !o.customer.is_fake,
                                    fake_reason: reason
                                  })
                                  toast.success(o.customer.is_fake ? 'Customer unflagged' : 'Customer flagged as fake')
                                  queryClient.invalidateQueries({ queryKey: ['orders'] })
                                } catch (e) {
                                  toast.error('Failed to update status')
                                }
                              }}
                              className={`p-1.5 rounded-lg border transition-all ${o.customer.is_fake ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-muted/50 text-muted-foreground border-border hover:bg-red-500 hover:text-white hover:border-red-600'}`}
                              title={o.customer.is_fake ? "Unflag Customer" : "Flag as Fake"}
                            >
                              {o.customer.is_fake ? <CheckCircle className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top" onClick={e => e.stopPropagation()}>
                          <div className="flex flex-col gap-1.5">
                            <select
                              value={o.fb_pixel_status}
                              onChange={(e) => updatePixelStatusMutation.mutate({ id: o.id, status: e.target.value as any })}
                              disabled={o.fb_pixel_status === 'sent'}
                              className={`text-[9px] uppercase font-black tracking-tighter px-2 py-1 rounded-lg border outline-none cursor-pointer appearance-none text-center transition-all
                                ${o.fb_pixel_status === 'hold' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' :
                                  o.fb_pixel_status === 'sent' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                    'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                } ${o.fb_pixel_status === 'sent' ? 'opacity-100' : 'hover:scale-105 active:scale-95'}`}
                            >
                              <option value="hold" className="bg-white text-slate-700">⏸️ Hold</option>
                              <option value="sent" className="bg-white text-emerald-700">🚀 Send</option>
                              <option value="blocked" className="bg-white text-red-700">🚫 Block</option>
                            </select>
                            {o.fb_pixel_status === 'sent' && (
                              <span className="text-[8px] text-emerald-600 font-bold text-center animate-pulse">Event Sent ✓</span>
                            )}
                            {o.fb_pixel_status === 'hold' && !o.fb_fbp && (
                              <span className="text-[7px] text-muted-foreground text-center italic">Direct/Organic</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top" onClick={e => e.stopPropagation()}>
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                            className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border outline-none cursor-pointer appearance-none text-center
                              ${o.status === 'pending' ? 'bg-amber-500/10    text-amber-600    dark:text-amber-400    border-amber-500/20' :
                                o.status === 'processing' ? 'bg-blue-500/10     text-blue-600     dark:text-blue-400     border-blue-500/20' :
                                  o.status === 'in_courier' ? 'bg-cyan-500/10     text-cyan-600     dark:text-cyan-400     border-cyan-500/20' :
                                    o.status === 'on_the_way' ? 'bg-sky-500/10      text-sky-600      dark:text-sky-400      border-sky-500/20' :
                                      o.status === 'shipped' ? 'bg-indigo-500/10   text-indigo-600   dark:text-indigo-400   border-indigo-500/20' :
                                        o.status === 'delivered' ? 'bg-emerald-500/10  text-emerald-600  dark:text-emerald-400  border-emerald-500/20' :
                                          o.status === 'on_hold' ? 'bg-yellow-500/10   text-yellow-600   dark:text-yellow-400   border-yellow-500/20' :
                                            o.status === 'export' ? 'bg-purple-500/10   text-purple-600   dark:text-purple-400   border-purple-500/20' :
                                /* cancelled / returned */  'bg-red-500/10       text-red-600      dark:text-red-400      border-red-500/20'
                              }`}
                          >
                            {STATUSES.map(s => <option key={s} value={s} className="bg-background text-foreground normal-case">{t(s)}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 align-top" onClick={e => e.stopPropagation()}>
                          <div className="flex flex-col items-center gap-2">
                            <button className="text-muted-foreground hover:text-foreground p-1" onClick={() => setSelectedOrder(o)}>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            {o.status === 'cancelled' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOrderToDelete(o.id);
                                }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                title="Delete Order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onEdit={() => { setSelectedOrder(null); openEditOrder(selectedOrder); }}
          onCustomerFlag={async (id, isFake, reason) => {
            try {
              await api.post(`/customers/${id}/toggle-fake`, {
                is_fake: isFake,
                fake_reason: reason
              })
              toast.success(isFake ? 'Customer flagged as fake' : 'Customer unflagged')
              queryClient.invalidateQueries({ queryKey: ['orders'] })
              if (selectedOrder) {
                setSelectedOrder({
                  ...selectedOrder,
                  customer: { ...selectedOrder.customer, is_fake: isFake, fake_reason: reason || null }
                })
              }
            } catch (error) {
              toast.error('Failed to update customer status')
            }
          }}
          onPreviewInvoice={(id) => setPreviewInvoiceId(id)}
        />
      )}

      {previewInvoiceId && (
        <DashboardModal
          isOpen={!!previewInvoiceId}
          onClose={() => setPreviewInvoiceId(null)}
          title={`Invoice Preview #ORD-${previewInvoiceId}`}
          maxWidth="max-w-5xl"
          footer={
            <>
              <button
                onClick={() => setPreviewInvoiceId(null)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent rounded-xl transition-all"
              >
                Close
              </button>
              <a
                href={`${APP_URL}/order/invoice/${previewInvoiceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:shadow-glow transition-all"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </>
          }
        >
          <div className="w-full h-[70vh] bg-white">
            <iframe
              src={`${APP_URL}/order/invoice/${previewInvoiceId}/view`}
              className="w-full h-full border-0"
              title="Invoice Preview"
            />
          </div>
        </DashboardModal>
      )}

      {formModalOpen && (
        <OrderFormModal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          initialData={editingOrder}
          onSubmit={(data: any) => saveOrderMutation.mutate(data)}
          isSubmitting={saveOrderMutation.isPending}
        />
      )}
      {invoicePopup && (
        <Modal
          isOpen={invoicePopup.isOpen}
          onClose={() => setInvoicePopup(null)}
          title="Order Created Successfully"
          footer={
            <PrimaryButton onClick={() => setInvoicePopup(null)}>Close</PrimaryButton>
          }
        >
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <p className="text-muted-foreground mb-6">
              The order has been created. Since no email was provided for the customer, you can download the invoice manually below.
            </p>
            <a
              href={invoicePopup.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:shadow-glow transition-all"
            >
              <Download className="w-5 h-5" /> Download Invoice PDF
            </a>
          </div>
        </Modal>
      )}
      {orderToDelete && (
        <ConfirmationModal
          isOpen={!!orderToDelete}
          onClose={() => setOrderToDelete(null)}
          onConfirm={() => {
            if (orderToDelete) {
              toast.loading('Deleting order...', { id: `delete-${orderToDelete}` });
              deleteMutation.mutate(orderToDelete);
            }
          }}
          title="Delete Order"
          message={`Are you sure you want to delete order #ORD-${orderToDelete}? This action cannot be undone and will remove all associated data.`}
          isLoading={deleteMutation.isPending}
          confirmText="Delete Now"
        />
      )}

      {showBulkDeleteConfirm && (
        <ConfirmationModal
          isOpen={showBulkDeleteConfirm}
          onClose={() => setShowBulkDeleteConfirm(false)}
          onConfirm={() => {
            toast.loading('Deleting orders...', { id: 'bulk-delete' });
            bulkDeleteMutation.mutate(selectedOrders);
          }}
          title="Bulk Delete Orders"
          message={`Are you sure you want to delete ${selectedOrders.length} selected cancelled orders? This action cannot be undone and will permanently remove all selected order data.`}
          isLoading={bulkDeleteMutation.isPending}
          confirmText={`Delete ${selectedOrders.length} Cancelled Orders`}
        />
      )}
    </DashboardLayout>
  )
}
