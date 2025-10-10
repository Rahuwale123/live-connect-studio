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
}

const VideoTile = ({ participant }: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  const showAvatar = !participant.stream || participant.isCameraOn === false;

  return (
    <div className="relative bg-secondary rounded-xl overflow-hidden shadow-md group">
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

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium truncate">{participant.name}</span>
          <div className="flex-shrink-0">
            {participant.isMuted ? (
              <div className="p-1.5 bg-destructive rounded-full">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="p-1.5 bg-primary rounded-full">
                <Mic className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-3 left-3">
        <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-md backdrop-blur-sm">
          {participant.name}
        </span>
      </div>
    </div>
  );
};

export default VideoTile;
