import VideoTile from "./VideoTile";

export interface GridParticipant {
  id: number | string;
  name: string;
  isMuted?: boolean;
  isCameraOn?: boolean;
  stream?: MediaStream;
  isSelf?: boolean;
}

interface VideoGridProps {
  participants: GridParticipant[];
  isScreenSharing: boolean;
  screenShare?: { stream: MediaStream; ownerName: string } | null;
}

const VideoGrid = ({ participants, isScreenSharing, screenShare }: VideoGridProps) => {
  if (screenShare) {
    // Presentation layout: large shared screen + filmstrip
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-4 pb-2 overflow-hidden">
          <div className="w-full h-full bg-secondary rounded-xl overflow-hidden shadow-md">
            <video autoPlay playsInline controls={false} className="w-full h-full object-contain" ref={(el) => { if (el && el.srcObject !== screenShare.stream) el.srcObject = screenShare.stream; }} />
            <div className="absolute m-4 px-2 py-1 bg-black/50 text-white text-xs rounded">{screenShare.ownerName} is presenting</div>
          </div>
        </div>
        <div className="p-3 pt-0">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {participants.map((p) => (
              <div key={p.id} className="w-[220px] h-[140px] flex-shrink-0">
                <VideoTile participant={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Regular grid layout
  const n = participants.length;
  const gridClass = n <= 1 ? "grid-cols-1" : n === 2 ? "grid-cols-2" : n <= 4 ? "grid-cols-2" : "grid-cols-3";
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className={`grid ${gridClass} gap-4 h-full auto-rows-fr`}>
        {participants.map((p) => (
          <VideoTile key={p.id} participant={p} />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
