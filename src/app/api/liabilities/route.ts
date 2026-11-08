import { NextRequest, NextResponse } from 'next/server';
import { authContext, audit, serverError, validationError } from '@/lib/api';
import { liabilitySchema } from '@/lib/validators';
export async function GET() {
  const {supabase,user,response}=await authContext(); if(response||!user)return response!;
  const {data,error}=await supabase.from('liabilities').select('*').is('deleted_at',null).order('created_at',{ascending:false});
  if(error)return serverError('Unable to load liabilities.'); return NextResponse.json(data??[]);
}
export async function POST(request:NextRequest) {
  const {supabase,user,response}=await authContext(); if(response||!user)return response!;
  const body=await request.json().catch(()=>null); const parsed=liabilitySchema.safeParse(body); if(!parsed.success)return validationError('Check the liability details.',parsed.error.flatten());
  const {data:profile}=await supabase.from('profiles').select('currency').eq('id',user.id).maybeSingle(); const recordCurrency=typeof (body as any)?.currency==='string'?(body as any).currency:(profile?.currency??'INR');
  const {data,error}=await supabase.from('liabilities').insert({...parsed.data,currency:recordCurrency,user_id:user.id}).select('*').single();
  if(error)return validationError('Could not save this liability.'); await audit(supabase,user.id,'liability.created','liability',data.id); return NextResponse.json(data,{status:201});
}
