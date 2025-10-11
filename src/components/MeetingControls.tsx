import { Video, VideoOff, Mic, MicOff, MonitorUp, MessageSquare, Users, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MeetingControlsProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  showChat: boolean;
  showParticipants: boolean;
  unreadCount?: number;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onLeaveMeeting: () => void;
}

const MeetingControls = ({
  isCameraOn,
  isMicOn,
  isScreenSharing,
  showChat,
  showParticipants,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onLeaveMeeting,
  unreadCount = 0,
}: MeetingControlsProps) => {
  return (
    <TooltipProvider>
      {/* Floating controls bar (Meet-style) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-3 md:px-4 py-2.5 md:py-3 bg-card/95 backdrop-blur border border-border rounded-full shadow-xl flex items-center gap-2">
        {/* Controls cluster */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMicOn ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={onToggleMic}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMicOn ? "Turn off microphone" : "Turn on microphone"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCameraOn ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={onToggleCamera}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isCameraOn ? "Turn off camera" : "Turn on camera"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={onToggleScreenShare}
              >
                <MonitorUp className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isScreenSharing ? "Stop sharing" : "Share screen"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showChat ? "default" : "secondary"}
                size="icon"
                className="rounded-full w-12 h-12 relative"
                onClick={onToggleChat}
              >
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5 py-0.5 leading-none">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showParticipants ? "default" : "secondary"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={onToggleParticipants}
              >
                <Users className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Participants</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-12 h-12 ml-4"
                onClick={onLeaveMeeting}
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Leave meeting</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MeetingControls;
