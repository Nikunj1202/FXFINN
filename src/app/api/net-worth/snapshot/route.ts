import {NextResponse} from 'next/server';
import {authContext,serverError} from '@/lib/api';
import {sumMoney,calculateNetWorth} from '@/lib/finance';
export async function POST(){
 const {supabase,user,response}=await authContext();if(response||!user)return response!;
 const {data:profile}=await supabase.from('profiles').select('currency,timezone').eq('id',user.id).maybeSingle();const currency=profile?.currency??'INR';
 const [{data:assets,error:ae},{data:accounts,error:ce},{data:liabilities,error:le}]=await Promise.all([
  supabase.from('assets').select('current_value').eq('currency',currency).is('deleted_at',null),
  supabase.from('accounts').select('current_balance,type').eq('currency',currency).is('archived_at',null),
  supabase.from('liabilities').select('outstanding_amount').eq('currency',currency).is('deleted_at',null),
 ]);
 if(ae||ce||le)return serverError('Unable to create a net worth snapshot.');
 if(!(assets?.length||accounts?.length||liabilities?.length))return NextResponse.json({created:false,reason:'No balance records yet.'});
 const totalAssets=sumMoney([...(assets??[]).map((x:any)=>x.current_value),...(accounts??[]).filter((x:any)=>x.type!=='credit_card').map((x:any)=>x.current_balance)]);
 const totalLiabilities=sumMoney((liabilities??[]).map((x:any)=>x.outstanding_amount));
 const snapshot={user_id:user.id,snapshot_date:new Date().toLocaleDateString('en-CA',{timeZone:profile?.timezone??'Asia/Kolkata'}),total_assets:totalAssets,total_liabilities:totalLiabilities,net_worth:calculateNetWorth(totalAssets,totalLiabilities),currency};
 const {error}=await supabase.from('net_worth_snapshots').upsert(snapshot,{onConflict:'user_id,snapshot_date,currency'});
 if(error)return serverError('Unable to save net worth history.');return NextResponse.json({created:true,snapshot_date:snapshot.snapshot_date});
}
