import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import VideoGrid from "@/components/VideoGrid";
import MeetingControls from "@/components/MeetingControls";
import ChatPanel from "@/components/ChatPanel";
import ParticipantPanel from "@/components/ParticipantPanel";

const Meeting = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const handleLeaveMeeting = () => {
    navigate("/home");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold">Meeting</h1>
          <div className="px-3 py-1 bg-muted rounded-md text-sm font-mono">{code}</div>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <VideoGrid
            isCameraOn={isCameraOn}
            isScreenSharing={isScreenSharing}
          />
          
          <MeetingControls
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
            showChat={showChat}
            showParticipants={showParticipants}
            onToggleCamera={() => setIsCameraOn(!isCameraOn)}
            onToggleMic={() => setIsMicOn(!isMicOn)}
            onToggleScreenShare={() => setIsScreenSharing(!isScreenSharing)}
            onToggleChat={() => setShowChat(!showChat)}
            onToggleParticipants={() => setShowParticipants(!showParticipants)}
            onLeaveMeeting={handleLeaveMeeting}
          />
        </div>

        {showChat && <ChatPanel onClose={() => setShowChat(false)} />}
        {showParticipants && <ParticipantPanel onClose={() => setShowParticipants(false)} />}
      </div>
    </div>
  );
};

export default Meeting;
