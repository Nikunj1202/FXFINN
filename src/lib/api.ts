import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '@/lib/supabase/server';

export async function authContext() {
  const context = await getAuthenticatedClient();
  if (!context.user) return { ...context, response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  return { ...context, response: null };
}
export function validationError(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}
export function serverError(message = 'Something went wrong. Please try again.') {
  return NextResponse.json({ error: message }, { status: 500 });
}
export async function audit(supabase: any, userId: string, eventType: string, entityType: string, entityId?: string) {
  await supabase.from('audit_logs').insert({ user_id: userId, event_type: eventType, entity_type: entityType, entity_id: entityId ?? null });
}
