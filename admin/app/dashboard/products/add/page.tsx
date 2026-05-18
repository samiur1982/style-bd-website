'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useApp } from '@/lib/AppContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProductForm from '@/components/products/ProductForm'
import { PageHeader } from '@/components/ui/Components'

export default function AddProductPage() {
  const { t } = useApp()
  const router = useRouter()

  const { data: catData } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      const res = await api.get('/categories?tree=1')
      return res.data
    }
  })

  const flattenCategories = (cats: any[], depth = 0): any[] => {
    let flat: any[] = []
    for (const cat of cats) {
      flat.push({ ...cat, depth, labelName: `${'—'.repeat(depth)} ${cat.name}`.trim() })
      if (cat.children && cat.children.length > 0) {
        flat = flat.concat(flattenCategories(cat.children, depth + 1))
      }
    }
    return flat
  }

  const categories = catData ? flattenCategories(catData) : []

  return (
    <DashboardLayout title={t('add_new_product')}>
      <div className="page-container pb-20">
        <PageHeader 
          title={t('add_new_product')} 
          subtitle="Create a new product listing in your catalog"
        />
        
        <div className="mt-6 glass-card overflow-hidden">
          <ProductForm 
            initial={null} 
            onClose={() => router.push('/dashboard/products')} 
            categories={categories}
            isFullPage={true}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
