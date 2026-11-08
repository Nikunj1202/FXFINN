import { NextRequest, NextResponse } from 'next/server';
import { authContext, serverError, validationError } from '@/lib/api';
import { allocationSchema } from '@/lib/validators';
export async function GET() {
  const {supabase,user,response}=await authContext(); if(response||!user)return response!;
  const {data,error}=await supabase.from('allocations').select('id,category,percentage,sort_order').order('sort_order');
  if(error)return serverError('Unable to load allocation plan.'); return NextResponse.json(data??[]);
}
export async function PUT(request:NextRequest) {
  const {supabase,user,response}=await authContext(); if(response||!user)return response!;
  const parsed=allocationSchema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return validationError('Allocation percentages must total exactly 100%.',parsed.error.flatten());
  const {error}=await supabase.rpc('replace_allocations',{p_items:parsed.data});
  if(error)return validationError('Could not save the allocation plan. Confirm the percentages total 100%.');
  return NextResponse.json({success:true,items:parsed.data});
}
