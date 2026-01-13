'use client'

import { supabase } from '@/lib/supabase/client'
import { useState } from 'react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  const handleRegister = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    alert('Account created')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] font-sans">
      {/* Background Decorative Element */}
      <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-10 -left-10"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-extrabold text-white tracking-tighter italic">JOIN THE CLUB</h2>
          <p className="text-slate-400 text-sm mt-2 uppercase tracking-[0.2em]">Admin Portal v2.0</p>
        </div>

        <div className="space-y-6">
          <div className="group relative">
            <input 
              placeholder="Username" 
              onChange={e => setUsername(e.target.value)} 
              className="w-full bg-transparent border-b border-slate-700 py-3 px-1 text-white outline-none transition-all focus:border-blue-500 placeholder:text-slate-600"
            />
          </div>

          <div className="group relative">
            <input 
              placeholder="Email" 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-transparent border-b border-slate-700 py-3 px-1 text-white outline-none transition-all focus:border-blue-500 placeholder:text-slate-600"
            />
          </div>

          <div className="group relative">
            <input 
              type="password" 
              placeholder="Password" 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-transparent border-b border-slate-700 py-3 px-1 text-white outline-none transition-all focus:border-blue-500 placeholder:text-slate-600"
            />
          </div>

          <button 
            onClick={handleRegister}
            className="w-full mt-8 bg-white text-black font-bold py-4 rounded-full hover:bg-blue-500 hover:text-white transition-all duration-300 active:scale-95 uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Create Account
          </button>
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-500 uppercase tracking-widest">
          Secure encrypted gateway
        </p>
      </div>
    </div>
  )
}