'use client'

import { useApp } from '@/lib/AppContext'
import { 
  TrendingUp, TrendingDown, X, Clock, Phone, MapPin, Pencil, ShieldAlert, AlertTriangle,
  PauseCircle, Navigation, Archive, Building2, Mail, ExternalLink, Globe,
  Copy, Check, Trash2, CheckCircle
} from 'lucide-react'
import { useState } from 'react'

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
  color: string
  isLoading?: boolean
}

export function MetricCard({ title, value, change, icon, color, isLoading }: MetricCardProps) {
  const { t } = useApp()
  const isPositive = change >= 0
  
  if (isLoading) {
    return (
      <div className="metric-card">
        <div className="flex items-center justify-between">
          <div className="w-24 h-4 skeleton" />
          <div className="w-10 h-10 rounded-xl skeleton" />
        </div>
        <div>
          <div className="w-32 h-8 skeleton mb-2" />
          <div className="w-20 h-4 skeleton" />
        </div>
      </div>
    )
  }

  return (
    <div className="metric-card group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2.5 rounded-xl ${color} shadow-sm`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {isPositive
            ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          }
          <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
          <span className="text-xs text-muted-foreground">{t('vs_last_month')}</span>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const map: Record<string, string> = {
    pending:    'badge-warning',
    processing: 'badge-primary',
    in_courier: 'badge-primary',
    on_the_way: 'badge-primary',
    shipped:    'badge-primary',
    delivered:  'badge-success',
    on_hold:    'badge-warning',
    cancelled:  'badge-danger',
    returned:   'badge-danger',
    export:     'badge-primary',
    confirmed:  'badge-primary',
    dispatched: 'badge-primary',
    in_stock:   'badge-success',
    low_stock:  'badge-warning',
    out_of_stock: 'badge-danger',
  }
  const { t } = useApp()
  return <span className={`${map[status] ?? 'badge-primary'} ${className}`}>{t(status) || status}</span>
}


export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass-card shadow-card p-5 ${className}`}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function PrimaryButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl 
      hover:bg-primary/90 shadow-sm hover:shadow-glow transition-all duration-200 ${className}`}
    >
      {children}
    </button>
  )
}

export function DataTable({ headers, rows, isLoading }: { headers: string[]; rows: React.ReactNode[][]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {headers.map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {headers.map((_, j) => (
                  <td key={j} className="px-4 py-4">
                    <div className="h-4 skeleton w-full opacity-40" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children, footer }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <Card className="relative w-full max-w-lg animate-slide-in shadow-2xl flex flex-col gap-6 !p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            {footer}
          </div>
        )}
      </Card>
    </div>
  )
}

export function Input({ label, id, ...props }: any) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="text-sm font-medium text-foreground">{label}</label>}
      <input
        id={id}
        className="input"
        {...props}
      />
    </div>
  )
}

export function DashboardModal({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-4xl' }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  if (!isOpen) return null

  return (
    <div className="fixed top-[64px] right-0 bottom-0 z-[40] flex items-center justify-center p-4 md:p-8"
         style={{ left: 'var(--sidebar-width)' }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} h-full max-h-[90vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col animate-slide-in overflow-hidden z-10`}>
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-[hsl(var(--muted)/0.1)]">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-card">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function CopyableText({ text, children, className = "" }: { text: string; children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`group relative flex items-center gap-2 cursor-pointer ${className}`} onClick={handleCopy}>
      <div className="flex-1 truncate">
        {children || <span>{text}</span>}
      </div>
      <div className={`p-1.5 rounded-lg bg-muted border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-accent flex-shrink-0`}>
        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
      </div>
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-[10px] font-bold rounded shadow-xl z-[100] whitespace-nowrap">
          Copied!
        </span>
      )}
    </div>
  )
}

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Delete', 
  isLoading = false,
  variant = 'danger'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string; 
  confirmText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'primary'
}) {
  const { t } = useApp()
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            variant === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
            variant === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
            'bg-primary/10 text-primary'
          }`}>
            {variant === 'danger' ? <Trash2 className="w-6 h-6" /> : 
             variant === 'warning' ? <AlertTriangle className="w-6 h-6" /> : 
             <CheckCircle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">{title}</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{message}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-semibold hover:bg-[hsl(var(--muted))] transition-colors"
          >
            {t('cancel_order') || 'Cancel'}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              variant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
              variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
              'bg-primary hover:opacity-90'
            }`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
