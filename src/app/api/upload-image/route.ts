import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_KEY missing in server environment' },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const userId = (formData.get('userId') as string | null) ?? 'mock-admin-1';
  const fileName = (formData.get('fileName') as string | null) ?? file?.name ?? 'upload';

  if (!file) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const path = `listings/${userId}/${Date.now()}-${fileName}`;
  console.log('[upload-image] IMAGE FILE', { name: file.name, size: file.size, type: file.type });
  console.log('[upload-image] UPLOAD PATH', path);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error } = await supabase.storage
    .from('listing-images')
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('[upload-image] UPLOAD ERROR', error.message, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('[upload-image] UPLOAD DATA', data);
  const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(data.path);
  console.log('[upload-image] PUBLIC URL', urlData.publicUrl);

  return NextResponse.json({ publicUrl: urlData.publicUrl });
}
