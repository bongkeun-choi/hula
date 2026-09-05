'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import AuthModal from '@/components/auth/AuthModal';
import Lobby from '@/components/lobby/Lobby';
import GameBoard from '@/components/game/GameBoard';
import SinglePlayerGame from '@/components/game/SinglePlayerGame';
import LoadingScreen from '@/components/common/LoadingScreen';
import { GameState } from '@/lib/hoola/types';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. 초기 세션 확인
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Check auth error:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // 2. 방 입장 시 소켓 연결
  useEffect(() => {
    if (!currentRoomId || !user) return;

    const newSocket = io({
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_room', {
        roomId: currentRoomId,
        user: {
          id: user.id,
          nickname: user.nickname,
          chips: user.chips,
        },
      });
    });

    newSocket.on('game_state_updated', (updatedState: GameState) => {
      setGameState(updatedState);
    });

    newSocket.on('game_error', (msg: string) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 3500);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentRoomId, user]);

  // 방 입장 핸들러
  const handleJoinRoom = (roomId: string) => {
    setCurrentRoomId(roomId);
  };

  // 방 나가기
  const handleLeaveRoom = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setCurrentRoomId(null);
    setGameState(null);
  };

  // 로그아웃
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setCurrentRoomId(null);
    setGameState(null);
  };

  if (loading) {
    return <LoadingScreen message="서버에 연결하고 있습니다..." />;
  }

  // 1단계: 미인증 시 로그인/회원가입/게스트 모달
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <AuthModal onSuccess={(authenticatedUser) => setUser(authenticatedUser)} />
      </main>
    );
  }

  // 2단계: 싱글플레이어 (혼자하기 AI 모드)
  if (isSinglePlayer) {
    return (
      <SinglePlayerGame
        user={user}
        onExit={() => setIsSinglePlayer(false)}
      />
    );
  }

  // 3단계: 방에 들어가지 않은 상태면 로비 화면 표시
  if (!currentRoomId || !gameState) {
    return (
      <Lobby
        user={user}
        onJoinRoom={handleJoinRoom}
        onStartSinglePlayer={() => setIsSinglePlayer(true)}
        onLogout={handleLogout}
      />
    );
  }

  // 4단계: 방에 들어왔으면 멀티플레이어 인게임 보드 표시
  return (
    <>
      {errorMessage && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-rose-600/95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl border border-rose-400 animate-bounce">
          ⚠️ {errorMessage}
        </div>
      )}
      <GameBoard
        socket={socket}
        gameState={gameState}
        currentUser={user}
        onLeaveRoom={handleLeaveRoom}
      />
    </>
  );
}
