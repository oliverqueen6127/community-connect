import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type ListingType = 'business' | 'event' | 'housing' | 'job';
type DbTable = 'businesses' | 'events' | 'housing' | 'jobs';

const TABLE_MAP: Record<ListingType, DbTable> = {
  business: 'businesses',
  event: 'events',
  housing: 'housing',
  job: 'jobs',
};

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
    return NextResponse.json({ items: [] });
  }

  const entries: Array<{ type: ListingType; rows: Record<string, unknown>[] }> = [];
  const types: ListingType[] = ['business', 'event', 'housing', 'job'];

  await Promise.all(
    types.map(async (type) => {
      const table = TABLE_MAP[type];
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        entries.push({ type, rows: data as Record<string, unknown>[] });
      }
    })
  );

  return NextResponse.json({ items: entries });
}

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service key not configured.' }, { status: 503 });
  }

  const body = await req.json() as { type?: unknown; row?: unknown };
  const { type, row } = body;

  if (typeof type !== 'string' || !TABLE_MAP[type as ListingType] || !row || typeof row !== 'object') {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }

  const table = TABLE_MAP[type as ListingType];
  const { error } = await supabase.from(table).insert(row);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service key not configured.' }, { status: 503 });
  }

  const body = await req.json() as { type?: unknown; id?: unknown };
  const { type, id } = body;

  if (typeof type !== 'string' || !TABLE_MAP[type as ListingType] || typeof id !== 'string') {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }

  const table = TABLE_MAP[type as ListingType];
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
