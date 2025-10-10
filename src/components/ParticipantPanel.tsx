import { X, Mic, MicOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ParticipantPanelProps {
  onClose: () => void;
  participants: Participant[];
}

interface Participant {
  id: number | string;
  name: string;
  isMuted?: boolean;
  isHost?: boolean;
}

const ParticipantPanel = ({ onClose, participants }: ParticipantPanelProps) => {

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      <div className="h-14 border-b px-4 flex items-center justify-between">
        <h2 className="font-semibold">Participants ({participants.length})</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{participant.name}</p>
                  {participant.isHost && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Host
                    </span>
                  )}
                </div>
              </div>
              <div>
                {participant.isMuted ? (
                  <MicOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Mic className="w-4 h-4 text-primary" />
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ParticipantPanel;
