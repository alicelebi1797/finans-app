import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, Input, Button } from "@/components/ui-elements";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Merhaba! Ben yapay zeka destekli finansal asistanınım. Harcamalarınızı analiz edebilir, bütçe tavsiyesi verebilir veya finansal hedefleriniz hakkında konuşabilirim. Nasıl yardımcı olabilirim?" }
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
      if (!res.ok) throw new Error('Chat failed');
      return res.json();
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        setMessages(prev => [...prev, { role: 'assistant', content: "Bağlantı kurarken bir hata oluştu. Lütfen tekrar deneyin." }]);
      }
    });
  };

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-64px)] flex flex-col">
      <header className="mb-6 flex items-center gap-3">
        <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
          <Sparkles size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Finansal Asistan</h1>
          <p className="text-muted-foreground text-sm">GPT-4o ile güçlendirildi</p>
        </div>
      </header>

      <Card className="flex-1 flex flex-col p-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-5 bg-secondary/10"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                msg.role === 'user' ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-card border border-border text-primary"
              )}>
                {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user'
                  ? "bg-primary text-primary-foreground rounded-tr-sm shadow-md"
                  : "bg-card border border-border/50 rounded-tl-sm"
              )}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-card border border-border text-primary flex items-center justify-center flex-shrink-0">
                <Bot size={15} />
              </div>
              <div className="px-4 py-3 bg-card border border-border/50 rounded-2xl rounded-tl-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/50">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              placeholder="Finansal durumunuz hakkında soru sorun..."
              value={input}
              onChange={e => setInput(e.target.value)}
              data-testid="input-chat"
              className="flex-1"
              disabled={chatMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              data-testid="button-send-chat"
              disabled={!input.trim() || chatMutation.isPending}
            >
              <Send size={17} />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
