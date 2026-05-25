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

  if (!url || !serviceKey) {
    console.error('ADMIN API INSERT ERROR: SUPABASE_SERVICE_KEY missing in server environment');
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET() {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_KEY missing in server environment', items: [] },
      { status: 503 },
    );
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
      if (error) {
        console.error(`[admin-listing] GET ${table} error:`, error.message);
      } else {
        entries.push({ type, rows: (data ?? []) as Record<string, unknown>[] });
      }
    })
  );

  return NextResponse.json({ items: entries });
}

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_KEY missing in server environment' },
      { status: 503 },
    );
  }

  const body = await req.json() as { type?: unknown; row?: unknown };
  const { type, row } = body;

  if (typeof type !== 'string' || !TABLE_MAP[type as ListingType] || !row || typeof row !== 'object') {
    return NextResponse.json({ error: 'Bad request — missing type or row.' }, { status: 400 });
  }

  const table = TABLE_MAP[type as ListingType];
  console.log('ADMIN API PAYLOAD', { type, table, row });
  console.log('ADMIN API INSERT DATA', row);

  const { error } = await supabase.from(table).insert(row);

  if (error) {
    console.error('ADMIN API INSERT ERROR', error.code, error.message, error.details);
    return NextResponse.json(
      { error: `${error.code}: ${error.message}${error.hint ? ' — ' + error.hint : ''}` },
      { status: 500 },
    );
  }

  console.log('ADMIN API INSERT DATA success — table:', table);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_KEY missing in server environment' },
      { status: 503 },
    );
  }

  const body = await req.json() as { type?: unknown; id?: unknown; status?: unknown };
  const { type, id, status } = body;

  if (
    typeof type !== 'string' || !TABLE_MAP[type as ListingType] ||
    typeof id !== 'string' ||
    typeof status !== 'string' || !['active', 'pending', 'rejected'].includes(status)
  ) {
    return NextResponse.json({ error: 'Bad request — missing type, id, or status.' }, { status: 400 });
  }

  const table = TABLE_MAP[type as ListingType];
  const { error } = await supabase.from(table).update({ status }).eq('id', id);

  if (error) {
    console.error('[admin-listing] PATCH error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_KEY missing in server environment' },
      { status: 503 },
    );
  }

  const body = await req.json() as { type?: unknown; id?: unknown };
  const { type, id } = body;

  if (typeof type !== 'string' || !TABLE_MAP[type as ListingType] || typeof id !== 'string') {
    return NextResponse.json({ error: 'Bad request — missing type or id.' }, { status: 400 });
  }

  const table = TABLE_MAP[type as ListingType];

  // Fetch image URLs before deleting so we can clean up Storage
  const { data: row } = await supabase
    .from(table)
    .select('image_url, logo_url, images')
    .eq('id', id)
    .maybeSingle();

  // Delete the DB row
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error('[admin-listing] DELETE error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Delete Storage images that belong to our bucket
  if (row) {
    const imageUrls: string[] = [];
    if (typeof row.image_url === 'string' && row.image_url) imageUrls.push(row.image_url);
    if (typeof row.logo_url === 'string' && row.logo_url) imageUrls.push(row.logo_url);
    if (Array.isArray(row.images)) {
      for (const img of row.images as unknown[]) {
        if (typeof img === 'string' && img) imageUrls.push(img);
      }
    }

    const paths = imageUrls
      .filter((url) => url.includes('/listing-images/'))
      .map((url) => url.split('/listing-images/')[1])
      .filter(Boolean);

    if (paths.length > 0) {
      const { error: storageErr } = await supabase.storage.from('listing-images').remove(paths);
      if (storageErr) console.error('[admin-listing] Storage delete error:', storageErr.message);
      else console.log('[admin-listing] deleted Storage images:', paths);
    }
  }

  return NextResponse.json({ ok: true });
}
