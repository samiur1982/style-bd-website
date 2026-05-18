import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Hind_Siliguri } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/lib/AppContext'
import QueryProvider from '@/components/providers/QueryProvider'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  variable: '--font-hind-siliguri',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'style-bd | Admin Command Center',
  description: 'Style BD - Bangladesh D2C Fashion Brand ERP Dashboard',
}

import { Toaster } from 'sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'dark') document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');

                  var sc = localStorage.getItem('sidebarCollapsed') === 'true';
                  document.documentElement.style.setProperty('--sidebar-width', sc ? '64px' : '256px');
                  document.documentElement.setAttribute('data-sidebar-collapsed', sc ? 'true' : 'false');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`antialiased ${plusJakarta.variable} ${hindSiliguri.variable}`} suppressHydrationWarning>
        <QueryProvider>
          <AppProvider>
            {children}
            <Toaster position="top-right" richColors theme="dark" />
          </AppProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
