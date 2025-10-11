import { useEffect, useRef } from "react";
import { Mic, MicOff, User } from "lucide-react";

interface TileParticipant {
  id: number | string;
  name: string;
  stream?: MediaStream;
  isMuted?: boolean;
  isCameraOn?: boolean;
  isSelf?: boolean;
}

interface VideoTileProps {
  participant: TileParticipant;
  playAudio?: boolean;
}

const VideoTile = ({ participant, playAudio = true }: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ensure srcObject binds on mount and when camera state toggles
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (participant.stream && participant.isCameraOn !== false) {
      if (el.srcObject !== participant.stream) {
        el.srcObject = participant.stream;
      }
      // Attempt to play in case the element was re-rendered
      el.play?.().catch(() => {});
    } else {
      // Pause when camera is off (saves resources); keep stream reference intact
      try { el.pause?.(); } catch {}
    }
  }, [participant.stream, participant.isCameraOn]);

  // Bind hidden audio element to remote streams for playback
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!participant.isSelf && playAudio && participant.stream) {
      if (a.srcObject !== participant.stream) a.srcObject = participant.stream as any;
      a.autoplay = true;
      a.muted = !!participant.isMuted;
      a.play?.().catch(()=>{});
    } else {
      try { a.pause?.(); } catch {}
    }
  }, [participant.stream, participant.isSelf, participant.isMuted, playAudio]);

  const showAvatar = !participant.stream || participant.isCameraOn === false;

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl w-full h-full ring-1 ring-white/20 ring-offset-1 ring-offset-black/40">
      <div className="absolute inset-0 flex items-center justify-center">
        {showAvatar ? (
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true}
            className="w-full h-full object-cover"
            style={{ transform: participant.isSelf ? 'scaleX(-1)' : 'none', transformOrigin: 'center center' }}
          />
        )}
      </div>

      {/* Bottom-left name pill */}
      <div className="absolute left-3 bottom-3">
        <span className="px-2.5 py-1 bg-black/60 text-white text-xs rounded-md backdrop-blur-sm">
          {participant.name}
        </span>
      </div>
      {/* Top-right mic status */}
      <div className="absolute right-3 top-3">
        {participant.isMuted ? (
          <div className="p-1.5 bg-black/60 rounded-full">
            <MicOff className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="p-1.5 bg-black/60 rounded-full">
            <Mic className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      {!participant.isSelf && <audio ref={audioRef} className="hidden" />}
    </div>
  );
};

export default VideoTile;
