import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ListChecks, Wallet, Moon, Sun, LogOut, TrendingUp, BarChart3, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ChatWidget } from "./ChatWidget";
import { SettingsPanel } from "./SettingsPanel";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: me } = useQuery<{ isAdmin?: boolean; displayName?: string; username?: string }>({
    queryKey: ['/api/auth/me'],
    queryFn: () => fetch('/api/auth/me').then(r => r.json()),
    staleTime: Infinity,
  });

  const isAdmin = me?.isAdmin ?? false;
  const displayName = me?.displayName || me?.username || 'Kullanıcı';

  const logoutMutation = useMutation({
    mutationFn: () => fetch('/api/auth/logout', { method: 'POST' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] })
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Anasayfa" },
    { href: "/management", icon: ListChecks, label: "Yönetim" },
    { href: "/wallet", icon: Wallet, label: "Cüzdan" },
    { href: "/reports", icon: BarChart3, label: "Raporlar" },
    { href: "/future-months", icon: CalendarDays, label: "Gelecek" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/50 bg-card/30 dark:bg-black/30 backdrop-blur-xl p-6 z-50 fixed h-full">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-display font-bold text-lg tracking-tight block leading-none">Akıllı Finans</span>
            <span className="text-xs text-muted-foreground truncate">{displayName}</span>
          </div>
          {isAdmin && (
            <button
              data-testid="button-open-settings"
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
              title="Kullanıcı Yönetimi"
            >
              <Settings size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <item.icon size={19} className="transition-transform group-hover:scale-110 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 pt-4 border-t border-border/50">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-sm font-medium"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}</span>
          </button>
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-sm font-medium"
          >
            <LogOut size={17} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-0 min-h-screen">
        <header className="md:hidden flex items-center justify-between p-4 bg-card/70 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
          <button
            data-testid="button-mobile-logo"
            onClick={() => isAdmin && setSettingsOpen(true)}
            className={cn("flex items-center gap-2", isAdmin && "cursor-pointer")}
          >
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-base block leading-tight">Akıllı Finans</span>
              <span className="text-xs text-muted-foreground">{displayName}</span>
            </div>
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-secondary text-foreground">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav — 5 items */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 z-50">
        <div className="flex items-center justify-around px-1 py-1.5">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl min-w-[52px] transition-all",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                <div className={cn("p-1.5 rounded-full transition-all", isActive && "bg-primary/10")}>
                  <item.icon size={20} />
                </div>
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Chat Widget - Desktop floating */}
      <div className="hidden md:block">
        <ChatWidget />
      </div>

      {/* Settings Panel */}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
