'use client'

import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, StatusBadge } from '@/components/ui/Components'
import { useEffect, useState } from 'react'
import {
  Search, Users, ShoppingCart, TrendingUp, Phone, Mail,
  MapPin, AlertTriangle, UserX, ShieldAlert, ChevronRight,
  RefreshCw, Trash2
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_fake: boolean;
  fake_reason: string;
  orders_count: number;
  created_at: string;
}

export default function FakeCustomersPage() {
  const { t, language } = useApp()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, withOrders: 0 })

  const fetchFakeCustomers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/customers/fake')
      setCustomers(response.data.data)
      const data = response.data.data
      setStats({
        total: response.data.total,
        withOrders: data.filter((c: Customer) => c.orders_count > 0).length
      })
    } catch (error) {
      console.error('Failed to fetch fake customers:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFakeCustomers()
  }, [])

  const handleUnflag = async (customer: Customer) => {
    try {
      await api.post(`/customers/${customer.id}/toggle-fake`, {
        is_fake: false
      })
      toast.success('Customer unflagged')
      fetchFakeCustomers()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async (customer: Customer) => {
    if (!confirm('Are you sure you want to delete this customer record?')) return
    try {
      await api.delete(`/customers/${customer.id}`)
      toast.success('Customer deleted')
      fetchFakeCustomers()
    } catch (error) {
      toast.error('Failed to delete customer')
    }
  }

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search) || 
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <DashboardLayout title={t('fake_customers')}>
      <div className="page-container">
        <PageHeader
          title={t('fake_customers')}
          subtitle={t('fake_customers_subtitle')}
        />

        {/* Fraud Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 border-l-4 border-red-500 bg-red-50/50 dark:bg-red-950/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.total}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('total_customers')}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 border-l-4 border-orange-500 bg-orange-50/50 dark:bg-orange-950/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats.withOrders}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Has Active Orders</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">Security</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Auto-Flag Active</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-muted/50 border border-border flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                placeholder={t('search_customers')}
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
            <button 
              onClick={fetchFakeCustomers}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold hover:opacity-80 transition-opacity"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">{t('customer')}</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">{t('reason')}</th>
                  <th className="text-left px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">{t('orders')}</th>
                  <th className="text-center px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={4} className="py-20 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary opacity-20" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="py-20 text-center text-muted-foreground font-bold tracking-tight">{t('no_customers_found')}</td></tr>
                ) : filtered.map(customer => (
                  <tr key={customer.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 font-black text-sm border border-red-200 dark:border-red-800">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-foreground">{customer.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-bold">
                            <Phone className="w-3 h-3" /> {customer.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 inline-block">
                          {customer.fake_reason || t('marked_by_admin')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-black">{customer.orders_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleUnflag(customer)}
                          className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors"
                          title="Unflag Customer"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer)}
                          className="p-2 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
