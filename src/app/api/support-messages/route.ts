import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupportMessage, SupportReply } from '@/lib/types';

interface DbSupportMessage {
  id: string; user_id: string | null; from_name: string; from_email: string;
  subject: string; message: string; status: 'unread' | 'read' | 'resolved';
  page: string; created_at: string;
}

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

function dbToMsg(row: DbSupportMessage): SupportMessage {
  return {
    id: row.id,
    fromUserId: row.user_id ?? undefined,
    fromUserName: row.from_name,
    fromUserEmail: row.from_email,
    subject: row.subject || undefined,
    content: row.message,
    timestamp: row.created_at,
    page: row.page || undefined,
    read: row.status !== 'unread',
  };
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

// GET — fetch all support messages + replies (admin only, service key)
export async function GET() {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_KEY missing', messages: [], replies: [] },
      { status: 503 },
    );
  }

  const [{ data: msgs, error: msgErr }, { data: reps, error: repErr }] = await Promise.all([
    supabase.from('support_messages').select('*').order('created_at', { ascending: false }),
    supabase.from('support_replies').select('*').order('created_at', { ascending: true }),
  ]);

  if (msgErr) console.error('[support-messages] GET error:', msgErr.message);
  if (repErr) console.error('[support-messages] GET replies error:', repErr.message);

  return NextResponse.json({
    messages: ((msgs ?? []) as DbSupportMessage[]).map(dbToMsg),
    replies: ((reps ?? []) as DbSupportReply[]).map(dbToReply),
  });
}

// PATCH — update support message status (read / resolved / unread)
export async function PATCH(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Service key missing' }, { status: 503 });

  const body = await req.json() as { id?: string; status?: string };
  const { id, status } = body;

  if (!id || !status || !['read', 'resolved', 'unread'].includes(status)) {
    return NextResponse.json({ error: 'Bad request — missing id or status' }, { status: 400 });
  }

  const { error } = await supabase.from('support_messages').update({ status }).eq('id', id);
  if (error) {
    console.error('[support-messages] PATCH error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE — delete a support message (cascades to replies)
export async function DELETE(req: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Service key missing' }, { status: 503 });

  const body = await req.json() as { id?: string };
  const { id } = body;

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase.from('support_messages').delete().eq('id', id);
  if (error) {
    console.error('[support-messages] DELETE error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
