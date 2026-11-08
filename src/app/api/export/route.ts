import { NextResponse } from 'next/server';
import { authContext, serverError, audit } from '@/lib/api';

export async function GET() {
  const { supabase, user, response } = await authContext();
  if (response || !user) return response!;
  const tables: [string, string][] = [
    ['profiles', 'id'], ['accounts', 'id'], ['transactions', 'id'], ['assets', 'id'], ['liabilities', 'id'],
    ['goals', 'id'], ['allocations', 'id'], ['wealth_levels', 'id'], ['achievement_definitions', 'id'],
    ['user_achievements', 'id'], ['net_worth_snapshots', 'id'], ['reports', 'id'], ['settings', 'user_id'], ['audit_logs', 'id'],
  ];
  try {
    const values = await Promise.all(tables.map(async ([table, primaryKey]) => {
      const rows: unknown[] = [];
      const pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase.from(table).select('*').order(primaryKey, { ascending: true }).range(offset, offset + pageSize - 1);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < pageSize) break;
      }
      return [table, rows] as const;
    }));
    const payload = { application: 'FXFINN', exportedAt: new Date().toISOString(), userId: user.id, data: Object.fromEntries(values) };
    await audit(supabase, user.id, 'data.exported', 'account');
    const filename = `fxfinn-backup-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' },
    });
  } catch {
    return serverError('Unable to create your data export.');
  }
}
