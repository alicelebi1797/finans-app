import { useState, useEffect, useRef } from 'react';
import { OnboardingHint } from '@/components/OnboardingHint';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import {
  Plus, CheckCircle2, CreditCard, Wallet, Copy, Check,
  Home, Zap, Wifi, ShoppingCart, Phone, Car, Utensils, GraduationCap,
  Heart, Shirt, Monitor, Music, Plane, Package,
  TrendingUp, TrendingDown, Briefcase, Banknote, Gift, Clock, Landmark,
  BarChart2, AlertTriangle, Pencil, Trash2, X
} from 'lucide-react';
import { SwipeRow } from '@/components/SwipeRow';
import { ConfirmModal } from '@/components/ConfirmModal';
import { cn } from '@/lib/utils';

const fmt = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
const fmtInput = (n: number) => String(Math.round(n));

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const fmtDay = (day: number) => `${day} ${TR_MONTHS[new Date().getMonth()]}`;

const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors';
const lbl = 'text-xs font-medium block mb-1 text-muted-foreground';

const getExpenseIcon = (title: string, idx: number) => {
  const t = title.toLowerCase();
  const icons = [Home, Zap, Wifi, ShoppingCart, Phone, Car, Utensils, GraduationCap, Heart, Shirt, Monitor, Music, Plane, Package];
  if (t.includes('kira') || t.includes('ev')) return Home;
  if (t.includes('elektrik') || t.includes('fatura')) return Zap;
  if (t.includes('internet') || t.includes('wifi')) return Wifi;
  if (t.includes('market') || t.includes('alışveriş')) return ShoppingCart;
  if (t.includes('telefon') || t.includes('gsm')) return Phone;
  if (t.includes('araba') || t.includes('araç') || t.includes('yakıt')) return Car;
  if (t.includes('yemek') || t.includes('restoran')) return Utensils;
  if (t.includes('okul') || t.includes('eğitim') || t.includes('kurs')) return GraduationCap;
  if (t.includes('sağlık') || t.includes('ilaç')) return Heart;
  if (t.includes('giyim')) return Shirt;
  if (t.includes('netflix') || t.includes('dizi') || t.includes('oyun')) return Monitor;
  if (t.includes('müzik') || t.includes('spotify')) return Music;
  if (t.includes('tatil') || t.includes('uçak')) return Plane;
  return icons[idx % icons.length];
};

const getIncomeIcon = (title: string, idx: number) => {
  const icons = [Briefcase, Banknote, Gift, TrendingUp, Landmark, Heart, Clock];
  const t = title.toLowerCase();
  if (t.includes('maaş') || t.includes('ücret')) return Briefcase;
  if (t.includes('kira')) return Home;
  if (t.includes('faiz') || t.includes('temettü')) return TrendingUp;
  if (t.includes('emekli')) return Landmark;
  if (t.includes('hediye') || t.includes('bağış')) return Gift;
  return icons[idx % icons.length];
};

const getCardAccent = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('garanti')) return 'bg-green-600';
  if (n.includes('akbank')) return 'bg-rose-600';
  if (n.includes('yapı kredi') || n.includes('yapi kredi')) return 'bg-blue-700';
  if (n.includes('iş bankası') || n.includes('isbank') || n.includes('işbankası')) return 'bg-blue-900';
  if (n.includes('ziraat')) return 'bg-red-700';
  if (n.includes('halk')) return 'bg-green-700';
  if (n.includes('vakıf') || n.includes('vakif')) return 'bg-purple-700';
  if (n.includes('deniz')) return 'bg-cyan-600';
  if (n.includes('qnb') || n.includes('finansbank')) return 'bg-violet-700';
  return 'bg-primary';
};

const getCardGradient = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('garanti')) return 'from-green-700 via-green-600 to-emerald-500';
  if (n.includes('akbank')) return 'from-rose-700 via-rose-600 to-red-500';
  if (n.includes('yapı kredi') || n.includes('yapi kredi')) return 'from-blue-800 via-blue-700 to-blue-500';
  if (n.includes('iş bankası') || n.includes('isbank') || n.includes('işbankası')) return 'from-slate-900 via-blue-900 to-blue-800';
  if (n.includes('ziraat')) return 'from-red-800 via-red-700 to-rose-600';
  if (n.includes('halk')) return 'from-green-800 via-green-700 to-teal-600';
  if (n.includes('vakıf') || n.includes('vakif')) return 'from-purple-800 via-purple-700 to-violet-600';
  if (n.includes('deniz')) return 'from-cyan-700 via-cyan-600 to-sky-500';
  if (n.includes('qnb') || n.includes('finansbank')) return 'from-violet-800 via-violet-700 to-purple-600';
  return 'from-primary/90 via-primary to-primary/80';
};

type ModalType = 'income' | 'expense' | 'card' | 'loan' | 'expected-income' | null;

const initForm = (type: ModalType, e: any = {}) => {
  switch (type) {
    case 'income': return { title: e.title || '', amount: e.amount || '', day: e.day || '1' };
    case 'expense': return { title: e.title || '', amount: e.amount || '', day: e.day || '1' };
    case 'expected-income': return { title: e.title || '', amount: e.amount || '', expectedDay: e.expectedDay || '' };
    case 'card': return { cardName: e.cardName || '', cardHolder: e.cardHolder || '', cardNumber: e.cardNumber || '', cardExpiry: e.cardExpiry || '', cvv: e.cvv || '', amount: e.amount || '', paymentDay: e.paymentDay || '1' };
    case 'loan': {
      let endDate = e.endDate || '';
      if (!endDate && e.remainingInstallments > 0) {
        const d = new Date(); d.setMonth(d.getMonth() + e.remainingInstallments);
        endDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      return { title: e.title || '', monthlyPayment: e.monthlyPayment || '', lastPaymentDate: e.lastPaymentDate || '1', endDate, ibanForPayment: e.ibanForPayment || '' };
    }
    default: return {};
  }
};

export default function Management() {
  const [modal, setModal] = useState<ModalType>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({});
  const [pinModal, setPinModal] = useState<{ id: number; pin: string; error: boolean; purpose?: string } | null>(null);
  const [cardInfoModal, setCardInfoModal] = useState<any | null>(null);
  const [cardInfoEditMode, setCardInfoEditMode] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [cardInfoEditForm, setCardInfoEditForm] = useState<any>({});
  const [copiedCardNumber, setCopiedCardNumber] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ ep: string; qk: string; id: number; name: string } | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [cashEditMode, setCashEditMode] = useState(false);
  const [cashInput, setCashInput] = useState('');
  const [distForm, setDistForm] = useState({ aliBank: '0', kubraBank: '0', nakit: '0' });
  const [distSlots, setDistSlots] = useState<{ label: string; amount: number }[]>([]);
  const [distEditMode, setDistEditMode] = useState(false);
  const [distEditLabels, setDistEditLabels] = useState<string[]>([]);

  const { data: authUser } = useQuery({ queryKey: ['/api/auth/me'] });
  const userId = (authUser as any)?.id as number | undefined;

  const gelirlerRef = useRef<HTMLDivElement>(null);
  const giderlerRef = useRef<HTMLDivElement>(null);
  const kartlarRef = useRef<HTMLDivElement>(null);
  const { data: fixedExpenses = [] } = useQuery({ queryKey: ['/api/fixed-expenses'], queryFn: () => fetch('/api/fixed-expenses', { credentials: 'include' }).then(r => r.json()) });
  const { data: variableExpenses = [] } = useQuery({ queryKey: ['/api/variable-expenses'], queryFn: () => fetch('/api/variable-expenses', { credentials: 'include' }).then(r => r.json()) });
  const { data: creditCards = [] } = useQuery({ queryKey: ['/api/credit-cards'], queryFn: () => fetch('/api/credit-cards', { credentials: 'include' }).then(r => r.json()) });
  const { data: loans = [] } = useQuery({ queryKey: ['/api/loans'], queryFn: () => fetch('/api/loans', { credentials: 'include' }).then(r => r.json()) });
  const { data: fixedIncomes = [] } = useQuery({ queryKey: ['/api/fixed-incomes'], queryFn: () => fetch('/api/fixed-incomes', { credentials: 'include' }).then(r => r.json()) });
  const { data: variableIncomes = [] } = useQuery({ queryKey: ['/api/variable-incomes'], queryFn: () => fetch('/api/variable-incomes', { credentials: 'include' }).then(r => r.json()) });
  const { data: expectedIncomes = [] } = useQuery({ queryKey: ['/api/expected-incomes'], queryFn: () => fetch('/api/expected-incomes', { credentials: 'include' }).then(r => r.json()) });
  const { data: savingsTxns = [] } = useQuery({ queryKey: ['/api/savings-transactions'], queryFn: () => fetch('/api/savings-transactions', { credentials: 'include' }).then(r => r.json()) });

  useEffect(() => {
    if (authUser) {
      setDistForm({
        aliBank: fmtInput((authUser as any).aliBank ?? 0),
        kubraBank: fmtInput((authUser as any).kubraBank ?? 0),
        nakit: fmtInput((authUser as any).nakit ?? 0),
      });
      try {
        const saved = JSON.parse((authUser as any).distSlots || '[]');
        if (Array.isArray(saved) && saved.length > 0) {
          setDistSlots(saved);
        } else {
          setDistSlots([
            { label: 'Banka 1', amount: (authUser as any).aliBank ?? 0 },
            { label: 'Banka 2', amount: (authUser as any).kubraBank ?? 0 },
            { label: 'Nakit', amount: (authUser as any).nakit ?? 0 },
          ]);
        }
      } catch {
        setDistSlots([
          { label: 'Banka 1', amount: (authUser as any).aliBank ?? 0 },
          { label: 'Banka 2', amount: (authUser as any).kubraBank ?? 0 },
          { label: 'Nakit', amount: (authUser as any).nakit ?? 0 },
        ]);
      }
    }
  }, [authUser]);

  const receivedIncome = [
    ...(fixedIncomes as any[]).filter(i => i.isReceived).map(i => i.amount),
    ...(fixedIncomes as any[]).filter(i => !i.isReceived && (i.receivedAmount ?? 0) > 0).map(i => i.receivedAmount),
    ...(variableIncomes as any[]).filter(i => i.isReceived).map(i => i.amount),
    ...(variableIncomes as any[]).filter(i => !i.isReceived && (i.receivedAmount ?? 0) > 0).map(i => i.receivedAmount),
    ...(expectedIncomes as any[]).filter(i => i.isApproved).map(i => i.amount),
  ].reduce((a, b) => a + b, 0);

  const paidExpenses = [
    ...(fixedExpenses as any[]).filter(e => e.isPaid).map(e => e.amount),
    ...(variableExpenses as any[]).filter(e => e.isPaid).map(e => e.amount),
    ...(creditCards as any[]).map(e => e.paidAmount ?? 0),
    ...(loans as any[]).filter(l => l.isPaid).map(l => l.monthlyPayment),
  ].reduce((a, b) => a + b, 0);

  const totalSavingsTLDeducted = (savingsTxns as any[]).reduce((s: number, t: any) => s + (t.amountTl ?? t.amountTL ?? 0), 0);
  const cashBase = receivedIncome - paidExpenses - totalSavingsTLDeducted;
  const cashAdjustment = (authUser as any)?.cashAdjustment ?? 0;
  const cashOnHand = cashBase + cashAdjustment;


  const saveMutation = useMutation({
    mutationFn: async ({ ep, id, data }: any) => {
      const res = await fetch(id ? `${ep}/${id}` : ep, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (_, { qk }) => { queryClient.invalidateQueries({ queryKey: [qk] }); setModal(null); setEditId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ ep, id }: any) => fetch(`${ep}/${id}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: (_, { qk }) => queryClient.invalidateQueries({ queryKey: [qk] }),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/expected-incomes/${id}/approve`, { method: 'PUT', credentials: 'include' });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/expected-incomes'] }),
  });

  const settingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/me'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setCashEditMode(false);
      setCashInput('');
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/monthly-reset', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Sıfırlama başarısız');
      return res.json();
    },
    onSuccess: async () => {
      const keys = [
        '/api/fixed-incomes', '/api/variable-incomes', '/api/expected-incomes',
        '/api/fixed-expenses', '/api/variable-expenses', '/api/credit-cards',
        '/api/loans', '/api/savings-transactions', '/api/auth/me', '/api/extra-savings',
      ];
      keys.forEach(qk => queryClient.removeQueries({ queryKey: [qk] }));
      setResetConfirmOpen(false);
    },
  });

  const epMap: Record<string, { ep: string; qk: string }> = {
    income: { ep: '/api/fixed-incomes', qk: '/api/fixed-incomes' },
    'expected-income': { ep: '/api/expected-incomes', qk: '/api/expected-incomes' },
    expense: { ep: '/api/fixed-expenses', qk: '/api/fixed-expenses' },
    card: { ep: '/api/credit-cards', qk: '/api/credit-cards' },
    loan: { ep: '/api/loans', qk: '/api/loans' },
  };

  const openAdd = (type: ModalType) => { setEditId(null); setModal(type); setForm(initForm(type)); };
  const openEdit = (type: ModalType, item: any) => { setEditId(item.id); setModal(type); setForm(initForm(type, item)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    const { ep, qk } = epMap[modal];
    const dataMap: any = {
      income: { title: form.title, amount: +form.amount, day: +form.day },
      'expected-income': { title: form.title, amount: +form.amount, expectedDay: form.expectedDay ? +form.expectedDay : null },
      expense: { title: form.title, amount: +form.amount, day: +form.day },
      card: { cardName: form.cardName, cardHolder: form.cardHolder || '', cardNumber: form.cardNumber, cardExpiry: form.cardExpiry, cvv: form.cvv || '', amount: +form.amount, paymentDay: +form.paymentDay },
      loan: (() => {
        const now = new Date();
        let remaining = 1, total = 1;
        if (form.endDate) {
          const [ey, em] = form.endDate.split('-').map(Number);
          const months = (ey - now.getFullYear()) * 12 + (em - (now.getMonth() + 1));
          remaining = Math.max(1, months);
          total = editId
            ? ((loans as any[]).find((l: any) => l.id === editId)?.totalInstallments ?? remaining)
            : remaining;
        }
        return { title: form.title, monthlyPayment: +form.monthlyPayment, remainingInstallments: remaining, totalInstallments: total, lastPaymentDate: +form.lastPaymentDate, ibanForPayment: form.ibanForPayment, endDate: form.endDate };
      })(),
    };
    saveMutation.mutate({ ep, qk, id: editId, data: dataMap[modal] });
  };

  const SectionHeader = ({ label, total, color, colorText, onAdd }: any) => (
    <div className={cn('flex items-center justify-between px-4 py-3 border-b border-border', color)}>
      <div className="flex items-center gap-2">
        <p className="font-bold text-base">{label}</p>
        {total > 0 && <span className={cn('text-sm font-bold tabular-nums', colorText)}>{fmt(total)}</span>}
      </div>
      <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
        <Plus size={13} /> Ekle
      </button>
    </div>
  );

  const Divider = ({ label, onAdd }: { label: string; onAdd?: () => void }) => (
    <div className="flex items-center justify-between px-4 py-2 bg-secondary/40 border-b border-border/40">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      {onAdd && (
        <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          <Plus size={12} /> Ekle
        </button>
      )}
    </div>
  );

  const EmptyRow = ({ label }: { label: string }) => (
    <div className="px-4 py-4 text-sm text-muted-foreground italic">{label}</div>
  );

  const ItemRow = ({ icon: Icon, iconBg, title, subtitle, amount, amountColor, faded, badge, extra }: any) => (
    <div className={cn('flex items-center gap-3 px-4 py-3.5 border-b border-border/30 last:border-0', faded && 'opacity-50')}>
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-[15px] font-medium leading-snug truncate', faded && 'line-through text-muted-foreground')}>
            {title}
          </span>
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={cn('text-[14px] font-bold tabular-nums', amountColor)}>{amount}</span>
        {extra}
      </div>
    </div>
  );

  const totalIncome = [
    ...(fixedIncomes as any[]).map(i => i.amount),
    ...(expectedIncomes as any[]).filter(i => i.isApproved).map(i => i.amount),
  ].reduce((a, b) => a + b, 0);
  const totalExpense = (fixedExpenses as any[]).reduce((s, e) => s + e.amount, 0);
  const totalCards = (creditCards as any[]).reduce((s, c) => s + c.amount, 0);
  const totalLoans = (loans as any[]).reduce((s, l) => s + l.monthlyPayment, 0);

  return (
    <div className="space-y-5 pb-8">
      <h1 className="text-2xl font-display font-bold tracking-tight">Yönetim</h1>

      {/* Eldeki Para */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Wallet size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-bold text-base">Eldeki Para</p>
          </div>
          <button onClick={() => { setCashEditMode(!cashEditMode); setCashInput(String(Math.round(cashOnHand))); }}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            {cashEditMode ? 'Kapat' : 'Düzenle'}
          </button>
        </div>
        <div className="px-4 py-4">
          <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(cashOnHand)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {fmt(receivedIncome)} onaylı gelir · {fmt(paidExpenses)} ödendi · {fmt(totalSavingsTLDeducted)} birikim
            {cashAdjustment !== 0 && (
              <span> · <span className={cashAdjustment > 0 ? 'text-emerald-600' : 'text-rose-500'}>{cashAdjustment > 0 ? '+' : ''}{fmt(cashAdjustment)} düzeltme</span></span>
            )}
          </p>
          {cashEditMode && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <p className="text-xs text-muted-foreground mb-2">Eldeki paranı manuel olarak ayarla (küçük takip edilmeyen harcamalar için):</p>
              <div className="flex gap-2">
                <input type="number" className={inp} placeholder="Eldeki para (₺)"
                  value={cashInput} onChange={e => setCashInput(e.target.value)} />
                <button onClick={() => {
                    const target = parseInt(cashInput) || 0;
                    const newAdj = target - cashBase;
                    settingsMutation.mutate({ cashAdjustment: newAdj });
                  }}
                  disabled={settingsMutation.isPending}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap">
                  {settingsMutation.isPending ? '...' : 'Kaydet'}
                </button>
                <button onClick={() => { setCashEditMode(false); setCashInput(''); }}
                  className="px-3 py-2.5 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">İptal</button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Hesaplanan: <span className="font-medium text-foreground">{fmt(cashBase)}</span>
                {cashAdjustment !== 0 && <span> · Düzeltme: <span className={cashAdjustment > 0 ? 'text-emerald-600' : 'text-rose-500'}>{cashAdjustment > 0 ? '+' : ''}{fmt(cashAdjustment)}</span></span>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Gelirler & Giderler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* GELİRLER */}
        <div ref={gelirlerRef} className="rounded-2xl border border-border bg-card overflow-hidden">
          <SectionHeader label="Gelirler" total={totalIncome} color="bg-emerald-500/5" colorText="text-emerald-600 dark:text-emerald-400" onAdd={() => openAdd('income')} />
          {(fixedIncomes as any[]).length === 0
            ? <EmptyRow label="Henüz gelir eklenmemiş" />
            : (fixedIncomes as any[]).map((inc: any, idx: number) => {
              const Icon = getIncomeIcon(inc.title, idx);
              const partial = !inc.isReceived && (inc.receivedAmount ?? 0) > 0;
              const remaining = inc.amount - (inc.receivedAmount ?? 0);
              return (
                <SwipeRow key={inc.id} id={`fi-${inc.id}`} openRowId={openRowId} setOpenRowId={setOpenRowId}
                  onEdit={() => openEdit('income', inc)}
                  onDelete={() => setDeleteConfirm({ ep: '/api/fixed-incomes', qk: '/api/fixed-incomes', id: inc.id, name: inc.title })}>
                  <ItemRow icon={Icon} iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    title={inc.title}
                    subtitle={partial ? `${fmt(inc.receivedAmount)} alındı · ${fmt(remaining)} bekleniyor` : fmtDay(inc.day)}
                    amount={`+${fmt(inc.amount)}`}
                    amountColor={inc.isReceived ? 'text-muted-foreground' : partial ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}
                    faded={inc.isReceived}
                    badge={inc.isReceived ? 'Alındı' : partial ? 'Kısmi' : undefined} />
                </SwipeRow>
              );
            })
          }

          <Divider label="Beklenen Gelirler" onAdd={() => openAdd('expected-income')} />
          {(expectedIncomes as any[]).length === 0
            ? <EmptyRow label="Henüz beklenen gelir eklenmemiş" />
            : (expectedIncomes as any[]).map((inc: any) => (
              <SwipeRow key={inc.id} id={`ei-${inc.id}`} openRowId={openRowId} setOpenRowId={setOpenRowId}
                onEdit={() => openEdit('expected-income', inc)}
                onDelete={() => setDeleteConfirm({ ep: '/api/expected-incomes', qk: '/api/expected-incomes', id: inc.id, name: inc.title })}>
                <ItemRow icon={Clock} iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  title={inc.title} subtitle={inc.expectedDay ? fmtDay(inc.expectedDay) : undefined}
                  amount={`+${fmt(inc.amount)}`} amountColor={inc.isApproved ? 'text-muted-foreground' : 'text-amber-600'}
                  faded={inc.isApproved} badge={inc.isApproved ? 'Gelire Dahil' : undefined}
                  extra={!inc.isApproved && (
                    <button onClick={() => approveMutation.mutate(inc.id)}
                      className="text-xs px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex-shrink-0 whitespace-nowrap">
                      Hesaba Dahil Et
                    </button>
                  )}
                />
              </SwipeRow>
            ))
          }
        </div>

        {/* GİDERLER */}
        <div ref={giderlerRef} className="rounded-2xl border border-border bg-card overflow-hidden">
          <SectionHeader label="Giderler" total={totalExpense} color="bg-rose-500/5" colorText="text-rose-600 dark:text-rose-400" onAdd={() => openAdd('expense')} />
          {(fixedExpenses as any[]).length === 0
            ? <EmptyRow label="Henüz gider eklenmemiş" />
            : (fixedExpenses as any[]).map((exp: any, idx: number) => {
              const Icon = getExpenseIcon(exp.title, idx);
              return (
                <SwipeRow key={exp.id} id={`fe-${exp.id}`} openRowId={openRowId} setOpenRowId={setOpenRowId}
                  onEdit={() => openEdit('expense', exp)}
                  onDelete={() => setDeleteConfirm({ ep: '/api/fixed-expenses', qk: '/api/fixed-expenses', id: exp.id, name: exp.title })}>
                  <ItemRow icon={Icon} iconBg="bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    title={exp.title} subtitle={fmtDay(exp.day)}
                    amount={fmt(exp.amount)} amountColor={exp.isPaid ? 'text-muted-foreground' : 'text-foreground'}
                    faded={exp.isPaid} badge={exp.isPaid ? 'Ödendi' : undefined} />
                </SwipeRow>
              );
            })
          }
        </div>
      </div>
      <OnboardingHint stepId="mgmt_gelir_gider" userId={userId} watchRef={gelirlerRef}
        title="Gelir & Gider Yönetimi"
        text="Burada sabit gelir ve giderlerinizi tanımlarsınız. Tanımlanan her kalem otomatik olarak Ana Sayfa'da listelenir. Satırı sola kaydırarak düzenleyebilir veya silebilirsiniz." />

      {/* Kredi Kartları & Krediler */}
      <div className="grid grid-cols-1 gap-5">

        {/* KREDİ KARTLARI */}
        <div ref={kartlarRef} className="rounded-2xl border border-border bg-card overflow-hidden">
          <SectionHeader label="Kredi Kartları" total={totalCards} color="bg-slate-500/5" colorText="text-slate-600 dark:text-slate-400" onAdd={() => openAdd('card')} />
          {(creditCards as any[]).length === 0
            ? <EmptyRow label="Henüz kredi kartı eklenmemiş" />
            : (creditCards as any[]).map((card: any) => (
              <SwipeRow key={card.id} id={`cc-${card.id}`} openRowId={openRowId} setOpenRowId={setOpenRowId}
                onEdit={() => openEdit('card', card)}
                onDelete={() => setDeleteConfirm({ ep: '/api/credit-cards', qk: '/api/credit-cards', id: card.id, name: card.cardName })}>
                <div className={cn('px-4 py-3.5 border-b border-border/20 last:border-0', card.isPaid && 'opacity-60')}>
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white', getCardAccent(card.cardName))}>
                      <CreditCard size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={cn('font-semibold text-[15px]', card.isPaid && 'line-through text-muted-foreground')}>{card.cardName}</p>
                        {!card.isPaid && (card.paidAmount ?? 0) > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">KISMİ ÖDENDİ</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{card.paymentDay}. gün</span>
                        <span className="text-muted-foreground/40">·</span>
                        <button
                          onClick={e => { e.stopPropagation(); setPinModal({ id: card.id, pin: '', error: false, purpose: 'cardInfo' }); }}
                          className="text-xs text-primary font-medium hover:underline transition-colors">
                          Kart Bilgileri
                        </button>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {card.isPaid
                        ? (() => {
                            const paidAmt = card.paidAmount ?? 0;
                            const isFull = paidAmt >= card.amount;
                            return (
                              <span className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded',
                                isFull
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                              )}>
                                {isFull ? 'TAMAMI ÖDENDİ' : 'ASGARİ ÖDENDİ'}
                              </span>
                            );
                          })()
                        : !card.isPaid && (card.paidAmount ?? 0) > 0
                          ? <p className="font-bold text-[17px] tabular-nums text-amber-600 dark:text-amber-400">{fmt(card.amount - (card.paidAmount ?? 0))}</p>
                          : <p className="font-bold text-[17px] tabular-nums">{fmt(card.amount)}</p>
                      }
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {!card.isPaid && (card.paidAmount ?? 0) > 0
                          ? `${fmt(card.paidAmount ?? 0)} ödendi · kalan`
                          : card.isPaid && (card.paidAmount ?? 0) < card.amount
                          ? `${fmt(card.paidAmount ?? 0)} ödendi`
                          : 'ekstre borcu'}
                      </p>
                    </div>
                  </div>
                </div>
              </SwipeRow>
            ))
          }
        </div>

        {/* KREDİLER */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <SectionHeader label="Krediler" total={totalLoans} color="bg-primary/5" colorText="text-primary" onAdd={() => openAdd('loan')} />
          {(loans as any[]).length === 0
            ? <EmptyRow label="Henüz kredi eklenmemiş" />
            : (loans as any[]).map((loan: any, idx: number) => (
              <div key={loan.id}>
                {idx > 0 && <div className="mx-4 border-t border-border/30" />}
                <SwipeRow id={`ln-${loan.id}`} openRowId={openRowId} setOpenRowId={setOpenRowId}
                  onEdit={() => openEdit('loan', loan)}
                  onDelete={() => setDeleteConfirm({ ep: '/api/loans', qk: '/api/loans', id: loan.id, name: loan.title })}>
                  <div className={cn('px-4 py-4', loan.isPaid && 'opacity-60')}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={cn('font-semibold text-sm', loan.isPaid && 'line-through text-muted-foreground')}>{loan.title}</p>
                      {loan.isPaid && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex-shrink-0">ÖDENDİ</span>
                      )}
                    </div>
                    <p className="text-2xl font-bold tabular-nums text-primary">{fmt(loan.monthlyPayment)}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span>Son Ödeme: <span className="font-medium text-foreground">{fmtDay(loan.lastPaymentDate)}</span></span>
                      <span>Kalan: <span className="font-medium text-foreground">{loan.remainingInstallments} taksit</span></span>
                    </div>
                    {loan.ibanForPayment && (
                      <div className="flex items-center gap-1.5 mt-2 bg-secondary/50 rounded-lg px-2.5 py-1.5">
                        <span className="text-xs text-muted-foreground font-mono flex-1 truncate">{loan.ibanForPayment}</span>
                        <button onClick={() => navigator.clipboard.writeText(loan.ibanForPayment)}
                          className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                          <Copy size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </SwipeRow>
              </div>
            ))
          }
        </div>
      </div>
      <OnboardingHint stepId="mgmt_kartlar" userId={userId} watchRef={kartlarRef}
        title="Kredi Kartları & Krediler"
        text="Kredi kartı ekstrelerinizi ve kredi taksitlerini buraya ekleyin. Her ay ödeme yaptığınızda 'Ödendi' işaretleyebilirsiniz. Kart bilgilerine PIN ile erişmek için kart satırına tıklayın." />

      {/* Nakit Dağılımları */}
      {(() => {
        const slotsTotal = distSlots.reduce((s, sl) => s + sl.amount, 0);
        const slotsDiff = slotsTotal - cashOnHand;
        const slotsOk = Math.abs(slotsDiff) <= 500;
        return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 bg-secondary/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart2 size={16} className="text-primary" />
              </div>
              <p className="font-bold text-base">Nakit Dağılımları</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">Beklenen: <span className="font-semibold text-foreground">{fmt(cashOnHand)}</span></p>
              <button
                data-testid="button-edit-dist-slots"
                onClick={() => {
                  if (!distEditMode) {
                    setDistEditLabels(distSlots.map(s => s.label));
                    setDistEditMode(true);
                  } else {
                    setDistEditMode(false);
                  }
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                {distEditMode ? <X size={15} /> : <Pencil size={15} />}
              </button>
            </div>
          </div>

          {distEditMode ? (
            /* — Label edit mode — */
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">İsimleri düzenleyin, yeni hesap ekleyin veya sileceklerinizi çıkarın.</p>
              <div className="space-y-2">
                {distEditLabels.map((lbl2, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      data-testid={`input-dist-label-${i}`}
                      className={inp}
                      value={lbl2}
                      onChange={e => setDistEditLabels(prev => prev.map((l, j) => j === i ? e.target.value : l))}
                      placeholder={`Hesap ${i + 1}`}
                    />
                    {distEditLabels.length > 1 && (
                      <button
                        data-testid={`button-remove-dist-${i}`}
                        onClick={() => setDistEditLabels(prev => prev.filter((_, j) => j !== i))}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors flex-shrink-0">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                data-testid="button-add-dist-slot"
                onClick={() => setDistEditLabels(prev => [...prev, ''])}
                className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-1.5">
                <Plus size={14} /> Hesap Ekle
              </button>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    const newSlots = distEditLabels.map((label, i) => ({
                      label: label || `Hesap ${i + 1}`,
                      amount: distSlots[i]?.amount ?? 0,
                    }));
                    setDistSlots(newSlots);
                    settingsMutation.mutate({ distSlots: JSON.stringify(newSlots) });
                    setDistEditMode(false);
                  }}
                  disabled={settingsMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {settingsMutation.isPending ? '...' : 'Kaydet'}
                </button>
                <button onClick={() => setDistEditMode(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">İptal</button>
              </div>
            </div>
          ) : (
            /* — Normal amount mode — */
            <div className="p-4 space-y-4">
              <div className={cn('grid gap-3', distSlots.length <= 3 ? 'grid-cols-3' : distSlots.length === 4 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3')}>
                {distSlots.map((slot, i) => (
                  <div key={i}>
                    <label className={lbl}>{slot.label}</label>
                    <input
                      data-testid={`input-dist-amount-${i}`}
                      type="number"
                      className={inp}
                      value={slot.amount === 0 ? '' : String(slot.amount)}
                      onChange={e => setDistSlots(prev => prev.map((s, j) => j === i ? { ...s, amount: parseInt(e.target.value) || 0 } : s))}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground text-right">
                Toplam: <span className="font-semibold text-foreground">{fmt(slotsTotal)}</span>
              </div>

              <div className={cn(
                'flex items-center gap-3 px-3.5 py-3 rounded-xl border',
                slotsOk
                  ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/5 border-rose-500/25 text-rose-700 dark:text-rose-300'
              )}>
                {slotsOk
                  ? <CheckCircle2 size={16} className="flex-shrink-0" />
                  : <AlertTriangle size={16} className="flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {slotsOk ? 'Hesaplar Düzgün' : 'Uyumsuzluk Var — Hesaplarını kontrol et'}
                  </p>
                  {!slotsOk && (
                    <p className="text-xs opacity-80 mt-0.5">
                      Fark: {slotsDiff > 0 ? '+' : ''}{fmt(slotsDiff)}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => settingsMutation.mutate({ distSlots: JSON.stringify(distSlots) })}
                disabled={settingsMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {settingsMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          )}
        </div>
        );
      })()}

      {/* Yeni Ay / Sıfırlama */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-destructive/20 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle size={16} className="text-destructive" />
          </div>
          <div>
            <p className="font-bold text-base">Yeni Ay Başlat</p>
            <p className="text-xs text-muted-foreground">Aylık sıfırlama — sanki 1'i geçmişsiniz gibi</p>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span> Sabit gelir ve giderler korunur, ödenmemiş olarak işaretlenir</li>
            <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span> Krediler korunur, aylık taksit ödenmemiş olarak sıfırlanır</li>
            <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span> Kredi kartları korunur, ekstre tutarı sıfırlanır</li>
            <li className="flex items-start gap-1.5"><span className="text-green-500 mt-0.5">✓</span> Birikimler dokunulmaz, kümülatif olmaya devam eder</li>
            <li className="flex items-start gap-1.5"><span className="text-red-500 mt-0.5">✗</span> Değişken gelir/giderler ve beklenen gelirler silinir</li>
            <li className="flex items-start gap-1.5"><span className="text-red-500 mt-0.5">✗</span> Bu ayki birikim hareketleri ve eldeki para düzeltmesi sıfırlanır</li>
          </ul>
          <button
            data-testid="button-monthly-reset"
            onClick={() => setResetConfirmOpen(true)}
            disabled={resetMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors">
            {resetMutation.isPending ? 'Sıfırlanıyor...' : 'Tüm Verileri Sıfırla'}
          </button>
        </div>
      </div>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteConfirm}
        message={`"${deleteConfirm?.name}" kaydını silmek istediğinizden emin misiniz?`}
        onConfirm={() => { if (deleteConfirm) { deleteMutation.mutate({ ep: deleteConfirm.ep, qk: deleteConfirm.qk, id: deleteConfirm.id }); setDeleteConfirm(null); } }}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Monthly Reset Confirm */}
      <ConfirmModal
        open={resetConfirmOpen}
        message="Yeni ay sıfırlaması yapılacak. Değişken gelir/giderler, beklenen gelirler ve bu ayki birikim hareketleri silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?"
        onConfirm={() => resetMutation.mutate()}
        onCancel={() => setResetConfirmOpen(false)}
      />

      {/* PIN Modal */}
      {pinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setPinModal(null)}>
          <div className="bg-card rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-base mb-1">PIN Kodu</h3>
            <p className="text-sm text-muted-foreground mb-4">Kart bilgilerini görmek için PIN'inizi girin.</p>
            <input type="password" maxLength={6} placeholder="••••" value={pinModal.pin} autoFocus
              onChange={e => setPinModal(p => p ? { ...p, pin: e.target.value, error: false } : null)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (pinModal.pin === '1888') {
                    const card = (creditCards as any[]).find(c => c.id === pinModal.id);
                    if (pinModal.purpose === 'cardInfo' && card) { setCardInfoModal(card); }
                    setPinModal(null);
                  } else setPinModal(p => p ? { ...p, error: true } : null);
                }
              }}
              className={cn(inp, 'text-center text-2xl font-bold tracking-[0.4em] mb-2', pinModal.error && 'border-destructive')} />
            {pinModal.error && <p className="text-destructive text-xs text-center mb-2">Yanlış PIN</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setPinModal(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">İptal</button>
              <button onClick={() => {
                if (pinModal.pin === '1888') {
                  const card = (creditCards as any[]).find(c => c.id === pinModal.id);
                  if (pinModal.purpose === 'cardInfo' && card) { setCardInfoModal(card); }
                  setPinModal(null);
                } else setPinModal(p => p ? { ...p, error: true } : null);
              }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Onayla</button>
            </div>
          </div>
        </div>
      )}

      {/* Card Info Modal */}
      {cardInfoModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-start justify-center z-[200] p-4 overflow-y-auto"
          onClick={() => { setCardInfoModal(null); setCardInfoEditMode(false); }}>
          <div className="w-full max-w-sm my-auto py-4" onClick={e => e.stopPropagation()}>
            {/* Realistic credit card */}
            <div className={cn('relative w-full rounded-2xl p-5 text-white shadow-2xl overflow-hidden bg-gradient-to-br', getCardGradient(cardInfoModal.cardName))}
              style={{ aspectRatio: '1.586' }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-black/10 translate-y-1/3 -translate-x-1/4" />
              <div className="relative z-10 flex flex-col h-full">
                {/* Top row: bank name + mastercard circles */}
                <div className="flex items-start justify-between mb-auto">
                  <p className="font-bold text-sm tracking-wide drop-shadow leading-tight max-w-[60%] truncate">{cardInfoModal.cardName}</p>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-red-500/80" />
                    <div className="w-5 h-5 rounded-full bg-yellow-500/80 -ml-2" />
                  </div>
                </div>
                {/* Chip */}
                <div className="w-9 h-7 rounded-md bg-yellow-400/70 mb-3 mt-2 overflow-hidden relative flex-shrink-0">
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="border border-yellow-500/40" />
                    ))}
                  </div>
                </div>
                {/* Card number row */}
                <div className="flex items-center gap-1.5 mb-3">
                  <p className="font-mono text-sm sm:text-base tracking-[0.15em] drop-shadow flex-1 min-w-0 truncate">
                    {cardInfoModal.cardNumber ? cardInfoModal.cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ') : '**** **** **** ****'}
                  </p>
                  <button
                    onClick={() => {
                      if (cardInfoModal.cardNumber) {
                        navigator.clipboard.writeText(cardInfoModal.cardNumber);
                        setCopiedCardNumber(true);
                        setTimeout(() => setCopiedCardNumber(false), 2000);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0"
                    title="Kopyala">
                    {copiedCardNumber ? <Check size={13} className="text-white" /> : <Copy size={13} className="text-white" />}
                  </button>
                </div>
                {/* Bottom row */}
                <div className="flex items-end justify-between">
                  <div className="flex gap-4 min-w-0">
                    <div className="min-w-0">
                      <p className="text-[8px] uppercase tracking-widest opacity-70 mb-0.5">Son Kullanma</p>
                      <p className="font-semibold text-xs">{cardInfoModal.cardExpiry || '--/--'}</p>
                    </div>
                    {cardInfoModal.cvv && (
                      <div>
                        <p className="text-[8px] uppercase tracking-widest opacity-70 mb-0.5">CVV</p>
                        <p className="font-semibold text-xs">{cardInfoModal.cvv}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {cardInfoModal.cardHolder && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-90 truncate max-w-[120px]">{cardInfoModal.cardHolder}</p>
                    )}
                    <p className="text-[9px] opacity-50 font-medium">CREDIT</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit form (below the card) */}
            {cardInfoEditMode ? (
              <div className="mt-3 bg-card rounded-2xl border border-border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Kart Bilgilerini Düzenle</h4>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Kart Sahibi</label>
                  <input className={inp} placeholder="Ali Çelebi" value={cardInfoEditForm.cardHolder || ''}
                    onChange={e => setCardInfoEditForm((p: any) => ({ ...p, cardHolder: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Kart Numarası</label>
                  <input className={inp} maxLength={16} value={cardInfoEditForm.cardNumber || ''}
                    onChange={e => setCardInfoEditForm((p: any) => ({ ...p, cardNumber: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Son Kullanma</label>
                    <input className={inp} placeholder="12/26" value={cardInfoEditForm.cardExpiry || ''}
                      onChange={e => setCardInfoEditForm((p: any) => ({ ...p, cardExpiry: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">CVV</label>
                    <input className={inp} maxLength={4} placeholder="***" value={cardInfoEditForm.cvv || ''}
                      onChange={e => setCardInfoEditForm((p: any) => ({ ...p, cvv: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setCardInfoEditMode(false); }}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">
                    İptal
                  </button>
                  <button
                    onClick={() => {
                      saveMutation.mutate({
                        ep: '/api/credit-cards',
                        qk: '/api/credit-cards',
                        id: cardInfoModal.id,
                        data: {
                          cardHolder: cardInfoEditForm.cardHolder,
                          cardNumber: cardInfoEditForm.cardNumber,
                          cardExpiry: cardInfoEditForm.cardExpiry,
                          cvv: cardInfoEditForm.cvv,
                        },
                      }, {
                        onSuccess: (updated: any) => {
                          setCardInfoModal(updated);
                          setCardInfoEditMode(false);
                        }
                      });
                    }}
                    disabled={saveMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    setCardInfoEditForm({
                      cardHolder: cardInfoModal.cardHolder || '',
                      cardNumber: cardInfoModal.cardNumber || '',
                      cardExpiry: cardInfoModal.cardExpiry || '',
                      cvv: cardInfoModal.cvv || '',
                    });
                    setCardInfoEditMode(true);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 text-sm font-semibold hover:bg-primary/20 transition-colors">
                  Düzenle
                </button>
                <button onClick={() => { setCardInfoModal(null); setCardInfoEditMode(false); }}
                  className="flex-1 py-3 rounded-2xl bg-card border border-border text-sm font-semibold hover:bg-secondary transition-colors">
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]"
          onClick={() => { setModal(null); setEditId(null); }}>
          <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border border-border max-h-[90dvh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 sm:hidden" />
            <h3 className="font-semibold text-lg mb-5">
              {editId ? 'Düzenle' : ({ income: 'Gelir Ekle', expense: 'Gider Ekle', card: 'Kredi Kartı Ekle', loan: 'Kredi Ekle', 'expected-income': 'Beklenen Gelir Ekle' } as any)[modal]}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {modal !== 'card' && (
                <div><label className={lbl}>Başlık</label>
                  <input className={inp} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
              )}
              {modal === 'card' && (<>
                <div><label className={lbl}>Kart Adı (Banka)</label><input className={inp} value={form.cardName || ''} onChange={e => setForm({ ...form, cardName: e.target.value })} required /></div>
                {!editId && (<>
                  <div><label className={lbl}>Kart Sahibi</label><input className={inp} placeholder="Ali Çelebi" value={form.cardHolder || ''} onChange={e => setForm({ ...form, cardHolder: e.target.value })} /></div>
                  <div><label className={lbl}>Kart Numarası</label><input className={inp} value={form.cardNumber || ''} maxLength={16} onChange={e => setForm({ ...form, cardNumber: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>Son Kullanma</label><input className={inp} placeholder="12/26" value={form.cardExpiry || ''} onChange={e => setForm({ ...form, cardExpiry: e.target.value })} required /></div>
                    <div><label className={lbl}>CVV</label><input className={inp} value={form.cvv || ''} maxLength={4} placeholder="***" onChange={e => setForm({ ...form, cvv: e.target.value })} /></div>
                  </div>
                </>)}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Ödeme Günü</label><input className={inp} type="number" min={1} max={31} value={form.paymentDay || ''} onChange={e => setForm({ ...form, paymentDay: e.target.value })} required /></div>
                  <div><label className={lbl}>Ekstre Borcu (₺)</label><input className={inp} type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                </div>
              </>)}
              {modal === 'loan' && (<>
                <div><label className={lbl}>Aylık Ödeme (₺)</label><input className={inp} type="number" value={form.monthlyPayment || ''} onChange={e => setForm({ ...form, monthlyPayment: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Bitiş Tarihi</label>
                    <input className={inp} type="month"
                      min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 2).padStart(2, '0')}`}
                      value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                  </div>
                  <div><label className={lbl}>Son Ödeme Günü</label><input className={inp} type="number" min={1} max={31} value={form.lastPaymentDate || ''} onChange={e => setForm({ ...form, lastPaymentDate: e.target.value })} /></div>
                </div>
                <div><label className={lbl}>IBAN (isteğe bağlı)</label><input className={inp} value={form.ibanForPayment || ''} onChange={e => setForm({ ...form, ibanForPayment: e.target.value })} /></div>
              </>)}
              {(modal === 'income' || modal === 'expense') && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Tutar (₺)</label><input className={inp} type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                  <div><label className={lbl}>Gün (1-31)</label><input className={inp} type="number" min={1} max={31} value={form.day || '1'} onChange={e => setForm({ ...form, day: e.target.value })} required /></div>
                </div>
              )}
              {modal === 'expected-income' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Tutar (₺)</label><input className={inp} type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                  <div><label className={lbl}>Beklenen Gün</label><input className={inp} type="number" min={1} max={31} value={form.expectedDay || ''} onChange={e => setForm({ ...form, expectedDay: e.target.value })} /></div>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setModal(null); setEditId(null); }}
                  className="flex-1 py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">İptal</button>
                <button type="submit" disabled={saveMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {saveMutation.isPending ? 'Kaydediliyor...' : editId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
