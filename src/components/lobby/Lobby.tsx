'use client';

import React, { useState } from 'react';
import { Coins, Trophy, Plus, LogOut, ArrowRight, RefreshCw, Volume2, VolumeX, Users, X } from 'lucide-react';
import { sound } from '@/lib/sound';

export interface ActiveRoomInfo {
  roomId: string;
  playerCount: number;
  status: 'WAITING' | 'PLAYING' | 'ENDED';
  hostNickname: string;
}

interface LobbyProps {
  user: any;
  activeRooms: ActiveRoomInfo[];
  onRefreshRooms: () => void;
  onJoinRoom: (roomId: string) => void;
  onStartSinglePlayer: () => void;
  onLogout: () => void;
}

export default function Lobby({
  user,
  activeRooms = [],
  onRefreshRooms,
  onJoinRoom,
  onStartSinglePlayer,
  onLogout,
}: LobbyProps) {
  const [inputRoomId, setInputRoomId] = useState('');
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  // 사운드 토글 & 테스트 재생
  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setIsSoundOn(next);
    if (next) {
      sound.playMeld();
    }
  };

  // 새로운 방 생성 확정
  const handleConfirmCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playCardDraw();
    const finalRoomId = newRoomName.trim() || Math.floor(100000 + Math.random() * 900000).toString();
    setShowCreateModal(false);
    setNewRoomName('');
    onJoinRoom(finalRoomId);
  };

  // 방 코드로 직접 입장
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomId.trim()) return;
    sound.playCardSelect();
    onJoinRoom(inputRoomId.trim());
  };

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
          <div className="flex items-center gap-1.5">
            {/* 효과음 On/Off & 소리 테스트 버튼 */}
            <button
              onClick={handleToggleSound}
              title={isSoundOn ? '효과음 켜짐 (클릭하여 테스트)' : '효과음 꺼짐'}
              className={`p-2 rounded-xl border transition-all ${
                isSoundOn
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {isSoundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              onClick={onLogout}
              title="로그아웃"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* 중앙 액션: 혼자하기(AI) & 방 만들기 & 방 입장 */}
      <section className="my-6 space-y-3">
        {/* 혼자하기 (AI 대전) 버튼 */}
        <button
          onClick={() => {
            sound.playCardDraw();
            onStartSinglePlayer();
          }}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all border border-amber-300/40"
        >
          <span className="text-2xl">🤖</span>
          <span>혼자하기 (AI 봇과 연습 대전)</span>
        </button>

        {/* 새 게임방 만들기 버튼 */}
        <button
          onClick={() => {
            sound.playCardSelect();
            setShowCreateModal(true);
          }}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Plus size={20} className="stroke-[3]" />
          <span>+ 멀티 음성 게임방 만들기</span>
        </button>

        {/* 방 코드/이름 직접 입력 입장 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-400 mb-2">초대 코드(방 번호)로 입장</h3>
          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <input
              type="text"
              placeholder="방 번호 또는 방 이름"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-white placeholder-slate-500"
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

        {/* 현재 열려있는 실시간 실제 대기방 목록 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-300">현재 열려있는 방</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded-full">
                {activeRooms.length}개
              </span>
            </div>
            <button
              onClick={() => {
                sound.playCardSelect();
                onRefreshRooms();
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={11} /> 새로고침
            </button>
          </div>

          {activeRooms.length === 0 ? (
            <div className="text-center py-6 px-2 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <div className="text-2xl mb-1.5">🎴</div>
              <p className="text-xs font-bold text-slate-300 mb-1">현재 열려있는 방이 없습니다</p>
              <p className="text-[11px] text-slate-500">
                위의 <strong>[+ 멀티 음성 게임방 만들기]</strong>를 눌러 첫 번째 방을 개설해보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {activeRooms.map((room) => (
                <div
                  key={room.roomId}
                  onClick={() => {
                    sound.playCardSelect();
                    onJoinRoom(room.roomId);
                  }}
                  className="flex items-center justify-between p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer active:scale-98 transition-all"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <span># {room.roomId}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          room.status === 'WAITING'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {room.status === 'WAITING' ? '대기중' : '게임중'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>방장: {room.hostNickname}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-amber-300 font-semibold">
                        <Users size={11} /> {room.playerCount}/4인
                      </span>
                    </div>
                  </div>
                  <button className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow">
                    {room.status === 'WAITING' ? '참여' : '관전'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 하단 훌라 게임 룰 안내 팁 */}
      <footer className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
        <div className="font-bold text-amber-400">💡 훌라 핵심 룰 안내:</div>
        <div>• <strong>7 카드</strong>는 1장만으로도 즉시 필드에 등록 가능합니다.</div>
        <div>• 같은 숫자 3장(트리플) 또는 같은 무늬 연속 3장(스트레이트) 등록 가능!</div>
        <div>• 한 번도 패를 안 내고 한 번에 다 털면 <strong>🌟훌라(2배 승리)</strong>!</div>
      </footer>

      {/* 방 만들기 팝업 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base text-amber-400 flex items-center gap-1.5">
                <span>🎴</span>
                <span>새 게임방 개설</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmCreateRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  방 이름 또는 번호
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="예: 타짜들의방 (비워두면 자동)"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-amber-500 text-white placeholder-slate-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-800/50 p-2.5 rounded-xl">
                • 방을 만들면 실시간으로 로비 목록에 공개됩니다.<br />
                • 최대 4명까지 실시간 음성 대화하며 함께 즐길 수 있습니다.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs shadow-lg"
                >
                  방 개설하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
