import { User } from "lucide-react";
import VideoTile from "./VideoTile";

interface VideoGridProps {
  isCameraOn: boolean;
  isScreenSharing: boolean;
}

const VideoGrid = ({ isCameraOn, isScreenSharing }: VideoGridProps) => {
  // Mock participants data
  const participants = [
    { id: "1", name: "You", isMuted: false, isCameraOn },
    { id: "2", name: "Alex Johnson", isMuted: false, isCameraOn: true },
    { id: "3", name: "Sarah Smith", isMuted: true, isCameraOn: true },
    { id: "4", name: "Mike Chen", isMuted: false, isCameraOn: false },
  ];

  const gridClass = isScreenSharing
    ? "grid-cols-1"
    : participants.length === 1
    ? "grid-cols-1"
    : participants.length === 2
    ? "grid-cols-2"
    : participants.length <= 4
    ? "grid-cols-2"
    : "grid-cols-3";

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {isScreenSharing ? (
        <div className="h-full space-y-4">
          <div className="h-3/4 bg-secondary rounded-xl flex items-center justify-center shadow-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Screen being shared</p>
            </div>
          </div>
          <div className="h-1/4 grid grid-cols-4 gap-3">
            {participants.slice(0, 4).map((participant) => (
              <VideoTile key={participant.id} participant={participant} />
            ))}
          </div>
        </div>
      ) : (
        <div className={`grid ${gridClass} gap-4 h-full auto-rows-fr`}>
          {participants.map((participant) => (
            <VideoTile key={participant.id} participant={participant} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
