import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { username?: unknown; password?: unknown };
    const { username, password } = body;

    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials not configured on the server.' },
        { status: 500 }
      );
    }

    if (
      username.toLowerCase().trim() === adminUsername.toLowerCase() &&
      password === adminPassword
    ) {
      const adminUser: User = {
        id: 'mock-admin-1',
        name: 'Administrator',
        email: 'admin@communityconnect.local',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };

      // If ADMIN_SUPABASE_EMAIL is set, pass it to the client so it can get
      // a real Supabase JWT — required for Supabase RLS INSERT/SELECT policies.
      const supabaseEmail = process.env.ADMIN_SUPABASE_EMAIL ?? null;

      return NextResponse.json({ user: adminUser, supabaseEmail });
    }

    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
}
