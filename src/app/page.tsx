'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import AuthModal from '@/components/auth/AuthModal';
import Lobby, { ActiveRoomInfo } from '@/components/lobby/Lobby';
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
  const [activeRooms, setActiveRooms] = useState<ActiveRoomInfo[]>([]);
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

  // 2. 유저 인증 시 소켓 연결 유지 (로비 방 목록 & 인게임 동기화)
  useEffect(() => {
    if (!user) return;

    const newSocket = io({
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      // 로비 접속 시 즉시 활성 방 목록 요청
      newSocket.emit('get_rooms');
    });

    newSocket.on('room_list_updated', (rooms: ActiveRoomInfo[]) => {
      setActiveRooms(rooms);
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
  }, [user]);

  // 3. 방 입장 핸들러
  const handleJoinRoom = (roomId: string) => {
    if (!socket || !user) return;
    setCurrentRoomId(roomId);
    socket.emit('join_room', {
      roomId,
      user: {
        id: user.id,
        nickname: user.nickname,
        chips: user.chips,
      },
    });
  };

  // 4. 방 나가기 핸들러
  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave_room');
      socket.emit('get_rooms');
    }
    setCurrentRoomId(null);
    setGameState(null);
  };

  // 5. 로그아웃
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setUser(null);
    setCurrentRoomId(null);
    setGameState(null);
    setActiveRooms([]);
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
        onExit={() => {
          setIsSinglePlayer(false);
          socket?.emit('get_rooms');
        }}
      />
    );
  }

  // 3단계: 방에 들어가지 않은 상태면 로비 화면 표시 (실제 방 목록 노출)
  if (!currentRoomId || !gameState) {
    return (
      <Lobby
        user={user}
        activeRooms={activeRooms}
        onRefreshRooms={() => socket?.emit('get_rooms')}
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
