'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Package } from 'lucide-react'

interface ProductImageProps {
  src?: string | null
  alt: string
  fill?: boolean
  sizes?: string
  className?: string
  priority?: boolean
  width?: number
  height?: number
}

/**
 * ProductImage - A smart image component with graceful fallback.
 * When a product has no image or the image fails to load, it shows
 * a styled placeholder instead of crashing the app.
 */
export default function ProductImage({
  src,
  alt,
  fill,
  sizes,
  className,
  priority,
  width,
  height,
}: ProductImageProps) {
  const [errored, setErrored] = useState(false)

  // Show fallback if no src or if image errored
  if (!src || errored) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(var(--muted))] to-[hsl(var(--accent))]">
        <Package className="w-8 h-8 text-[hsl(var(--muted-foreground))] opacity-40" />
      </div>
    )
  }

  let finalSrc = src;
  if (!finalSrc.startsWith('http') && !finalSrc.startsWith('data:')) {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000';
    if (finalSrc.startsWith('products/')) {
      finalSrc = `${APP_URL}/${finalSrc}`;
    } else if (finalSrc.startsWith('/')) {
      finalSrc = `${APP_URL}${finalSrc}`;
    } else {
      finalSrc = `${APP_URL}/${finalSrc}`;
    }
  }

  const commonProps = {
    src: finalSrc,
    alt,
    className,
    priority,
    onError: () => setErrored(true),
  }

  if (fill) {
    return (
      <Image
        {...commonProps}
        fill
        sizes={sizes}
        unoptimized
      />
    )
  }

  return (
    <Image
      {...commonProps}
      width={width ?? 500}
      height={height ?? 600}
      sizes={sizes}
      unoptimized
    />
  )
}
