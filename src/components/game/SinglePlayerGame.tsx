'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Sparkles, ArrowDown, HelpCircle, RotateCcw, Bot, Volume2, VolumeX } from 'lucide-react';
import { GameState, Player, Card, Meld } from '@/lib/hoola/types';
import { createDeck, validateMeld, canAttachCard, calculateHandScore, sortCards } from '@/lib/hoola/rules';
import { decideBotTurn } from '@/lib/hoola/aiPlayer';
import { sound } from '@/lib/sound';
import PlayingCard from './PlayingCard';

interface SinglePlayerGameProps {
  user: any;
  onExit: () => void;
}

export default function SinglePlayerGame({ user, onExit }: SinglePlayerGameProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [sortType, setSortType] = useState<'RANK' | 'SUIT'>('RANK');
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const prevIsTurnRef = useRef<boolean>(true);

  // 싱글 게임 초기화 (나 + AI 봇 3명 = 4인 플레이)
  const initSingleGame = useCallback(() => {
    const deck = createDeck(false);

    const players: Player[] = [
      {
        id: user.id || 'me',
        nickname: `${user.nickname} (나)`,
        chips: user.chips || 10000,
        cards: sortCards(deck.splice(0, 7), 'RANK'),
        hasRegistered: false,
        isTurn: true, // 내가 먼저 시작
        isReady: true,
        hasDrawn: false,
      },
      {
        id: 'bot_1',
        nickname: '🤖 알파훌라 (타짜)',
        chips: 10000,
        cards: sortCards(deck.splice(0, 7), 'RANK'),
        hasRegistered: false,
        isTurn: false,
        isReady: true,
        hasDrawn: false,
      },
      {
        id: 'bot_2',
        nickname: '🤖 초보봇 (연습)',
        chips: 10000,
        cards: sortCards(deck.splice(0, 7), 'RANK'),
        hasRegistered: false,
        isTurn: false,
        isReady: true,
        hasDrawn: false,
      },
      {
        id: 'bot_3',
        nickname: '🤖 중수봇',
        chips: 10000,
        cards: sortCards(deck.splice(0, 7), 'RANK'),
        hasRegistered: false,
        isTurn: false,
        isReady: true,
        hasDrawn: false,
      },
    ];

    const initialDiscard = deck.pop()!;

    setGameState({
      roomId: 'SINGLE_AI_PRACTICE',
      status: 'PLAYING',
      players,
      deck,
      discardPile: [initialDiscard],
      registeredMelds: [],
      currentTurnIndex: 0,
      turnTimer: 15,
      winner: null,
      history: ['혼자하기 (AI 연습 모드)를 시작합니다! 각자 7장씩 받았습니다.'],
    });

    setSelectedCardIds([]);
    setHintMessage(null);
  }, [user]);

  useEffect(() => {
    initSingleGame();
  }, [initSingleGame]);

  const me = gameState?.players[0];
  const bots = gameState?.players.slice(1) || [];

  // 내 정렬된 손패
  const sortedCards = useMemo(() => {
    if (!me?.cards) return [];
    return sortCards(me.cards, sortType);
  }, [me?.cards, sortType]);

  const selectedCards = useMemo(() => {
    if (!me?.cards) return [];
    return me.cards.filter((c) => selectedCardIds.includes(c.id));
  }, [me?.cards, selectedCardIds]);

  const meldValidation = useMemo(() => {
    return validateMeld(selectedCards);
  }, [selectedCards]);

  const myHandScore = me ? calculateHandScore(me.cards) : 0;

  // AI 봇의 턴 실행 로직 (딜레이를 주어 자연스러운 모션 연출)
  useEffect(() => {
    if (!gameState || gameState.status !== 'PLAYING') return;

    const currentTurnPlayer = gameState.players[gameState.currentTurnIndex];
    if (!currentTurnPlayer || currentTurnPlayer.id === (user.id || 'me')) return;

    setIsBotThinking(true);

    const timer = setTimeout(() => {
      setGameState((prev) => {
        if (!prev || prev.status !== 'PLAYING') return prev;
        const state = JSON.parse(JSON.stringify(prev)) as GameState;
        const bot = state.players[state.currentTurnIndex];
        const topDiscard = state.discardPile.length > 0 ? state.discardPile[state.discardPile.length - 1] : null;

        // AI 두뇌 호출
        const decision = decideBotTurn(bot, state.registeredMelds, topDiscard);

        // 1. 드로우
        if (decision.shouldDrawFromDiscard && state.discardPile.length > 0) {
          const card = state.discardPile.pop()!;
          bot.cards.push(card);
          state.history.push(`${bot.nickname}이(가) 버린 패 [${card.display}]를 집어갔습니다.`);
          sound.playCardDraw();
        } else {
          if (state.deck.length === 0) {
            state.deck = createDeck(false);
          }
          const card = state.deck.pop()!;
          bot.cards.push(card);
          state.history.push(`${bot.nickname}이(가) 덱에서 카드를 뽑았습니다.`);
          sound.playCardDraw();
        }
        bot.cards = sortCards(bot.cards, 'RANK');

        // 2. 등록
        decision.meldsToRegister.forEach((cardIds) => {
          const cards = bot.cards.filter((c) => cardIds.includes(c.id));
          const { valid, type } = validateMeld(cards);
          if (valid && type) {
            bot.cards = bot.cards.filter((c) => !cardIds.includes(c.id));
            bot.hasRegistered = true;
            state.registeredMelds.push({
              id: `meld_${Date.now()}_${Math.random()}`,
              type,
              ownerId: bot.id,
              cards,
            });
            state.history.push(`${bot.nickname}이(가) [${cards.map((c) => c.display).join(' ')}] 등록!`);
            sound.playMeld();
          }
        });

        // 3. 붙이기
        decision.attaches.forEach(({ meldId, cardId }) => {
          const targetMeld = state.registeredMelds.find((m) => m.id === meldId);
          const card = bot.cards.find((c) => c.id === cardId);
          if (targetMeld && card) {
            const { canAttach, newCards } = canAttachCard(targetMeld, card);
            if (canAttach && newCards) {
              targetMeld.cards = newCards;
              bot.cards = bot.cards.filter((c) => c.id !== cardId);
              bot.hasRegistered = true;
              state.history.push(`${bot.nickname}이(가) 필드에 [${card.display}] 이어붙이기!`);
              sound.playAttach();
            }
          }
        });

        // 등록/붙이기로 0장이 되면 즉시 승리
        if (bot.cards.length === 0) {
          state.status = 'ENDED';
          state.winner = {
            player: bot,
            type: bot.hasRegistered ? 'NORMAL' : 'HOOLA',
            score: 0,
            chipsWon: 3000,
          };
          state.history.push(`🚨 ${bot.nickname} 승리!`);
          sound.playLose();
          setIsBotThinking(false);
          return state;
        }

        // 4. 스톱 선언 검사
        if (decision.shouldCallStop) {
          const botScore = calculateHandScore(bot.cards);
          const otherScores = state.players
            .filter((p) => p.id !== bot.id)
            .map((p) => calculateHandScore(p.cards));
          const minOther = Math.min(...otherScores);

          if (botScore <= minOther) {
            state.status = 'ENDED';
            state.winner = { player: bot, type: 'STOP', score: botScore, chipsWon: 3000 };
            state.history.push(`✋ ${bot.nickname}이(가) ${botScore}점으로 스톱에 성공하여 승리했습니다!`);
            sound.playLose();
            setIsBotThinking(false);
            return state;
          }
        }

        // 5. 버리기
        const discardIdx = bot.cards.findIndex((c) => c.id === decision.cardToDiscard);
        const [discarded] = bot.cards.splice(discardIdx >= 0 ? discardIdx : 0, 1);
        state.discardPile.push(discarded);
        state.history.push(`${bot.nickname}이(가) [${discarded.display}] 카드를 버렸습니다.`);
        sound.playCardDiscard();

        if (bot.cards.length === 0) {
          state.status = 'ENDED';
          state.winner = {
            player: bot,
            type: bot.hasRegistered ? 'NORMAL' : 'HOOLA',
            score: 0,
            chipsWon: 3000,
          };
          sound.playLose();
          setIsBotThinking(false);
          return state;
        }

        // 턴 넘기기
        bot.isTurn = false;
        bot.hasDrawn = false;
        state.currentTurnIndex = (state.currentTurnIndex + 1) % state.players.length;
        state.players[state.currentTurnIndex].isTurn = true;
        state.players[state.currentTurnIndex].hasDrawn = false;

        // 다음 턴이 나(플레이어)라면 챠임 알림음
        if (state.currentTurnIndex === 0) {
          sound.playMyTurn();
        }

        setIsBotThinking(false);
        return state;
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [gameState, user]);

  // 유저 액션: 드로우
  const handleUserDraw = (fromDiscard: boolean) => {
    if (!gameState || !me?.isTurn || me?.hasDrawn) return;
    sound.playCardDraw();

    setGameState((prev) => {
      if (!prev) return prev;
      const state = JSON.parse(JSON.stringify(prev)) as GameState;
      const player = state.players[0];

      let drawn: Card | undefined;
      if (fromDiscard) {
        drawn = state.discardPile.pop();
        state.history.push(`내가 버린 카드 [${drawn?.display}]를 가져왔습니다.`);
      } else {
        if (state.deck.length === 0) state.deck = createDeck(false);
        drawn = state.deck.pop();
        state.history.push('내가 덱에서 카드를 1장 뽑았습니다.');
      }

      if (drawn) {
        player.cards.push(drawn);
        player.cards = sortCards(player.cards, 'RANK');
        player.hasDrawn = true;
      }
      return state;
    });
    setSelectedCardIds([]);
  };

  // 유저 액션: 등록
  // 유저 액션: 등록
  const handleUserRegister = () => {
    if (!gameState || !me?.isTurn || !me?.hasDrawn || !meldValidation.valid || !meldValidation.type) return;
    sound.playMeld();

    setGameState((prev) => {
      if (!prev) return prev;
      const state = JSON.parse(JSON.stringify(prev)) as GameState;
      const player = state.players[0];

      const toMeld = player.cards.filter((c) => selectedCardIds.includes(c.id));
      player.cards = player.cards.filter((c) => !selectedCardIds.includes(c.id));
      player.hasRegistered = true;

      state.registeredMelds.push({
        id: `meld_${Date.now()}`,
        type: meldValidation.type!,
        ownerId: player.id,
        cards: toMeld,
      });

      state.history.push(`🎉 내가 [${toMeld.map((c) => c.display).join(' ')}] 등록을 완료했습니다!`);

      if (player.cards.length === 0) {
        state.status = 'ENDED';
        state.winner = { player, type: 'NORMAL', score: 0, chipsWon: 3000 };
        sound.playWin();
        confetti();
      }

      return state;
    });
    setSelectedCardIds([]);
  };

  // 유저 액션: 붙이기
  const handleUserAttach = (meldId: string) => {
    if (!gameState || !me?.isTurn || !me?.hasDrawn || selectedCardIds.length !== 1) return;
    sound.playAttach();

    setGameState((prev) => {
      if (!prev) return prev;
      const state = JSON.parse(JSON.stringify(prev)) as GameState;
      const player = state.players[0];
      const targetMeld = state.registeredMelds.find((m) => m.id === meldId);
      const card = player.cards.find((c) => c.id === selectedCardIds[0]);

      if (targetMeld && card) {
        const { canAttach, newCards } = canAttachCard(targetMeld, card);
        if (canAttach && newCards) {
          targetMeld.cards = newCards;
          player.cards = player.cards.filter((c) => c.id !== card.id);
          player.hasRegistered = true;
          state.history.push(`내가 필드에 [${card.display}]를 이어붙였습니다!`);

          if (player.cards.length === 0) {
            state.status = 'ENDED';
            state.winner = { player, type: 'NORMAL', score: 0, chipsWon: 3000 };
            sound.playWin();
            confetti();
          }
        }
      }
      return state;
    });
    setSelectedCardIds([]);
  };

  // 유저 액션: 버리기
  const handleUserDiscard = () => {
    if (!gameState || !me?.isTurn || !me?.hasDrawn || selectedCardIds.length !== 1) return;
    sound.playCardDiscard();

    setGameState((prev) => {
      if (!prev) return prev;
      const state = JSON.parse(JSON.stringify(prev)) as GameState;
      const player = state.players[0];

      const idx = player.cards.findIndex((c) => c.id === selectedCardIds[0]);
      const [discarded] = player.cards.splice(idx, 1);
      state.discardPile.push(discarded);
      state.history.push(`내가 [${discarded.display}]를 버렸습니다.`);

      if (player.cards.length === 0) {
        const isHoola = !player.hasRegistered;
        state.status = 'ENDED';
        state.winner = {
          player,
          type: isHoola ? 'HOOLA' : 'NORMAL',
          score: 0,
          chipsWon: isHoola ? 6000 : 3000,
        };
        if (isHoola) {
          sound.playHoolaWin();
        } else {
          sound.playWin();
        }
        confetti({ particleCount: 150, spread: 90 });
        return state;
      }

      // 다음 턴으로
      player.isTurn = false;
      player.hasDrawn = false;
      state.currentTurnIndex = 1;
      state.players[1].isTurn = true;
      state.players[1].hasDrawn = false;

      return state;
    });
    setSelectedCardIds([]);
  };

  // 유저 액션: 스톱
  const handleUserStop = () => {
    if (!gameState || !me?.isTurn || !me?.hasDrawn) return;
    sound.playStopAlert();

    const callerScore = calculateHandScore(me.cards);
    let minScore = callerScore;
    let actualWinner = me;
    let isBak = false;

    for (const other of gameState.players.slice(1)) {
      const s = calculateHandScore(other.cards);
      if (s <= minScore) {
        minScore = s;
        actualWinner = other;
        isBak = true;
      }
    }

    setGameState((prev) => {
      if (!prev) return prev;
      const state = JSON.parse(JSON.stringify(prev)) as GameState;
      state.status = 'ENDED';
      if (isBak) {
        state.winner = { player: actualWinner, type: 'STOP', score: minScore, chipsWon: 3000 };
        state.history.push(`🚨 스톱 실패 (바가지 독박)! ${actualWinner.nickname}이 더 낮은 점수로 승리했습니다.`);
        sound.playLose();
      } else {
        state.winner = { player: me, type: 'STOP', score: callerScore, chipsWon: 3000 };
        state.history.push(`🏆 축하합니다! ${callerScore}점으로 스톱에 성공하여 승리했습니다!`);
        sound.playWin();
        confetti();
      }
      return state;
    });
  };

  // 사운드 토글
  const handleToggleSound = () => {
    const newState = sound.toggleSound();
    setIsSoundOn(newState);
    if (newState) {
      sound.playMeld();
    }
  };

  // 초보자를 위한 힌트 기능: 등록 가능한 패 추천
  const handleShowHint = () => {
    sound.playCardSelect();
    if (!me) return;
    const seven = me.cards.find((c) => c.rank === 7);
    if (seven) {
      setHintMessage(`💡 7 카드 [${seven.display}]가 있습니다! 1장만으로 바로 등록할 수 있습니다.`);
      return;
    }
    setHintMessage('💡 같은 숫자 3장이나 같은 무늬 연속 3장을 모아보세요. 필요없는 높은 숫자는 버리세요!');
  };

  const isCardAttachable = (meld: Meld) => {
    if (selectedCards.length !== 1) return false;
    return canAttachCard(meld, selectedCards[0]).canAttach;
  };

  if (!gameState) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none max-w-lg mx-auto pb-4 px-2">
      {/* 상단 바: 나가기, 사운드 토글 & 힌트 */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors text-slate-300"
        >
          <ArrowLeft size={14} />
          <span>로비로 나가기</span>
        </button>

        <div className="flex items-center gap-2">
          {/* 사운드 토글 버튼 */}
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

          <span className="text-[11px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
            🤖 AI 연습 모드
          </span>
          <button
            onClick={handleShowHint}
            className="p-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 rounded-lg text-amber-400 transition-colors"
            title="훌라 힌트 보기"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* 힌트 알림 */}
      {hintMessage && (
        <div className="my-1.5 p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex items-center justify-between">
          <span>{hintMessage}</span>
          <button onClick={() => setHintMessage(null)} className="font-bold text-xs ml-2 text-white">✕</button>
        </div>
      )}

      {/* 상단: AI 봇 플레이어 3명 */}
      <div className="grid grid-cols-3 gap-2 py-2">
        {bots.map((bot) => (
          <div
            key={bot.id}
            className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
              bot.isTurn
                ? 'bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-500/40 scale-102'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="relative mb-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-800 border-2 border-slate-700 text-indigo-400">
                <Bot size={20} />
              </div>
              {bot.isTurn && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded-full animate-bounce">
                  생각중
                </span>
              )}
            </div>

            <span className="text-[11px] font-bold text-slate-200 truncate max-w-[80px]">
              {bot.nickname}
            </span>

            <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-300 font-bold bg-slate-800/80 px-2 py-0.5 rounded-full">
              <span>🎴</span>
              <span>{bot.cards.length}장</span>
            </div>
          </div>
        ))}
      </div>

      {/* 중앙 필드: 덱 & 버린 카드 & 필드 등록 패 */}
      <div className="flex-1 flex flex-col justify-between my-2 min-h-[220px] bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-3 backdrop-blur-sm">
        {/* 덱 & 버린 카드 */}
        <div className="flex items-center justify-center gap-6 py-2 border-b border-emerald-800/30">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-emerald-300 font-bold mb-1">덱 ({gameState.deck.length}장)</span>
            <PlayingCard
              isFaceDown
              size="md"
              onClick={() => me?.isTurn && !me?.hasDrawn && handleUserDraw(false)}
              className={me?.isTurn && !me?.hasDrawn ? 'ring-2 ring-yellow-400 animate-pulse cursor-pointer' : ''}
            />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold mb-1">버린 패</span>
            {gameState.discardPile.length > 0 ? (
              <PlayingCard
                card={gameState.discardPile[gameState.discardPile.length - 1]}
                size="md"
                onClick={() => me?.isTurn && !me?.hasDrawn && handleUserDraw(true)}
                className={me?.isTurn && !me?.hasDrawn ? 'ring-2 ring-emerald-400 animate-pulse cursor-pointer' : ''}
              />
            ) : (
              <div className="w-14 h-20 border border-dashed border-slate-700 rounded-lg flex items-center justify-center text-xs text-slate-600">
                비었음
              </div>
            )}
          </div>
        </div>

        {/* 필드 등록 패 (Melds) */}
        <div className="flex-1 py-2 overflow-y-auto max-h-[160px]">
          <div className="text-[10px] text-emerald-400 font-bold mb-1.5 flex items-center justify-between">
            <span>필드 등록 패 ({gameState.registeredMelds.length}세트)</span>
            <span className="text-[9px] text-slate-400">카드를 선택하고 필드 세트를 탭하여 붙이기</span>
          </div>

          {gameState.registeredMelds.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              아직 등록된 패가 없습니다. 7이나 트리플, 스트레이트를 등록해보세요!
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {gameState.registeredMelds.map((meld) => {
                const attachable = isCardAttachable(meld);
                return (
                  <div
                    key={meld.id}
                    onClick={() => attachable && handleUserAttach(meld.id)}
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

      {/* 하단: 내 손패 & 조작 버튼 */}
      {me && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl">
          <div className="flex items-center justify-between mb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">내 손패 ({me.cards.length}장)</span>
              <span className="text-[11px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                합산: {myHandScore}점
              </span>
              {me.isTurn && (
                <span className="text-[11px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black animate-pulse">
                  내 턴! {me.hasDrawn ? '패 등록 또는 버리기' : '카드 1장 뽑기'}
                </span>
              )}
            </div>

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

          {/* 대형 카드 손패 가로 스크롤 나열 */}
          <div className="flex items-end justify-start sm:justify-center overflow-x-auto pt-5 pb-2 px-2 -space-x-3 sm:-space-x-2 scrollbar-none min-h-[124px]">
            {sortedCards.map((card) => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <PlayingCard
                  key={card.id}
                  card={card}
                  size="md"
                  isSelected={isSelected}
                  onClick={() => {
                    sound.playCardSelect();
                    setSelectedCardIds((prev) =>
                      prev.includes(card.id) ? prev.filter((id) => id !== card.id) : [...prev, card.id]
                    );
                  }}
                />
              );
            })}
          </div>

          {/* 버튼 패널 */}
          {me.isTurn ? (
            <div className="grid grid-cols-4 gap-1.5 mt-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleUserRegister}
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

              <button
                onClick={handleUserDiscard}
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

              <button
                onClick={handleUserStop}
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

              {!me.hasDrawn ? (
                <button
                  onClick={() => handleUserDraw(false)}
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
          ) : (
            <div className="text-center py-2.5 text-xs text-slate-400 font-medium animate-pulse">
              {isBotThinking ? '🤖 AI 봇이 패를 생각하고 있습니다...' : '상대방 턴 진행 중...'}
            </div>
          )}
        </div>
      )}

      {/* 게임 결과 모달 */}
      {gameState.status === 'ENDED' && gameState.winner && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl text-center text-white">
            <div className="text-5xl mb-3">
              {gameState.winner.player.id === (user.id || 'me') ? '🏆' : '🤖'}
            </div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">
              {gameState.winner.player.id === (user.id || 'me')
                ? gameState.winner.type === 'HOOLA'
                  ? '🌟 훌라(완승) 대역전!'
                  : '축하합니다! 승리하셨습니다!'
                : `${gameState.winner.player.nickname} 승리!`}
            </h2>
            <p className="text-sm font-bold text-slate-200 mt-2">
              우승자: <span className="text-amber-300">{gameState.winner.player.nickname}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              +{gameState.winner.chipsWon.toLocaleString()} 칩 획득
            </p>

            <button
              onClick={initSingleGame}
              className="w-full mt-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              <span>한 판 더 하기</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
