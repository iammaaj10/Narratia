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
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background Decorative Glow (Matches Login Page) */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Light Card Container */}
      <div className="relative z-10 w-full max-w-md p-10 bg-[#f8fafc] rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
        
        {/* Top Accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-blue-600 rounded-b-full"></div>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Register Here</h2>
          
        </div>

        <div className="space-y-5">
          {/* Input Group: Username */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Username</label>
            <input 
              placeholder="e.g. master_admin" 
              onChange={e => setUsername(e.target.value)} 
              className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
            />
          </div>

          {/* Input Group: Email */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Email Address</label>
            <input 
              placeholder="admin@company.com" 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
            />
          </div>

          {/* Input Group: Password */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4 mb-1 block">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
            />
          </div>

          <button 
            onClick={handleRegister}
            className="w-full mt-6 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-all duration-300 transform active:scale-[0.97] shadow-xl shadow-blue-500/10 uppercase tracking-widest text-sm"
          >
            Create Admin Account
          </button>
        </div>
        
        
      </div>
    </div>
  )
}