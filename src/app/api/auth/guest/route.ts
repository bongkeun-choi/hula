import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    await initDb();
    const body = await req.json().catch(() => ({}));
    const guestNumber = Math.floor(1000 + Math.random() * 9000);
    const nickname = body.nickname?.trim() || `훌라유저_${guestNumber}`;
    const guestId = `guest_${randomUUID()}`;
    const email = `${guestId}@guest.hoola.com`;
    const initialChips = 10000;

    await db.execute({
      sql: 'INSERT INTO users (id, email, nickname, password_hash, chips) VALUES (?, ?, ?, ?, ?)',
      args: [guestId, email, nickname, 'GUEST_NO_PASSWORD', initialChips],
    });

    const user = {
      id: guestId,
      email,
      nickname,
      chips: initialChips,
      wins: 0,
      losses: 0,
      hoolas: 0,
    };

    const token = signToken({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      chips: user.chips,
    });

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('hoola_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Guest login error:', error);
    return NextResponse.json({ error: error.message || '게스트 로그인 실패' }, { status: 500 });
  }
}
