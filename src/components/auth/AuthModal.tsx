'use client';

import React, { useState } from 'react';
import { User, LogIn, UserPlus, Zap } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: any) => void;
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'guest' | 'login' | 'register'>('guest');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 게스트 즉시 플레이
  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 로그인 / 회원가입
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-amber-500/20 rounded-2xl mb-2 text-amber-400">
            <span className="text-3xl">🎴</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">온라인 보이스 훌라</h2>
          <p className="text-xs text-slate-400 mt-1">친구들과 실시간 음성 대화하며 즐기는 한국 카드게임</p>
        </div>

        {/* 탭 전환 */}
        <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('guest')}
            className={`py-2 rounded-lg transition-all ${
              mode === 'guest' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            빠른 시작
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            회원가입
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {mode === 'guest' ? (
          <form onSubmit={handleGuestLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">사용할 닉네임</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="예: 훌라타짜 (비워두면 자동생성)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-amber-500 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm shadow-lg flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
            >
              <Zap size={16} />
              <span>{loading ? '접속 중...' : '게스트로 바로 플레이 (10,000칩)'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">닉네임</label>
                <input
                  type="text"
                  required
                  placeholder="닉네임을 입력하세요"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500 text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">이메일</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">비밀번호</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow-lg flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
            >
              {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              <span>{loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입 완료'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
