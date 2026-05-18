"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { usePathname } from "next/navigation";

interface ChatMessage {
  id: string;
  text: string;
  sender: "customer" | "admin";
  timestamp: number;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("chat_name");
    if (saved) { setName(saved); setNameSet(true); }

    const handler = (e: CustomEvent) => {
      setOpen(true);
      if (e.detail?.message) {
        setTimeout(() => setText(e.detail.message), 300);
      }
    };
    window.addEventListener("open-chat", handler as EventListener);
    return () => window.removeEventListener("open-chat", handler as EventListener);
  }, []);

  useEffect(() => {
    if (!nameSet || !open) return;
    const since = messages.length > 0 ? messages[messages.length - 1].timestamp : 0;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/poll?name=${encodeURIComponent(name)}&since=${since}`);
        const data = await res.json();
        if (data.messages?.length) {
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.id));
            const newOnes = data.messages.filter((m: any) => !existing.has(m.id));
            return [...prev, ...newOnes];
          });
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [nameSet, open, name, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text: text.trim() }),
      });
      const optimistic: ChatMessage = {
        id: "opt-" + Date.now(),
        text: text.trim(),
        sender: "customer",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setText("");
    } catch {}
    setSending(false);
  }

  function handleSetName(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    localStorage.setItem("chat_name", name.trim());
    setNameSet(true);
  }

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-xl transition-transform hover:scale-105"
        style={{ backgroundColor: "var(--brand-button, #111)" }}
        aria-label="Chat"
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            backgroundColor: "var(--brand-primary, #fff)",
            border: "1px solid color-mix(in srgb, var(--brand-text, #111) 15%, transparent)",
            maxHeight: "60vh",
          }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              backgroundColor: "var(--brand-button, #111)",
              color: "var(--brand-primary, #fff)",
            }}
          >
            <span className="text-xs font-bold tracking-widest uppercase">Chat</span>
            <button onClick={() => setOpen(false)} className="text-sm opacity-70 hover:opacity-100">✕</button>
          </div>

          {!nameSet ? (
            <form onSubmit={handleSetName} className="p-4 space-y-3">
              <p className="text-xs opacity-60">Enter your name to start chatting</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--brand-text, #111)20", color: "var(--brand-text, #111)" }}
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-2 text-xs tracking-widest uppercase text-white"
                style={{ backgroundColor: "var(--brand-button, #111)" }}
              >
                Start Chat
              </button>
            </form>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 300, maxHeight: 350 }}>
                {messages.length === 0 && (
                  <p className="text-xs opacity-30 text-center py-8">Send a message to start</p>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        msg.sender === "customer"
                          ? "rounded-br-md"
                          : "rounded-bl-md"
                      }`}
                      style={{
                        backgroundColor: msg.sender === "customer"
                          ? "var(--brand-button, #111)"
                          : "var(--brand-secondary, #f5f5f0)",
                        color: msg.sender === "customer"
                          ? "var(--brand-primary, #fff)"
                          : "var(--brand-text, #111)",
                      }}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p
                        className="text-[10px] mt-1 opacity-50"
                        style={{ color: msg.sender === "customer" ? "inherit" : "var(--brand-text, #111)" }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="p-3 border-t flex gap-2" style={{ borderColor: "var(--brand-text, #111)15" }}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border px-3 py-2 text-sm outline-none rounded-full"
                  style={{ borderColor: "var(--brand-text, #111)20", color: "var(--brand-text, #111)" }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="px-4 py-2 text-xs tracking-widest uppercase text-white rounded-full disabled:opacity-30"
                  style={{ backgroundColor: "var(--brand-button, #111)" }}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
