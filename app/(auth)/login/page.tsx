'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Email and password are required')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] px-4">
      {/* Subtle Background Glow to separate form from darkness */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-[#f8fafc] rounded-[2rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Accent Strip at top */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back.</h2>
          <p className="text-slate-500 mt-2 font-medium">Please enter your admin credentials.</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Email Address</label>
            <input
              type="email"
              placeholder="admin@system.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="relative">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="pt-4">
            <button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-blue-900/10 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Verifying...
                </span>
              ) : 'Sign In'}
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
            <button 
              onClick={() => router.push('/forgot-password')}
              className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-tighter"
            >
              Secure Password Reset
            </button>
        </div>
      </div>
    </div>
  )
}