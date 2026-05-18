'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, Modal, ConfirmationModal, DataTable } from '@/components/ui/Components'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  UserPlus, Search, Shield, ShieldCheck, ShieldAlert, Eye,
  Pencil, Trash2, Users, UserCheck, UserX, Crown, ChevronDown, X, Check
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
interface AdminUser {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  role_label: string
  status: 'active' | 'inactive' | 'suspended'
  permissions: string[]
  avatar: string | null
  last_login_at: string | null
  created_at: string
}

interface RolesData {
  roles: Record<string, string>
  permissions: Record<string, string[]>
  all_permissions: Record<string, string>
}

const BLANK_FORM = {
  name: '', email: '', password: '', phone: '',
  role: 'staff', status: 'active', permissions: [] as string[],
}

// ── Role style map ────────────────────────────────────────────────────────
const roleStyle: Record<string, { color: string; icon: any }> = {
  super_admin: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: Crown },
  manager:     { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',         icon: ShieldCheck },
  staff:       { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: Shield },
  viewer:      { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',            icon: Eye },
}

const statusStyle: Record<string, string> = {
  active:    'badge-success',
  inactive:  'badge-gray',
  suspended: 'badge-danger',
}

// ── Helpers ───────────────────────────────────────────────────────────────
function Avatar({ user, size = 'md' }: { user: AdminUser; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }[size]
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600',
    'from-purple-500 to-pink-600', 'from-amber-500 to-orange-600']
  const color = colors[user.id % colors.length]
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

function RoleBadge({ role, label }: { role: string; label: string }) {
  const s = roleStyle[role] ?? roleStyle.viewer
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${s.color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

// ── Permission Checkbox Grid ──────────────────────────────────────────────
function PermissionGrid({
  allPerms, selected, onChange,
}: { allPerms: Record<string, string>; selected: string[]; onChange: (p: string[]) => void }) {
  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {Object.entries(allPerms).map(([key, label]) => {
        const on = selected.includes(key)
        return (
          <button key={key} type="button" onClick={() => toggle(key)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all text-sm ${
              on ? 'border-primary bg-primary/8 text-primary font-semibold'
                 : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted'
            }`}>
            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              on ? 'border-primary bg-primary' : 'border-border'
            }`}>
              {on && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ── User Form Modal ───────────────────────────────────────────────────────
function UserFormModal({
  isOpen, onClose, editUser, rolesData,
}: {
  isOpen: boolean; onClose: () => void; editUser: AdminUser | null; rolesData: RolesData | undefined
}) {
  const queryClient = useQueryClient()
  const isEdit = !!editUser
  const [form, setForm] = useState(() =>
    editUser ? {
      name: editUser.name, email: editUser.email, password: '',
      phone: editUser.phone ?? '', role: editUser.role,
      status: editUser.status, permissions: [...editUser.permissions],
    } : { ...BLANK_FORM }
  )
  const [permTab, setPermTab] = useState<'preset' | 'custom'>('preset')

  const handleRoleChange = (role: string) => {
    const defaultPerms = rolesData?.permissions[role] ?? []
    setForm(f => ({ ...f, role, permissions: [...defaultPerms] }))
  }

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (isEdit) return api.put(`/admin/users/${editUser!.id}`, data)
      return api.post('/admin/users', data)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'User updated!' : 'User created!')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Something went wrong'),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{isEdit ? 'Edit User' : 'Create New User'}</h2>
              <p className="text-xs text-muted-foreground">{isEdit ? 'Update user info and permissions' : 'Add a new admin user'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={submit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Basic Info */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Basic Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahim Uddin" />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input className="input" type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@style-bd.com" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="017XXXXXXXX" />
                </div>
                <div>
                  <label className="label">{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input className="input" type="password" required={!isEdit} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder={isEdit ? '••••••••' : 'Min 8 characters'} minLength={8} />
                </div>
              </div>
            </div>

            {/* Role & Status */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Role & Status</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Role *</label>
                  <select className="input" value={form.role} onChange={e => handleRoleChange(e.target.value)}>
                    {Object.entries(rolesData?.roles ?? {}).map(([val, lbl]) => (
                      <option key={val} value={val}>{lbl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Status *</label>
                  <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                    <option value="active">✅ Active</option>
                    <option value="inactive">⏸ Inactive</option>
                    <option value="suspended">🚫 Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Permissions</p>
                <div className="flex gap-1 p-1 bg-muted rounded-lg border border-border">
                  {(['preset', 'custom'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setPermTab(t)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${permTab === t ? 'bg-primary text-white' : 'text-muted-foreground'}`}>
                      {t === 'preset' ? '⚡ Role Defaults' : '🛠 Custom'}
                    </button>
                  ))}
                </div>
              </div>

              {permTab === 'preset' ? (
                <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{rolesData?.roles[form.role]}</span> gets these default permissions:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(rolesData?.permissions[form.role] ?? []).map(p => (
                      <span key={p} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                        {rolesData?.all_permissions[p] ?? p}
                      </span>
                    ))}
                  </div>
                  <button type="button" onClick={() => setPermTab('custom')}
                    className="text-xs text-primary font-semibold hover:underline mt-1">
                    Customize permissions →
                  </button>
                </div>
              ) : (
                <PermissionGrid
                  allPerms={rolesData?.all_permissions ?? {}}
                  selected={form.permissions}
                  onChange={perms => setForm(f => ({ ...f, permissions: perms }))}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60">
              {mutation.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { t } = useApp()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [formModal, setFormModal] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [deleteModal, setDeleteModal] = useState<AdminUser | null>(null)

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users', search, filterRole, filterStatus],
    queryFn: async () => {
      const params: any = {}
      if (search) params.search = search
      if (filterRole) params.role = filterRole
      if (filterStatus) params.status = filterStatus
      const res = await api.get('/admin/users', { params })
      return res.data
    },
  })

  const { data: rolesData } = useQuery<RolesData>({
    queryKey: ['admin-roles'],
    queryFn: async () => (await api.get('/admin/roles')).data,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success('User deleted.')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setDeleteModal(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Cannot delete user'),
  })

  // Stats
  const totalActive    = users.filter(u => u.status === 'active').length
  const totalInactive  = users.filter(u => u.status !== 'active').length
  const totalAdmins    = users.filter(u => u.role === 'super_admin' || u.role === 'manager').length

  const openCreate = () => { setEditUser(null); setFormModal(true) }
  const openEdit   = (u: AdminUser) => { setEditUser(u); setFormModal(true) }

  const timeAgo = (iso: string | null) => {
    if (!iso) return 'Never'
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <DashboardLayout title="User Management">
      <div className="page-container">
        <PageHeader
          title="User Management"
          subtitle="Create admin users and control what each person can access"
          actions={
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-sm hover:shadow-glow transition-all">
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          }
        />

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Users',  value: users.length,  icon: Users,     color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
            { label: 'Active',       value: totalActive,   icon: UserCheck, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
            { label: 'Inactive',     value: totalInactive, icon: UserX,     color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
            { label: 'Admins',       value: totalAdmins,   icon: Crown,     color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] header-search">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              className="bg-transparent border-none outline-none text-sm w-full"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-auto" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">All Roles</option>
            {Object.entries(rolesData?.roles ?? {}).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          {(search || filterRole || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus('') }}
              className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-accent transition-colors">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <DataTable
            isLoading={isLoading}
            headers={['User', 'Role', 'Status', 'Permissions', 'Last Login', 'Joined', 'Actions']}
            rows={users.map(u => [
              // User
              <div key="u" className="flex items-center gap-3">
                <Avatar user={u} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                </div>
              </div>,
              // Role
              <RoleBadge key="r" role={u.role} label={u.role_label} />,
              // Status
              <span key="s" className={statusStyle[u.status] ?? 'badge-gray'}>
                {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
              </span>,
              // Permissions
              <div key="p" className="flex flex-wrap gap-1 max-w-[200px]">
                {u.permissions.slice(0, 3).map(p => (
                  <span key={p} className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium">
                    {rolesData?.all_permissions[p]?.replace('Manage ', '').replace('View ', '') ?? p}
                  </span>
                ))}
                {u.permissions.length > 3 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold">
                    +{u.permissions.length - 3} more
                  </span>
                )}
              </div>,
              // Last Login
              <span key="l" className="text-xs text-muted-foreground">{timeAgo(u.last_login_at)}</span>,
              // Joined
              <span key="j" className="text-xs text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>,
              // Actions
              <div key="a" className="flex items-center gap-1">
                <button onClick={() => openEdit(u)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteModal(u)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>,
            ])}
          />
          {!isLoading && users.length === 0 && (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground font-medium">No users found</p>
              <button onClick={openCreate} className="mt-3 text-sm text-primary font-semibold hover:underline">
                Create your first user
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        editUser={editUser}
        rolesData={rolesData}
      />
      <ConfirmationModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={() => deleteModal && deleteMutation.mutate(deleteModal.id)}
        isLoading={deleteMutation.isPending}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteModal?.name}"? Their access will be revoked immediately.`}
        confirmText="Delete User"
        variant="danger"
      />
    </DashboardLayout>
  )
}
