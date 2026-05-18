'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
const ReactApexChart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div className="w-full h-full skeleton opacity-50" />
})

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function SalesLineChart({ dark = false, data = [] }: { dark?: boolean; data?: any[] }) {
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      return {
        categories: data.map(d => d.date),
        series: [{ name: 'Revenue', data: data.map(d => Number(d.revenue)) }]
      }
    }
    return {
      categories: months.slice(0, 7),
      series: [
        { name: 'Revenue', data: [42000, 58000, 45000, 71000, 55000, 84000, 92000] },
        { name: 'Ad Spend', data: [8000, 12000, 10000, 14000, 11000, 16000, 18000] },
      ]
    }
  }, [data])

  const options: ApexCharts.ApexOptions = useMemo(() => ({
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', sparkline: { enabled: false } },
    theme: { mode: dark ? 'dark' : 'light' },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] } },
    xaxis: { categories: chartData.categories, labels: { style: { colors: '#94a3b8', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (v) => `৳${(v/1000).toFixed(0)}k`, style: { colors: '#94a3b8', fontSize: '11px' } } },
    grid: { borderColor: dark ? '#1e293b' : '#f1f5f9', strokeDashArray: 4 },
    colors: ['#1d4ed8', '#60a5fa'],
    tooltip: { theme: dark ? 'dark' : 'light', y: { formatter: (v) => `৳${v.toLocaleString()}` } },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: '#94a3b8' } },
  }), [dark, chartData])
  return (
    <div style={{ height: 260 }}>
      <ReactApexChart options={options} series={chartData.series} type="area" height={260} />
    </div>
  )
}

export function OrderFunnelChart({ dark = false }: { dark?: boolean }) {
  const options: ApexCharts.ApexOptions = useMemo(() => ({
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: dark ? 'dark' : 'light' },
    plotOptions: { bar: { borderRadius: 6, distributed: true, horizontal: false } },
    colors: ['#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
    xaxis: { categories: ['Sessions', 'Add to Cart', 'Checkout', 'Payment', 'Orders'], labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
    yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
    grid: { borderColor: dark ? '#1e293b' : '#f1f5f9', strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { theme: dark ? 'dark' : 'light' },
    series: [{ name: 'Users', data: [1200, 480, 210, 165, 143] }],
  }), [dark])
  return (
    <div style={{ height: 260 }}>
      <ReactApexChart options={options} series={options.series!} type="bar" height={260} />
    </div>
  )
}

export function TrafficDonutChart({ dark = false }: { dark?: boolean }) {
  const options: ApexCharts.ApexOptions = useMemo(() => ({
    chart: { type: 'donut', background: 'transparent' },
    theme: { mode: dark ? 'dark' : 'light' },
    labels: ['Facebook', 'Google', 'Direct', 'Instagram', 'Other'],
    colors: ['#1d4ed8', '#f59e0b', '#10b981', '#e11d48', '#8b5cf6'],
    legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
    plotOptions: { pie: { donut: { size: '55%' } } },
    tooltip: { theme: dark ? 'dark' : 'light' },
    series: [38, 27, 15, 13, 7],
  }), [dark])
  return (
    <div style={{ height: 260 }}>
      <ReactApexChart options={options} series={options.series as number[]} type="donut" height={260} />
    </div>
  )
}

export function RevenueBarChart({ dark = false }: { dark?: boolean }) {
  const options: ApexCharts.ApexOptions = useMemo(() => ({
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: dark ? 'dark' : 'light' },
    plotOptions: { bar: { borderRadius: 5, columnWidth: '50%' } },
    colors: ['#1d4ed8'],
    stroke: { show: false },
    xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
    yaxis: { labels: { formatter: (v) => `৳${(v/1000).toFixed(0)}k`, style: { colors: '#94a3b8', fontSize: '11px' } } },
    grid: { borderColor: dark ? '#1e293b' : '#f1f5f9', strokeDashArray: 4 },
    tooltip: { theme: dark ? 'dark' : 'light', y: { formatter: (v) => `৳${v.toLocaleString()}` } },
    series: [{ name: 'Sales', data: [12000, 19000, 14000, 22000, 17000, 28000, 24000] }],
  }), [dark])
  return (
    <div style={{ height: 200 }}>
      <ReactApexChart options={options} series={options.series!} type="bar" height={200} />
    </div>
  )
}
