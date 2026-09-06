import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameManager } from './hoola/gameManager';

export function setupSocketHandlers(io: SocketIOServer) {
  const gameManager = GameManager.getInstance();

  const broadcastRoomList = () => {
    io.emit('room_list_updated', gameManager.getActiveRooms());
  };

  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    // 0. 로비에서 현재 활성 방 목록 요청
    socket.on('get_rooms', () => {
      socket.emit('room_list_updated', gameManager.getActiveRooms());
    });

    // 1. 방 입장 (새 방 생성 또는 기존 방 참여)
    socket.on('join_room', ({ roomId, user }) => {
      try {
        currentRoomId = roomId;
        currentUserId = user.id;
        socket.join(roomId);

        const room = gameManager.joinRoom(roomId, user);
        io.to(roomId).emit('game_state_updated', room);
        broadcastRoomList();
      } catch (err: any) {
        socket.emit('game_error', err.message);
      }
    });

    // 2. 준비(Ready) 토글
    socket.on('toggle_ready', () => {
      if (!currentRoomId || !currentUserId) return;
      try {
        const room = gameManager.toggleReady(currentRoomId, currentUserId);
        io.to(currentRoomId).emit('game_state_updated', room);
        broadcastRoomList();
      } catch (err: any) {
        socket.emit('game_error', err.message);
      }
    });

    // 3. 카드 뽑기 (덱 or 버린 카드)
    socket.on('draw_card', ({ fromDiscard }) => {
      if (!currentRoomId || !currentUserId) return;
      try {
        const room = gameManager.drawCard(currentRoomId, currentUserId, fromDiscard);
        io.to(currentRoomId).emit('game_state_updated', room);
      } catch (err: any) {
        socket.emit('game_error', err.message);
      }
    });

    // 4. 패 등록하기
    socket.on('register_meld', ({ cardIds }) => {
      if (!currentRoomId || !currentUserId) return;
      try {
        const room = gameManager.registerMeld(currentRoomId, currentUserId, cardIds);
        io.to(currentRoomId).emit('game_state_updated', room);
      } catch (err: any) {
        socket.emit('game_error', err.message);
      }
    });

    // 5. 카드 붙이기
    socket.on('attach_card', ({ meldId, cardId }) => {
      if (!currentRoomId || !currentUserId) return;
      try {
        const room = gameManager.attachCard(currentRoomId, currentUserId, meldId, cardId);
        io.to(currentRoomId).emit('game_state_updated', room);
      } catch (err: any) {
        socket.emit('game_error', err.message);
      }
    });

    // 6. 카드 버리기
    socket.on('discard_card', ({ cardId }) => {
      if (!currentRoomId || !currentUserId) return;
      try {
        const room = gameManager.discardCard(currentRoomId, currentUserId, cardId);
        io.to(currentRoomId).emit('game_state_updated', room);
      } catch (err: any) {
        socket.emit('game_error', err.message);
      }
    });

    // 7. 스톱 선언
    socket.on('call_stop', () => {
      if (!currentRoomId || !currentUserId) return;
      try {
        const room = gameManager.callStop(currentRoomId, currentUserId);
        io.to(currentRoomId).emit('game_state_updated', room);
      } catch (err: any) {
        socket.emit('game_error', err.message);
      }
    });

    // 8. 음성 채팅 시그널링 (WebRTC Peer ID 교환)
    socket.on('voice_peer_ready', ({ peerId, nickname }) => {
      if (!currentRoomId || !currentUserId) return;
      socket.to(currentRoomId).emit('voice_peer_joined', {
        userId: currentUserId,
        peerId,
        nickname,
      });
    });

    // 9. 말하는 중(Speaking) 상태 브로드캐스팅
    socket.on('speaking_change', ({ isSpeaking }) => {
      if (!currentRoomId || !currentUserId) return;
      socket.to(currentRoomId).emit('player_speaking_changed', {
        userId: currentUserId,
        isSpeaking,
      });
    });

    // 10. 방 나가기
    socket.on('leave_room', () => {
      if (currentRoomId && currentUserId) {
        socket.leave(currentRoomId);
        const room = gameManager.leaveRoom(currentRoomId, currentUserId);
        if (room) {
          io.to(currentRoomId).emit('game_state_updated', room);
          io.to(currentRoomId).emit('voice_peer_left', { userId: currentUserId });
        }
        currentRoomId = null;
        currentUserId = null;
        broadcastRoomList();
      }
    });

    // 연결 종료
    socket.on('disconnect', () => {
      if (currentRoomId && currentUserId) {
        const room = gameManager.leaveRoom(currentRoomId, currentUserId);
        if (room) {
          io.to(currentRoomId).emit('game_state_updated', room);
          io.to(currentRoomId).emit('voice_peer_left', { userId: currentUserId });
        }
        broadcastRoomList();
      }
    });
  });
}
