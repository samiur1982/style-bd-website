'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, APP_URL } from '@/lib/api'
import { Modal } from '@/components/ui/Components'
import { Search, Grid, Check, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface MediaItem {
  id: string
  src: string
  path: string
  name: string
  dimensions: string
  size: string
}

export function MediaPicker({ isOpen, onClose, onSelect }: { 
  isOpen: boolean
  onClose: () => void
  onSelect: (path: string) => void 
}) {
  const [search, setSearch] = useState('')
  const { data: items = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ['media'],
    queryFn: async () => (await api.get('/media')).data,
    enabled: isOpen
  })

  const filtered = items.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.path.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select from Media Manager">
      <div className="flex flex-col gap-4 h-[60vh]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search media..." 
            className="bg-transparent flex-1 outline-none text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square skeleton rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {filtered.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(item.path)
                    onClose()
                  }}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-border hover:border-primary transition-all shadow-sm hover:shadow-glow"
                >
                  <Image 
                    src={item.src} 
                    alt={item.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="150px"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm italic">No images found</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
