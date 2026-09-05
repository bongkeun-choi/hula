import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const cookieStore = await cookies();
    const token = cookieStore.get('hoola_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    const result = await db.execute({
      sql: 'SELECT id, email, nickname, chips, wins, losses, hoolas FROM users WHERE id = ?',
      args: [payload.id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ user: null });
    }

    const row = result.rows[0];
    const user = {
      id: row.id as string,
      email: row.email as string,
      nickname: row.nickname as string,
      chips: Number(row.chips),
      wins: Number(row.wins || 0),
      losses: Number(row.losses || 0),
      hoolas: Number(row.hoolas || 0),
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ user: null });
  }
}
