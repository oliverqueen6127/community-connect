import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { users: [], error: 'SUPABASE_SERVICE_KEY missing in server environment' },
      { status: 503 },
    );
  }

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    return NextResponse.json({ users: [], error: error.message }, { status: 500 });
  }

  const users = (data.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? '',
    name: (u.user_metadata?.full_name as string | undefined) ?? u.email?.split('@')[0] ?? 'Unknown',
    role: (u.user_metadata?.role as string | undefined) ?? 'user',
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at ?? null,
    emailConfirmed: !!u.email_confirmed_at,
  }));

  return NextResponse.json({ users });
}
