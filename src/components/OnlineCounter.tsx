import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function OnlineCounter() {
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    // Generate a unique session ID for this visitor
    const sessionId = sessionStorage.getItem("visitorId") || crypto.randomUUID();
    sessionStorage.setItem("visitorId", sessionId);

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: sessionId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setOnlineCount(count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            online_at: new Date().toISOString(),
            session_id: sessionId,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Badge 
      variant="outline" 
      className="gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 border-green-500/20 animate-pulse"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <Users className="h-3.5 w-3.5" />
      <span className="font-medium">{onlineCount.toLocaleString("fa-IR")}</span>
      <span className="text-xs">آنلاین</span>
    </Badge>
  );
}