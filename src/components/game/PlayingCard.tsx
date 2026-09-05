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
  // 모바일 화면 비율에 맞춘 크기 프리셋
  const sizeClasses = {
    sm: 'w-10 h-14 text-xs rounded',
    md: 'w-14 h-20 sm:w-16 sm:h-24 text-sm rounded-lg',
    lg: 'w-16 h-24 sm:w-20 sm:h-28 text-base rounded-xl',
  };

  // 뒷면 카드 렌더링
  if (isFaceDown || !card) {
    return (
      <div
        onClick={onClick}
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-700 via-indigo-800 to-blue-950 border-2 border-white/60 shadow-md flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 ${className}`}
      >
        <div className="w-4/5 h-4/5 border border-dashed border-blue-300/40 rounded flex items-center justify-center">
          <span className="text-white/60 font-bold text-xs">🎴</span>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'HEART' || card.suit === 'DIAMOND';
  const suitSymbols: Record<Suit, string> = {
    SPADE: '♠',
    HEART: '♥',
    DIAMOND: '♦',
    CLUB: '♣',
    JOKER: '🃏',
  };

  const suitColor =
    card.suit === 'JOKER'
      ? 'text-purple-600'
      : isRed
      ? 'text-red-600'
      : 'text-slate-900';

  return (
    <div
      onClick={isSelectable ? onClick : undefined}
      className={`
        ${sizeClasses[size]}
        relative bg-white font-bold select-none transition-all duration-150 flex flex-col justify-between p-1 shadow-md
        ${isSelectable ? 'cursor-pointer active:scale-95' : 'cursor-default'}
        ${
          isSelected
            ? 'border-2 border-amber-500 ring-2 ring-amber-400 -translate-y-3 z-10 shadow-lg'
            : 'border border-gray-300 hover:border-gray-400'
        }
        ${isHighlight ? 'ring-2 ring-yellow-400 ring-offset-1 animate-pulse' : ''}
        ${className}
      `}
    >
      {/* 붙이기 가능 뱃지 */}
      {canAttach && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] px-1 py-0.5 rounded-full font-black shadow z-20">
          붙임
        </div>
      )}

      {/* 좌측 상단 숫자 & 무늬 (모바일에서 한눈에 보이게 굵고 큼직하게) */}
      <div className={`flex flex-col items-center leading-none ${suitColor}`}>
        <span className="text-base sm:text-lg font-black tracking-tight">{card.name}</span>
        <span className="text-xs sm:text-sm -mt-0.5">{suitSymbols[card.suit]}</span>
      </div>

      {/* 중앙 대형 무늬 */}
      <div
        className={`absolute inset-0 flex items-center justify-center opacity-85 pointer-events-none text-2xl sm:text-3xl ${suitColor}`}
      >
        {suitSymbols[card.suit]}
      </div>

      {/* 우측 하단 숫자 & 무늬 (180도 회전) */}
      <div className={`flex flex-col items-center leading-none rotate-180 self-end ${suitColor}`}>
        <span className="text-base sm:text-lg font-black tracking-tight">{card.name}</span>
        <span className="text-xs sm:text-sm -mt-0.5">{suitSymbols[card.suit]}</span>
      </div>
    </div>
  );
}
