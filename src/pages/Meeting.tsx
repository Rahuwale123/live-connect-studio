import { useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import VideoGrid, { GridParticipant } from "@/components/VideoGrid";
import MeetingControls from "@/components/MeetingControls";
import ChatPanel from "@/components/ChatPanel";
import ParticipantPanel from "@/components/ParticipantPanel";
import { Button } from "@/components/ui/button";
import useAuthGuard from "@/hooks/use-auth-guard";
import { getToken, getUser, joinMeeting as apiJoin, getChat as apiGetChat, wsUrl, getTurn, endMeeting as apiEndMeeting } from "@/lib/api";

const Meeting = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [presenterId, setPresenterId] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [unread, setUnread] = useState(0);
  const [participants, setParticipants] = useState<GridParticipant[]>([]);
  const [messages, setMessages] = useState<{id:string; sender:string; text:string; time:string; isSelf:boolean}[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [showLeaveOptions, setShowLeaveOptions] = useState(false);
  const [endingMeeting, setEndingMeeting] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<number, RTCPeerConnection>>(new Map());
  const streamsRef = useRef<Map<number, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const participantsRef = useRef<GridParticipant[]>([]);
  const micStateRef = useRef(isMicOn);
  const cameraStateRef = useRef(isCameraOn);
  const rtcServersRef = useRef<any[]>([]);
  const [currentUser, setCurrentUser] = useState(() => getUser());
  const authReady = useAuthGuard();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authReady) {
      setCurrentUser(getUser());
    }
  }, [authReady]);

  const handleCopyCode = async () => {
    try {
      const text = String(code || "");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  // Helper: aggressively try to start all remote audio elements without surfacing UI prompts
  function resumeAllAudio() {
    try {
      const audios = document.querySelectorAll('audio');
      const plays: Promise<unknown>[] = [];
      audios.forEach((element) => {
        const audio = element as HTMLAudioElement;
        try {
          audio.autoplay = true;
          const playAttempt = audio.play?.();
          if (playAttempt && typeof playAttempt.then === "function") {
            plays.push(playAttempt.catch(() => { /* ignore blocked play */ }));
          }
        } catch {
          // ignore playback errors; browser will surface if user interaction is needed
        }
      });
      if (plays.length) {
        Promise.allSettled(plays).catch(() => {});
      }
    } catch {
      // noop
    }
  }

  // On mount, attempt a short retry loop to auto-start audio
  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      resumeAllAudio();
      if (tries >= 6) window.clearInterval(id);
    }, 750);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!code) return;
    const token = getToken();
    if (!token) { navigate('/login'); return; }
    const user = currentUser || getUser();
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    (async () => {
      try {
        const join = await apiJoin(code);
        setIsHost(join.host_id === user.id);
        setParticipants(join.participants.map(p => ({ id: p.id, name: p.name })));
      } catch (e) {
        navigate('/home');
        return;
      }
      // Load chat history (non-fatal if missing)
      try {
        const hist = await apiGetChat(code);
        setMessages(hist.map(h => ({ id: String(h.id), sender: h.name, text: h.message, time: new Date(h.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), isSelf: false })));
      } catch (e) { console.warn('Chat history unavailable', e); }
      // Media: constrain for stability
      let local: MediaStream | null = null;
      try {
        local = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } },
        });
        localStreamRef.current = local;
        // After permissions (gesture), attempt to unlock audio
        resumeAllAudio();
      } catch (err) {
        console.warn('Media permissions not granted or unavailable', err);
        localStreamRef.current = null;
      }

      const effectiveMicOn = local ? isMicOn : false;
      const effectiveCamOn = local ? isCameraOn : false;
      setParticipants(prev => {
        const selfId = user.id;
        const others = prev.filter(p => Number(p.id) !== selfId);
        const selfEntry: GridParticipant = {
          id: selfId,
          name: user.name,
          stream: local ?? undefined,
          isSelf: true,
          isMuted: !effectiveMicOn,
          isCameraOn: effectiveCamOn,
        };
        return [selfEntry, ...others];
      });
      if (!local) {
        setIsMicOn(false);
        setIsCameraOn(false);
      }

      try { const cfg = await getTurn(); rtcServersRef.current = cfg.iceServers || []; } catch {}

      const ws = new WebSocket(wsUrl(code));
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'meeting-ended') { navigate('/home'); return; }
          if (msg.type === 'user-joined' && msg.user) {
            setParticipants(prev => prev.some(p => p.id === msg.user.id) ? prev : [...prev, { id: msg.user.id, name: msg.user.name }]);
            if ((currentUser?.id||0) < msg.user.id) {
              callPeer(msg.user.id);
            }
            resumeAllAudio();
          }
          if (msg.type === 'user-left' && msg.user) {
            setParticipants(prev => prev.filter(p => p.id !== msg.user.id));
            const pc = peersRef.current.get(msg.user.id);
            if (pc) { try { pc.close(); } catch {} peersRef.current.delete(msg.user.id); }
            streamsRef.current.delete(msg.user.id);
            if (presenterId === msg.user.id) setPresenterId(null);
          }
          if (msg.type === 'room-state') {
            const snap = Array.isArray(msg.participants) ? msg.participants : [];
            setParticipants(prev => {
              const map = new Map<number, GridParticipant>();
              [...prev, ...snap.map((p:any) => ({ id: p.id, name: p.name, isMuted: p.mic === false, isCameraOn: p.cam !== false }))].forEach(p => map.set(Number(p.id), { ...map.get(Number(p.id)), ...p } as any));
              const arr = Array.from(map.values());
              const self = arr.find(p => Number(p.id) === (currentUser?.id||0));
              if (self && localStreamRef.current) self.stream = localStreamRef.current;
              return arr;
            });
            if (typeof msg.presenter_id === 'number') setPresenterId(msg.presenter_id);
            // Try initiating to larger-ids after snapshot
            setTimeout(() => {
              const current = participantsRef.current;
              current.forEach(p => { if (!p.isSelf && (currentUser?.id||0) < Number(p.id)) callPeer(Number(p.id)); });
            }, 100);
          }
          if (msg.type === 'screen-share-start') {
            const senderId = typeof msg.sender?.id === "number" ? msg.sender.id : null;
            setPresenterId(senderId);
          }
          if (msg.type === 'screen-share-stop') {
            const senderId = typeof msg.sender?.id === "number" ? msg.sender.id : null;
            setPresenterId((prev) => ((senderId == null || prev === senderId) ? null : prev));
          }
          if (msg.type === 'media') {
            const media = msg.data || {};
            const uid = msg.sender?.id;
            if (uid) setParticipants(prev => prev.map(p => Number(p.id) === Number(uid) ? { ...p, isMuted: media.mic === false, isCameraOn: media.cam !== false } : p));
          }
          if (msg.type === 'chat') {
            const senderId = msg.sender?.id;
            if (senderId && currentUser && senderId === currentUser.id) return; // ignore echo of own message
            const sender = msg.sender?.name || 'User';
            const text = msg.data?.text || '';
            const time = msg.data?.timestamp ? new Date(msg.data.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            setMessages(prev => [...prev, { id: String(prev.length+1), sender, text, time, isSelf: false }]);
            if (!showChat) setUnread((u) => Math.min(99, u + 1));
          }
          const to = msg.data?.to;
          if (to && currentUser && to !== currentUser.id) return;
          if (msg.type === 'offer') handleOffer(msg.sender.id, msg.data.sdp);
          if (msg.type === 'answer') handleAnswer(msg.sender.id, msg.data.sdp);
          if (msg.type === 'ice-candidate') handleCandidate(msg.sender.id, msg.data.candidate);
        } catch {}
      };
      ws.onopen = () => {
        // proactive offers
        const current = participantsRef.current;
        current.forEach(p => { if (!p.isSelf && (currentUser?.id||0) < Number(p.id)) callPeer(Number(p.id)); });
        const audioTracks = localStreamRef.current?.getAudioTracks() || [];
        const videoTracks = localStreamRef.current?.getVideoTracks() || [];
        if (!micStateRef.current || !audioTracks.length || audioTracks.every(t => !t.enabled)) {
          ws.send(JSON.stringify({ type: 'mute', data: {} }));
        }
        if (!cameraStateRef.current || !videoTracks.length || videoTracks.every(t => !t.enabled)) {
          ws.send(JSON.stringify({ type: 'camera-off', data: {} }));
        }
        resumeAllAudio();
      };
    })();
    return () => { try { wsRef.current?.close(); } catch {} };
  }, [code, authReady]);

  // Ensure devices are turned off on tab close/refresh
  useEffect(() => {
    const cleanup = () => {
      try { peersRef.current.forEach((pc) => { try { pc.close(); } catch {} }); peersRef.current.clear(); } catch {}
      try { localStreamRef.current?.getTracks().forEach((t) => { try { t.stop(); } catch {} }); localStreamRef.current = null; } catch {}
      try { screenStreamRef.current?.getTracks().forEach((t) => { try { t.stop(); } catch {} }); screenStreamRef.current = null; } catch {}
      try { wsRef.current?.close(); } catch {}
    };
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, []);

  const handleLeaveMeeting = () => {
    setShowLeaveOptions(false);
    setLeaveError(null);
    setEndingMeeting(false);
    try {
      // Close peer connections
      peersRef.current.forEach((pc) => { try { pc.close(); } catch {} });
      peersRef.current.clear();
      // Stop local camera/mic
      const ls = localStreamRef.current;
      if (ls) {
        ls.getTracks().forEach((t) => {
          try { t.stop(); } catch {}
        });
      }
      localStreamRef.current = null;
      // Stop any active screen share
      const ss = screenStreamRef.current;
      if (ss) {
        ss.getTracks().forEach((t) => {
          try { t.stop(); } catch {}
        });
      }
      screenStreamRef.current = null;
      // Close websocket
      try { wsRef.current?.close(); } catch {}
      // Update UI state to reflect camera off
      setParticipants((prev) => prev.map((p) => p.isSelf ? { ...p, stream: undefined, isCameraOn: false } : p));
    } finally {
      navigate("/home");
    }
  };

  const handleSendChat = (text: string) => {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'chat', data: { text } }));
    setMessages(prev => [...prev, { id: String(prev.length+1), sender: 'You', text, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), isSelf: true }]);
  };

  const handleLeaveClick = () => {
    if (isHost) {
      setLeaveError(null);
      setShowLeaveOptions(true);
    } else {
      handleLeaveMeeting();
    }
  };

  const handleEndForMe = () => {
    handleLeaveMeeting();
  };

  const handleEndForEveryone = async () => {
    if (!code || endingMeeting) return;
    setLeaveError(null);
    setEndingMeeting(true);
    try {
      await apiEndMeeting(code);
      handleLeaveMeeting();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to end meeting for everyone.";
      setLeaveError(message);
    } finally {
      setEndingMeeting(false);
    }
  };

  const handleCancelLeave = () => {
    setShowLeaveOptions(false);
    setLeaveError(null);
  };

  // Reset unread when opening chat
  useEffect(() => { if (showChat) setUnread(0); }, [showChat]);

  // Try to (re)start playback for all videos when participants or streams change
  useEffect(() => {
    try {
      const videos = document.querySelectorAll('video');
      videos.forEach((v: any) => v?.play?.().catch(() => {}));
    } catch {}
  }, [participants]);

  // Try to resume audio on any user gesture (autoplay policies)
  useEffect(() => {
    const resumeAudio = () => {
      try {
        const audios = document.querySelectorAll('audio');
        audios.forEach((element) => {
          const audio = element as HTMLAudioElement;
          try {
            const attempt = audio.play?.();
            attempt?.catch(() => {});
          } catch {
            // ignore
          }
        });
      } catch {}
      // one-shot unlock
      window.removeEventListener('pointerdown', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('click', resumeAudio);
    };
    window.addEventListener('pointerdown', resumeAudio, { once: true });
    window.addEventListener('keydown', resumeAudio, { once: true });
    window.addEventListener('click', resumeAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('click', resumeAudio);
    };
  }, []);

  // WebRTC helpers
  function ensurePC(remoteId: number): RTCPeerConnection {
    let pc = peersRef.current.get(remoteId);
    if (pc) return pc;
    pc = new RTCPeerConnection({ iceServers: rtcServersRef.current, iceTransportPolicy: 'all' });
    // add local tracks
    const local = localStreamRef.current;
    local?.getTracks().forEach(t => pc!.addTrack(t, local));
    setTimeout(() => tunePeerSenders(pc), 0);
    pc.ontrack = (ev) => {
      // Merge tracks into a persistent MediaStream so both audio and video stay attached
      let stream: MediaStream | undefined = (ev.streams && ev.streams[0]) || streamsRef.current.get(remoteId);
      if (!stream) {
        stream = new MediaStream();
      }
      if (!stream.getTracks().includes(ev.track)) {
        try { stream.addTrack(ev.track); } catch {}
      }
      streamsRef.current.set(remoteId, stream);
      setParticipants(prev => prev.map(p => p.id === remoteId ? { ...p, stream, isCameraOn: p.isCameraOn ?? (ev.track.kind === 'video' ? true : p.isCameraOn) } : p));
      // Try to start audio as soon as any track arrives
      resumeAllAudio();
      // react to remote track state to keep UI in sync without refresh
      const tr = ev.track;
      if (tr && tr.kind === 'video') {
        tr.onmute = () => {
          setParticipants(prev => prev.map(p => p.id === remoteId ? { ...p, isCameraOn: false } : p));
        };
        tr.onunmute = () => {
          setParticipants(prev => prev.map(p => p.id === remoteId ? { ...p, isCameraOn: true } : p));
        };
        tr.onended = () => {
          setParticipants(prev => prev.map(p => p.id === remoteId ? { ...p, isCameraOn: false } : p));
        };
      }
    };
    pc.onicecandidate = (ev) => {
      if (ev.candidate) wsRef.current?.send(JSON.stringify({ type: 'ice-candidate', data: { to: remoteId, candidate: ev.candidate } }));
    };
    peersRef.current.set(remoteId, pc);
    return pc;
  }

  function tunePeerSenders(pc: RTCPeerConnection) {
    try {
      pc.getSenders().forEach((sender) => {
        const p = sender.getParameters();
        if (!p.encodings || p.encodings.length === 0) p.encodings = [{} as RTCRtpEncodingParameters];
        if (sender.track?.kind === 'video') {
          const isPresenting = presenterId === (currentUser?.id || 0);
          const maxBitrate = isPresenting ? 1800000 : 650000;
          p.encodings[0].maxBitrate = maxBitrate;
          try { sender.setParameters(p); } catch {}
          try { (sender.track as any).contentHint = isPresenting ? 'detail' : 'motion'; } catch {}
        }
      });
    } catch {}
  }

  // keep latest participants for ws open
  useEffect(() => { participantsRef.current = participants; }, [participants]);

  async function callPeer(remoteId: number) {
    const pc = ensurePC(remoteId);
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    wsRef.current?.send(JSON.stringify({ type: 'offer', data: { to: remoteId, sdp: offer } }));
  }

  async function handleOffer(remoteId: number, offer: any) {
    const pc = ensurePC(remoteId);
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    wsRef.current?.send(JSON.stringify({ type: 'answer', data: { to: remoteId, sdp: answer } }));
  }

  async function handleAnswer(remoteId: number, answer: any) {
    const pc = peersRef.current.get(remoteId);
    if (!pc) return;
    await pc.setRemoteDescription(answer);
  }

  async function handleCandidate(remoteId: number, candidate: any) {
    const pc = peersRef.current.get(remoteId);
    if (!pc || !candidate) return;
    try { await pc.addIceCandidate(candidate); } catch {}
  }

  // React to mic/camera toggles
  useEffect(() => {
    micStateRef.current = isMicOn;
    const local = localStreamRef.current;
    if (!local) return;
    local.getAudioTracks().forEach(t => t.enabled = isMicOn);
    setParticipants(prev => prev.map(p => p.isSelf ? { ...p, isMuted: !isMicOn } : p));
  }, [isMicOn]);

  useEffect(() => {
    cameraStateRef.current = isCameraOn;
    const local = localStreamRef.current;
    if (!local) return;
    local.getVideoTracks().forEach(t => t.enabled = isCameraOn);
    setParticipants(prev => prev.map(p => p.isSelf ? { ...p, isCameraOn } : p));
  }, [isCameraOn]);

  useEffect(() => {
    async function doShare() {
      if (isScreenSharing) {
        try {
          const screen = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 24, max: 30 } }, audio: false });
          screenStreamRef.current = screen;
          const track = screen.getVideoTracks()[0];
          try { (track as any).contentHint = 'detail'; } catch {}
          peersRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(track);
            tunePeerSenders(pc);
          });
          // update local preview
          setParticipants(prev => prev.map(p => p.isSelf ? { ...p, stream: new MediaStream([track, ...(localStreamRef.current?.getAudioTracks()||[])]) } : p));
          track.onended = () => setIsScreenSharing(false);
          setPresenterId(currentUser?.id || null);
          wsRef.current?.send(JSON.stringify({ type: 'screen-share-start', data: {} }));
        } catch { setIsScreenSharing(false); }
      } else {
        // restore camera
        const cam = localStreamRef.current?.getVideoTracks()[0];
        if (cam) {
          try { (cam as any).contentHint = 'motion'; } catch {}
          peersRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(cam);
            tunePeerSenders(pc);
          });
          setParticipants(prev => prev.map(p => p.isSelf ? { ...p, stream: localStreamRef.current || p.stream } : p));
          try { screenStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
        }
        if (presenterId === (currentUser?.id || null)) setPresenterId(null);
        wsRef.current?.send(JSON.stringify({ type: 'screen-share-stop', data: {} }));
      }
      // Try to keep audio alive across transitions
      resumeAllAudio();
    }
    doShare();
    // resume video playback if needed
    setTimeout(() => { try { document.querySelectorAll('video').forEach((v:any)=>v?.play?.().catch(()=>{})); } catch {} }, 0);
  }, [isScreenSharing]);

  useEffect(() => { try { peersRef.current.forEach((pc)=>tunePeerSenders(pc)); } catch {} }, [presenterId, isCameraOn]);

  // keep participants ref fresh for ws open usage
  useEffect(() => { participantsRef.current = participants; }, [participants]);

  if (!authReady) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold">Meeting</h1>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-muted rounded-md text-sm font-mono select-all">{code}</div>
            <button
              onClick={handleCopyCode}
              title="Copy meeting code"
              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-secondary hover:bg-secondary/80 border border-border"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <VideoGrid
            participants={participants}
            isScreenSharing={!!presenterId}
            screenShare={presenterId ? {
              stream: presenterId === (currentUser?.id||0) ? (screenStreamRef.current || localStreamRef.current!) : (streamsRef.current.get(presenterId) || new MediaStream()),
              ownerName: participants.find(p => Number(p.id) === presenterId)?.name || 'Presenter',
              isSelf: presenterId === (currentUser?.id||0),
              onStop: () => setIsScreenSharing(false),
            } : null}
          />
          
          <MeetingControls
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
            showChat={showChat}
            showParticipants={showParticipants}
            onToggleCamera={() => { const next = !isCameraOn; setIsCameraOn(next); wsRef.current?.send(JSON.stringify({ type: next ? 'camera-on' : 'camera-off', data: {} })); }}
            onToggleMic={() => { const next = !isMicOn; setIsMicOn(next); wsRef.current?.send(JSON.stringify({ type: next ? 'unmute' : 'mute', data: {} })); }}
            onToggleScreenShare={() => setIsScreenSharing(!isScreenSharing)}
            onToggleChat={() => setShowChat(!showChat)}
            onToggleParticipants={() => setShowParticipants(!showParticipants)}
            onLeaveMeeting={handleLeaveClick}
            unreadCount={unread}
          />
        </div>

        {showChat && <ChatPanel onClose={() => setShowChat(false)} messages={messages} onSend={handleSendChat} />}
        {showParticipants && <ParticipantPanel onClose={() => setShowParticipants(false)} participants={participants} />}
      </div>
      {showLeaveOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div>
              <h2 className="text-lg font-semibold">End meeting?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose whether to leave just for yourself or end the meeting for everyone.
              </p>
            </div>
            {leaveError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {leaveError}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" onClick={handleCancelLeave} disabled={endingMeeting}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleEndForMe} disabled={endingMeeting}>
                End for me
              </Button>
              <Button variant="destructive" onClick={handleEndForEveryone} disabled={endingMeeting}>
                {endingMeeting ? "Ending…" : "End for everyone"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meeting;
