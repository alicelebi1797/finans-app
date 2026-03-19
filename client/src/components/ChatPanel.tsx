import { useState, useRef, useEffect } from "react";
import { Bot, User, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  onClose: () => void;
  initialMessage?: string;
}

export function ChatPanel({ onClose, initialMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>(() => {
    const first = initialMessage
      ? initialMessage
      : "Merhaba! Finansal asistanınım. Size nasıl yardımcı olabilirim?";
    return [{ role: 'assistant', content: first }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Bir hata oluştu.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Finansal Asistan</p>
            <p className="text-xs text-muted-foreground">GPT-4o</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex gap-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            <div className={cn("max-w-[82%] px-3 py-2 rounded-xl text-sm leading-relaxed",
              msg.role === 'user'
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-secondary rounded-tl-sm"
            )}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <div className="bg-secondary px-3 py-2 rounded-xl rounded-tl-sm flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-border/50 pb-8">
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Mesajınızı yazın..."
            disabled={loading}
            className="flex-1 rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50 flex-shrink-0 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
}
