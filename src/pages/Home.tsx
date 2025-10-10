import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Plus, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMeeting, joinMeeting, getUser, getToken } from "@/lib/api";

const Home = () => {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const handleCreateMeeting = async () => {
    setError(null);
    try {
      if (!getToken()) { navigate('/login'); return; }
      const resp = await createMeeting();
      navigate(`/meeting/${resp.meeting_id}`);
    } catch (e: any) { setError(e.message || 'Failed to create'); }
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = meetingCode.trim();
    if (!code) return;
    try {
      if (!getToken()) { navigate('/login'); return; }
      await joinMeeting(code);
      navigate(`/meeting/${code}`);
    } catch (err: any) { setError(err.message || 'Failed to join'); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Video className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">VideoMeet</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/login")}>
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Video Meetings for Everyone
            </h1>
            <p className="text-lg text-muted-foreground">
              Connect, collaborate and celebrate from anywhere with VideoMeet
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>New Meeting</CardTitle>
                <CardDescription>Start an instant meeting</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateMeeting} className="w-full" size="lg">
                  Create Meeting
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                  <LogIn className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Join Meeting</CardTitle>
                <CardDescription>Enter a meeting code</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinMeeting} className="space-y-3">
                  <Input
                    placeholder="Enter meeting code"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    className="text-center"
                  />
                  <Button type="submit" variant="outline" className="w-full" size="lg">
                    Join
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          {error && <p className="text-sm text-destructive mt-4 text-center">{error}</p>}
        </div>
      </main>
    </div>
  );
};

export default Home;
