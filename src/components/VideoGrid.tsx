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
  screenShare?: { stream: MediaStream; ownerName: string; isSelf?: boolean; onStop?: () => void } | null;
}

const VideoGrid = ({ participants, isScreenSharing, screenShare }: VideoGridProps) => {
  // Single participant layout: center a large 16:9 tile like Google Meet
  if (!screenShare && participants.length === 1) {
    const p = participants[0];
    return (
      <div className="flex-1 flex items-center justify-center bg-black pt-12 pb-36" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="w-full max-w-6xl px-4">
          <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black my-6 md:my-8">
            <VideoTile participant={p} />
          </div>
        </div>
      </div>
    );
  }

  // Two participants: render side-by-side tiles (no PiP)
  if (!screenShare && participants.length === 2) {
    return (
      <div className="flex-1 bg-black pt-12 pb-36 flex items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="w-full max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 xl:gap-8">
            {participants.map((p) => (
              <div key={p.id} className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black my-6 md:my-8">
                <VideoTile participant={p} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screenShare) {
    // Presentation layout: large shared screen + right filmstrip
    return (
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-black pb-24">
        <div className="flex-1 p-2 md:p-4 overflow-hidden relative">
          <div className="w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <video autoPlay playsInline controls={false} className="w-full h-full object-contain bg-black" ref={(el) => { if (el && el.srcObject !== screenShare.stream) el.srcObject = screenShare.stream; }} />
            {/* Presenter banner */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/10 text-white text-sm rounded-md backdrop-blur">
              {screenShare.ownerName} (presenting)
            </div>
            {/* Stop presenting button if self */}
            {screenShare.isSelf && (
              <button onClick={screenShare.onStop} className="absolute top-4 right-4 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-full shadow">
                Stop presenting
              </button>
            )}
          </div>
        </div>
        <aside className="md:w-72 md:p-4 md:pl-0 w-full p-2 md:overflow-y-auto overflow-x-auto">
          <div className="hidden md:flex md:flex-col md:space-y-3">
            {participants.map((p) => (
              <div key={p.id} className="w-full aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 shadow">
              <VideoTile participant={p} />
              </div>
            ))}
          </div>
          <div className="md:hidden flex gap-3 no-scrollbar">
            {participants.map((p) => (
              <div key={p.id} className="w-44 flex-shrink-0 aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 shadow">
                <VideoTile participant={p} />
              </div>
            ))}
          </div>
        </aside>
      </div>
    );
  }

  // Regular grid layout
  const n = participants.length;
  const gridClass = n <= 1 ? "grid-cols-1" : n === 2 ? "grid-cols-2" : n <= 4 ? "grid-cols-2" : "grid-cols-3";
  return (
    <div className="flex-1 p-2 md:p-4 overflow-y-auto bg-black pb-24">
      <div className={`grid ${gridClass} gap-4 h-full auto-rows-fr`}>
        {participants.map((p) => (
          <VideoTile key={p.id} participant={p} />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
