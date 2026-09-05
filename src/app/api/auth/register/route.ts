import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    await initDb();
    const { email, password, nickname } = await req.json();

    if (!email || !password || !nickname) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
    }

    // 이메일 중복 체크
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 400 });
    }

    const userId = randomUUID();
    const passwordHash = await hashPassword(password);
    const initialChips = 10000;

    await db.execute({
      sql: 'INSERT INTO users (id, email, nickname, password_hash, chips) VALUES (?, ?, ?, ?, ?)',
      args: [userId, email.toLowerCase().trim(), nickname.trim(), passwordHash, initialChips],
    });

    const user = {
      id: userId,
      email: email.toLowerCase().trim(),
      nickname: nickname.trim(),
      chips: initialChips,
    };

    const token = signToken(user);

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('hoola_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || '회원가입 실패' }, { status: 500 });
  }
}
