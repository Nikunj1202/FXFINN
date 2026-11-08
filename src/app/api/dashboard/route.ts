import { NextResponse } from 'next/server';
import { authContext, serverError } from '@/lib/api';
import { calculateNetWorth, calculateSavingsRate, sumMoney } from '@/lib/finance';

export async function GET() {
  try {
    const { supabase, user, response } = await authContext(); if (response || !user) return response!;
    const { data: profile } = await supabase.from('profiles').select('currency,full_name,timezone').eq('id', user.id).maybeSingle();
    const currency = profile?.currency ?? 'INR';
    const [{ data: transactions, error: te }, { data: assets, error: ae }, { data: liabilities, error: le }, { data: goals }, { data: allocations }, { data: snapshots }, { data: accounts }, { data: wealthLevels }] = await Promise.all([
      supabase.from('transactions').select('date,type,amount,currency,category').eq('currency', currency).is('deleted_at', null).order('date', { ascending: true }),
      supabase.from('assets').select('id,name,category,current_value,purchase_value,currency').eq('currency', currency).is('deleted_at', null),
      supabase.from('liabilities').select('id,name,type,outstanding_amount,monthly_payment,currency').eq('currency', currency).is('deleted_at', null),
      supabase.from('goals').select('id,name,target_amount,current_amount,target_date,priority,currency').eq('currency', currency).is('deleted_at', null),
      supabase.from('allocations').select('category,percentage,sort_order').order('sort_order'),
      supabase.from('net_worth_snapshots').select('snapshot_date,net_worth,total_assets,total_liabilities').eq('currency', currency).order('snapshot_date', { ascending: false }).limit(24),
      supabase.from('accounts').select('id,name,type,current_balance,currency').eq('currency', currency).is('archived_at', null),
      supabase.from('wealth_levels').select('name,min_net_worth,color,sort_order').order('sort_order'),
    ]);
    if (te || ae || le) return serverError('Unable to load your financial dashboard.');
    const tx = transactions ?? []; const now = new Date();
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: profile?.timezone ?? 'Asia/Kolkata' }));
    const monthStart = new Date(localNow.getFullYear(), localNow.getMonth(), 1).toLocaleDateString('en-CA');
    const yearStart = new Date(localNow.getFullYear(), 0, 1).toLocaleDateString('en-CA');
    const monthTx = tx.filter(t => t.date >= monthStart);
    const yearTx = tx.filter(t => t.date >= yearStart);
    const income = (rows: any[]) => sumMoney(rows.filter(t => t.type === 'income').map(t => t.amount));
    const expense = (rows: any[]) => sumMoney(rows.filter(t => t.type === 'expense').map(t => t.amount));
    const totalAssets = sumMoney([...(assets ?? []).map((a: any) => a.current_value), ...(accounts ?? []).filter((a: any) => a.type !== 'credit_card').map((a: any) => a.current_balance)]);
    const totalLiabilities = sumMoney((liabilities ?? []).map((l: any) => l.outstanding_amount));
    const totalMonthlyPayment = sumMoney((liabilities ?? []).map((l: any) => l.monthly_payment));
    const assetTotals = (assets ?? []).reduce((acc: Record<string, number>, item: any) => { acc[item.category] = (acc[item.category] ?? 0) + Number(item.current_value); return acc; }, {});
    if ((accounts ?? []).length) assetTotals['Accounts'] = (accounts ?? []).filter((item: any) => item.type !== 'credit_card').reduce((sum: number, item: any) => sum + Number(item.current_balance), 0);
    const assetMix = Object.entries(assetTotals).map(([name, value]) => ({ name, value }));
    const expenseMix = Object.entries(monthTx.filter(t => t.type === 'expense').reduce((acc: Record<string, number>, item: any) => { acc[item.category] = (acc[item.category] ?? 0) + Number(item.amount); return acc; }, {})).map(([name, value]) => ({ name, value }));
    const monthlyIncome = income(monthTx); const monthlyExpenses = expense(monthTx);
    const netWorth = calculateNetWorth(totalAssets, totalLiabilities);
    const cashflowTrend = Array.from({ length: 6 }, (_, index) => { const d = new Date(localNow.getFullYear(), localNow.getMonth() - 5 + index, 1); const key = d.toLocaleDateString('en-CA'); const next = new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString('en-CA'); const rows = tx.filter(t => t.date >= key && t.date < next); const mIncome = income(rows); const mExpenses = expense(rows); return { month: d.toLocaleDateString('en-IN', { month: 'short' }), income: Number(mIncome), expenses: Number(mExpenses), savingsRate: calculateSavingsRate(mIncome, mExpenses) }; });
    const yearlyIncome = income(yearTx); const yearlyExpenses = expense(yearTx);
    return NextResponse.json({
      profile: { currency, fullName: profile?.full_name ?? user.email ?? '' },
      totals: { netWorth, totalAssets, totalLiabilities, monthlyIncome, monthlyExpenses, yearlyIncome, yearlyExpenses, savingsRate: calculateSavingsRate(monthlyIncome, monthlyExpenses), monthlyDebtPayment: totalMonthlyPayment },
      assets: assets ?? [], liabilities: liabilities ?? [], goals: goals ?? [], allocations: allocations ?? [], accounts: accounts ?? [], wealthLevels: wealthLevels ?? [],
      charts: { netWorth: snapshots ?? [], assetMix, expenseMix, cashflowTrend },
      recentTransactions: tx.slice(-8).reverse(),
      dataCoverage: { assets: (assets ?? []).length + (accounts ?? []).length, liabilities: (liabilities ?? []).length, transactions: tx.length },
    });
  } catch { return serverError(); }
}
