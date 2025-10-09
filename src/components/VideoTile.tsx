import { Mic, MicOff, User } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isCameraOn: boolean;
}

interface VideoTileProps {
  participant: Participant;
}

const VideoTile = ({ participant }: VideoTileProps) => {
  return (
    <div className="relative bg-secondary rounded-xl overflow-hidden shadow-md group">
      <div className="absolute inset-0 flex items-center justify-center">
        {participant.isCameraOn ? (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        ) : (
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
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
