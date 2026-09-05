'use client';

import React, { useState, useEffect } from 'react';

const TIPS = [
  '💡 7 카드는 1장만으로 즉시 필드에 등록할 수 있습니다!',
  '🌟 한 번도 등록 안 하고 한 번에 다 털면 훌라 2배 역전승!',
  '✋ 패의 총점이 가장 낮다고 판단될 때 스톱을 선언하세요.',
  '🔗 이미 필드에 깔린 패에 내 카드를 이어붙여 손패를 줄이세요.',
  '🎙️ 마이크를 켜면 친구들과 실시간으로 음성 대화를 나눌 수 있습니다.',
];

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = '훌라 게임을 준비하고 있습니다...' }: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // 3초마다 게임 팁 변경
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3200);

    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(tipInterval);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-6 select-none text-white overflow-hidden">
      {/* 배경 빛 효과 */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 상단 타이틀 */}
      <div className="text-center mt-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold mb-3 shadow-sm">
          <span>✨</span>
          <span>한국 정통 카드 게임</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span>온라인 보이스</span>
          <span className="text-amber-400 underline decoration-amber-500/50 underline-offset-4">훌라</span>
        </h1>
      </div>

      {/* 중앙: 3단 카드 셔플 모션 애니메이션 */}
      <div className="relative flex items-center justify-center my-auto py-10">
        {/* 카드 1 (스페이드 7) - 좌측 기울임 */}
        <div className="w-16 h-24 sm:w-20 sm:h-28 bg-white text-slate-900 rounded-xl shadow-2xl border-2 border-slate-200 p-2 flex flex-col justify-between -rotate-12 -translate-x-6 animate-pulse">
          <span className="font-black text-sm sm:text-base leading-none">7♠</span>
          <span className="text-2xl sm:text-3xl self-center text-slate-900">♠</span>
          <span className="font-black text-sm sm:text-base leading-none self-end rotate-180">7♠</span>
        </div>

        {/* 카드 2 (다이아몬드 A) - 중앙 메인 */}
        <div className="w-18 h-26 sm:w-22 sm:h-32 bg-white text-red-600 rounded-xl shadow-2xl border-2 border-amber-400 p-2.5 flex flex-col justify-between z-10 -translate-y-2 ring-4 ring-amber-400/30 animate-bounce">
          <span className="font-black text-base sm:text-lg leading-none">A♦</span>
          <span className="text-3xl sm:text-4xl self-center text-red-600">♦</span>
          <span className="font-black text-base sm:text-lg leading-none self-end rotate-180">A♦</span>
        </div>

        {/* 카드 3 (하트 7) - 우측 기울임 */}
        <div className="w-16 h-24 sm:w-20 sm:h-28 bg-white text-red-600 rounded-xl shadow-2xl border-2 border-slate-200 p-2 flex flex-col justify-between rotate-12 translate-x-6 animate-pulse">
          <span className="font-black text-sm sm:text-base leading-none">7♥</span>
          <span className="text-2xl sm:text-3xl self-center text-red-600">♥</span>
          <span className="font-black text-sm sm:text-base leading-none self-end rotate-180">7♥</span>
        </div>
      </div>

      {/* 하단: 프로그레스 바 & 안내 메시지 & 팁 */}
      <div className="w-full max-w-sm space-y-4 mb-4 relative z-10">
        {/* 상태 텍스트 */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            <span className="text-sm font-bold text-slate-200">{message}</span>
          </div>
          {elapsed > 3 && (
            <span className="text-[11px] text-slate-400 animate-pulse">
              서버를 깨우고 있습니다 ({elapsed}초)... 곧 연결됩니다!
            </span>
          )}
        </div>

        {/* 무한 회전 프로그레스 바 */}
        <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
          <div className="bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500 h-full rounded-full w-2/5 animate-[shimmer_1.5s_infinite_linear] shadow-sm" />
        </div>

        {/* 게임 팁 말풍선 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md text-center min-h-[50px] flex items-center justify-center transition-all duration-300">
          <p className="text-xs text-amber-300/90 font-medium leading-relaxed">
            {TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
