'use client'

import React, { useState, useRef, useEffect } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X, Save, RotateCw, FlipHorizontal, Scissors, FileType, Check, Link, Info, Monitor, HardDrive, ArrowRight, Fullscreen, Minimize, Search } from 'lucide-react'

interface ImageEditorProps {
  item: {
    src: string
    name: string
    size: string
    dimensions: string
    format: string
    path: string
  }
  onSave: (blob: Blob, fileName: string) => void
  onClose: () => void
}

export default function ImageEditor({ item, onSave, onClose }: ImageEditorProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [aspect, setAspect] = useState<number | undefined>(3 / 4)
  
  // Initialize format based on original item to preserve extension/link
  const [format, setFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>(
    item.format === 'png' ? 'image/png' : 
    (item.format === 'jpeg' || item.format === 'jpg') ? 'image/jpeg' : 
    'image/webp'
  )
  const [quality, setQuality] = useState(0.85)
  const [isProcessing, setIsProcessing] = useState(false)
  const [estimatedSize, setEstimatedSize] = useState<string>('')
  
  const imgRef = useRef<HTMLImageElement>(null)

  // Use proxy route for local images to avoid CORS/Tainted Canvas issue
  const studioSrc = item.src.includes('/products/') 
    ? item.src.replace('/products/', '/api/media/serve/products/') 
    : item.src

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleExport()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [completedCrop, rotate, scale, format, quality])

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    
    // Auto-calculate best initial crop based on current aspect
    if (aspect) {
       setCrop(centerCrop(
          makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
          width,
          height
       ))
    }
  }

  useEffect(() => {
    if (!completedCrop || !imgRef.current) return
    const originalSizeKb = parseFloat(item.size.replace('KB', ''))
    const cropRatio = (completedCrop.width * completedCrop.height) / (imgRef.current.width * imgRef.current.height)
    let estimated = originalSizeKb * cropRatio * quality
    if (format === 'image/webp') estimated *= 0.7
    setEstimatedSize(estimated.toFixed(1) + ' KB')
  }, [completedCrop, quality, format, item.size])

  const handleExport = async () => {
    if (!imgRef.current || !completedCrop) return
    setIsProcessing(true)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const scaleX = imgRef.current.naturalWidth / imgRef.current.width
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height

      canvas.width = Math.floor(completedCrop.width * scaleX)
      canvas.height = Math.floor(completedCrop.height * scaleY)

      ctx.imageSmoothingQuality = 'high'
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotate * Math.PI) / 180)
      ctx.scale(scale, 1) // Scale only X for flip
      ctx.translate(-canvas.width / 2, -canvas.height / 2)

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0, 0, canvas.width, canvas.height
      )
      ctx.restore()

      canvas.toBlob((blob) => {
        if (blob) {
          const ext = format.split('/')[1]
          const name = item.name.replace(/\.[^/.]+$/, "") + `_lab.${ext}`
          onSave(blob, name)
        }
        setIsProcessing(false)
      }, format, quality)
    } catch (err) {
      console.error('Export failed:', err)
      setIsProcessing(false)
      alert('Failed to save image. This might be due to a security restriction (CORS).')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col md:flex-row animate-in fade-in duration-300" 
         style={{ 
           left: 'var(--sidebar-width)', 
           top: '64px',
           height: 'calc(100vh - 64px)'
         }}>
      
      {/* 🛠️ SIDEBAR CONTROLS */}
      <div className="w-full md:w-80 bg-[#141414] border-r border-white/10 flex flex-col h-full overflow-y-auto text-white">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
             <Search className="w-4 h-4 text-indigo-500" /> Image Studio
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/20 font-bold hidden md:block">ESC to close</span>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4 text-white/40" /></button>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* ASPECT RATIO */}
          <section>
            <label className="text-[10px] font-bold uppercase text-white/40 mb-4 block tracking-tighter">1. Framing & Crop</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '3:4 Fashion', val: 3/4 },
                { label: '1:1 Square', val: 1/1 },
                { label: '9:16 Story', val: 9/16 },
                { label: 'Free View', val: undefined }
              ].map(opt => (
                <button 
                  key={opt.label} onClick={() => setAspect(opt.val)}
                  className={`py-2 px-3 text-[10px] font-bold rounded border transition-all ${aspect === opt.val ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20 shadow-lg' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* TRANSFORM */}
          <section>
             <label className="text-[10px] font-bold uppercase text-white/40 mb-4 block tracking-tighter">2. Orientation</label>
             <div className="flex gap-2">
              <button onClick={() => setRotate(r => (r + 90) % 360)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded border border-white/5 flex flex-col items-center gap-2 transition-all">
                <RotateCw className="w-4 h-4 text-indigo-400" />
                <span className="text-[9px] font-bold uppercase">Rotate</span>
              </button>
              <button onClick={() => setScale(s => s === 1 ? -1 : 1)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded border border-white/5 flex flex-col items-center gap-2 transition-all">
                <FlipHorizontal className="w-4 h-4 text-indigo-400" />
                <span className="text-[9px] font-bold uppercase">Flip</span>
              </button>
            </div>
          </section>

          {/* EXPORT ENGINE */}
          <section className="p-4 rounded bg-indigo-500/5 border border-indigo-500/20">
            <label className="text-[10px] font-bold uppercase text-indigo-400 mb-4 block flex items-center gap-2">
              <FileType className="w-3 h-3" /> 3. Compression Engine
            </label>
            <div className="space-y-4">
              <div className="flex bg-black/40 p-1 rounded border border-white/10">
                {['webp', 'jpeg', 'png'].map(ext => (
                  <button 
                    key={ext} onClick={() => setFormat(`image/${ext}` as any)}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded transition-all ${format === `image/${ext}` ? 'bg-indigo-600 text-white' : 'text-white/40'}`}
                  >
                    {ext.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="px-1">
                <div className="flex justify-between text-[10px] font-bold mb-3">
                  <span className="text-white/40">Efficiency</span>
                  <span className="text-indigo-400">{Math.round(quality * 100)}%</span>
                </div>
                <input type="range" min={0.5} max={1} step={0.05} value={quality} onChange={e => setQuality(+e.target.value)} className="w-full accent-indigo-500 h-1 bg-white/10 rounded-full" />
              </div>
            </div>
          </section>

          {/* METADATA */}
          <section className="pt-6 border-t border-white/5 space-y-4">
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 p-3 rounded border border-white/5">
                   <p className="text-[8px] text-white/30 uppercase font-black mb-1">Source Size</p>
                   <p className="text-[11px] font-mono font-bold text-white/80">{item.size}</p>
                </div>
                <div className="bg-black/20 p-3 rounded border border-white/5">
                   <p className="text-[8px] text-white/30 uppercase font-black mb-1">Dimensions</p>
                   <p className="text-[11px] font-mono font-bold text-white/80">{item.dimensions}</p>
                </div>
             </div>
             <div className="bg-indigo-500/10 p-3 rounded border border-indigo-500/20">
                <p className="text-[8px] text-indigo-400 uppercase font-black mb-1 tracking-widest">Target Weight</p>
                <p className="text-[13px] font-mono font-black text-indigo-400 flex items-center gap-2">
                   {estimatedSize} <ArrowRight className="w-3 h-3 opacity-50" /> <span className="text-[10px] text-indigo-300/50">OPTIMIZED</span>
                </p>
             </div>
          </section>
        </div>

        <div className="p-4 bg-black/40 border-t border-white/10 sticky bottom-0">
          <button 
            onClick={handleExport} disabled={isProcessing}
            className="w-full py-4 bg-indigo-600 text-white rounded font-black shadow-lg hover:bg-indigo-500 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 text-xs uppercase tracking-widest group"
          >
            <div className="flex items-center gap-3">
              {isProcessing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              <span>Save changes</span>
            </div>
            <span className="text-[8px] text-white/40 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Ctrl + Enter</span>
          </button>
        </div>
      </div>

      {/* 🖼️ VIEWPORT - FIXED SCALING LOGIC */}
      <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center p-8 overflow-hidden relative">
        <div className="absolute top-6 left-6 flex items-center gap-3 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 backdrop-blur-md">
           <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
           <span className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em]">Studio Viewport active</span>
        </div>

        {/* This container ensures the image NEVER goes outside the visible space */}
        <div className="relative w-full h-full flex items-center justify-center">
           <div className="max-w-full max-h-full flex items-center justify-center overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                // These are critical for the fix
                style={{ maxHeight: '100%', maxWidth: '100%' }}
                className="max-w-full max-h-full"
              >
                <img 
                  ref={imgRef} 
                  src={studioSrc} 
                  crossOrigin="anonymous"
                  onLoad={onImageLoad}
                  style={{ 
                    // Use scale only for horizontal flip, not for zoom
                    transform: `rotate(${rotate}deg) scaleX(${scale})`, 
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    maxHeight: 'calc(100vh - 200px)', // Precise height limit
                    maxWidth: '100%'
                  }}
                  className="object-contain block pointer-events-none shadow-2xl"
                />
              </ReactCrop>
           </div>
        </div>

        <div className="absolute bottom-6 right-6">
           <div className="flex items-center gap-2 text-white/20 text-[10px] font-bold uppercase tracking-widest">
              <Minimize className="w-3 h-3" /> Auto-fit enabled
           </div>
        </div>
      </div>
    </div>
  )
}
