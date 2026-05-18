'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/AppContext'
import { Eye, EyeOff, Store, ArrowRight, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'

export default function LoginPage() {
  const { t, theme, toggleTheme, language, setLanguage } = useApp()
  const router = useRouter()
  const [email, setEmail] = useState('admin@style-bd.com')
  const [password, setPassword] = useState('m062229')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await api.post('/login', { email, password })
      const { token, user } = res.data
      
      // Store token in localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Login error details:', err.response?.data)
      const msg = err.response?.data?.message || 
                  (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : null) ||
                  'ইমেইল বা পাসওয়ার্ড সঠিক নয়'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-primary text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-xl leading-none">style-bd</p>
              <p className="text-xs text-white/70">Command Center</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            বাংলাদেশের সেরা<br />
            <span className="text-white/80">ফ্যাশন ব্র্যান্ড</span><br />
            পরিচালনা প্যানেল
          </h1>
          <p className="text-white/70 leading-relaxed">
            আপনার সম্পূর্ণ ব্যবসা পরিচালনা করুন একটি জায়গা থেকে — অর্ডার, পণ্য, গ্রাহক, মার্কেটিং সব কিছু।
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { num: '১,২৮৪+', label: 'অর্ডার' },
            { num: '৮৪৭+',   label: 'গ্রাহক' },
            { num: '৭৯১%',   label: 'ROI' },
          ].map((s, i) => (
            <div key={i} className="text-center p-3 rounded-xl bg-white/10 backdrop-blur">
              <p className="text-2xl font-bold">{s.num}</p>
              <p className="text-xs text-white/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Top controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="flex items-center gap-0.5 p-1 bg-muted rounded-lg border border-border">
            <button onClick={() => setLanguage('bn')} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${language === 'bn' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>বাং</button>
            <button onClick={() => setLanguage('en')} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${language === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>EN</button>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors text-xs">{theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="font-bold text-xl text-foreground">style-bd</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">স্বাগতম!</h2>
            <p className="text-muted-foreground mt-2">আপনার অ্যাকাউন্টে লগইন করুন</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">ইমেইল ঠিকানা</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                placeholder="admin@style-bd.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder="পাসওয়ার্ড লিখুন"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-border bg-muted text-primary focus:ring-primary/40"
                />
                মনে রাখুন (Always Allow)
              </label>
              <a href="#" className="text-primary hover:underline">পাসওয়ার্ড ভুলেছেন?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl
              hover:bg-primary/90 shadow-sm hover:shadow-glow transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>লগইন করুন <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>SSL দ্বারা সুরক্ষিত · সমস্ত ডেটা এনক্রিপ্টেড</span>
          </div>
        </div>
      </div>
    </div>
  )
}
