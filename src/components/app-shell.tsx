'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { supabaseBrowser } from '@/components/auth-form';
import { LayoutDashboard, ArrowLeftRight, Wallet, CreditCard, ChartPie, Target, FileBarChart, Settings, LogOut, Menu, X, Plus, TrendingUp, CircleDollarSign } from 'lucide-react';

const nav = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Assets', href: '/assets', icon: Wallet },
  { label: 'Liabilities', href: '/liabilities', icon: CreditCard },
  { label: 'Allocation', href: '/allocation', icon: ChartPie },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'Reports', href: '/reports', icon: FileBarChart },
];
export function AppShell({ children, email }: { children: ReactNode; email: string }) {
  const pathname = usePathname(); const router = useRouter(); const [mobileOpen, setMobileOpen] = useState(false); const [quickAdd, setQuickAdd] = useState(false);
  const signOut = async () => { await supabaseBrowser().auth.signOut(); router.replace('/login'); router.refresh(); };
  const sidebar = <>
    <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[var(--navy)]"><TrendingUp size={20}/></div>
      <div><div className="text-[17px] font-bold tracking-[.11em] text-white">FXFINN</div><div className="text-[9px] uppercase tracking-[.22em] text-slate-400">Personal wealth</div></div>
    </div>
    <div className="px-4 pt-7 pb-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Workspace</div>
    <nav className="space-y-1 px-3">
      {nav.map(({ label, href, icon: Icon }) => { const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href)); return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon size={17} strokeWidth={1.8}/>{label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400"/>}</Link>; })}
    </nav>
    <div className="mt-auto p-4">
      <Link href="/settings" className={`mb-3 flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] ${pathname==='/settings'?'bg-white/10 text-white':'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Settings size={17}/>Settings</Link>
      <div className="rounded-xl border border-white/10 bg-white/[.04] p-3"><div className="truncate text-[12px] font-semibold text-slate-200">{email}</div><div className="mt-1 text-[10px] text-slate-500">Private workspace</div><button onClick={signOut} className="mt-3 flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-white"><LogOut size={14}/>Sign out</button></div>
    </div>
  </>;
  return <div className="min-h-screen md:flex">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[245px] flex-col bg-[var(--navy)] md:flex">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 md:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-slate-950/50" onClick={()=>setMobileOpen(false)}/><aside className="relative flex h-full w-[285px] flex-col bg-[var(--navy)]">{sidebar}</aside></div>}
    <main className="min-h-screen min-w-0 flex-1 md:ml-[245px]">
      <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-[var(--line)] bg-white/90 px-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-3"><button aria-label="Open navigation" onClick={()=>setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"><Menu size={19}/></button><div className="text-[12px] font-medium text-slate-500">Personal Finance <span className="mx-1.5 text-slate-300">/</span><span className="text-slate-800">{nav.find(n=>pathname===n.href || (n.href!='/dashboard'&&pathname.startsWith(n.href)))?.label ?? 'Settings'}</span></div></div>
        <div className="flex items-center gap-2"><span className="hidden text-[11px] text-slate-400 sm:inline">Your finances, in focus</span><button onClick={()=>setQuickAdd(v=>!v)} className="btn-primary !px-3 !py-2"><Plus size={15}/>Add new</button></div>
      </header>
      {quickAdd && <div className="fixed right-4 top-[58px] z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl md:right-8"><div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Create record</div>{[['Income','/transactions?new=income'],['Expense','/transactions?new=expense'],['Asset','/assets?new=1'],['Liability','/liabilities?new=1']].map(([label,href])=><Link key={label} href={href} onClick={()=>setQuickAdd(false)} className="block rounded-lg px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50">{label}</Link>)}</div>}
      <div className="mx-auto max-w-[1440px] px-4 py-6 pb-24 md:px-8 md:py-8">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-4px_20px_rgba(15,23,42,.04)] md:hidden">
        {[{label:'Home',href:'/dashboard',icon:LayoutDashboard},{label:'Activity',href:'/transactions',icon:ArrowLeftRight},{label:'Assets',href:'/assets',icon:Wallet},{label:'Goals',href:'/goals',icon:Target},{label:'More',href:'/settings',icon:CircleDollarSign}].map(({label,href,icon:Icon})=><Link key={href} href={href} className={`flex flex-col items-center gap-1 py-1 text-[10px] ${pathname.startsWith(href)?'text-[var(--navy)]':'text-slate-400'}`}><Icon size={19}/>{label}</Link>)}
      </nav>
    </main>
  </div>;
}
