import { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatPanelProps {
  onClose: () => void;
  messages: Message[];
  onSend: (text: string) => void;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSelf: boolean;
}

const ChatPanel = ({ onClose, messages, onSend }: ChatPanelProps) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) { onSend(message.trim()); setMessage(""); }
  };

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      <div className="h-14 border-b px-4 flex items-center justify-between">
        <h2 className="font-semibold">Chat</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}>
              <div className={`max-w-[80%] ${msg.isSelf ? "order-1" : ""}`}>
                <div className="text-xs text-muted-foreground mb-1">
                  {msg.sender} • {msg.time}
                </div>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    msg.isSelf
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!message.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
