import { NextRequest, NextResponse } from 'next/server';
import { authContext, audit, serverError, validationError } from '@/lib/api';
import { assetSchema } from '@/lib/validators';
export async function PATCH(request: NextRequest, context: { params: Promise<{id:string}> }) {
  const {id}=await context.params; const {supabase,user,response}=await authContext(); if(response||!user)return response!;
  const parsed=assetSchema.partial().safeParse(await request.json().catch(()=>null)); if(!parsed.success)return validationError('Check the asset details.',parsed.error.flatten());
  const {data,error}=await supabase.from('assets').update(parsed.data).eq('id',id).is('deleted_at',null).select('*').maybeSingle();
  if(error)return validationError('Could not update this asset.'); if(!data)return NextResponse.json({error:'Asset not found.'},{status:404});
  await audit(supabase,user.id,'asset.updated','asset',id); return NextResponse.json(data);
}
export async function DELETE(_request:NextRequest,context:{params:Promise<{id:string}>}) {
  const {id}=await context.params; const {supabase,user,response}=await authContext(); if(response||!user)return response!;
  const {data,error}=await supabase.from('assets').update({deleted_at:new Date().toISOString()}).eq('id',id).is('deleted_at',null).select('id').maybeSingle();
  if(error)return serverError('Could not delete this asset.'); if(!data)return NextResponse.json({error:'Asset not found.'},{status:404});
  await audit(supabase,user.id,'asset.deleted','asset',id); return NextResponse.json({success:true});
}
