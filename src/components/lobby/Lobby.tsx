'use client';

import React, { useState } from 'react';
import { Coins, Trophy, Plus, LogOut, ArrowRight, RefreshCw } from 'lucide-react';

interface LobbyProps {
  user: any;
  onJoinRoom: (roomId: string) => void;
  onStartSinglePlayer: () => void;
  onLogout: () => void;
}

export default function Lobby({ user, onJoinRoom, onStartSinglePlayer, onLogout }: LobbyProps) {
  const [inputRoomId, setInputRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 새로운 방 생성 (6자리 코드)
  const handleCreateRoom = () => {
    setIsCreating(true);
    const newRoomCode = Math.floor(100000 + Math.random() * 900000).toString();
    onJoinRoom(newRoomCode);
  };

  // 방 코드로 입장
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomId.trim()) return;
    onJoinRoom(inputRoomId.trim());
  };

  // 공개 추천 방 목록
  const publicRooms = ['훌라초보방-1', '보이스채팅방-2', '고수대전-3'];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col justify-between">
      {/* 상단 프로필 바 */}
      <header className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full flex items-center justify-center text-slate-950 font-black text-xl shadow">
              {user.nickname?.substring(0, 1) || '🎴'}
            </div>
            <div>
              <div className="font-bold text-base flex items-center gap-1.5">
                <span>{user.nickname}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold">
                  Lv.1
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Coins size={14} />
                  {Number(user.chips || 0).toLocaleString()} 칩
                </span>
                <span className="flex items-center gap-1">
                  <Trophy size={14} className="text-yellow-500" />
                  {user.wins || 0}승 {user.losses || 0}패
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="로그아웃"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* 중앙 액션: 혼자하기(AI) & 방 만들기 & 방 입장 */}
      <section className="my-6 space-y-3">
        {/* 혼자하기 (AI 대전) 버튼 */}
        <button
          onClick={onStartSinglePlayer}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all border border-amber-300/40"
        >
          <span className="text-2xl">🤖</span>
          <span>혼자하기 (AI 봇과 연습 대전)</span>
        </button>

        {/* 새 게임방 만들기 버튼 */}
        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Plus size={20} className="stroke-[3]" />
          <span>멀티 음성 게임방 만들기</span>
        </button>

        {/* 방 코드 입력 입장 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-400 mb-2">초대 코드(방 번호)로 입장</h3>
          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <input
              type="text"
              placeholder="방 번호 또는 방 이름"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-1 active:scale-95 transition-all shadow"
            >
              <span>입장</span>
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* 빠른 대전 채널 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400">공개 추천 대기방</h3>
            <span className="text-[11px] text-amber-400 flex items-center gap-1">
              <RefreshCw size={11} /> 실시간
            </span>
          </div>

          <div className="space-y-2">
            {publicRooms.map((room) => (
              <div
                key={room}
                onClick={() => onJoinRoom(room)}
                className="flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer active:scale-98 transition-all"
              >
                <div>
                  <div className="font-bold text-sm text-slate-200"># {room}</div>
                  <div className="text-[11px] text-slate-400">기본 판돈 1,000칩 • 2~4인 • 음성 통화 지원</div>
                </div>
                <button className="px-3 py-1.5 bg-slate-700 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs rounded-lg transition-colors">
                  참여
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 하단 훌라 게임 룰 안내 팁 */}
      <footer className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
        <div className="font-bold text-amber-400">💡 훌라 핵심 룰 안내:</div>
        <div>• <strong>7 카드</strong>는 1장만으로도 즉시 필드에 등록 가능합니다.</div>
        <div>• 같은 숫자 3장(트리플) 또는 같은 무늬 연속 3장(스트레이트) 등록 가능!</div>
        <div>• 한 번도 패를 안 내고 한 번에 다 털면 <strong>🌟훌라(2배 승리)</strong>!</div>
      </footer>
    </main>
  );
}
