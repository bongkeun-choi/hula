import { NextResponse } from 'next/server';

// UptimeRobot 또는 외부 크론 서비스가 10분마다 호출하여 Render 무료 서버가 잠들지 않게(Keep-Alive) 하는 핑 엔드포인트
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    message: 'Hoola game server is alive!',
  });
}
