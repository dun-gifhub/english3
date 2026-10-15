import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { audioService } from '../services/audioService';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  MessageSquare,
  Sparkles,
  Volume2,
  Send,
  Monitor,
  MonitorOff,
  Maximize2,
  Radio,
  BookOpen,
  Activity,
  Headphones,
  Copy,
  Check,
  AlertCircle,
  Clock
} from 'lucide-react';

interface CallRoomScreenProps {
  onLeave: () => void;
}

interface PeerState {
  uid: string;
  displayName: string;
  role: string;
  avatarColor: string;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const CallRoomScreen: React.FC<CallRoomScreenProps> = ({ onLeave }) => {
  const { activeRoom, leaveRoom, currentUser, selectedGrade } = useApp();

  // Socket & WebRTC Connections
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Local Streams & Devices
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mainStageVideoRef = useRef<HTMLVideoElement | null>(null);

  // Audio Equalizer & Analyser
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const [isLoopbackEnabled, setIsLoopbackEnabled] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const loopbackGainRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Remote Peers in the room
  const [peers, setPeers] = useState<Map<string, PeerState>>(new Map());

  // Room Duration (Unlimited Free, like Google Meet)
  const [callDurationSeconds, setCallDurationSeconds] = useState<number>(0);

  // Errors & UI states
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [presentationMode, setPresentationMode] = useState<'screen' | 'whiteboard'>('screen');
  const [whiteboardSlideIndex, setWhiteboardSlideIndex] = useState<number>(0);

  // Live Chat Stream
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: string; text: string; time: string; isSystem?: boolean; uid?: string }>
  >([
    {
      sender: 'Hệ Thống',
      text: `Chào mừng bạn vào phòng luyện phản xạ trực tuyến #${activeRoom?.roomCode}! Cuộc gọi hoạt động không giới hạn thời gian.`,
      time: 'Vừa xong',
      isSystem: true
    }
  ]);
  const [typedMessage, setTypedMessage] = useState<string>('');

  // Lesson presentation slides
  const LESSON_SLIDES = [
    {
      title: `Chuyên Đề Trọng Tâm: Câu Điều Kiện Lớp ${selectedGrade}`,
      content: 'If + S + had + P2, S + would/could + have + P2',
      notes: 'Giả định trái ngược với quá khứ. Đảo ngữ: Had + S + P2, S + would have + P2.',
      example: "Had we left earlier, we wouldn't have missed the opening ceremony."
    },
    {
      title: `Từ Vựng Trọng Điểm: Humans & Environment`,
      content: 'Carbon footprint • Eco-friendly • Biodiversity • Conservation',
      notes: 'Collocations: take measures, have an impact on, reduce carbon footprint.',
      example: "Planting trees plays a pivotal role in reducing our collective carbon footprint."
    },
    {
      title: `Collocations Nâng Cao (THPTQG & HSG)`,
      content: 'Keep one\'s cool • Dedicated to V-ing • Consistent with',
      notes: 'Mẹo nhớ: dedicate đi cùng giới từ TO và theo sau là Danh từ hoặc V-ing.',
      example: "The volunteer team is dedicated to preserving mangrove forests."
    }
  ];

  // 1. DURATION TIMER (NO TIME LIMIT)
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDuration = useMemo(() => {
    const hours = Math.floor(callDurationSeconds / 3600);
    const mins = Math.floor((callDurationSeconds % 3600) / 60);
    const secs = callDurationSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [callDurationSeconds]);

  // 2. AUDIO ANALYSER SETUP
  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) return;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const loopbackGain = ctx.createGain();
      loopbackGain.gain.value = isLoopbackEnabled ? 0.3 : 0.0;
      loopbackGainRef.current = loopbackGain;
      source.connect(loopbackGain);
      loopbackGain.connect(ctx.destination);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicAudioLevel(Math.min(100, Math.round((avg / 255) * 100 * 2.2)));

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (err) {
      console.warn('[CallRoom] Audio meter init notice:', err);
    }
  };

  const cleanupAudioMeter = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    loopbackGainRef.current = null;
    setMicAudioLevel(0);
  };

  // 3. INITIALIZE LOCAL MEDIA (MIC & CAMERA)
  const initLocalMedia = async (wantMic: boolean, wantCam: boolean) => {
    try {
      setMediaError(null);
      audioService.unlockMobileAudio();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt chưa hỗ trợ mediaDevices.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: wantMic
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          : false,
        video: wantCam
          ? {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            }
          : false
      });

      localStreamRef.current = stream;

      if (wantMic) {
        setupAudioMeter(stream);
      }

      if (localVideoRef.current && wantCam) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Add tracks to all existing peer connections
      peerConnectionsRef.current.forEach((pc) => {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      });

      return stream;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[CallRoom] Media access notice:', msg);
      if (!msg.includes('Permission denied') && !msg.includes('cancelled')) {
        setMediaError(`Không thể mở Microphone/Camera: ${msg}`);
      }
      return null;
    }
  };

  // 4. WEBRTC PEER CONNECTION CREATION
  const createPeerConnection = useCallback(
    (remoteUid: string) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      // Add local stream tracks if available
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'signal',
              targetUid: remoteUid,
              fromUid: currentUser?.uid,
              fromUser: {
                displayName: currentUser?.displayName,
                role: currentUser?.role,
                avatarColor: currentUser?.avatarColor
              },
              signal: {
                type: 'candidate',
                candidate: event.candidate
              }
            })
          );
        }
      };

      // Handle Incoming Remote Tracks (Audio & Video)
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (!remoteStream) return;

        setPeers((prev) => {
          const next = new Map(prev);
          const peer = next.get(remoteUid);
          if (peer) {
            next.set(remoteUid, {
              ...peer,
              stream: remoteStream
            });
          }
          return next;
        });

        // If presenter shared screen, mirror to main stage video
        if (presentationMode === 'screen' && mainStageVideoRef.current) {
          mainStageVideoRef.current.srcObject = remoteStream;
          mainStageVideoRef.current.play().catch(() => {});
        }
      };

      peerConnectionsRef.current.set(remoteUid, pc);
      return pc;
    },
    [currentUser, presentationMode]
  );

  // 5. WEBSOCKET SIGNALING CONNECTION
  useEffect(() => {
    if (!activeRoom || !currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/call`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      // 1. Initialize local mic
      await initLocalMedia(isMicOn, isCameraOn);

      // 2. Send join-room
      ws.send(
        JSON.stringify({
          type: 'join-room',
          roomCode: activeRoom.roomCode,
          user: {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            role: currentUser.role,
            avatarColor: currentUser.avatarColor || '#00E5FF'
          },
          isMicOn,
          isCameraOn
        })
      );
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;

        if (type === 'room-state') {
          // Existing peers in the room
          const newPeers = new Map<string, PeerState>();
          for (const p of data.peers || []) {
            newPeers.set(p.uid, {
              uid: p.uid,
              displayName: p.displayName,
              role: p.role,
              avatarColor: p.avatarColor || '#00E5FF',
              isMicOn: !!p.isMicOn,
              isCameraOn: !!p.isCameraOn,
              isScreenSharing: !!p.isScreenSharing
            });

            // Create WebRTC offer to each existing peer
            const pc = createPeerConnection(p.uid);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            ws.send(
              JSON.stringify({
                type: 'signal',
                targetUid: p.uid,
                fromUid: currentUser.uid,
                fromUser: {
                  displayName: currentUser.displayName,
                  role: currentUser.role,
                  avatarColor: currentUser.avatarColor
                },
                signal: {
                  type: 'offer',
                  sdp: offer.sdp
                }
              })
            );
          }
          setPeers(newPeers);
        } else if (type === 'peer-joined') {
          const { peer } = data;
          if (peer && peer.uid !== currentUser.uid) {
            setPeers((prev) => {
              const next = new Map(prev);
              next.set(peer.uid, {
                uid: peer.uid,
                displayName: peer.displayName,
                role: peer.role,
                avatarColor: peer.avatarColor || '#00E5FF',
                isMicOn: !!peer.isMicOn,
                isCameraOn: !!peer.isCameraOn,
                isScreenSharing: !!peer.isScreenSharing
              });
              return next;
            });

            setChatMessages((prev) => [
              ...prev,
              {
                sender: 'Hệ Thống',
                text: `👋 ${peer.displayName} vừa vào phòng học!`,
                time: 'Vừa xong',
                isSystem: true
              }
            ]);
          }
        } else if (type === 'peer-left') {
          const { uid } = data;
          if (uid) {
            setPeers((prev) => {
              const next = new Map(prev);
              const exiting = next.get(uid);
              if (exiting) {
                setChatMessages((chatPrev) => [
                  ...chatPrev,
                  {
                    sender: 'Hệ Thống',
                    text: `🚪 ${exiting.displayName} đã rời phòng học.`,
                    time: 'Vừa xong',
                    isSystem: true
                  }
                ]);
              }
              next.delete(uid);
              return next;
            });

            const pc = peerConnectionsRef.current.get(uid);
            if (pc) {
              pc.close();
              peerConnectionsRef.current.delete(uid);
            }
          }
        } else if (type === 'signal') {
          const { fromUid, signal } = data;
          if (!fromUid || !signal) return;

          let pc = peerConnectionsRef.current.get(fromUid);
          if (!pc) {
            pc = createPeerConnection(fromUid);
          }

          if (signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            ws.send(
              JSON.stringify({
                type: 'signal',
                targetUid: fromUid,
                fromUid: currentUser.uid,
                signal: {
                  type: 'answer',
                  sdp: answer.sdp
                }
              })
            );
          } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
          } else if (signal.type === 'candidate' && signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        } else if (type === 'media-status-update') {
          const { uid, isMicOn: peerMic, isCameraOn: peerCam, isScreenSharing: peerScreen } = data;
          setPeers((prev) => {
            const next = new Map(prev);
            const peer = next.get(uid);
            if (peer) {
              next.set(uid, {
                ...peer,
                isMicOn: typeof peerMic === 'boolean' ? peerMic : peer.isMicOn,
                isCameraOn: typeof peerCam === 'boolean' ? peerCam : peer.isCameraOn,
                isScreenSharing: typeof peerScreen === 'boolean' ? peerScreen : peer.isScreenSharing
              });
            }
            return next;
          });
        } else if (type === 'chat-message') {
          if (data.message) {
            setChatMessages((prev) => [...prev, data.message]);
          }
        }
      } catch (err) {
        console.warn('[WS Call] Message processing notice:', err);
      }
    };

    ws.onerror = () => {
      console.warn('[WS Call] WebSocket connection notice.');
    };

    return () => {
      cleanupAudioMeter();
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave-room' }));
        ws.close();
      }
    };
  }, [activeRoom?.roomCode, currentUser?.uid, createPeerConnection]);

  // 6. TOGGLE MICROPHONE
  const handleToggleMic = async () => {
    const nextMic = !isMicOn;
    setIsMicOn(nextMic);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = nextMic;
      });
    } else if (nextMic) {
      await initLocalMedia(true, isCameraOn);
    }

    if (!nextMic) {
      cleanupAudioMeter();
    } else if (localStreamRef.current) {
      setupAudioMeter(localStreamRef.current);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'media-status',
          isMicOn: nextMic
        })
      );
    }
  };

  // 7. TOGGLE CAMERA
  const handleToggleCamera = async () => {
    const nextCam = !isCameraOn;
    setIsCameraOn(nextCam);

    if (nextCam) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        const videoTrack = stream.getVideoTracks()[0];

        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
        } else {
          localStreamRef.current = stream;
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          localVideoRef.current.play().catch(() => {});
        }

        peerConnectionsRef.current.forEach((pc) => {
          pc.addTrack(videoTrack, localStreamRef.current!);
        });
      } catch (err: any) {
        setMediaError(`Không thể mở Camera: ${err.message}`);
        setIsCameraOn(false);
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.stop();
          localStreamRef.current?.removeTrack(t);
        });
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'media-status',
          isCameraOn: nextCam
        })
      );
    }
  };

  // 8. REAL SCREEN SHARING
  const startScreenShare = async () => {
    try {
      setMediaError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Trình duyệt chưa hỗ trợ chia sẻ màn hình getDisplayMedia.');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: true
      });

      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      setPresentationMode('screen');

      if (mainStageVideoRef.current) {
        mainStageVideoRef.current.srcObject = stream;
        mainStageVideoRef.current.play().catch(console.error);
      }

      // Add screen track to peers
      const screenTrack = stream.getVideoTracks()[0];
      peerConnectionsRef.current.forEach((pc) => {
        pc.addTrack(screenTrack, stream);
      });

      screenTrack.onended = () => {
        stopScreenShare();
      };

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'media-status',
            isScreenSharing: true
          })
        );
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Hệ Thống',
          text: `🖥️ ${currentUser?.displayName || 'Bạn'} đã bắt đầu trình chiếu màn hình trực tiếp!`,
          time: 'Vừa xong',
          isSystem: true
        }
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('Permission denied') && !msg.includes('cancelled')) {
        setMediaError(`Không thể khởi tạo chia sẻ màn hình: ${msg}`);
      }
      setIsScreenSharing(false);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (mainStageVideoRef.current) {
      mainStageVideoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'media-status',
          isScreenSharing: false
        })
      );
    }

    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'Hệ Thống',
        text: 'Đã dừng trình chiếu màn hình.',
        time: 'Vừa xong',
        isSystem: true
      }
    ]);
  };

  // Toggle Loopback (Hear own mic)
  const handleToggleLoopback = () => {
    if (!loopbackGainRef.current) return;
    const nextState = !isLoopbackEnabled;
    setIsLoopbackEnabled(nextState);
    loopbackGainRef.current.gain.value = nextState ? 0.3 : 0.0;
  };

  // Copy Room Code
  const handleCopyRoomCode = () => {
    if (activeRoom?.roomCode) {
      navigator.clipboard.writeText(activeRoom.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Test Sound
  const handleTestSpeaker = () => {
    audioService.unlockMobileAudio();
    audioService.playVictoryFanfare();
    setTimeout(() => {
      audioService.speakEnglish('Speaker check OK. Welcome to Tap Hunter group call.');
    }, 400);
  };

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !currentUser) return;

    const newMsg = {
      sender: currentUser.displayName || 'Thợ Săn Lương Phú',
      text: typedMessage.trim(),
      time: 'Vừa xong',
      uid: currentUser.uid
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat-message',
          message: newMsg
        })
      );
    } else {
      setChatMessages((prev) => [...prev, newMsg]);
    }
    setTypedMessage('');
  };

  const handleExit = () => {
    stopScreenShare();
    cleanupAudioMeter();
    leaveRoom();
    onLeave();
  };

  if (!activeRoom) {
    return (
      <div className="text-center py-20 space-y-4">
        <h3 className="text-lg font-bold text-white">Bạn chưa ở trong phòng học nào!</h3>
        <button
          onClick={onLeave}
          className="px-5 py-2.5 rounded-xl bg-[#00E5FF] text-[#0D1B2A] font-bold text-xs cursor-pointer"
        >
          Quay lại màn hình Bạn Bè
        </button>
      </div>
    );
  }

  const allParticipantsCount = 1 + peers.size;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20">
      {/* Top Header: Google Meet Style Banner, Unlimited Free Duration, Actions */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#162338] border border-[#00E5FF]/30 shadow-xl flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06D6A0] animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#00E5FF]">
              Phòng Học Trực Tuyến Meet
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#06D6A0]/20 text-[#06D6A0] flex items-center gap-1">
              <Clock size={11} />
              <span>{formattedDuration}</span>
              <span className="hidden sm:inline">• Không Giới Hạn Thời Gian</span>
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
            {activeRoom.title}
          </h2>

          <div className="flex items-center gap-2 text-xs text-[#778DA9] mt-0.5 flex-wrap">
            <span>
              Mã phòng: <strong className="text-[#00E5FF] font-mono">#{activeRoom.roomCode}</strong>
            </span>
            <button
              onClick={handleCopyRoomCode}
              className="px-2 py-0.5 rounded-md bg-[#0D1B2A] hover:bg-[#1E2D40] text-[#00E5FF] text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Sao chép mã phòng để mời bạn bè"
            >
              {copiedCode ? <Check size={11} className="text-[#06D6A0]" /> : <Copy size={11} />}
              <span>{copiedCode ? 'Đã chép mã' : 'Sao chép mã'}</span>
            </button>
            <span>• Thành viên: {allParticipantsCount} người</span>
          </div>
        </div>

        {/* Global Control Bar: Mic, Camera, Screen, Test, Leave */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Speaker Test */}
          <button
            onClick={handleTestSpeaker}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#0D1B2A] hover:bg-[#1E2D40] text-[#FFD166] border border-[#FFD166]/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Kiểm tra âm thanh loa"
          >
            <Headphones size={16} />
            <span className="hidden sm:inline">Thử Loa</span>
          </button>

          {/* Screen Share */}
          <button
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md ${
              isScreenSharing
                ? 'bg-[#EF476F] text-white hover:bg-[#d9385d]'
                : 'bg-[#9D4EDD] text-white hover:bg-[#a855f7]'
            }`}
            title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Trình chiếu màn hình'}
          >
            {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
            <span className="hidden sm:inline">
              {isScreenSharing ? 'Dừng Chiếu' : 'Trình Chiếu'}
            </span>
          </button>

          {/* Camera Toggle */}
          <button
            onClick={handleToggleCamera}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border shadow-md ${
              isCameraOn
                ? 'bg-[#06D6A0] text-[#0D1B2A] border-[#06D6A0]'
                : 'bg-[#0D1B2A] text-[#ADB5BD] border-[#27384E] hover:text-white'
            }`}
            title={isCameraOn ? 'Tắt camera' : 'Bật camera'}
          >
            {isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
            <span className="hidden sm:inline">{isCameraOn ? 'Camera Bật' : 'Camera Tắt'}</span>
          </button>

          {/* Microphone Toggle */}
          <button
            onClick={handleToggleMic}
            className={`p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md ${
              isMicOn
                ? 'bg-[#00E5FF] text-[#0D1B2A]'
                : 'bg-[#EF476F]/20 text-[#EF476F] border border-[#EF476F]/40'
            }`}
            title={isMicOn ? 'Tắt micro' : 'Bật micro'}
          >
            {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
            <span className="hidden sm:inline">{isMicOn ? 'Mic Đang Bật' : 'Đã Tắt Mic'}</span>
          </button>

          {/* Leave Call */}
          <button
            onClick={handleExit}
            className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-[#EF476F] hover:bg-[#d9385d] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-[#EF476F]/20"
            title="Rời phòng"
          >
            <PhoneOff size={16} />
            <span className="hidden sm:inline">Rời Phòng</span>
          </button>
        </div>
      </div>

      {/* Media Error Warning */}
      {mediaError && (
        <div className="p-3 rounded-2xl bg-[#EF476F]/20 border border-[#EF476F] text-[#EF476F] text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{mediaError}</span>
        </div>
      )}

      {/* MAIN STAGE: Live Screen / Whiteboard / Video */}
      <div className="rounded-3xl bg-[#162338] border border-[#27384E] overflow-hidden shadow-xl">
        <div className="px-4 py-2.5 bg-[#0D1B2A] border-b border-[#27384E] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            <span className="text-xs font-bold text-[#00E5FF]">
              {presentationMode === 'screen' && isScreenSharing
                ? '🖥️ Đang Trình Chiếu Màn Hình Của Bạn'
                : '📖 Bảng Trình Chiếu Chuyên Đề & Bài Học'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPresentationMode('screen')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                presentationMode === 'screen'
                  ? 'bg-[#00E5FF] text-[#0D1B2A]'
                  : 'bg-[#1E2D40] text-[#778DA9]'
              }`}
            >
              Màn Hình
            </button>
            <button
              onClick={() => setPresentationMode('whiteboard')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                presentationMode === 'whiteboard'
                  ? 'bg-[#00E5FF] text-[#0D1B2A]'
                  : 'bg-[#1E2D40] text-[#778DA9]'
              }`}
            >
              Bảng Bài Giảng
            </button>
          </div>
        </div>

        {/* Video Stage Canvas */}
        <div className="relative min-h-[300px] sm:min-h-[400px] bg-black flex items-center justify-center overflow-hidden">
          {presentationMode === 'screen' && isScreenSharing ? (
            <video
              ref={mainStageVideoRef}
              autoPlay
              playsInline
              className="w-full h-full max-h-[520px] object-contain bg-black"
            />
          ) : presentationMode === 'whiteboard' ? (
            <div className="w-full p-6 sm:p-8 text-center max-w-xl mx-auto space-y-3.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#9D4EDD]/20 text-[#9D4EDD] border border-[#9D4EDD]/40">
                Slide {whiteboardSlideIndex + 1} / {LESSON_SLIDES.length}
              </span>

              <h3 className="text-lg sm:text-xl font-black text-white">
                {LESSON_SLIDES[whiteboardSlideIndex].title}
              </h3>

              <div className="p-3.5 rounded-2xl bg-[#0D1B2A] border border-[#00E5FF]/40 text-sm font-mono font-bold text-[#00E5FF]">
                {LESSON_SLIDES[whiteboardSlideIndex].content}
              </div>

              <p className="text-xs text-[#ADB5BD] leading-relaxed">
                {LESSON_SLIDES[whiteboardSlideIndex].notes}
              </p>

              <div className="p-2.5 rounded-xl bg-[#1E2D40] text-xs text-[#FFD166] italic">
                Ví dụ: "{LESSON_SLIDES[whiteboardSlideIndex].example}"
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setWhiteboardSlideIndex((prev) => Math.max(0, prev - 1))}
                  disabled={whiteboardSlideIndex === 0}
                  className="px-3 py-1 rounded-xl bg-[#0D1B2A] text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  ← Trước
                </button>
                <button
                  onClick={() =>
                    setWhiteboardSlideIndex((prev) =>
                      Math.min(LESSON_SLIDES.length - 1, prev + 1)
                    )
                  }
                  disabled={whiteboardSlideIndex === LESSON_SLIDES.length - 1}
                  className="px-3 py-1 rounded-xl bg-[#00E5FF] text-[#0D1B2A] text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#131F2E] border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
                <Monitor size={32} />
              </div>
              <div className="max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-white">Chưa Bật Trình Chiếu Màn Hình</h4>
                <p className="text-xs text-[#778DA9] mt-0.5">
                  Bấm nút <strong>"Trình Chiếu"</strong> ở trên để chia sẻ tab học tập hoặc đề thi cho cả nhóm.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={startScreenShare}
                  className="px-3.5 py-1.5 rounded-xl bg-[#00E5FF] text-[#0D1B2A] text-xs font-bold cursor-pointer"
                >
                  Bắt Đầu Trình Chiếu
                </button>
                <button
                  onClick={() => setPresentationMode('whiteboard')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1E2D40] text-white text-xs font-bold cursor-pointer"
                >
                  Mở Bảng Bài Giảng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LOWER SECTION: Participants Grid + Live Real Voice Equalizer + Room Chat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PARTICIPANTS & VOICE VISUALIZER (2 Cols) */}
        <div className="md:col-span-2 space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#162338] border border-[#27384E] space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users size={16} className="text-[#00E5FF]" />
                <span>Thành Viên Tham Gia ({allParticipantsCount})</span>
              </h3>
              <span className="text-xs text-[#06D6A0] font-semibold flex items-center gap-1">
                <Radio size={13} className="animate-pulse" />
                <span>Âm thanh trực tiếp</span>
              </span>
            </div>

            {/* LIVE MICROPHONE VOLUME EQUALIZER */}
            <div className="p-3.5 rounded-2xl bg-[#0D1B2A] border border-[#27384E] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Activity size={14} className="text-[#00E5FF]" />
                  <span>Âm lượng Micro của bạn:</span>
                </span>
                <span className="font-mono text-[11px] text-[#00E5FF]">
                  {isMicOn ? `${micAudioLevel}% (Đang thu âm)` : 'Đã tắt Micro'}
                </span>
              </div>

              {/* Dynamic Equalizer Bar */}
              <div className="flex items-end gap-1 h-7 px-2 py-1 bg-[#162338] rounded-xl overflow-hidden border border-[#27384E]">
                {Array.from({ length: 24 }).map((_, i) => {
                  const factor = Math.sin((i / 24) * Math.PI);
                  const barHeight = isMicOn
                    ? Math.max(8, Math.min(100, micAudioLevel * factor + Math.random() * 6))
                    : 6;

                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-xs transition-all duration-75 ${
                        barHeight > 65
                          ? 'bg-[#EF476F]'
                          : barHeight > 35
                          ? 'bg-[#FFD166]'
                          : 'bg-[#00E5FF]'
                      }`}
                      style={{ height: `${barHeight}%` }}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#778DA9]">
                <span>Nói vào mic để bạn học nghe thấy tiếng bạn</span>
                <button
                  onClick={handleToggleLoopback}
                  className={`font-bold cursor-pointer transition-colors ${
                    isLoopbackEnabled ? 'text-[#06D6A0]' : 'text-[#778DA9] hover:text-white'
                  }`}
                  title="Nghe lại chính giọng của bạn qua tai nghe"
                >
                  {isLoopbackEnabled ? '🎧 Đang bật nghe lại giọng' : '🎧 Thử nghe giọng mình'}
                </button>
              </div>
            </div>

            {/* Participants Video & Audio Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Local User Tile */}
              <div
                className={`p-3 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden ${
                  isMicOn && micAudioLevel > 15
                    ? 'bg-[#183646] border-[#00E5FF] shadow-sm shadow-[#00E5FF]/20'
                    : 'bg-[#0D1B2A] border-[#27384E]'
                }`}
              >
                {isCameraOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-12 h-12 rounded-xl object-cover shrink-0 bg-black"
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-[#0D1B2A] shrink-0"
                    style={{ backgroundColor: currentUser?.avatarColor || '#00E5FF' }}
                  >
                    {currentUser?.displayName?.charAt(0) || 'B'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white truncate">
                      {currentUser?.displayName || 'Bạn'}
                    </h4>
                    <span className="text-[9px] font-black text-[#00E5FF] bg-[#00E5FF]/20 px-1 rounded">
                      BẠN
                    </span>
                  </div>
                  <p className="text-[10px] text-[#778DA9] truncate">
                    {isMicOn ? '🎤 Micro đang mở' : '🔇 Đã tắt mic'}
                  </p>
                </div>

                {isMicOn && micAudioLevel > 15 && (
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 rounded-full bg-[#06D6A0] animate-pulse" />
                    <span className="w-1 h-5 rounded-full bg-[#06D6A0] animate-pulse delay-75" />
                    <span className="w-1 h-2 rounded-full bg-[#06D6A0] animate-pulse delay-150" />
                  </div>
                )}
              </div>

              {/* Remote Peer Tiles */}
              {Array.from(peers.values()).map((p) => (
                <div
                  key={p.uid}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden ${
                    p.isMicOn ? 'bg-[#0D1B2A] border-[#27384E]' : 'bg-[#0D1B2A] border-[#27384E]'
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-[#0D1B2A] shrink-0"
                    style={{ backgroundColor: p.avatarColor || '#9D4EDD' }}
                  >
                    {p.displayName.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate">{p.displayName}</h4>
                      {p.role === 'TEACHER' && (
                        <span className="text-[9px] font-black text-[#9D4EDD] bg-[#9D4EDD]/20 px-1 rounded">
                          GV
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#778DA9] truncate">
                      {p.isMicOn ? '🎤 Đang kết nối âm thanh' : '🔇 Đang tắt mic'}
                    </p>
                  </div>

                  {p.isMicOn && (
                    <span className="w-2 h-2 rounded-full bg-[#06D6A0] animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LIVE ROOM CHAT (1 Col) */}
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#162338] border border-[#27384E] flex flex-col justify-between h-[420px] shadow-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#27384E]">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageSquare size={15} className="text-[#00E5FF]" />
                <span>Trò Chuyện Trực Tuyến</span>
              </h3>
              <span className="text-[10px] text-[#778DA9]">{chatMessages.length} tin nhắn</span>
            </div>

            {/* Messages stream */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-xl ${
                    msg.isSystem
                      ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF]'
                      : msg.uid === currentUser?.uid
                      ? 'bg-[#1E2D40] border border-[#00E5FF]/30 ml-4'
                      : 'bg-[#0D1B2A] border border-[#27384E] mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-extrabold text-white text-[10px]">{msg.sender}</span>
                    <span className="text-[8px] text-[#778DA9]">{msg.time}</span>
                  </div>
                  <p className="text-[#ADB5BD] leading-relaxed text-[11px]">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Quick Reactions */}
            <div className="flex items-center justify-between gap-1 py-1 border-t border-[#27384E]">
              {['👏 Tuyệt', '💡 Hiểu rồi', '🔥 Cố lên', '❓ Hỏi bài'].map((react, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!currentUser) return;
                    const newMsg = {
                      sender: currentUser.displayName || 'Bạn',
                      text: react,
                      time: 'Vừa xong',
                      uid: currentUser.uid
                    };
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.send(
                        JSON.stringify({
                          type: 'chat-message',
                          message: newMsg
                        })
                      );
                    } else {
                      setChatMessages((prev) => [...prev, newMsg]);
                    }
                  }}
                  className="px-1.5 py-0.5 rounded-lg bg-[#0D1B2A] hover:bg-[#1E2D40] text-[9px] font-bold text-[#ADB5BD] hover:text-white transition-all cursor-pointer"
                >
                  {react}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-1.5 pt-1.5">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="Nhắn tin cho cả nhóm..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#0D1B2A] border border-[#27384E] focus:outline-hidden focus:border-[#00E5FF] text-white text-xs placeholder-[#778DA9]"
              />
              <button
                type="submit"
                disabled={!typedMessage.trim()}
                className="px-3 py-1.5 rounded-xl bg-[#00E5FF] text-[#0D1B2A] font-bold text-xs hover:bg-[#38bdf8] transition-all disabled:opacity-40 cursor-pointer"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
