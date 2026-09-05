'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import type { Socket } from 'socket.io-client';

interface VoiceChatProps {
  socket: Socket | null;
  roomId: string;
  userId: string;
  nickname: string;
  speakingPlayers: Set<string>;
}

export default function VoiceChat({
  socket,
  roomId,
  userId,
  nickname,
  speakingPlayers,
}: VoiceChatProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<any>(null);
  const peersRef = useRef<Map<string, any>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 음성 레벨 감지 루프 (발언 중 여부 판별)
  const detectSpeaking = useCallback(() => {
    if (!analyserRef.current || !socket || isMuted) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const isSpeaking = average > 18; // 임계값

    socket.emit('speaking_change', { isSpeaking });
    animationFrameRef.current = requestAnimationFrame(detectSpeaking);
  }, [socket, isMuted]);

  useEffect(() => {
    let isMounted = true;

    async function initVoice() {
      try {
        // 1. 마이크 권한 및 로컬 스트림 획득
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        if (!isMounted) return;
        localStreamRef.current = stream;
        setHasMicPermission(true);

        // 2. Web Audio API로 마이크 볼륨 분석기 설정
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        animationFrameRef.current = requestAnimationFrame(detectSpeaking);

        // 3. PeerJS 초기화 (동적 import로 SSR 방지)
        const { default: Peer } = await import('peerjs');
        const peer = new Peer();
        peerRef.current = peer;

        peer.on('open', (peerId) => {
          setIsConnected(true);
          // 소켓을 통해 방 내 다른 플레이어들에게 내 PeerID 전달
          socket?.emit('voice_peer_ready', { peerId, nickname });
        });

        // 상대방으로부터 통화가 들어왔을 때 내 오디오 스트림 응답
        peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            playRemoteAudio(call.peer, remoteStream);
          });
          peersRef.current.set(call.peer, call);
        });

        // 소켓 이벤트 수신: 새로운 참가자의 Peer ID가 오면 내가 먼저 전화(Call) 걸기
        socket?.on('voice_peer_joined', ({ peerId }) => {
          if (peer && stream && !peersRef.current.has(peerId)) {
            const call = peer.call(peerId, stream);
            call?.on('stream', (remoteStream) => {
              playRemoteAudio(peerId, remoteStream);
            });
            peersRef.current.set(peerId, call);
          }
        });

        socket?.on('voice_peer_left', ({ peerId }) => {
          const call = peersRef.current.get(peerId);
          if (call) {
            call.close();
            peersRef.current.delete(peerId);
            const audioElement = document.getElementById(`audio-${peerId}`);
            if (audioElement) audioElement.remove();
          }
        });
      } catch (err) {
        console.warn('마이크 권한 획득 실패 또는 거부:', err);
        setHasMicPermission(false);
      }
    }

    initVoice();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) audioContextRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [roomId, socket, nickname, detectSpeaking]);

  // 원격 오디오 재생 엘리먼트 생성
  const playRemoteAudio = (peerId: string, stream: MediaStream) => {
    let audio = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = `audio-${peerId}`;
      audio.autoplay = true;
      document.body.appendChild(audio);
    }
    audio.srcObject = stream;
  };

  // 마이크 음소거 토글
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
        if (!isMuted) {
          socket?.emit('speaking_change', { isSpeaking: false });
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 shadow-md">
      <button
        onClick={toggleMute}
        disabled={!hasMicPermission}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
          isMuted
            ? 'bg-rose-600/90 text-white hover:bg-rose-500'
            : 'bg-emerald-600/90 text-white hover:bg-emerald-500 ring-2 ring-emerald-400/40'
        }`}
      >
        {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
        <span>{isMuted ? '마이크 끔' : '음성 켜짐'}</span>
      </button>

      <div className="flex items-center gap-1 text-[11px] text-slate-300">
        <Volume2 size={13} className="text-blue-400" />
        <span>음성채팅 {isConnected ? '연결됨' : '준비중'}</span>
      </div>
    </div>
  );
}
