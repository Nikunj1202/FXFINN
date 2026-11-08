'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, LoaderCircle } from 'lucide-react';
let client: ReturnType<typeof createClient> | null = null;
export function supabaseBrowser() { client ??= createClient(); return client; }
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState(''); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const router=useRouter();
  async function submit(e:FormEvent) { e.preventDefault(); setBusy(true); setMessage(''); try {
    const supabase=supabaseBrowser();
    if(mode==='login') { const {error}=await supabase.auth.signInWithPassword({email,password}); if(error)throw error; router.replace('/dashboard'); router.refresh(); }
    else { const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:`${window.location.origin}/auth/callback?next=/dashboard`}}); if(error)throw error; setMessage(data.session?'Account created. Redirecting…':'Account created. Check your email to verify the address, then sign in.'); if(data.session){router.replace('/dashboard');router.refresh();} }
  } catch(err) {setMessage(err instanceof Error?err.message:'Authentication failed.');} finally{setBusy(false);} }
  return <div className="w-full max-w-[430px] rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_12px_48px_rgba(16,24,40,.08)] sm:p-9">
    <div className="mb-8 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--navy)] text-white"><TrendingUp size={21}/></div><div><div className="text-lg font-bold tracking-[.12em]">FXFINN</div><div className="text-[10px] uppercase tracking-[.18em] text-slate-400">Personal wealth</div></div></div>
    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{mode==='login'?'Welcome back':'Create your workspace'}</h1><p className="mt-2 text-sm text-slate-500">{mode==='login'?'Sign in to see your complete financial picture.':'Start bringing your financial life into one clear view.'}</p>
    <form onSubmit={submit} className="mt-7 space-y-4">
      {mode==='register'&&<label className="block text-xs font-semibold text-slate-600">Full name<input required value={name} onChange={e=>setName(e.target.value)} className="field mt-1.5" placeholder="Your name" maxLength={100}/></label>}
      <label className="block text-xs font-semibold text-slate-600">Email address<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="field mt-1.5" placeholder="name@example.com"/></label>
      <label className="block text-xs font-semibold text-slate-600">Password<input required type="password" minLength={8} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} className="field mt-1.5" placeholder="At least 8 characters"/></label>
      {message&&<div role="status" className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{message}</div>}
      <button disabled={busy} className="btn-primary w-full !py-3 disabled:opacity-60">{busy?<LoaderCircle className="animate-spin" size={16}/>:null}{mode==='login'?'Sign in':'Create account'}</button>
    </form>
    {mode==='login'&&<div className="mt-3 text-right"><Link href="/forgot-password" className="text-[11px] font-semibold text-slate-500 underline underline-offset-4">Forgot password?</Link></div>}
    <p className="mt-6 text-center text-xs text-slate-500">{mode==='login'?"Don't have an account? ":'Already registered? '}<Link className="font-semibold text-slate-900 underline underline-offset-4" href={mode==='login'?'/register':'/login'}>{mode==='login'?'Create one':'Sign in'}</Link></p>
    <p className="mt-7 text-center text-[10px] leading-5 text-slate-400">Your financial records are private to your account. By continuing, you agree to the Terms and Privacy Policy.</p>
  </div>;
}
