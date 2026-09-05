import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await initDb();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'SELECT id, email, nickname, password_hash, chips, wins, losses, hoolas FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    const row = result.rows[0];
    const isMatch = await verifyPassword(password, row.password_hash as string);

    if (!isMatch) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }

    const user = {
      id: row.id as string,
      email: row.email as string,
      nickname: row.nickname as string,
      chips: Number(row.chips),
      wins: Number(row.wins || 0),
      losses: Number(row.losses || 0),
      hoolas: Number(row.hoolas || 0),
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
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || '로그인 실패' }, { status: 500 });
  }
}
