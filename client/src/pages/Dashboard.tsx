import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useState, useRef } from 'react';
import { OnboardingHint } from '@/components/OnboardingHint';
import {
  CheckCircle2, Bot, RefreshCw, Bell, DollarSign, Euro, Coins,
  TrendingDown, Home, Zap, Wifi, ShoppingCart, Phone, Car,
  Utensils, GraduationCap, Heart, Shirt, Monitor, Music, Plane, Hammer, Package,
  CreditCard, Landmark, Wallet, Plus, X, Pencil, Trash2
} from 'lucide-react';
import { Card, Badge } from '@/components/ui-elements';
import { SwipeRow } from '@/components/SwipeRow';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ChatPanel } from '@/components/ChatPanel';
import { cn } from '@/lib/utils';

const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

const categoryIcons = [Home, Zap, Wifi, ShoppingCart, Phone, Car, Utensils, GraduationCap, Heart, Shirt, Monitor, Music, Plane, Hammer, Package];
const getCategoryIcon = (title: string, idx: number) => {
  const t = title.toLowerCase();
  if (t.includes('kira') || t.includes('ev')) return Home;
  if (t.includes('elektrik') || t.includes('fatura')) return Zap;
  if (t.includes('internet') || t.includes('wifi')) return Wifi;
  if (t.includes('market') || t.includes('alışveriş')) return ShoppingCart;
  if (t.includes('telefon') || t.includes('gsm')) return Phone;
  if (t.includes('araba') || t.includes('araç') || t.includes('yakıt')) return Car;
  if (t.includes('yemek') || t.includes('restoran')) return Utensils;
  if (t.includes('okul') || t.includes('eğitim')) return GraduationCap;
  if (t.includes('sağlık') || t.includes('ilaç')) return Heart;
  if (t.includes('giyim')) return Shirt;
  if (t.includes('netflix') || t.includes('dizi') || t.includes('oyun')) return Monitor;
  if (t.includes('müzik') || t.includes('spotify')) return Music;
  if (t.includes('tatil') || t.includes('uçak')) return Plane;
  return categoryIcons[idx % categoryIcons.length];
};

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const fmtDay = (day: number) => {
  const now = new Date();
  return `${day} ${TR_MONTHS[now.getMonth()]}`;
};

const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors';

export default function Dashboard() {
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitMsg, setChatInitMsg] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({ title: '', amount: '', day: '' });
  const [editModal, setEditModal] = useState<{ id: number; type: string; ep: string; qk: string; title: string; amount: string; day: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ ep: string; qk: string; id: number; name: string } | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState<{ id: number; title: string; amount: number; endpoint: string; key: string; receivedAmount: number } | null>(null);
  const [partialInput, setPartialInput] = useState('');
  const [cardPayModal, setCardPayModal] = useState<{ id: number; cardName: string; amount: number; paidAmount: number } | null>(null);
  const [cardPayInput, setCardPayInput] = useState('');

  const today = new Date();
  const currentDay = today.getDate();

  const harcamaRef = useRef<HTMLDivElement>(null);
  const giderlerRef = useRef<HTMLDivElement>(null);
  const gelirlerRef = useRef<HTMLDivElement>(null);
  const kambiyoRef = useRef<HTMLDivElement>(null);

  const { data: authUser } = useQuery({ queryKey: ['/api/auth/me'] });
  const userId = (authUser as any)?.id as number | undefined;
  const { data: fixedExpenses = [] } = useQuery({ queryKey: ['/api/fixed-expenses'], queryFn: () => fetch('/api/fixed-expenses', { credentials: 'include' }).then(r => r.json()) });
  const { data: variableExpenses = [] } = useQuery({ queryKey: ['/api/variable-expenses'], queryFn: () => fetch('/api/variable-expenses', { credentials: 'include' }).then(r => r.json()) });
  const { data: creditCards = [] } = useQuery({ queryKey: ['/api/credit-cards'], queryFn: () => fetch('/api/credit-cards', { credentials: 'include' }).then(r => r.json()) });
  const { data: loans = [] } = useQuery({ queryKey: ['/api/loans'], queryFn: () => fetch('/api/loans', { credentials: 'include' }).then(r => r.json()) });
  const { data: fixedIncomes = [] } = useQuery({ queryKey: ['/api/fixed-incomes'], queryFn: () => fetch('/api/fixed-incomes', { credentials: 'include' }).then(r => r.json()) });
  const { data: variableIncomes = [] } = useQuery({ queryKey: ['/api/variable-incomes'], queryFn: () => fetch('/api/variable-incomes', { credentials: 'include' }).then(r => r.json()) });
  const { data: expectedIncomes = [] } = useQuery({ queryKey: ['/api/expected-incomes'], queryFn: () => fetch('/api/expected-incomes', { credentials: 'include' }).then(r => r.json()) });
  const { data: rates } = useQuery({ queryKey: ['/api/exchange-rates'], queryFn: () => fetch('/api/exchange-rates', { credentials: 'include' }).then(r => r.json()), staleTime: 5 * 60 * 1000 });
  const { data: savingsTxns = [] } = useQuery({ queryKey: ['/api/savings-transactions'], queryFn: () => fetch('/api/savings-transactions', { credentials: 'include' }).then(r => r.json()) });

  const totalIncome = [
    ...(fixedIncomes as any[]).map(i => i.amount),
    ...(variableIncomes as any[]).map(i => i.amount),
    ...(expectedIncomes as any[]).filter(i => (i as any).isApproved).map(i => (i as any).amount),
  ].reduce((a, b) => a + b, 0);

  const receivedIncome = [
    ...(fixedIncomes as any[]).filter(i => i.isReceived).map(i => i.amount),
    ...(fixedIncomes as any[]).filter(i => !i.isReceived && (i.receivedAmount ?? 0) > 0).map(i => i.receivedAmount),
    ...(variableIncomes as any[]).filter(i => i.isReceived).map(i => i.amount),
    ...(variableIncomes as any[]).filter(i => !i.isReceived && (i.receivedAmount ?? 0) > 0).map(i => i.receivedAmount),
    ...(expectedIncomes as any[]).filter(i => i.isApproved).map(i => i.amount),
  ].reduce((a, b) => a + b, 0);

  const projectedIncome = receivedIncome;

  const paidExpenses = [
    ...(fixedExpenses as any[]).filter(e => e.isPaid).map(e => e.amount),
    ...(variableExpenses as any[]).filter(e => e.isPaid).map(e => e.amount),
    ...(creditCards as any[]).map(e => e.paidAmount ?? 0),
    ...(loans as any[]).filter(l => l.isPaid).map(l => l.monthlyPayment),
  ].reduce((a, b) => a + b, 0);

  const totalExpenses = [
    ...(fixedExpenses as any[]).map(e => e.amount),
    ...(variableExpenses as any[]).map(e => e.amount),
    ...(creditCards as any[]).map(e => e.amount),
    ...(loans as any[]).map(l => l.monthlyPayment),
  ].reduce((a, b) => a + b, 0);

  const totalSavingsTLDeducted = (savingsTxns as any[]).filter((t: any) => !t.isOffRecord).reduce((s: number, t: any) => s + (t.amountTl ?? t.amountTL ?? 0), 0);

  const cashAdjustment = (authUser as any)?.cashAdjustment ?? 0;
  const cashOnHand = receivedIncome - paidExpenses - totalSavingsTLDeducted + cashAdjustment;
  const projectedNet = totalIncome - totalExpenses - totalSavingsTLDeducted;

  const pendingIncomes = [
    ...(fixedIncomes as any[]).filter(i => !i.isReceived && i.day <= currentDay).map(i => ({ ...i, endpoint: '/api/fixed-incomes', key: '/api/fixed-incomes' })),
    ...(variableIncomes as any[]).filter(i => !i.isReceived && i.expectedDay && i.expectedDay <= currentDay).map(i => ({ ...i, endpoint: '/api/variable-incomes', key: '/api/variable-incomes' })),
  ];

  const toggleIncomeMutation = useMutation({
    mutationFn: async ({ endpoint, id, isReceived }: any) =>
      fetch(`${endpoint}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ isReceived }) }).then(r => r.json()),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: [key] });
      setApproveModal(null);
      setPartialInput('');
    }
  });

  const partialIncomeMutation = useMutation({
    mutationFn: async ({ endpoint, id, receivedAmount }: any) =>
      fetch(`${endpoint}/${id}/partial`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ receivedAmount }) }).then(r => r.json()),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: [key] });
      setApproveModal(null);
      setPartialInput('');
    }
  });

  const toggleExpenseMutation = useMutation({
    mutationFn: async ({ endpoint, id, isPaid }: any) =>
      fetch(`${endpoint}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ isPaid }) }).then(r => r.json()),
    onSuccess: (_, { key }) => queryClient.invalidateQueries({ queryKey: [key] })
  });

  const cardPayMutation = useMutation({
    mutationFn: async ({ id, isPaid, paidAmount }: { id: number; isPaid: boolean; paidAmount: number }) =>
      fetch(`/api/credit-cards/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ isPaid, paidAmount }) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credit-cards'] });
      setCardPayModal(null);
      setCardPayInput('');
    }
  });

  const quickAddMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/variable-expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify(data)
    }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/variable-expenses'] });
      setQuickAddOpen(false);
      setQuickForm({ title: '', amount: '' });
    }
  });

  const editExpenseMutation = useMutation({
    mutationFn: ({ ep, id, data }: any) => fetch(`${ep}/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify(data)
    }).then(r => r.json()),
    onSuccess: (_, { qk }) => {
      queryClient.invalidateQueries({ queryKey: [qk] });
      setEditModal(null);
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: ({ ep, id }: any) => fetch(`${ep}/${id}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: (_, { qk }) => queryClient.invalidateQueries({ queryKey: [qk] })
  });

  const isOverdue  = (e: any) => !e.isPaid && e.day != null && e.day < currentDay;
  const isUpcoming = (e: any) => !e.isPaid && e.day != null && e.day >= currentDay && (e.day - currentDay) <= 5;

  const allExpensesRaw = [
    ...(fixedExpenses as any[]).map((e, i) => ({ ...e, day: e.day, type: 'fixed', endpoint: '/api/fixed-expenses', key: '/api/fixed-expenses', Icon: getCategoryIcon(e.title, i), colorCls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' })),
    ...(variableExpenses as any[]).map((e, i) => ({ ...e, day: e.day, type: 'variable', endpoint: '/api/variable-expenses', key: '/api/variable-expenses', Icon: getCategoryIcon(e.title, i), colorCls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' })),
    ...(creditCards as any[]).map(c => ({ ...c, day: c.paymentDay, title: c.cardName, amount: c.amount, type: 'card', endpoint: '/api/credit-cards', key: '/api/credit-cards', Icon: CreditCard, colorCls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' })),
    ...(loans as any[]).map(l => ({ ...l, day: l.lastPaymentDate, amount: l.monthlyPayment, type: 'loan', endpoint: '/api/loans', key: '/api/loans', Icon: Landmark, colorCls: 'bg-primary/10 text-primary' })),
    ...(savingsTxns as any[])
      .filter((t: any) => (t.amountTl ?? t.amountTL ?? 0) > 0 && !t.isOffRecord)
      .map((t: any) => ({
        ...t,
        type: 'savings',
        amount: t.amountTl ?? t.amountTL ?? 0,
        day: t.date ? new Date(t.date).getDate() : null,
        isPaid: true,
        endpoint: null,
        key: null,
        Icon: Coins,
        colorCls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        isSavings: true,
      })),
  ];

  const allExpenses = [
    ...allExpensesRaw.filter(e => !e.isPaid).sort((a, b) => a.day - b.day),
    ...allExpensesRaw.filter(e => e.isPaid),
  ];

  const getAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const prompt = `Kullanıcının finansal durumu:
- Eldeki Para: ${fmt(cashOnHand)}
- Tahmini Net: ${fmt(projectedNet)}
- Toplam gider: ${fmt(totalExpenses)}, Ödenen: ${fmt(paidExpenses)}
Kısa, pratik 2-3 cümlelik Türkçe tavsiye ver.`;
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ message: prompt }) });
      const data = await res.json();
      setAiAnalysis(data.response);
    } catch { setAiAnalysis('Analiz sırasında hata oluştu.'); }
    setAiLoading(false);
  };

  const openEditModal = (exp: any) => {
    setEditModal({
      id: exp.id,
      type: exp.type,
      ep: exp.endpoint,
      qk: exp.key,
      title: exp.title,
      amount: String(exp.amount),
      day: String(exp.day ?? ''),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Anasayfa</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {today.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Pending income alerts */}
      {pendingIncomes.length > 0 && (
        <Card className="border-amber-300/50 dark:border-amber-700/40 bg-amber-50/40 dark:bg-amber-900/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Bu miktar hesabına geçti mi?</p>
          </div>
          <div className="space-y-2">
            {pendingIncomes.map((inc: any) => {
              const received = inc.receivedAmount ?? 0;
              const remaining = inc.amount - received;
              const isPartial = received > 0;
              return (
              <div key={`${inc.endpoint}-${inc.id}`} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{inc.title}</p>
                  {isPartial ? (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      <span className="text-emerald-600 dark:text-emerald-400">{fmt(received)} alındı</span>
                      {' · '}
                      <span className="text-amber-600 dark:text-amber-400">{fmt(remaining)} bekleniyor</span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground tabular-nums">{fmt(inc.amount)}</p>
                  )}
                </div>
                <button
                  data-testid={`button-approve-income-${inc.id}`}
                  onClick={() => { setApproveModal({ id: inc.id, title: inc.title, amount: inc.amount, endpoint: inc.endpoint, key: inc.key, receivedAmount: received }); setPartialInput(''); }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition-colors flex-shrink-0">
                  {isPartial ? 'Kalan Geçti?' : 'Evet, geçti'}
                </button>
              </div>
            );
            })}
          </div>
        </Card>
      )}

      {/* Harcama — full width */}
      <div ref={harcamaRef}>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm text-muted-foreground">Kalan Para</p>
          <Badge variant={projectedNet >= 0 ? "success" : "destructive"} className="text-xs">
            {projectedNet >= 0 ? '↑ Pozitif' : '↓ Negatif'}
          </Badge>
        </div>
        <p className={cn("text-4xl font-bold tracking-tight tabular-nums", projectedNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
          {fmt(projectedNet)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Gelir - Gider - Birikim = Net Kalan</p>
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-rose-500" /> Toplam Gider
            </span>
            <span className="font-medium tabular-nums text-rose-600 dark:text-rose-400">-{fmt(totalExpenses)}</span>
          </div>
          {totalSavingsTLDeducted > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Coins className="w-3 h-3 text-emerald-500" /> Birikimler
              </span>
              <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">-{fmt(totalSavingsTLDeducted)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3 h-3" /> Eldeki Para
            </span>
            <span className="font-semibold tabular-nums text-foreground">{fmt(cashOnHand)}</span>
          </div>
        </div>
      </Card>
      <OnboardingHint stepId="dash_harcama" userId={userId} watchRef={harcamaRef}
        title="Kalan Para"
        text="Bu kart aylık net kalanınızı gösterir: Toplam Gelir − Gider − Birikim = Net Kalan. Ay sonunda pozitif kalmak için giderleri takip edin. En altta bugünkü eldeki nakit paranız yer alır." />
      </div>

      {/* Expense List */}
      {(allExpenses.length > 0 || true) && (
        <div ref={giderlerRef}>
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Bu Ay Giderlerim</h3>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setQuickAddOpen(true)}
                data-testid="quick-add-expense"
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
                <Plus size={12} /> Harcama Ekle
              </button>
              {allExpensesRaw.filter(e => isOverdue(e)).length > 0 && (
                <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                  {allExpensesRaw.filter(e => isOverdue(e)).length} gecikmiş
                </span>
              )}
              <span className="text-xs text-muted-foreground">{allExpensesRaw.filter(e => e.isPaid && !e.isSavings).length}/{allExpensesRaw.filter(e => !e.isSavings).length}</span>
            </div>
          </div>
          {allExpenses.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Henüz gider eklenmemiş. "Harcama Ekle" ile başlayın.
            </div>
          )}
          <div className="divide-y divide-border/30">
            {allExpenses.map((exp) => {
              const overdue  = isOverdue(exp);
              const upcoming = isUpcoming(exp);
              return (
                <SwipeRow
                  key={`${exp.type}-${exp.id}`}
                  id={`exp-${exp.type}-${exp.id}`}
                  openRowId={openRowId}
                  setOpenRowId={setOpenRowId}
                  onEdit={exp.isSavings ? undefined : () => openEditModal(exp)}
                  onDelete={exp.isSavings ? undefined : () => setDeleteConfirm({ ep: exp.endpoint, qk: exp.key, id: exp.id, name: exp.title })}
                  hideDesktopActions
                >
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-all",
                    exp.isPaid && !exp.isSavings ? "opacity-40" : !exp.isPaid ? "hover:bg-secondary/20" : "",
                    exp.isSavings && "opacity-60",
                    overdue  && "bg-rose-500/5 border-l-2 border-l-rose-500",
                    upcoming && !overdue && "bg-amber-500/5 border-l-2 border-l-amber-400",
                  )}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      overdue ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : exp.colorCls
                    )}>
                      <exp.Icon size={15} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={cn("text-sm font-medium truncate", (exp.isPaid && !exp.isSavings) && "line-through text-muted-foreground")}>{exp.title}</p>
                        {exp.isSavings && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex-shrink-0">BİRİKİM</span>
                        )}
                        {exp.type === 'card' && exp.isPaid && (() => {
                          const paid = exp.paidAmount ?? 0;
                          const full = paid >= exp.amount;
                          return full
                            ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex-shrink-0">TAMAMI ÖDENDİ</span>
                            : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 flex-shrink-0">ASGARİ ÖDENDİ</span>;
                        })()}
                        {exp.type === 'card' && !exp.isPaid && (exp.paidAmount ?? 0) > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 flex-shrink-0">KISMİ ÖDENDİ</span>
                        )}
                        {overdue && !exp.isPaid && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500 text-white flex-shrink-0">GECİKMİŞ</span>
                        )}
                        {upcoming && !exp.isPaid && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-700 dark:text-amber-300 flex-shrink-0">YAKLAŞAN</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {exp.type === 'card' && !exp.isPaid && (exp.paidAmount ?? 0) > 0 ? (
                          <p className="text-xs tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                            {fmt(exp.amount - (exp.paidAmount ?? 0))} kalan
                          </p>
                        ) : (
                          <p className={cn("text-xs tabular-nums", overdue ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-muted-foreground")}>{fmt(exp.amount)}</p>
                        )}
                        {exp.type === 'card' && !exp.isPaid && (() => {
                          const paid = exp.paidAmount ?? 0;
                          const updatedMin = Math.max(0, Math.ceil(exp.amount * 0.4) - paid);
                          return updatedMin > 0
                            ? <span className="text-[11px] text-muted-foreground">· Asg. {fmt(updatedMin)}</span>
                            : null;
                        })()}
                        {exp.day && (
                          <span className={cn("text-[11px] tabular-nums",
                            overdue  ? "text-rose-500 dark:text-rose-400 font-semibold" :
                            upcoming ? "text-amber-600 dark:text-amber-400 font-medium" :
                            "text-muted-foreground"
                          )}>· {fmtDay(exp.day)}</span>
                        )}
                      </div>
                    </div>

                    {!exp.isSavings && (
                      <div className="hidden md:flex items-center gap-0.5 flex-shrink-0 mr-1">
                        <button
                          onClick={e => { e.stopPropagation(); openEditModal(exp); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                          data-testid={`edit-exp-${exp.id}`}>
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteConfirm({ ep: exp.endpoint, qk: exp.key, id: exp.id, name: exp.title }); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          data-testid={`delete-exp-${exp.id}`}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                    {!exp.isSavings ? (
                      <button
                        data-testid={`toggle-exp-${exp.id}`}
                        onClick={() => {
                          if (exp.type === 'card') {
                            if (exp.isPaid) {
                              cardPayMutation.mutate({ id: exp.id, isPaid: false, paidAmount: 0 });
                            } else {
                              setCardPayModal({ id: exp.id, cardName: exp.title, amount: exp.amount, paidAmount: exp.paidAmount ?? 0 });
                              setCardPayInput('');
                            }
                          } else {
                            toggleExpenseMutation.mutate({ endpoint: exp.endpoint, id: exp.id, isPaid: !exp.isPaid, key: exp.key });
                          }
                        }}
                        className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                          exp.isPaid ? "bg-emerald-500 border-emerald-500 text-white" :
                          overdue    ? "border-rose-400 hover:bg-rose-500 hover:border-rose-500 hover:text-white" :
                          "border-border hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        )}>
                        {exp.isPaid && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}
                  </div>
                </SwipeRow>
              );
            })}
          </div>
        </Card>
        <OnboardingHint stepId="dash_giderler" userId={userId} watchRef={giderlerRef}
          title="Bu Ay Giderlerim"
          text="Sabit ve değişken tüm giderleriniz listelenir. 'Harcama Ekle' ile anlık harcama ekleyebilirsiniz. Ödeme yaptığınızda satıra tıklayarak ödendi olarak işaretleyin." />
        </div>
      )}

      {/* AI Analysis */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="font-semibold">Finansal Danışman</h3>
          </div>
          <button onClick={getAiAnalysis} disabled={aiLoading} data-testid="get-ai-analysis"
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 disabled:opacity-50 font-medium transition-colors">
            <RefreshCw className={cn("w-3.5 h-3.5", aiLoading && "animate-spin")} />
            {aiLoading ? 'Analiz ediliyor...' : 'Analiz Et'}
          </button>
        </div>
        <button
          data-testid="ai-analysis-open-chat"
          onClick={() => {
            const msg = aiAnalysis || (cashOnHand > 0
              ? `Eldeki paranız ${fmt(cashOnHand)}. Tahmini net ${fmt(projectedNet)}. Sorularınızı sorabilirsiniz.`
              : 'Merhaba! Finansal asistanınım. Size nasıl yardımcı olabilirim?');
            setChatInitMsg(msg);
            setChatOpen(true);
          }}
          className="w-full text-left group"
        >
          <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-foreground transition-colors">
            {aiAnalysis || (
              <span className="italic">
                {cashOnHand > 0
                  ? `Eldeki paranız ${fmt(cashOnHand)}. Tahmini net ${fmt(projectedNet)}. Detaylı analiz için butona tıklayın.`
                  : 'Gelir ve gider ekleyerek finansal analizinizi başlatın.'
                }
              </span>
            )}
          </p>
          <p className="text-xs text-primary/60 mt-2 group-hover:text-primary transition-colors">Sohbet başlatmak için tıklayın →</p>
        </button>
      </Card>

      {/* Exchange rates */}
      <div ref={kambiyoRef}>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3.5">
          <p className="font-semibold text-sm">Döviz Kurları</p>
          {(rates as any)?.updatedAt && (
            <span className="text-xs text-muted-foreground">
              {new Date((rates as any).updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Dolar', suffix: 'USD', value: (rates as any)?.usd, icon: DollarSign, iconCls: 'text-green-600 dark:text-green-400', bgCls: 'bg-green-500/10' },
            { label: 'Euro', suffix: 'EUR', value: (rates as any)?.eur, icon: Euro, iconCls: 'text-blue-600 dark:text-blue-400', bgCls: 'bg-blue-500/10' },
            { label: 'Gram Altın', suffix: 'XAU', value: (rates as any)?.gold, icon: Coins, iconCls: 'text-amber-600 dark:text-amber-400', bgCls: 'bg-amber-500/10' },
          ].map(r => (
            <div key={r.label} className="flex flex-col items-center gap-2 rounded-xl bg-secondary/40 py-3 px-2">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', r.bgCls)}>
                <r.icon className={cn('w-4 h-4', r.iconCls)} />
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">{r.label}</span>
              <span className="font-bold text-sm tabular-nums leading-tight text-center">
                {r.value ? `₺${r.value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </span>
            </div>
          ))}
        </div>
      </Card>
      <OnboardingHint stepId="dash_kambiyo" userId={userId} watchRef={kambiyoRef}
        title="Döviz Kurları"
        text="Anlık USD, EUR ve gram altın kurları burada listelenir. Cüzdan sayfasındaki döviz ve altın birikimleriniz bu kurlarla otomatik TL'ye çevrilir." />
      </div>

      {/* Quick Add Expense Modal */}
      {quickAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]"
          onClick={() => setQuickAddOpen(false)}>
          <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">Hızlı Harcama Ekle</h3>
              <button onClick={() => setQuickAddOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Harcama Adı</label>
                <input data-testid="input-expense-title" className={inp} placeholder="Örn: Akşam yemeği" value={quickForm.title}
                  onChange={e => setQuickForm(p => ({ ...p, title: e.target.value }))} autoFocus />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Tutar (₺)</label>
                  <input data-testid="input-expense-amount" className={inp} type="number" placeholder="0" value={quickForm.amount}
                    onChange={e => setQuickForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="w-24">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Gün</label>
                  <input data-testid="input-expense-day" className={inp} type="number" min="1" max="31" placeholder={String(currentDay)} value={quickForm.day}
                    onChange={e => setQuickForm(p => ({ ...p, day: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setQuickAddOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
                  İptal
                </button>
                <button
                  onClick={() => {
                    if (!quickForm.title || !quickForm.amount) return;
                    quickAddMutation.mutate({ title: quickForm.title, amount: +quickForm.amount, day: quickForm.day ? +quickForm.day : currentDay });
                  }}
                  disabled={!quickForm.title || !quickForm.amount || quickAddMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {quickAddMutation.isPending ? '...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]"
          onClick={() => setEditModal(null)}>
          <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">Gider Düzenle</h3>
              <button onClick={() => setEditModal(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Ad</label>
                <input className={inp} value={editModal.title}
                  onChange={e => setEditModal(p => p ? { ...p, title: e.target.value } : null)} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Tutar (₺)</label>
                  <input className={inp} type="number" value={editModal.amount}
                    onChange={e => setEditModal(p => p ? { ...p, amount: e.target.value } : null)} />
                </div>
                {editModal.type !== 'loan' && editModal.type !== 'card' && (
                  <div className="w-24">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Gün</label>
                    <input className={inp} type="number" min="1" max="31" value={editModal.day}
                      onChange={e => setEditModal(p => p ? { ...p, day: e.target.value } : null)} />
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
                  İptal
                </button>
                <button
                  onClick={() => {
                    if (!editModal) return;
                    const data = editModal.type === 'loan'
                      ? { monthlyPayment: +editModal.amount }
                      : editModal.type === 'card'
                      ? { amount: +editModal.amount, cardName: editModal.title }
                      : { title: editModal.title, amount: +editModal.amount, ...(editModal.day ? { day: +editModal.day } : {}) };
                    editExpenseMutation.mutate({ ep: editModal.ep, id: editModal.id, qk: editModal.qk, data });
                  }}
                  disabled={editExpenseMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {editExpenseMutation.isPending ? '...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Income Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]"
          onClick={() => setApproveModal(null)}>
          <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-base">Hesaba Geçiş</h3>
              <button onClick={() => setApproveModal(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{approveModal.title} · {fmt(approveModal.amount)}</p>

            {/* Full approval */}
            <button
              data-testid="button-full-approve"
              onClick={() => toggleIncomeMutation.mutate({ endpoint: approveModal.endpoint, id: approveModal.id, isReceived: true, key: approveModal.key })}
              disabled={toggleIncomeMutation.isPending}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors mb-4">
              {toggleIncomeMutation.isPending ? '...' : 'Tamamı Hesaba Geçti'}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">veya</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Partial approval */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  {approveModal.receivedAmount > 0
                    ? `Kalan: ${fmt(approveModal.amount - approveModal.receivedAmount)} · Bu kısımdan ne kadarı geçti?`
                    : 'Ne kadar hesaba geçti? (TL)'}
                </label>
                <input
                  data-testid="input-partial-amount"
                  type="number"
                  className={inp}
                  placeholder={`Örn: ${Math.round(approveModal.amount / 2).toLocaleString('tr-TR')}`}
                  value={partialInput}
                  onChange={e => setPartialInput(e.target.value)}
                  autoFocus
                />
                {partialInput && Number(partialInput) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Kalan: <span className="font-medium text-amber-600 dark:text-amber-400">
                      {fmt(approveModal.amount - (approveModal.receivedAmount + Number(partialInput)))}
                    </span> bekleniyor olarak görünecek
                  </p>
                )}
              </div>
              <button
                data-testid="button-partial-approve"
                onClick={() => {
                  const total = approveModal.receivedAmount + Number(partialInput);
                  if (!partialInput || Number(partialInput) <= 0) return;
                  if (total >= approveModal.amount) {
                    toggleIncomeMutation.mutate({ endpoint: approveModal.endpoint, id: approveModal.id, isReceived: true, key: approveModal.key });
                  } else {
                    partialIncomeMutation.mutate({ endpoint: approveModal.endpoint, id: approveModal.id, receivedAmount: total, key: approveModal.key });
                  }
                }}
                disabled={!partialInput || Number(partialInput) <= 0 || partialIncomeMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 disabled:opacity-50 transition-colors border border-primary/20">
                {partialIncomeMutation.isPending ? '...' : 'Bu Kadarı Geçti →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Payment Modal */}
      {cardPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]"
          onClick={() => setCardPayModal(null)}>
          <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-base">Kart Ödemesi</h3>
              <button onClick={() => setCardPayModal(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            {(() => {
              const existing = cardPayModal.paidAmount;
              const remaining = cardPayModal.amount - existing;
              const origMin = Math.ceil(cardPayModal.amount * 0.4);
              const updatedMin = Math.max(0, origMin - existing);
              const addVal = Number(cardPayInput) || 0;
              const newTotal = existing + addVal;
              return (
                <>
                  <p className="text-sm text-muted-foreground mb-1">{cardPayModal.cardName}</p>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/40 text-sm">
                      <span className="text-muted-foreground">Ekstre borcu</span>
                      <span className="font-bold tabular-nums">{fmt(cardPayModal.amount)}</span>
                    </div>
                    {existing > 0 && (
                      <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm">
                        <span className="text-amber-700 dark:text-amber-300">Ödenen</span>
                        <span className="font-bold tabular-nums text-amber-700 dark:text-amber-300">-{fmt(existing)}</span>
                      </div>
                    )}
                    {existing > 0 && (
                      <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/60 text-sm">
                        <span className="text-muted-foreground font-medium">Kalan borç</span>
                        <span className="font-bold tabular-nums">{fmt(remaining)}</span>
                      </div>
                    )}
                  </div>
                  {updatedMin > 0 && (
                    <div className="flex items-center gap-3 mb-4 py-2 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                      <CreditCard size={14} className="flex-shrink-0" />
                      <span>Asgari ödeme tutarı: <span className="font-bold">{fmt(updatedMin)}</span> (%40)</span>
                    </div>
                  )}

                  {/* Full payment */}
                  <button
                    data-testid="button-card-full-pay"
                    onClick={() => cardPayMutation.mutate({ id: cardPayModal.id, isPaid: true, paidAmount: cardPayModal.amount })}
                    disabled={cardPayMutation.isPending}
                    className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors mb-4">
                    {cardPayMutation.isPending ? '...' : existing > 0 ? `Kalan ${fmt(remaining)}'yi Ödedim` : 'Tamamını Ödedim'}
                  </button>

                  <div className="relative flex items-center gap-3 mb-4">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-muted-foreground">veya</span>
                    <div className="flex-1 border-t border-border" />
                  </div>

                  {/* Partial payment */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                        {existing > 0 ? `Ek ödeme tutarı (₺) · Kalan: ${fmt(remaining)}` : 'Şu kadarını ödedim (₺)'}
                      </label>
                      <input
                        data-testid="input-card-pay-amount"
                        type="number"
                        className={inp}
                        placeholder={`Örn: ${Math.round(remaining / 2).toLocaleString('tr-TR')}`}
                        value={cardPayInput}
                        onChange={e => setCardPayInput(e.target.value)}
                        autoFocus
                      />
                      {cardPayInput && addVal > 0 && (() => {
                        if (newTotal >= cardPayModal.amount) {
                          return <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">Tamamı ödenmiş sayılacak</p>;
                        } else if (newTotal >= origMin) {
                          return <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium">Asgari ödeme karşılandı — üstü çizilecek</p>;
                        } else {
                          return <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">Kalan asgari: <span className="font-bold">{fmt(origMin - newTotal)}</span> — üstü çizilmeyecek</p>;
                        }
                      })()}
                    </div>
                    <button
                      data-testid="button-card-partial-pay"
                      onClick={() => {
                        if (!cardPayInput || addVal <= 0) return;
                        if (newTotal >= cardPayModal.amount) {
                          cardPayMutation.mutate({ id: cardPayModal.id, isPaid: true, paidAmount: cardPayModal.amount });
                        } else if (newTotal >= origMin) {
                          cardPayMutation.mutate({ id: cardPayModal.id, isPaid: true, paidAmount: newTotal });
                        } else {
                          cardPayMutation.mutate({ id: cardPayModal.id, isPaid: false, paidAmount: newTotal });
                        }
                      }}
                      disabled={!cardPayInput || addVal <= 0 || cardPayMutation.isPending}
                      className="w-full py-2.5 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 disabled:opacity-50 transition-colors border border-primary/20">
                      {cardPayMutation.isPending ? '...' : 'Bu Kadarını Ödedim →'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteConfirm}
        message={`"${deleteConfirm?.name}" giderini silmek istediğinizden emin misiniz?`}
        onConfirm={() => { if (deleteConfirm) { deleteExpenseMutation.mutate({ ep: deleteConfirm.ep, qk: deleteConfirm.qk, id: deleteConfirm.id }); setDeleteConfirm(null); } }}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Chat Popup */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center md:p-4"
          onClick={() => setChatOpen(false)}>
          <div
            className="w-full md:max-w-md bg-card rounded-t-3xl md:rounded-2xl flex flex-col shadow-2xl border border-border overflow-hidden"
            style={{ height: '88vh', maxHeight: '640px' }}
            onClick={e => e.stopPropagation()}
          >
            <ChatPanel onClose={() => setChatOpen(false)} initialMessage={chatInitMsg} />
          </div>
        </div>
      )}
    </div>
  );
}
