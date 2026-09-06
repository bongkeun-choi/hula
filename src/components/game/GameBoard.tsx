'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { LogOut, Volume2, VolumeX, Sparkles, Check, ArrowDown, HelpCircle } from 'lucide-react';
import { GameState, Player, Card, Meld } from '@/lib/hoola/types';
import { validateMeld, canAttachCard, calculateHandScore, sortCards } from '@/lib/hoola/rules';
import { sound } from '@/lib/sound';
import PlayingCard from './PlayingCard';
import VoiceChat from '../voice/VoiceChat';

interface GameBoardProps {
  socket: Socket | null;
  gameState: GameState;
  currentUser: any;
  onLeaveRoom: () => void;
}

export default function GameBoard({
  socket,
  gameState,
  currentUser,
  onLeaveRoom,
}: GameBoardProps) {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [sortType, setSortType] = useState<'RANK' | 'SUIT'>('RANK');
  const [speakingPlayers, setSpeakingPlayers] = useState<Set<string>>(new Set());
  const [targetMeldForAttach, setTargetMeldForAttach] = useState<string | null>(null);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const prevIsTurnRef = useRef<boolean>(false);

  // 내 플레이어 객체
  const me: Player | undefined = useMemo(() => {
    return gameState.players.find((p) => p.id === currentUser.id);
  }, [gameState.players, currentUser.id]);

  // 내 턴 전환 감지 및 효과음 재생
  useEffect(() => {
    if (me?.isTurn && !prevIsTurnRef.current && gameState.status === 'PLAYING') {
      sound.playMyTurn();
    }
    prevIsTurnRef.current = !!me?.isTurn;
  }, [me?.isTurn, gameState.status]);

  // 다른 플레이어 목록
  const otherPlayers: Player[] = useMemo(() => {
    return gameState.players.filter((p) => p.id !== currentUser.id);
  }, [gameState.players, currentUser.id]);

  // 내 정렬된 손패
  const sortedCards = useMemo(() => {
    if (!me?.cards) return [];
    return sortCards(me.cards, sortType);
  }, [me?.cards, sortType]);

  // 선택된 카드들
  const selectedCards = useMemo(() => {
    if (!me?.cards) return [];
    return me.cards.filter((c) => selectedCardIds.includes(c.id));
  }, [me?.cards, selectedCardIds]);

  // 선택된 카드가 유효한 등록(Meld)인지 여부
  const meldValidation = useMemo(() => {
    return validateMeld(selectedCards);
  }, [selectedCards]);

  // 승리/패배 발생 시 콘페티(폭죽) 및 효과음
  useEffect(() => {
    if (gameState.status === 'ENDED' && gameState.winner) {
      if (gameState.winner.player.id === currentUser.id) {
        if (gameState.winner.type === 'HOOLA') {
          sound.playHoolaWin();
        } else {
          sound.playWin();
        }
      } else {
        sound.playLose();
      }

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [gameState.status, gameState.winner, currentUser.id]);

  // 발언 상태 소켓 리스너
  useEffect(() => {
    if (!socket) return;
    const handleSpeakingChange = ({ userId, isSpeaking }: { userId: string; isSpeaking: boolean }) => {
      setSpeakingPlayers((prev) => {
        const next = new Set(prev);
        if (isSpeaking) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    socket.on('player_speaking_changed', handleSpeakingChange);
    return () => {
      socket.off('player_speaking_changed', handleSpeakingChange);
    };
  }, [socket]);

  // 카드 선택 토글
  const toggleCardSelect = (cardId: string) => {
    sound.playCardSelect();
    setSelectedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  };

  // 사운드 토글
  const handleToggleSound = () => {
    const newState = sound.toggleSound();
    setIsSoundOn(newState);
    if (newState) {
      sound.playMeld();
    }
  };

  // 소켓 액션 전송
  const handleToggleReady = () => {
    sound.playCardSelect();
    socket?.emit('toggle_ready');
  };

  const handleDrawCard = (fromDiscard: boolean) => {
    sound.playCardDraw();
    socket?.emit('draw_card', { fromDiscard });
    setSelectedCardIds([]);
  };

  const handleRegisterMeld = () => {
    if (!meldValidation.valid) return;
    sound.playMeld();
    socket?.emit('register_meld', { cardIds: selectedCardIds });
    setSelectedCardIds([]);
  };

  const handleAttachCard = (meldId: string) => {
    if (selectedCardIds.length !== 1) return;
    sound.playAttach();
    socket?.emit('attach_card', { meldId, cardId: selectedCardIds[0] });
    setSelectedCardIds([]);
    setTargetMeldForAttach(null);
  };

  const handleDiscardCard = () => {
    if (selectedCardIds.length !== 1) return;
    sound.playCardDiscard();
    socket?.emit('discard_card', { cardId: selectedCardIds[0] });
    setSelectedCardIds([]);
  };

  const handleCallStop = () => {
    if (confirm('스톱을 선언하시겠습니까? (다른 플레이어보다 점수가 높으면 바가지 독박)')) {
      sound.playStopAlert();
      socket?.emit('call_stop');
    }
  };

  // 붙이기 가능한 필드 패 검사 (내가 선택한 카드가 1장일 때)
  const isCardAttachableToMeld = (meld: Meld) => {
    if (selectedCards.length !== 1) return false;
    return canAttachCard(meld, selectedCards[0]).canAttach;
  };

  const myHandScore = me ? calculateHandScore(me.cards) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none max-w-lg mx-auto pb-4 px-2">
      {/* 1. 상단 바: 방 번호, 음성 채팅 컨트롤, 효과음 토글, 나가기 */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-black text-amber-400 text-sm"># {gameState.roomId}</span>
          <span className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full font-semibold">
            {gameState.status === 'WAITING' ? '대기실' : '게임 진행 중'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 게임 효과음 On/Off 버튼 */}
          <button
            onClick={handleToggleSound}
            className={`p-1.5 rounded-lg border transition-colors ${
              isSoundOn
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={isSoundOn ? '효과음 켜짐' : '효과음 꺼짐'}
          >
            {isSoundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* WebRTC 음성 채팅 버튼 */}
          <VoiceChat
            socket={socket}
            roomId={gameState.roomId}
            userId={currentUser.id}
            nickname={currentUser.nickname}
            speakingPlayers={speakingPlayers}
          />

          <button
            onClick={onLeaveRoom}
            className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 rounded-lg transition-colors"
            title="방 나가기"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* 2. 다른 플레이어들 (상단 배치) */}
      <div className="grid grid-cols-3 gap-2 py-2">
        {otherPlayers.map((player) => {
          const isSpeaking = speakingPlayers.has(player.id);
          return (
            <div
              key={player.id}
              className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                player.isTurn
                  ? 'bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              {/* 아바타 (말할 때 초록색 펄스 링!) */}
              <div className="relative mb-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-800 border-2 ${
                    isSpeaking
                      ? 'border-emerald-400 ring-4 ring-emerald-500/50 animate-pulse'
                      : 'border-slate-700'
                  }`}
                >
                  {player.nickname.substring(0, 1)}
                </div>
                {player.isTurn && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded-full animate-bounce">
                    턴
                  </span>
                )}
              </div>

              <span className="text-xs font-bold text-slate-200 truncate max-w-[80px]">
                {player.nickname}
              </span>

              {/* 남은 카드 장수 뒷면 미니 뱃지 */}
              {gameState.status === 'PLAYING' ? (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-300 font-bold bg-slate-800/80 px-2 py-0.5 rounded-full">
                  <span>🎴</span>
                  <span>{player.cards.length}장</span>
                </div>
              ) : (
                <span
                  className={`text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded ${
                    player.isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {player.isReady ? '준비완료' : '대기중'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. 중앙 게임 필드 */}
      <div className="flex-1 flex flex-col justify-center my-2 min-h-[220px] bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-3 backdrop-blur-sm relative overflow-hidden">
        {gameState.status === 'WAITING' ? (
          /* 대기실 화면 */
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="text-4xl mb-2">🎴</div>
            <h3 className="text-lg font-black text-amber-400 mb-1">대기실에서 플레이어를 기다리는 중</h3>
            <p className="text-xs text-slate-400 mb-6">
              최소 2명 이상 [준비 완료]를 누르면 게임이 바로 시작됩니다! (현재 {gameState.players.length}/4인)
            </p>

            <button
              onClick={handleToggleReady}
              className={`px-8 py-3.5 rounded-2xl font-black text-base shadow-xl flex items-center gap-2 active:scale-95 transition-all ${
                me?.isReady
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
              }`}
            >
              <Check size={20} className="stroke-[3]" />
              <span>{me?.isReady ? '준비 취소' : '게임 준비 (READY)'}</span>
            </button>
          </div>
        ) : (
          /* 인게임 필드: 덱 / 버린패 / 등록된 패 영역 */
          <div className="flex flex-col h-full justify-between">
            {/* 덱 & 버린 카드 더미 */}
            <div className="flex items-center justify-center gap-6 py-2 border-b border-emerald-800/30">
              {/* 1) 카드 뽑는 덱 */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-emerald-300 font-bold mb-1">덱 ({gameState.deck.length}장)</span>
                <PlayingCard
                  isFaceDown
                  size="md"
                  onClick={() => me?.isTurn && !me?.hasDrawn && handleDrawCard(false)}
                  className={me?.isTurn && !me?.hasDrawn ? 'ring-2 ring-yellow-400 animate-pulse cursor-pointer' : ''}
                />
              </div>

              {/* 2) 버린 카드 더미 */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold mb-1">버린 패</span>
                {gameState.discardPile.length > 0 ? (
                  <PlayingCard
                    card={gameState.discardPile[gameState.discardPile.length - 1]}
                    size="md"
                    onClick={() => me?.isTurn && !me?.hasDrawn && handleDrawCard(true)}
                    className={me?.isTurn && !me?.hasDrawn ? 'ring-2 ring-emerald-400 animate-pulse cursor-pointer' : ''}
                  />
                ) : (
                  <div className="w-14 h-20 border border-dashed border-slate-700 rounded-lg flex items-center justify-center text-xs text-slate-600">
                    비었음
                  </div>
                )}
              </div>
            </div>

            {/* 필드 등록 패 (Melds) 목록 */}
            <div className="flex-1 py-2 overflow-y-auto max-h-[160px]">
              <div className="text-[10px] text-emerald-400 font-bold mb-1.5 flex items-center justify-between">
                <span>필드 등록 패 ({gameState.registeredMelds.length}세트)</span>
                <span className="text-[9px] text-slate-400">카드를 선택 후 필드 세트를 탭하여 붙이기</span>
              </div>

              {gameState.registeredMelds.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  아직 필드에 등록된 패가 없습니다. 7이나 트리플, 스트레이트를 등록해보세요!
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {gameState.registeredMelds.map((meld) => {
                    const attachable = isCardAttachableToMeld(meld);
                    return (
                      <div
                        key={meld.id}
                        onClick={() => attachable && handleAttachCard(meld.id)}
                        className={`flex items-center -space-x-4 bg-slate-900/80 p-1.5 rounded-xl border transition-all ${
                          attachable
                            ? 'border-emerald-400 ring-2 ring-emerald-400/50 cursor-pointer animate-pulse scale-105'
                            : 'border-slate-800'
                        }`}
                      >
                        {meld.cards.map((c) => (
                          <PlayingCard key={c.id} card={c} size="sm" isSelectable={false} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. 하단 영역: 내 손패 & 원터치 게임 조작 버튼들 */}
      {me && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl">
          {/* 손패 정보 바 */}
          <div className="flex items-center justify-between mb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">내 패 ({me.cards.length}장)</span>
              <span className="text-[11px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                합산: {myHandScore}점
              </span>
              {me.isTurn && (
                <span className="text-[11px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black animate-pulse">
                  내 턴! {me.hasDrawn ? '패 등록 또는 버리기' : '카드 1장 뽑기'}
                </span>
              )}
            </div>

            {/* 카드 정렬 토글 버튼 */}
            <div className="flex gap-1 bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                onClick={() => setSortType('RANK')}
                className={`px-2 py-1 rounded ${
                  sortType === 'RANK' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                숫자순
              </button>
              <button
                onClick={() => setSortType('SUIT')}
                className={`px-2 py-1 rounded ${
                  sortType === 'SUIT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                무늬순
              </button>
            </div>
          </div>

          {/* 내 손패 카드 나열 (가로 스크롤 가능 및 큼직한 카드 뷰) */}
          <div className="flex items-end justify-start sm:justify-center overflow-x-auto py-3 px-1 -space-x-3 sm:-space-x-2 scrollbar-none min-h-[110px]">
            {sortedCards.map((card) => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <PlayingCard
                  key={card.id}
                  card={card}
                  size="md"
                  isSelected={isSelected}
                  onClick={() => toggleCardSelect(card.id)}
                />
              );
            })}
          </div>

          {/* 게임 액션 버튼 패널 */}
          {gameState.status === 'PLAYING' && me.isTurn && (
            <div className="grid grid-cols-4 gap-1.5 mt-2 pt-2 border-t border-slate-800">
              {/* 1. 패 등록 버튼 */}
              <button
                onClick={handleRegisterMeld}
                disabled={!me.hasDrawn || !meldValidation.valid}
                className={`py-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  meldValidation.valid && me.hasDrawn
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 animate-pulse'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Sparkles size={14} />
                <span>패 등록</span>
              </button>

              {/* 2. 카드 버리기 (턴 종료) */}
              <button
                onClick={handleDiscardCard}
                disabled={!me.hasDrawn || selectedCardIds.length !== 1}
                className={`py-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  me.hasDrawn && selectedCardIds.length === 1
                    ? 'bg-rose-600 hover:bg-rose-500 text-white font-black'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ArrowDown size={14} />
                <span>1장 버리기</span>
              </button>

              {/* 3. 스톱(Stop) 선언 */}
              <button
                onClick={handleCallStop}
                disabled={!me.hasDrawn}
                className={`py-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  me.hasDrawn
                    ? 'bg-purple-600 hover:bg-purple-500 text-white font-black'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>✋ 스톱!</span>
                <span className="text-[9px] font-normal opacity-80">({myHandScore}점)</span>
              </button>

              {/* 4. 카드 뽑기 안내 또는 빠른 덱 드로우 */}
              {!me.hasDrawn ? (
                <button
                  onClick={() => handleDrawCard(false)}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex flex-col items-center justify-center animate-bounce"
                >
                  <span>덱에서 뽑기</span>
                </button>
              ) : (
                <button
                  onClick={() => setSelectedCardIds([])}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center"
                >
                  선택 해제
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. 승리/게임 종료 결과 모달 */}
      {gameState.status === 'ENDED' && gameState.winner && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl text-center text-white">
            <div className="text-5xl mb-3">
              {gameState.winner.type === 'HOOLA' ? '🌟' : '🏆'}
            </div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">
              {gameState.winner.type === 'HOOLA'
                ? '대 역 전 ! 훌 라 (완 승) !'
                : gameState.winner.type === 'STOP'
                ? '스 톱 승 리 !'
                : '게 임 승 리 !'}
            </h2>
            <p className="text-sm font-bold text-slate-200 mt-2">
              우승자: <span className="text-amber-300">{gameState.winner.player.nickname}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              +{gameState.winner.chipsWon.toLocaleString()} 칩 획득
            </p>

            <button
              onClick={handleToggleReady}
              className="w-full mt-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base rounded-2xl shadow-xl active:scale-95 transition-transform"
            >
              다음 판 다시 시작
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
