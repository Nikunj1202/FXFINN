import { NextRequest, NextResponse } from 'next/server';
import { authContext, audit, serverError, validationError } from '@/lib/api';
import { liabilitySchema } from '@/lib/validators';
export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}) {
  const {id}=await context.params; const {supabase,user,response}=await authContext(); if(response||!user)return response!;
  const parsed=liabilitySchema.partial().safeParse(await request.json().catch(()=>null)); if(!parsed.success)return validationError('Check the liability details.',parsed.error.flatten());
  const {data,error}=await supabase.from('liabilities').update(parsed.data).eq('id',id).is('deleted_at',null).select('*').maybeSingle();
  if(error)return validationError('Could not update this liability.'); if(!data)return NextResponse.json({error:'Liability not found.'},{status:404});
  await audit(supabase,user.id,'liability.updated','liability',id); return NextResponse.json(data);
}
export async function DELETE(_request:NextRequest,context:{params:Promise<{id:string}>}) {
  const {id}=await context.params; const {supabase,user,response}=await authContext(); if(response||!user)return response!;
  const {data,error}=await supabase.from('liabilities').update({deleted_at:new Date().toISOString()}).eq('id',id).is('deleted_at',null).select('id').maybeSingle();
  if(error)return serverError('Could not delete liability.'); if(!data)return NextResponse.json({error:'Liability not found.'},{status:404});
  await audit(supabase,user.id,'liability.deleted','liability',id); return NextResponse.json({success:true});
}
