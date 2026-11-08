import { NextRequest, NextResponse } from 'next/server';
import { authContext, audit, serverError, validationError } from '@/lib/api';
import { transactionSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  const { supabase, user, response } = await authContext(); if (response || !user) return response!;
  const p = request.nextUrl.searchParams; let query = supabase.from('transactions').select('*').is('deleted_at', null).order('date', { ascending: false }).limit(500);
  const type = p.get('type'); const search = p.get('search'); const from = p.get('from'); const to = p.get('to');
  if (type && type !== 'all') query = query.eq('type', type);
  if (from) query = query.gte('date', from); if (to) query = query.lte('date', to);
  const safeSearch = (search ?? '').replace(/[\\%_(),]/g, ' ').trim().slice(0, 80);
  if (safeSearch) query = query.or(`category.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
  const { data, error } = await query; if (error) return serverError('Unable to load transactions.');
  return NextResponse.json(data ?? []);
}
export async function POST(request: NextRequest) {
  const { supabase, user, response } = await authContext(); if (response || !user) return response!;
  const body = await request.json().catch(() => null); const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) return validationError('Check the transaction details.', parsed.error.flatten());
  const { data: profile } = await supabase.from('profiles').select('currency').eq('id', user.id).maybeSingle();
  const recordCurrency = typeof body?.currency === 'string' ? body.currency : (profile?.currency ?? 'INR');
  const { data, error } = await supabase.from('transactions').insert({ ...parsed.data, currency: recordCurrency, user_id: user.id }).select('*').single();
  if (error) return validationError('Could not save transaction. Check the account and amount.');
  await audit(supabase, user.id, 'transaction.created', 'transaction', data.id);
  return NextResponse.json(data, { status: 201 });
}
