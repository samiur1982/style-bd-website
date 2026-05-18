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
                  (language === 'bn' ? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়' : 'Incorrect email or password')
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#05070c] dark:bg-[#05070c] text-foreground font-sans relative overflow-hidden flex items-center justify-center p-6 transition-colors duration-300">
      {/* Decorative Brand Spotlights */}
      <div className="absolute -top-[150px] -left-[150px] w-[500px] h-[500px] bg-[#EFBE63]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[150px] -right-[150px] w-[500px] h-[500px] bg-[#C79438]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EFBE63]/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Subtle Dot Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Floating Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <div className="flex items-center gap-0.5 p-1 bg-white/[0.03] border border-white/10 rounded-lg backdrop-blur-md shadow-sm">
          <button 
            onClick={() => setLanguage('bn')} 
            className={`px-3 py-1 rounded-md text-[11px] font-extrabold tracking-wider transition-all duration-200 ${language === 'bn' ? 'bg-[#EFBE63] text-black shadow-sm' : 'text-white/60 hover:text-white'}`}
          >
            বাং
          </button>
          <button 
            onClick={() => setLanguage('en')} 
            className={`px-3 py-1 rounded-md text-[11px] font-extrabold tracking-wider transition-all duration-200 ${language === 'en' ? 'bg-[#EFBE63] text-black shadow-sm' : 'text-white/60 hover:text-white'}`}
          >
            EN
          </button>
        </div>
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-white/60 hover:text-white transition-all duration-200 text-xs backdrop-blur-md shadow-sm hover:scale-105 active:scale-95"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Centered Glassmorphic Login Card */}
      <div className="w-full max-w-[460px] relative z-10 bg-[#0c0e17]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-8 lg:p-10 shadow-2xl shadow-black/80 flex flex-col">
        
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EFBE63] to-[#C79438] flex items-center justify-center shadow-lg shadow-[#EFBE63]/20 mb-3 hover:scale-105 transition-transform duration-300">
            <Store className="w-6 h-6 text-black" />
          </div>
          <div className="text-center">
            <p className="font-extrabold text-2xl tracking-tight text-white">style-bd</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#EFBE63] mt-1">Command Center</p>
          </div>
        </div>

        {/* Form Title */}
        <div className="text-center mb-8 border-b border-white/5 pb-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            {language === 'bn' ? 'স্বাগতম!' : 'Welcome Back'}
          </h2>
          <p className="text-white/50 mt-2 text-sm font-medium">
            {language === 'bn' ? 'আপনার অ্যাডমিন প্যানেলে প্রবেশ করুন' : 'Sign in to access the control center'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 block">
              {language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 outline-none focus:border-[#EFBE63] focus:ring-4 focus:ring-[#EFBE63]/10 transition-all duration-300 font-medium"
              placeholder="admin@style-bd.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 block">
              {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20 outline-none focus:border-[#EFBE63] focus:ring-4 focus:ring-[#EFBE63]/10 transition-all duration-300 font-medium"
                placeholder={language === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Enter password'}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#EFBE63] transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-fade-in flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-semibold">
            <label className="flex items-center gap-2.5 text-white/50 hover:text-white cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded accent-[#EFBE63] border-white/10 bg-white/[0.03] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              {language === 'bn' ? 'মনে রাখুন' : 'Remember Me'}
            </label>
            <a href="#" className="text-[#EFBE63]/90 hover:text-[#EFBE63] hover:underline transition-all">
              {language === 'bn' ? 'পাসওয়ার্ড ভুলেছেন?' : 'Forgot Password?'}
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-[#EFBE63] to-[#C79438] text-black font-extrabold rounded-xl
            hover:opacity-95 shadow-md shadow-[#EFBE63]/10 hover:shadow-lg hover:shadow-[#EFBE63]/20 active:scale-[0.98] transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span>{language === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* SSL Secured Tag */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold text-white/40 tracking-wider uppercase border-t border-white/5 pt-6">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>SSL Secured · Encrypted Connection</span>
        </div>

      </div>
    </div>
  )
}
