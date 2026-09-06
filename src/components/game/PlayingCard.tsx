'use client';

import React from 'react';
import { Card, Suit } from '@/lib/hoola/types';

interface PlayingCardProps {
  card?: Card;
  isFaceDown?: boolean;
  isSelected?: boolean;
  isSelectable?: boolean;
  canAttach?: boolean;
  isHighlight?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

// ♠ SPADE SVG
function SpadeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.2C10.6 5 4.8 11.2 4.8 15a4.2 4.2 0 0 0 6.6 3.5c-.3 1.3-1.2 2.4-2.4 3h6c-1.2-.6-2.1-1.7-2.4-3A4.2 4.2 0 0 0 19.2 15c0-3.8-5.8-10-7.2-12.8z" />
    </svg>
  );
}

// ♥ HEART SVG
function HeartIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

// ♦ DIAMOND SVG
function DiamondIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.5L3.8 12l8.2 9.5 8.2-9.5L12 2.5z" />
    </svg>
  );
}

// ♣ CLUB SVG
function ClubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="7.2" r="4.2" />
      <circle cx="7.2" cy="13.2" r="4.2" />
      <circle cx="16.8" cy="13.2" r="4.2" />
      <circle cx="12" cy="11.5" r="2.8" />
      <path d="M10.2 13h3.6l1.7 8.5H8.5z" />
    </svg>
  );
}

// 🃏 JOKER / SPECIAL SVG
function JokerIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 16.1 7.2 18.6l.9-5.3-3.8-3.7 5.3-.8L12 2z" />
    </svg>
  );
}

// 👑 KING CROWN SVG
function CrownIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5 19h14v2H5v-2zm0-2l-2-9 5.5 4 3.5-7 3.5 7 5.5-4-2 9H5z" />
    </svg>
  );
}

// 👸 QUEEN TIARA SVG
function TiaraIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 4l2.5 4 4.5-2-2 7.5L20 15v3H4v-3l3-1.5-2-7.5 4.5 2L12 4z" />
    </svg>
  );
}

// 🛡️ JACK HELM SVG
function ShieldIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 4a3 3 0 0 1 3 3c0 1.3-.8 2.4-2 2.8v2.2h-2V11.8c-1.2-.4-2-1.5-2-2.8a3 3 0 0 1 3-3z" />
    </svg>
  );
}

export function SuitSymbol({
  suit,
  className = 'w-4 h-4',
}: {
  suit: Suit;
  className?: string;
}) {
  switch (suit) {
    case 'SPADE':
      return <SpadeIcon className={className} />;
    case 'HEART':
      return <HeartIcon className={className} />;
    case 'DIAMOND':
      return <DiamondIcon className={className} />;
    case 'CLUB':
      return <ClubIcon className={className} />;
    case 'JOKER':
      return <JokerIcon className={className} />;
  }
}

export default function PlayingCard({
  card,
  isFaceDown = false,
  isSelected = false,
  isSelectable = true,
  canAttach = false,
  isHighlight = false,
  size = 'md',
  onClick,
  className = '',
}: PlayingCardProps) {
  // 모바일 환경에 최적화된 트럼프 카드 비율 (1 : 1.45)
  const sizeClasses = {
    sm: 'w-11 h-16 sm:w-12 sm:h-17 text-xs rounded-md',
    md: 'w-16 h-24 sm:w-17 sm:h-25 text-sm rounded-lg',
    lg: 'w-20 h-28 sm:w-24 sm:h-34 text-base rounded-xl',
  };

  // 1. 카드 뒷면 (클래식 카지노 스타일 로얄 블루 패턴)
  if (isFaceDown || !card) {
    return (
      <div
        onClick={onClick}
        className={`
          ${sizeClasses[size]}
          relative bg-white border border-slate-300 shadow-md p-1 select-none
          transition-transform active:scale-95 cursor-pointer overflow-hidden
          ${className}
        `}
      >
        <div className="w-full h-full rounded bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 border border-blue-400/40 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
          {/* 격자 다이아몬드 카지노 텍스처 */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px), radial-gradient(circle at 0% 0%, #38bdf8 1px, transparent 1px)',
              backgroundSize: '8px 8px',
            }}
          />
          {/* 중앙 골드 엠블럼 */}
          <div className="w-3/4 h-3/4 border border-amber-400/50 rounded flex items-center justify-center relative">
            <div className="w-6 h-6 rounded-full border border-amber-300/70 flex items-center justify-center bg-blue-950/90 shadow">
              <span className="text-amber-400 text-xs font-black">🎴</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. 카드 앞면 렌더링
  const isRed = card.suit === 'HEART' || card.suit === 'DIAMOND';
  const isSeven = card.rank === 7;
  const isCourt = card.rank >= 11; // J, Q, K
  const isAce = card.rank === 1;

  // 정통 카지노 카드 컬러 팔레트 (선명하고 뚜렷한 식별성)
  const textColor =
    card.suit === 'JOKER'
      ? 'text-purple-600'
      : isRed
      ? 'text-red-600'
      : 'text-slate-950';

  return (
    <div
      onClick={isSelectable ? onClick : undefined}
      className={`
        ${sizeClasses[size]}
        relative bg-white select-none transition-all duration-150 shadow-[0_2px_5px_rgba(0,0,0,0.22)] overflow-hidden
        ${isSelectable ? 'cursor-pointer active:scale-95' : 'cursor-default'}
        ${
          isSelected
            ? 'border-2 border-amber-400 ring-2 ring-amber-400/90 -translate-y-3.5 z-30 shadow-[0_8px_18px_rgba(245,158,11,0.4)] scale-102'
            : isSeven
            ? 'border border-amber-400/90 ring-1 ring-amber-400/40 hover:border-amber-500'
            : 'border border-slate-300/90 hover:border-slate-400'
        }
        ${isHighlight ? 'ring-2 ring-yellow-400 ring-offset-1 animate-pulse' : ''}
        ${className}
      `}
    >
      {/* 훌라 핵심 7 카드 특별 골드 하이라이트 배지 */}
      {isSeven && (
        <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[8px] font-black px-1 rounded-bl leading-tight shadow-sm z-10">
          ★7
        </div>
      )}

      {/* 붙이기 가능 뱃지 */}
      {canAttach && (
        <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black shadow-md ring-1 ring-white z-20 animate-bounce">
          +붙임
        </div>
      )}

      {/* 좌측 상단 숫자 & 무늬 (핵심 식별 영역 - 겹쳐도 100% 식별 가능하도록 좌상단 고정) */}
      <div
        className={`absolute top-1 left-1.5 flex flex-col items-center leading-none ${textColor} pointer-events-none z-10`}
      >
        <span
          className={`
            font-black tracking-tighter
            ${
              size === 'sm'
                ? 'text-xs'
                : size === 'md'
                ? 'text-sm sm:text-base'
                : 'text-base sm:text-lg'
            }
          `}
        >
          {card.name}
        </span>
        <div
          className={`
            mt-0.5
            ${
              size === 'sm'
                ? 'w-2.5 h-2.5'
                : size === 'md'
                ? 'w-3.5 h-3.5'
                : 'w-4.5 h-4.5'
            }
          `}
        >
          <SuitSymbol suit={card.suit} className="w-full h-full" />
        </div>
      </div>

      {/* 중앙 아트워크 / 무늬 (숫자/코너와 충돌하지 않도록 정교하게 배치) */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center pointer-events-none ${textColor}
        `}
      >
        {isCourt ? (
          // J, Q, K 왕실 문양
          <div className="opacity-75 flex flex-col items-center">
            {card.rank === 13 && (
              <CrownIcon
                className={
                  size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-7 h-7' : 'w-9 h-9'
                }
              />
            )}
            {card.rank === 12 && (
              <TiaraIcon
                className={
                  size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-7 h-7' : 'w-9 h-9'
                }
              />
            )}
            {card.rank === 11 && (
              <ShieldIcon
                className={
                  size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'
                }
              />
            )}
          </div>
        ) : isAce ? (
          // A 에이스 대형 엠블럼
          <div
            className={`
              opacity-80
              ${
                size === 'sm'
                  ? 'w-5 h-5'
                  : size === 'md'
                  ? 'w-8 h-8'
                  : 'w-10 h-10'
              }
            `}
          >
            <SuitSymbol suit={card.suit} className="w-full h-full" />
          </div>
        ) : (
          // 일반 숫자 카드 (2-10): 중앙 심볼
          <div
            className={`
              ${isSeven ? 'opacity-90 scale-110' : 'opacity-75'}
              ${
                size === 'sm'
                  ? 'w-4 h-4'
                  : size === 'md'
                  ? 'w-6 h-6'
                  : 'w-8 h-8'
              }
            `}
          >
            <SuitSymbol suit={card.suit} className="w-full h-full" />
          </div>
        )}
      </div>

      {/* 우측 하단 숫자 & 무늬 (중/대형 카드에만 180도 회전 배치) */}
      {size !== 'sm' && (
        <div
          className={`absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180 ${textColor} pointer-events-none z-10`}
        >
          <span
            className={`
              font-black tracking-tighter
              ${size === 'md' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}
            `}
          >
            {card.name}
          </span>
          <div className="w-3 h-3 mt-0.5">
            <SuitSymbol suit={card.suit} className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
