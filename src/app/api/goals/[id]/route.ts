import { NextRequest, NextResponse } from 'next/server';
import { authContext, audit, serverError, validationError } from '@/lib/api';
import { goalSchema } from '@/lib/validators';
export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}) {
  const {id}=await context.params; const {supabase,user,response}=await authContext(); if(response||!user)return response!;
  const parsed=goalSchema.partial().safeParse(await request.json().catch(()=>null)); if(!parsed.success)return validationError('Check the goal details.',parsed.error.flatten());
  const {data,error}=await supabase.from('goals').update(parsed.data).eq('id',id).is('deleted_at',null).select('*').maybeSingle();
  if(error)return validationError('Could not update this goal.'); if(!data)return NextResponse.json({error:'Goal not found.'},{status:404});
  await audit(supabase,user.id,'goal.updated','goal',id); return NextResponse.json(data);
}
export async function DELETE(_request:NextRequest,context:{params:Promise<{id:string}>}) {
  const {id}=await context.params; const {supabase,user,response}=await authContext(); if(response||!user)return response!;
  const {data,error}=await supabase.from('goals').update({deleted_at:new Date().toISOString()}).eq('id',id).is('deleted_at',null).select('id').maybeSingle();
  if(error)return serverError('Could not delete goal.'); if(!data)return NextResponse.json({error:'Goal not found.'},{status:404});
  await audit(supabase,user.id,'goal.deleted','goal',id); return NextResponse.json({success:true});
}
