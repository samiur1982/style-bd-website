'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronRight, ChevronDown, Folder, Hash, Palette, MoreVertical, Pencil } from 'lucide-react'
import { Card, SectionHeader, PrimaryButton } from '@/components/ui/Components'
import { useApp } from '@/lib/AppContext'

interface Category {
  id: number
  name: string
  name_bn?: string
  slug: string
  parent_id?: number
  image_url?: string
  children?: Category[]
}

export function CategoryTreeItem({ category, onAdd, onEdit, onDelete, level = 0 }: { 
  category: Category; 
  onAdd: (id: number) => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: number) => void;
  level?: number 
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = category.children && category.children.length > 0
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000'

  const resolveImageUrl = (path: string | undefined) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    
    // If it starts with media/ or products/ or storage/
    if (cleanPath.startsWith('media/') || cleanPath.startsWith('products/') || cleanPath.startsWith('storage/')) {
      return `${APP_URL}/${cleanPath}`
    }
    
    // Default fallback: prepend APP_URL and a slash
    return `${APP_URL}/${cleanPath}`
  }

  const imageUrl = resolveImageUrl(category.image_url)

  return (
    <div className="space-y-1">
      <div 
        className={`group flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer`}
        style={{ paddingLeft: level * 20 + 8 }}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-accent rounded">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}
          {imageUrl ? (
            <div className="w-6 h-6 rounded border border-border overflow-hidden bg-muted flex-shrink-0">
               <img 
                 src={imageUrl} 
                 alt="" 
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   // If image fails to load, replace with a placeholder or icon
                   (e.target as HTMLImageElement).style.display = 'none';
                   (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-3 h-3 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg></div>';
                 }}
               />
            </div>
          ) : (
            <Folder className="w-4 h-4 text-primary opacity-70" />
          )}
          <span className="text-sm font-medium">{category.name}</span>
          {category.name_bn && <span className="text-xs text-muted-foreground">({category.name_bn})</span>}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onAdd(category.id)}
            className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
            title={level === 0 ? "Add Sub-category" : "Add Sub-category"}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onEdit(category)}
            className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onDelete(category.id)}
            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {hasChildren && expanded && (
        <div className="ml-4 pl-4 border-l border-dashed border-border/50 space-y-1 animate-fade-in">
          {category.children!.map(child => (
            <CategoryTreeItem key={child.id} category={child} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AttributePanel({ title, items, icon: Icon, onAdd, onEdit, onDelete, renderItem }: {
  title: string
  items: any[]
  icon: any
  onAdd: () => void
  onEdit: (item: any) => void
  onDelete: (id: number) => void
  renderItem: (item: any) => React.ReactNode
}) {
  const { t } = useApp()
  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <button 
          onClick={onAdd}
          className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {items.map(item => (
          <div key={item.id} className="group flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              {renderItem(item)}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => onEdit(item)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => onDelete(item.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm italic">
            {t('no_items_hint')}
          </div>
        )}
      </div>
    </Card>
  )
}
