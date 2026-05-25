import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupportReply } from '@/lib/types';

interface DbSupportReply {
  id: string; support_message_id: string; sender_role: 'admin' | 'user';
  sender_id: string | null; sender_name: string; message: string;
  read: boolean; created_at: string;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function dbToReply(row: DbSupportReply): SupportReply {
  return {
    id: row.id,
    supportMessageId: row.support_message_id,
    senderRole: row.sender_role,
    senderId: row.sender_id ?? undefined,
    senderName: row.sender_name,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
  };
}

// POST — admin sends a reply to a support message (service key, no JWT needed)
export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_KEY missing in server environment' },
      { status: 503 },
    );
  }

  const body = await req.json() as { supportMessageId?: string; message?: string };
  const { supportMessageId, message } = body;

  if (!supportMessageId || !message?.trim()) {
    return NextResponse.json(
      { error: 'Bad request — missing supportMessageId or message' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('support_replies')
    .insert({
      support_message_id: supportMessageId,
      sender_role: 'admin',
      sender_id: 'mock-admin-1',
      sender_name: 'Community Connect Admin',
      message: message.trim(),
      read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[support-reply] POST error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark the original message as read
  await supabase.from('support_messages').update({ status: 'read' }).eq('id', supportMessageId);

  return NextResponse.json({ reply: dbToReply(data as DbSupportReply) });
}
