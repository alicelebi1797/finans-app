import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, X, Send, Bot, User, Sparkles, Minus } from "lucide-react";
import { Input } from "@/components/ui-elements";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Merhaba! Finansal asistanınım. Gelir/gider analizi, birikim tavsiyeleri veya bütçe yönetimi hakkında sorularınızı yanıtlayabilirim." }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");
    chatMutation.mutate(userMsg, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: 'assistant', content: "Bir hata oluştu. Lütfen tekrar deneyin." }]);
      }
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="glass rounded-2xl shadow-2xl w-80 md:w-96 overflow-hidden border border-border/50 flex flex-col" style={{ height: '480px' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-primary/5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Finansal Asistan</p>
                <p className="text-xs text-muted-foreground">GPT-4o</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Minus className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-secondary/10">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn("flex gap-2 max-w-[88%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5",
                  msg.role === 'user' ? "bg-primary text-white" : "bg-card border border-border text-primary"
                )}>
                  {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                <div className={cn(
                  "px-3 py-2 rounded-xl text-xs leading-relaxed",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border/50 rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-2 max-w-[80%] mr-auto">
                <div className="w-6 h-6 rounded-full bg-card border border-border text-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="px-3 py-2 bg-card border border-border/50 rounded-xl rounded-tl-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border/50">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input
                placeholder="Mesajınızı yazın..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="flex-1 text-xs py-2 h-9"
                disabled={chatMutation.isPending}
              />
              <button
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        data-testid="chat-widget-toggle"
        className={cn(
          "w-12 h-12 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center",
          open
            ? "bg-secondary text-foreground hover:bg-secondary/80"
            : "bg-primary text-white hover:bg-primary/90 shadow-primary/25 hover:scale-110"
        )}
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>
    </div>
  );
}
