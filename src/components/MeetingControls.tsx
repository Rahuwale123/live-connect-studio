import { Video, VideoOff, Mic, MicOff, MonitorUp, MessageSquare, Users, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MeetingControlsProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  showChat: boolean;
  showParticipants: boolean;
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
}: MeetingControlsProps) => {
  return (
    <TooltipProvider>
      <div className="h-20 bg-card border-t px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Meeting in progress</span>
        </div>

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
                className="rounded-full w-12 h-12"
                onClick={onToggleChat}
              >
                <MessageSquare className="w-5 h-5" />
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

        <div className="w-24" />
      </div>
    </TooltipProvider>
  );
};

export default MeetingControls;
