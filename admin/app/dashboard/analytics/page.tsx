'use client'

import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, PageHeader, SectionHeader } from '@/components/ui/Components'
import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

const getRanges = (t: any) => [
  { label: t('today'), key: 'today' },
  { label: t('last_7_days'), key: 'last_7_days' },
  { label: t('this_month'), key: 'this_month' },
  { label: t('last_month'), key: 'last_month' },
  { label: t('this_year'), key: 'this_year' },
  { label: t('custom'), key: 'custom' }
]

export default function AnalyticsPage() {
  const { t, theme, language } = useApp()
  const RANGES = getRanges(t)
  const [selectedRange, setSelectedRange] = useState(RANGES[2]) // Default to This Month
  const isDark = theme === 'dark'

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['analytics', selectedRange.key],
    queryFn: async () => {
      const response = await api.get('/analytics', {
        params: { period: selectedRange.key }
      })
      return response.data
    }
  })

  const kpis = [
    { label: t('total_sales'), value: `৳${(data?.kpis?.total_sales || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}`, change: +18.2, good: true },
    { label: t('total_orders'), value: (data?.kpis?.total_orders || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US'), change: +12.5, good: true },
    { label: t('conversion_rate'), value: (data?.kpis?.conversion_rate || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') + '%', change: -0.4, good: false },
    { label: t('ad_spend'), value: `৳${(data?.kpis?.ad_spend || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}`, change: +6.0, good: false },
    { label: t('net_profit'), value: `৳${(data?.kpis?.net_profit || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}`, change: +21.0, good: true },
    { label: t('roi'), value: (data?.kpis?.roi || 0).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') + '%', change: +15.0, good: true },
  ]

  const journalTotals = useMemo(() => {
    return (data?.journal || []).reduce((acc: any, row: any) => ({
      total_inhouse: acc.total_inhouse + (row.total_inhouse || 0),
      total_sold: acc.total_sold + (row.total_sold || 0),
      remaining_qty: acc.remaining_qty + (row.remaining_qty || 0),
      total_cost_of_goods: acc.total_cost_of_goods + (row.total_cost_of_goods || 0),
      sold_item_cost: acc.sold_item_cost + (row.sold_item_cost || 0),
      revenue: acc.revenue + (row.revenue || 0),
      profit: acc.profit + (row.profit || 0),
      remaining_balance_cost: acc.remaining_balance_cost + (row.remaining_balance_cost || 0),
    }), {
      total_inhouse: 0, total_sold: 0, remaining_qty: 0,
      total_cost_of_goods: 0, sold_item_cost: 0, revenue: 0, profit: 0,
      remaining_balance_cost: 0,
    })
  }, [data?.journal])

  const totalMargin = journalTotals.revenue > 0 ? (journalTotals.profit / journalTotals.revenue) * 100 : 0
  const topProducts = data?.top_products || []

  return (
    <DashboardLayout title={t('analytics')}>
      <div className="page-container">
        <PageHeader
          title={t('analytics')}
          subtitle={t('analytics_subtitle')}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border">
                {RANGES.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setSelectedRange(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedRange.key === r.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpis.map((k, i) => (
            <div key={i} className="glass-card p-4 relative overflow-hidden">
              {isLoading && <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
              <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
              <p className="text-lg font-bold text-foreground">{k.value}</p>
              <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${k.good ? 'text-emerald-500' : 'text-red-500'}`}>
                {k.good ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {k.change > 0 ? '+' : ''}{k.change}%
              </div>
            </div>
          ))}
        </div>

        <Card className="overflow-hidden border-primary/10 shadow-glow-sm">
          <SectionHeader
            title="Product Intelligence Journal"
            action={<span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">Financial Audit View</span>}
          />

          {/* Journal Totals Executive Summary */}
          {!isLoading && (
            <div className="bg-primary/[0.03] border-b border-primary/10 p-4">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" /> Journal Total Value
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3">
                <div className="bg-background rounded-lg p-3 border border-border/40 shadow-sm">
                  <div className="text-[10px] text-muted-foreground font-black mb-2 capitalize tracking-tight">Total Opening Stock</div>
                  <div className="text-sm font-black text-foreground">{journalTotals.total_inhouse} Units</div>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border/40 shadow-sm">
                  <div className="text-[10px] text-muted-foreground font-black mb-2 capitalize tracking-tight">Average Cost</div>
                  <div className="text-sm font-black font-mono text-muted-foreground">
                    ৳{journalTotals.total_inhouse > 0 ? (journalTotals.total_cost_of_goods / journalTotals.total_inhouse).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}
                  </div>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border/40 shadow-sm">
                  <div className="text-[10px] text-muted-foreground font-black mb-2 capitalize tracking-tight">Total Inventory Value</div>
                  <div className="text-sm font-black font-mono text-foreground">৳{journalTotals.total_cost_of_goods.toLocaleString()}</div>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border/40 shadow-sm">
                  <div className="text-[10px] text-muted-foreground font-black mb-2 capitalize tracking-tight">Total Units Sold</div>
                  <div className="text-sm font-black text-emerald-600">{journalTotals.total_sold} {journalTotals.total_sold === 1 ? 'Unit' : 'Units'}</div>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border/40 shadow-sm">
                  <div className="text-[10px] text-muted-foreground font-black mb-2 capitalize tracking-tight">Total COGS</div>
                  <div className="text-sm font-black font-mono text-muted-foreground">৳{journalTotals.sold_item_cost.toLocaleString()}</div>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border/40 shadow-sm">
                  <div className="text-[10px] text-muted-foreground font-black mb-2 capitalize tracking-tight">Total Revenue</div>
                  <div className="text-sm font-black font-mono text-primary">৳{journalTotals.revenue.toLocaleString()}</div>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border/40 shadow-sm">
                  <div className="text-[10px] text-muted-foreground font-black mb-2 capitalize tracking-tight">Total Profit</div>
                  <div className="text-sm font-black font-mono text-emerald-500">৳{journalTotals.profit.toLocaleString()}</div>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border/40 shadow-sm">
                  <div className="text-[10px] text-muted-foreground font-black mb-2 capitalize tracking-tight">Average Margin</div>
                  <div className="text-sm font-black">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-primary text-primary-foreground">{totalMargin.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="bg-background rounded-lg p-3 border border-border/40 shadow-sm">
                  <div className="text-[10px] text-muted-foreground font-black mb-2 capitalize tracking-tight">Total Stock Value (Rem.)</div>
                  <div className="text-sm font-black font-mono text-muted-foreground">৳{journalTotals.remaining_balance_cost.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-[13px] text-left border-collapse min-w-[1100px]">
              <thead className="z-20">
                <tr>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] whitespace-nowrap align-middle">Product Name</th>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] whitespace-nowrap align-middle">Code</th>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] text-center whitespace-nowrap align-middle">Opening Stock</th>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] text-right whitespace-nowrap align-middle">Cost</th>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] text-right whitespace-nowrap align-middle">Inventory Value (Cost)</th>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] text-center whitespace-nowrap align-middle">Units Sold</th>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] text-center whitespace-nowrap align-middle">Current Stock</th>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] text-right whitespace-nowrap align-middle">COGS</th>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] text-right text-primary whitespace-nowrap align-middle">Revenue</th>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] text-right text-emerald-500 whitespace-nowrap align-middle">Profit</th>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] text-right whitespace-nowrap align-middle">Margin %</th>
                  <th className="sticky top-0 z-20 bg-background border-y border-border px-5 py-3 font-black capitalize tracking-tight text-muted-foreground text-[11px] text-right whitespace-nowrap align-middle">Stock Value (At Cost)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan={12} className="p-5"><div className="h-5 bg-muted animate-pulse rounded w-full" /></td></tr>
                  ))
                ) : (
                  data?.journal?.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-primary/[0.03] transition-colors group">
                      <td className="px-5 py-4 font-black text-foreground group-hover:text-primary whitespace-nowrap">{row.name}</td>
                      <td className="px-5 py-4 font-mono text-[11px] text-muted-foreground/80 font-bold">
                        <span className="bg-muted px-1.5 py-0.5 rounded border border-border/50 uppercase">{row.code || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-muted-foreground">{row.total_inhouse}</td>
                      <td className="px-5 py-4 text-right font-mono text-muted-foreground/60">৳{row.unit_cost.toLocaleString()}</td>
                      <td className="px-5 py-4 text-right font-mono text-muted-foreground">৳{row.total_cost_of_goods.toLocaleString()}</td>
                      <td className="px-5 py-4 text-center font-bold text-emerald-500">{row.total_sold}</td>
                      <td className="px-5 py-4 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-md ${row.remaining_qty <= 5 ? 'bg-rose-500/10 text-rose-600' :
                            row.remaining_qty <= 15 ? 'bg-amber-500/10 text-amber-600' :
                              'bg-muted/50 text-muted-foreground'
                          }`}>
                          {row.remaining_qty}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-muted-foreground">৳{row.sold_item_cost.toLocaleString()}</td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-primary">৳{row.revenue.toLocaleString()}</td>
                      <td className="px-5 py-4 text-right font-mono font-black text-emerald-500">
                        <span className={row.profit < 0 ? 'text-rose-500' : 'text-emerald-500'}>
                          ৳{row.profit.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-tighter border ${row.margin >= 40 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            row.margin >= 20 ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                              'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                          {row.margin}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-muted-foreground">৳{row.remaining_balance_cost.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>


        {/* Top Products table */}
        <Card>
          <SectionHeader title={t('top_products')} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border">
                  {[t('product'), t('sold'), t('revenue'), t('roi'), t('trend')].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td colSpan={5} className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded w-full" /></td>
                    </tr>
                  ))
                ) : (
                  topProducts.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{Number(row.sold).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</td>
                      <td className="px-4 py-3 font-semibold text-primary">৳{Number(row.revenue).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${row.up ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {row.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {Number(row.roi).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${row.up ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: '70%' }} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!isLoading && topProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No data found for this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
