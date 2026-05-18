'use client'

import { useQuery } from '@tanstack/react-query'
import { useApp } from '@/lib/AppContext'
import { api } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MetricCard, SectionHeader, StatusBadge, Card, PageHeader, PrimaryButton, DataTable } from '@/components/ui/Components'
import { SalesLineChart, OrderFunnelChart, TrafficDonutChart, RevenueBarChart } from '@/components/charts/Charts'
import {
  BanknoteIcon, ShoppingCart, Users, TrendingUp, AlertTriangle,
  ShoppingBag, Plus, ArrowRight, Package, Zap, Brain
} from 'lucide-react'

export default function DashboardPage() {
  const { t, theme, language } = useApp()
  const isDark = theme === 'dark'

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard')
      return res.data
    }
  })

  const stats = data?.stats || {
    total_revenue: 0,
    total_orders: 0,
    total_customers: 0,
    avg_order_value: 0,
    low_stock_count: 0
  }

  const recentOrders = data?.recent_orders || []
  const recentCustomers = data?.recent_customers || []
  const lowStockProducts = data?.low_stock_products || []

  return (
    <DashboardLayout title={t('dashboard')}>
      <div className="page-container">
        {/* Page header */}
        <PageHeader
          title={t('dashboard')}
          subtitle={t('dashboard_subtitle')}
          actions={
            <PrimaryButton>
              <Plus className="w-4 h-4" />
              {t('new_order')}
            </PrimaryButton>
          }
        />

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title={t('total_revenue')}
            value={`৳${Number(stats.total_revenue).toLocaleString()}`}
            change={12.5}
            icon={<BanknoteIcon className="w-5 h-5 text-white" />}
            color="bg-primary"
            isLoading={isLoading}
          />
          <MetricCard
            title={t('total_orders')}
            value={stats.total_orders.toLocaleString()}
            change={8.2}
            icon={<ShoppingCart className="w-5 h-5 text-white" />}
            color="bg-blue-500"
            isLoading={isLoading}
          />
          <MetricCard
            title={t('total_customers')}
            value={stats.total_customers.toLocaleString()}
            change={5.4}
            icon={<Users className="w-5 h-5 text-white" />}
            color="bg-violet-500"
            isLoading={isLoading}
          />
          <MetricCard
            title={t('avg_order_value')}
            value={`৳${Number(stats.avg_order_value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            change={-1.2}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="bg-emerald-500"
            isLoading={isLoading}
          />
        </div>

        {/* Alert Banner */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{t('low_stock_alerts')}: <strong>{stats.low_stock_count.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')} {t('product_count')}</strong> {t('items_below_stock')}</span>
            <a href="/dashboard/products?filter=low_stock" className="ml-auto text-xs underline flex items-center gap-1">{t('view_all')} <ArrowRight className="w-3 h-3" /></a>
          </div>
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 text-blue-800 dark:text-blue-300">
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{t('abandoned_carts')}: <strong>{(3).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')} {t('cart_count')}</strong> – {t('potential_recovery')} ৳{(14200).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</span>
            <a href="/dashboard/abandoned-cart" className="ml-auto text-xs underline flex items-center gap-1">{t('recover')} <ArrowRight className="w-3 h-3" /></a>
          </div>
        </div>

        {/* Priority Section: Latest Orders + New Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="flex flex-col">
            <SectionHeader
              title={t('recent_orders')}
              action={<a href="/dashboard/orders" className="text-xs text-primary hover:underline flex items-center gap-1">{t('view_all')} <ArrowRight className="w-3 h-3" /></a>}
            />
            <div className="flex-1">
              <DataTable
                headers={[t('order_id'), t('product'), t('customer'), t('price'), t('date'), t('status')]}
                isLoading={isLoading}
                rows={recentOrders.map((o: any) => [
                  <span key={`id-${o.id}`} className="font-mono text-xs font-semibold text-primary align-top">#ORD-{o.id}</span>,
                  <div key={`items-${o.id}`} className="flex flex-col gap-1 py-1 align-top">
                    {o.items?.map((item: any, idx: number) => (
                      <span key={idx} className="text-[10px] font-medium text-foreground truncate max-w-[150px]">
                        • {item.product?.name} <span className="text-muted-foreground font-bold">×{item.quantity}</span>
                      </span>
                    ))}
                  </div>,
                  <div key={`cust-${o.id}`} className="flex flex-col align-top">
                    <span className="font-medium truncate max-w-[120px] inline-block">{o.customer?.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{o.customer?.phone}</span>
                    <span className="text-[9px] text-muted-foreground line-clamp-2 max-w-[120px] leading-tight">
                      <strong className="text-foreground font-bold">{o.district}</strong> | {o.address}
                    </span>
                    {o.ip_address && (
                      <span className="text-[8px] text-primary/60 font-mono flex items-center gap-1 mt-0.5">
                        <Zap className="w-2 h-2" /> {o.ip_address}
                      </span>
                    )}
                  </div>,
                  <span key={`amt-${o.id}`} className="flex flex-col gap-1 py-1 align-top">
                    {o.items?.map((item: any, idx: number) => (
                      <span key={idx} className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                        ৳{(item.quantity * (Number(item.unit_price) - Number(item.discount || 0))).toLocaleString()}
                      </span>
                    ))}
                    <span className="font-bold text-xs text-primary border-t border-border/50 pt-1 mt-1">
                      ৳{Number(o.total_amount).toLocaleString()}
                    </span>
                  </span>,
                  <div key={`date-${o.id}`} className="flex flex-col align-top">
                    <span className="text-[10px] font-bold text-[hsl(var(--foreground))]">
                      {new Date(o.created_at).toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
                      {new Date(o.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                    </span>
                  </div>,
                  <StatusBadge key={`status-${o.id}`} status={o.status} className="align-top" />,
                ])}
              />
            </div>
          </Card>

          <Card className="flex flex-col">
            <SectionHeader
              title={t('new_customers')}
              action={<a href="/dashboard/customers" className="text-xs text-primary hover:underline flex items-center gap-1">{t('view_all')} <ArrowRight className="w-3 h-3" /></a>}
            />
            <div className="flex-1">
              <DataTable
                headers={[t('name'), t('contact_info'), t('joined'), t('ltv')]}
                isLoading={isLoading}
                rows={recentCustomers.map((c: any) => [
                  <div key={`name-${c.id}`} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {c.name.charAt(0)}
                    </div>
                    <span className="font-medium truncate max-w-[100px]">{c.name}</span>
                  </div>,
                  <span key={`contact-${c.id}`} className="text-xs text-muted-foreground">{c.phone || c.email}</span>,
                  <span key={`joined-${c.id}`} className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}</span>,
                  <span key={`ltv-${c.id}`} className="font-semibold text-emerald-600">৳{Number(c.total_spent || 0).toLocaleString()}</span>,
                ])}
              />
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <SectionHeader title={t('sales_overview')} />
            <SalesLineChart dark={isDark} />
          </Card>
          <Card>
            <SectionHeader title={t('traffic_source')} />
            <TrafficDonutChart dark={isDark} />
          </Card>
        </div>

        {/* Deep Driver + Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-900/10">
            <SectionHeader 
              title={t('deep_driver')} 
              action={<div className="px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-bold text-primary animate-pulse">LIVE INSIGHTS</div>}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('ai_recommendation')}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      {t('kurti_demand_alert')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Conversion Driver</p>
                    <p className="text-xs text-muted-foreground mt-1">Direct traffic from Facebook is converting 15% higher than Google search this week.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 border border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Growth Velocity</p>
                <div className="space-y-3">
                  {[
                    { label: 'Customer Retention', value: 72, color: 'bg-primary' },
                    { label: 'Order Frequency', value: 45, color: 'bg-blue-500' },
                    { label: 'Brand Loyalty', value: 88, color: 'bg-emerald-500' }
                  ].map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium">
                        <span>{item.label}</span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Zap className="w-3 h-3" /> {t('smart_forecast')}
                </button>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {/* Low Stock */}
            <Card>
              <SectionHeader
                title={t('low_stock_alerts')}
                action={<AlertTriangle className="w-4 h-4 text-amber-500" />}
              />
              <div className="space-y-3">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg skeleton" />
                        <div className="space-y-1">
                          <div className="w-24 h-3 skeleton" />
                          <div className="w-16 h-2 skeleton" />
                        </div>
                      </div>
                      <div className="w-12 h-5 rounded-full skeleton" />
                    </div>
                  ))
                ) : (
                  <>
                    {lowStockProducts.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground leading-tight truncate max-w-[120px]">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{t('threshold')}: {p.low_stock.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</p>
                          </div>
                        </div>
                        <span className="badge-danger text-[10px] py-0.5">{p.stock.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}{language === 'bn' ? 'টি' : ''} {t('remaining')}</span>
                      </div>
                    ))}
                    {lowStockProducts.length === 0 && (
                      <p className="text-xs text-center text-muted-foreground py-4">{t('sufficient_stock')}</p>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* Server Status */}
            <Card className="bg-slate-900 text-white border-none shadow-glow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">{t('server_status')}</span>
                </div>
                <span className="text-[10px] font-mono opacity-50">v2.4.0-stable</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold">Node-Primary</p>
                  <p className="text-xs text-emerald-400 font-medium mt-0.5">{t('active')}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/10">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
