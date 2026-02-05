"use client";

import { useCallback } from "react";
import { ChatInterface } from "@/components/chat-interface";

export default function ChatPage() {
  const sendMessage = useCallback(async (message: string): Promise<string> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data.reply ?? "No response.";
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          AI Genie
        </h1>
        <p className="text-slate-400 mt-1">
          Natural language queries over your SRE monitoring data
        </p>
      </div>
      <ChatInterface onSend={sendMessage} />
    </div>
  );
}
