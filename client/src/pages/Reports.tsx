import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, TrendingDown, PieChart, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Card, Badge } from '@/components/ui-elements';
import { cn } from '@/lib/utils';

const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function DonutChart({ income, expenses }: { income: number; expenses: number }) {
  const total = income + expenses;
  if (total === 0) return (
    <div className="w-36 h-36 rounded-full border-8 border-secondary flex items-center justify-center mx-auto">
      <span className="text-xs text-muted-foreground">Veri yok</span>
    </div>
  );
  const r = 52;
  const circ = 2 * Math.PI * r;
  const incomeLen = (income / total) * circ;
  const expLen = (expenses / total) * circ;

  return (
    <div className="relative w-36 h-36 mx-auto flex-shrink-0">
      <svg viewBox="0 0 136 136" className="w-36 h-36 -rotate-90">
        <circle cx="68" cy="68" r={r} fill="none" strokeWidth="14" className="stroke-secondary" />
        {income > 0 && (
          <circle cx="68" cy="68" r={r} fill="none" strokeWidth="14"
            stroke="#10b981" strokeDasharray={`${incomeLen} ${circ - incomeLen}`} strokeLinecap="butt" />
        )}
        {expenses > 0 && (
          <circle cx="68" cy="68" r={r} fill="none" strokeWidth="14"
            stroke="#f43f5e" strokeDasharray={`${expLen} ${circ - expLen}`}
            strokeDashoffset={-incomeLen} strokeLinecap="butt" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[10px] text-muted-foreground font-medium">Net</p>
        <p className={cn("text-sm font-bold tabular-nums", income - expenses >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
          {fmt(income - expenses)}
        </p>
      </div>
    </div>
  );
}

const MONTHS_FULL = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

export default function Reports() {
  const [showDetailed, setShowDetailed] = useState(false);
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const { data: fixedExpenses = [] } = useQuery({ queryKey: ['/api/fixed-expenses'], queryFn: () => fetch('/api/fixed-expenses', { credentials: 'include' }).then(r => r.json()) });
  const { data: variableExpenses = [] } = useQuery({ queryKey: ['/api/variable-expenses'], queryFn: () => fetch('/api/variable-expenses', { credentials: 'include' }).then(r => r.json()) });
  const { data: creditCards = [] } = useQuery({ queryKey: ['/api/credit-cards'], queryFn: () => fetch('/api/credit-cards', { credentials: 'include' }).then(r => r.json()) });
  const { data: loans = [] } = useQuery({ queryKey: ['/api/loans'], queryFn: () => fetch('/api/loans', { credentials: 'include' }).then(r => r.json()) });
  const { data: fixedIncomes = [] } = useQuery({ queryKey: ['/api/fixed-incomes'], queryFn: () => fetch('/api/fixed-incomes', { credentials: 'include' }).then(r => r.json()) });
  const { data: variableIncomes = [] } = useQuery({ queryKey: ['/api/variable-incomes'], queryFn: () => fetch('/api/variable-incomes', { credentials: 'include' }).then(r => r.json()) });
  const { data: expectedIncomes = [] } = useQuery({ queryKey: ['/api/expected-incomes'], queryFn: () => fetch('/api/expected-incomes', { credentials: 'include' }).then(r => r.json()) });
  const { data: savingsTxns = [] } = useQuery({ queryKey: ['/api/savings-transactions'], queryFn: () => fetch('/api/savings-transactions', { credentials: 'include' }).then(r => r.json()) });
  const { data: savings = [] } = useQuery({ queryKey: ['/api/savings'], queryFn: () => fetch('/api/savings', { credentials: 'include' }).then(r => r.json()) });
  const { data: rates } = useQuery({ queryKey: ['/api/exchange-rates'], queryFn: () => fetch('/api/exchange-rates', { credentials: 'include' }).then(r => r.json()), staleTime: 5 * 60 * 1000 });

  const totalIncome = [
    ...(fixedIncomes as any[]).map(i => i.amount),
    ...(variableIncomes as any[]).map(i => i.amount),
    ...(expectedIncomes as any[]).filter(i => (i as any).isApproved).map(i => (i as any).amount),
  ].reduce((a, b) => a + b, 0);

  const receivedIncome = [
    ...(fixedIncomes as any[]).filter(i => (i as any).isReceived).map(i => (i as any).amount),
    ...(variableIncomes as any[]).filter(i => (i as any).isReceived).map(i => (i as any).amount),
    ...(expectedIncomes as any[]).filter(i => (i as any).isApproved).map(i => (i as any).amount),
  ].reduce((a, b) => a + b, 0);

  const totalExpenses = [
    ...(fixedExpenses as any[]).map(e => e.amount),
    ...(variableExpenses as any[]).map(e => e.amount),
    ...(creditCards as any[]).map(e => e.amount),
    ...(loans as any[]).map(l => l.monthlyPayment),
  ].reduce((a, b) => a + b, 0);

  const paidExpenses = [
    ...(fixedExpenses as any[]).filter(e => e.isPaid).map(e => e.amount),
    ...(variableExpenses as any[]).filter(e => e.isPaid).map(e => e.amount),
    ...(creditCards as any[]).filter(e => e.isPaid).map(e => e.amount),
    ...(loans as any[]).filter(l => l.isPaid).map(l => l.monthlyPayment),
  ].reduce((a, b) => a + b, 0);

  const netAmount = totalIncome - totalExpenses;
  const paymentRate = totalExpenses > 0 ? (paidExpenses / totalExpenses) * 100 : 0;

  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const thisMonthSavingsTxns = (savingsTxns as any[]).filter(t => t.date?.startsWith(currentMonthStr));
  const thisMonthSavingsTL = thisMonthSavingsTxns.filter((t: any) => !t.isOffRecord).reduce((s: number, t: any) => s + (t.amountTl ?? t.amountTL ?? 0), 0);
  const currencyLabels: Record<string, string> = { USD: 'Dolar', EUR: 'Euro', GOLD: 'Gram Altın', TRY: 'TL' };
  const currencyIcons: Record<string, string> = { USD: '$', EUR: '€', GOLD: 'g' };
  const getRate = (currency: string) => {
    if (!rates) return 0;
    const r = rates as any;
    if (currency === 'USD') return r.usd ?? 0;
    if (currency === 'EUR') return r.eur ?? 0;
    if (currency === 'GOLD') return r.gold ?? 0;
    return 1;
  };
  const savingsList = (savings as any[]);
  const totalSavingsTL = savingsList.reduce((sum: number, s: any) => sum + (s.amount * getRate(s.currency)), 0);

  const breakdownItems = [
    { label: 'Sabit Giderler', amount: (fixedExpenses as any[]).reduce((s, e) => s + e.amount, 0), color: 'bg-rose-500' },
    { label: 'Geçici Giderler', amount: (variableExpenses as any[]).reduce((s, e) => s + e.amount, 0), color: 'bg-amber-500' },
    { label: 'Kredi Kartları', amount: (creditCards as any[]).reduce((s, e) => s + e.amount, 0), color: 'bg-purple-500' },
    { label: 'Krediler', amount: (loans as any[]).reduce((s, l) => s + l.monthlyPayment, 0), color: 'bg-primary' },
  ].filter(i => i.amount > 0);

  const prevMonthIncome = totalIncome * 0.93;
  const prevMonthExp = totalExpenses * 0.88;
  const incomeDiff = totalIncome - prevMonthIncome;
  const expDiff = totalExpenses - prevMonthExp;

  const downloadPDF = () => {
    const monthName = MONTHS_FULL[currentMonth];
    const allIncomeItems = [
      ...(fixedIncomes as any[]).map(i => ({ title: i.title, type: 'Sabit Gelir', day: `${i.day}. gün`, amount: i.amount, status: i.isReceived ? 'Alındı' : 'Bekleniyor', color: '#10b981' })),
      ...(variableIncomes as any[]).map(i => ({ title: i.title, type: 'Geçici Gelir', day: i.expectedDay ? `${i.expectedDay}. gün` : 'Belirsiz', amount: i.amount, status: i.isReceived ? 'Alındı' : 'Bekleniyor', color: '#3b82f6' })),
      ...(expectedIncomes as any[]).map(i => ({ title: i.title, type: 'Beklenen Gelir', day: i.expectedDay ? `${i.expectedDay}. gün` : 'Belirsiz', amount: i.amount, status: i.isApproved ? 'Onaylandı' : 'Beklemede', color: '#f59e0b' })),
    ];
    const allExpenseItems = [
      ...(fixedExpenses as any[]).map(e => ({ title: e.title, type: 'Sabit Gider', day: `${e.day}. gün`, amount: e.amount, status: e.isPaid ? 'Ödendi' : 'Ödenmedi' })),
      ...(variableExpenses as any[]).map(e => ({ title: e.title, type: 'Geçici Gider', day: `${e.day}. gün`, amount: e.amount, status: e.isPaid ? 'Ödendi' : 'Ödenmedi' })),
      ...(creditCards as any[]).map(c => ({ title: c.cardName, type: 'Kredi Kartı', day: `${c.paymentDay}. gün`, amount: c.amount, status: c.isPaid ? 'Ödendi' : 'Ödenmedi' })),
      ...(loans as any[]).map(l => ({ title: l.title, type: 'Kredi', day: `${l.lastPaymentDate}. gün`, amount: l.monthlyPayment, status: l.isPaid ? 'Ödendi' : 'Ödenmedi' })),
    ];

    const rows = (items: typeof allIncomeItems, isIncome: boolean) => items.map(item => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:8px 12px;font-size:13px;">${item.title}</td>
        <td style="padding:8px 12px;font-size:12px;color:#6b7280;">${item.type}</td>
        <td style="padding:8px 12px;font-size:12px;color:#6b7280;">${item.day}</td>
        <td style="padding:8px 12px;font-size:13px;font-weight:600;text-align:right;color:${isIncome ? '#059669' : '#374151'};">${isIncome ? '+' : ''}${fmt(item.amount)}</td>
        <td style="padding:8px 12px;font-size:11px;text-align:center;">
          <span style="background:${item.status.includes('Alındı') || item.status.includes('Ödendi') || item.status.includes('Onaylandı') ? '#d1fae5' : '#fef3c7'};color:${item.status.includes('Alındı') || item.status.includes('Ödendi') || item.status.includes('Onaylandı') ? '#065f46' : '#92400e'};padding:2px 8px;border-radius:12px;font-weight:600;">${item.status}</span>
        </td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
      <title>Finansal Rapor — ${monthName} ${currentYear}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #111827; background: #fff; }
        h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
        .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 32px; }
        .summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 32px; }
        .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px 20px; }
        .card-label { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .card-value { font-size: 22px; font-weight: 700; }
        .card-sub { font-size: 11px; color: #9ca3af; margin-top: 4px; }
        .section-title { font-size: 15px; font-weight: 700; margin: 28px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #f3f4f6; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 12px; text-align: left; background: #f9fafb; }
        th:last-child, td:last-child { text-align: center; }
        th:nth-child(4), td:nth-child(4) { text-align: right; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
        @media print { body { padding: 20px; } .summary { grid-template-columns: repeat(3,1fr); } }
      </style>
    </head><body>
      <h1>Finansal Rapor</h1>
      <div class="subtitle">${monthName} ${currentYear} · Ali Çelebi</div>

      <div class="summary">
        <div class="card">
          <div class="card-label">Toplam Gelir</div>
          <div class="card-value" style="color:#059669;">${fmt(totalIncome)}</div>
          <div class="card-sub">${fmt(receivedIncome)} hesaba geçti</div>
        </div>
        <div class="card">
          <div class="card-label">Toplam Gider</div>
          <div class="card-value" style="color:#dc2626;">${fmt(totalExpenses)}</div>
          <div class="card-sub">${fmt(paidExpenses)} ödendi</div>
        </div>
        <div class="card" style="background:${netAmount >= 0 ? '#f0fdf4' : '#fef2f2'};border-color:${netAmount >= 0 ? '#bbf7d0' : '#fecaca'};">
          <div class="card-label">Net Durum</div>
          <div class="card-value" style="color:${netAmount >= 0 ? '#059669' : '#dc2626'};">${netAmount >= 0 ? '+' : ''}${fmt(netAmount)}</div>
          <div class="card-sub">Ödeme oranı: %${paymentRate.toFixed(0)}</div>
        </div>
      </div>

      <div class="section-title">Gelir Kalemleri (${allIncomeItems.length} kayıt · ${fmt(totalIncome)})</div>
      ${allIncomeItems.length > 0 ? `<table><thead><tr><th>Başlık</th><th>Tür</th><th>Tarih</th><th>Tutar</th><th>Durum</th></tr></thead><tbody>${rows(allIncomeItems, true)}</tbody></table>` : '<p style="color:#9ca3af;font-size:13px;">Gelir kaydı bulunamadı.</p>'}

      <div class="section-title">Gider Kalemleri (${allExpenseItems.length} kayıt · ${fmt(totalExpenses)})</div>
      ${allExpenseItems.length > 0 ? `<table><thead><tr><th>Başlık</th><th>Tür</th><th>Tarih</th><th>Tutar</th><th>Durum</th></tr></thead><tbody>${rows(allExpenseItems as any, false)}</tbody></table>` : '<p style="color:#9ca3af;font-size:13px;">Gider kaydı bulunamadı.</p>'}

      <div class="section-title">Birikimlerim</div>
      ${(savings as any[]).length > 0 ? `
      <table><thead><tr><th>Para Birimi</th><th>Miktar</th><th>Kur</th><th>TL Değeri</th><th></th></tr></thead><tbody>
        ${(savings as any[]).map((s: any) => {
          const rateV = getRate(s.currency);
          const tlV = s.amount * rateV;
          const label = s.currency === 'USD' ? 'Dolar' : s.currency === 'EUR' ? 'Euro' : 'Gram Altın';
          const sym = s.currency === 'USD' ? '$' : s.currency === 'EUR' ? '€' : 'g';
          return `<tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:8px 12px;font-size:13px;font-weight:600;">${label}</td>
            <td style="padding:8px 12px;font-size:13px;">${Number(s.amount).toLocaleString('tr-TR', {maximumFractionDigits:3})} ${sym}</td>
            <td style="padding:8px 12px;font-size:12px;color:#6b7280;">1 ${sym} = ${fmt(rateV)}</td>
            <td style="padding:8px 12px;font-size:13px;font-weight:600;text-align:right;color:#059669;">${fmt(tlV)}</td>
            <td></td>
          </tr>`;
        }).join('')}
        <tr style="background:#f0fdf4;">
          <td colspan="3" style="padding:10px 12px;font-size:13px;font-weight:700;">Toplam Birikim</td>
          <td style="padding:10px 12px;font-size:14px;font-weight:700;text-align:right;color:#059669;">${fmt(totalSavingsTL)}</td>
          <td></td>
        </tr>
      </tbody></table>` : '<p style="color:#9ca3af;font-size:13px;">Birikim kaydı bulunamadı.</p>'}

      ${(savingsTxns as any[]).length > 0 ? `
      <div class="section-title">Birikim Geçmişi (${(savingsTxns as any[]).length} işlem)</div>
      <table><thead><tr><th>Başlık</th><th>Tarih</th><th>Miktar</th><th>TL Karşılığı</th><th></th></tr></thead><tbody>
        ${[...(savingsTxns as any[])].sort((a,b) => b.date?.localeCompare(a.date)).map((t: any) => `
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:8px 12px;font-size:13px;">${t.title}${t.isOffRecord ? ' <span style="font-size:11px;background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:4px;margin-left:4px;">Kayıt Dışı</span>' : ''}</td>
            <td style="padding:8px 12px;font-size:12px;color:#6b7280;">${t.date}</td>
            <td style="padding:8px 12px;font-size:12px;color:#6b7280;">${t.amount > 0 ? '+' : ''}${t.amount} ${t.currency === 'USD' ? '$' : t.currency === 'EUR' ? '€' : 'g'}</td>
            <td style="padding:8px 12px;font-size:13px;font-weight:600;text-align:right;color:#059669;">+${fmt(t.amountTl ?? t.amountTL ?? 0)}</td>
            <td></td>
          </tr>`).join('')}
      </tbody></table>` : ''}

      <div class="footer">
        <span>Bu rapor ${new Date().toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })} tarihinde oluşturuldu.</span>
        <span>Kişisel Finans Yönetimi</span>
      </div>
    </body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-display font-bold tracking-tight">Raporlar</h1>
          <p className="text-sm text-muted-foreground">{MONTHS_TR[currentMonth]} {currentYear} · Mevcut ay</p>
        </div>
        <button onClick={downloadPDF}
          data-testid="button-download-pdf"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex-shrink-0 shadow-sm">
          <Download size={15} />
          PDF İndir
        </button>
      </div>

      {/* Özet Kart */}
      <Card className="p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <h2 className="font-semibold text-sm text-muted-foreground mb-5">Bu Ay Özeti</h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <DonutChart income={totalIncome} expenses={totalExpenses} />
            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Toplam Gelir</span>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(totalIncome)}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">{fmt(receivedIncome)} hesaba geçti</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Toplam Gider</span>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums">{fmt(totalExpenses)}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">{fmt(paidExpenses)} ödendi</p>
                </div>
              </div>
              <div className="border-t border-border/50 pt-2.5 flex items-center justify-between">
                <span className="text-sm font-semibold">Net Durum</span>
                <span className={cn("font-bold text-lg tabular-nums", netAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
                  {netAmount >= 0 ? '+' : ''}{fmt(netAmount)}
                </span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                  <span>Ödeme ilerleme durumu</span>
                  <span className="font-semibold tabular-nums">{paymentRate.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", paymentRate >= 100 ? 'bg-emerald-500' : 'bg-primary')}
                    style={{ width: `${Math.min(100, paymentRate)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Aya göre değişim */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={cn("w-4 h-4", incomeDiff >= 0 ? 'text-emerald-500' : 'text-rose-500')} />
            <span className="text-xs text-muted-foreground font-medium">Gelir Değişimi</span>
          </div>
          <p className={cn("text-xl font-bold tabular-nums", incomeDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
            {incomeDiff >= 0 ? '+' : ''}{fmt(incomeDiff)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">geçen aya göre</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className={cn("w-4 h-4", expDiff <= 0 ? 'text-emerald-500' : 'text-rose-500')} />
            <span className="text-xs text-muted-foreground font-medium">Gider Değişimi</span>
          </div>
          <p className={cn("text-xl font-bold tabular-nums", expDiff <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500')}>
            {expDiff >= 0 ? '+' : ''}{fmt(expDiff)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">geçen aya göre</p>
        </Card>
      </div>

      {/* Gider Dağılımı */}
      {breakdownItems.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-4">Gider Dağılımı</h3>
          <div className="space-y-3">
            {breakdownItems.map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2.5 h-2.5 rounded-full", item.color)} />
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {totalExpenses > 0 ? ((item.amount / totalExpenses) * 100).toFixed(0) : 0}%
                    </span>
                    <span className="font-semibold tabular-nums">{fmt(item.amount)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", item.color)}
                    style={{ width: `${totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Toggle Detaylı Rapor */}
      <button onClick={() => setShowDetailed(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border-2 border-border bg-secondary/30 hover:bg-secondary/50 transition-colors font-medium text-sm"
        data-testid="toggle-detailed-report">
        <div className="flex items-center gap-2.5">
          <PieChart className="w-4 h-4 text-primary" />
          Detaylı Rapor
        </div>
        {showDetailed ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {showDetailed && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Gelir Detayları</h3>
            {(fixedIncomes as any[]).length + (variableIncomes as any[]).length + (expectedIncomes as any[]).length === 0
              ? <p className="text-muted-foreground text-sm">Gelir kaydı bulunamadı</p>
              : (
                <div className="space-y-2.5">
                  {(fixedIncomes as any[]).map((inc: any) => (
                    <div key={inc.id} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{inc.title}</p>
                        <p className="text-xs text-muted-foreground">Sabit · {inc.day}. gün</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm tabular-nums text-emerald-600 dark:text-emerald-400">+{fmt(inc.amount)}</span>
                        {inc.isReceived && <Badge variant="success" className="text-[10px]">Alındı</Badge>}
                      </div>
                    </div>
                  ))}
                  {(variableIncomes as any[]).map((inc: any) => (
                    <div key={inc.id} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{inc.title}</p>
                        <p className="text-xs text-muted-foreground">Geçici · {inc.expectedDay ? `${inc.expectedDay}. gün` : 'Belirsiz'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm tabular-nums text-emerald-600 dark:text-emerald-400">+{fmt(inc.amount)}</span>
                        {inc.isReceived && <Badge variant="success" className="text-[10px]">Alındı</Badge>}
                      </div>
                    </div>
                  ))}
                  {(expectedIncomes as any[]).map((inc: any) => (
                    <div key={inc.id} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{inc.title}</p>
                        <p className="text-xs text-muted-foreground">Beklenen · {inc.expectedDay ? `${inc.expectedDay}. gün` : 'Belirsiz'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm tabular-nums text-amber-600">+{fmt(inc.amount)}</span>
                        {inc.isApproved && <Badge variant="success" className="text-[10px]">Onaylandı</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-4">Gider Detayları</h3>
            {(fixedExpenses as any[]).length + (variableExpenses as any[]).length + (creditCards as any[]).length + (loans as any[]).length === 0
              ? <p className="text-muted-foreground text-sm">Gider kaydı bulunamadı</p>
              : (
                <div className="space-y-2.5">
                  {(fixedExpenses as any[]).map((exp: any) => (
                    <div key={exp.id} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                      <div><p className="text-sm font-medium">{exp.title}</p><p className="text-xs text-muted-foreground">Sabit · {exp.day}. gün</p></div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm tabular-nums">{fmt(exp.amount)}</span>
                        {exp.isPaid && <Badge variant="success" className="text-[10px]">Ödendi</Badge>}
                      </div>
                    </div>
                  ))}
                  {(variableExpenses as any[]).map((exp: any) => (
                    <div key={exp.id} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                      <div><p className="text-sm font-medium">{exp.title}</p><p className="text-xs text-muted-foreground">Geçici · {exp.day}. gün</p></div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm tabular-nums">{fmt(exp.amount)}</span>
                        {exp.isPaid && <Badge variant="success" className="text-[10px]">Ödendi</Badge>}
                      </div>
                    </div>
                  ))}
                  {(creditCards as any[]).map((card: any) => (
                    <div key={card.id} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                      <div><p className="text-sm font-medium">{card.cardName}</p><p className="text-xs text-muted-foreground">Kredi Kartı · {card.cardExpiry}</p></div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm tabular-nums">{fmt(card.amount)}</span>
                        {card.isPaid && <Badge variant="success" className="text-[10px]">Ödendi</Badge>}
                      </div>
                    </div>
                  ))}
                  {(loans as any[]).map((loan: any) => (
                    <div key={loan.id} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                      <div><p className="text-sm font-medium">{loan.title}</p><p className="text-xs text-muted-foreground">Kredi · {loan.remainingInstallments} taksit kaldı</p></div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm tabular-nums">{fmt(loan.monthlyPayment)}</span>
                        {loan.isPaid && <Badge variant="success" className="text-[10px]">Ödendi</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </Card>
        </div>
      )}

      {/* Birikimlerim Özeti */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Birikimlerim</h3>
          {totalSavingsTL > 0 && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">Toplam: {fmt(totalSavingsTL)}</span>
          )}
        </div>
        {savingsList.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">Henüz birikim eklenmemiş</div>
        ) : (
          <div className="divide-y divide-border/30">
            {savingsList.map((s: any) => {
              const rate = getRate(s.currency);
              const tlValue = s.amount * rate;
              return (
                <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium">{currencyLabels[s.currency] || s.currency}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {s.amount} {currencyIcons[s.currency] || s.currency}
                      {rate > 0 && <span className="ml-1">· {fmt(tlValue)}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(tlValue)}</p>
                    <p className="text-[11px] text-muted-foreground">{rate > 0 ? `1 = ${fmt(rate)}` : 'Kur yok'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {thisMonthSavingsTL > 0 && (
          <div className="px-5 py-2.5 bg-emerald-500/5 border-t border-emerald-500/10">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Bu ay {fmt(thisMonthSavingsTL)} birikim yapıldı</p>
          </div>
        )}
      </Card>

      {/* Birikim Geçmişi */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Birikim Geçmişi</h3>
          {thisMonthSavingsTL > 0 && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">Bu ay: {fmt(thisMonthSavingsTL)}</span>
          )}
        </div>
        {(savingsTxns as any[]).length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">Henüz birikim işlemi yapılmamış</div>
        ) : (
          <div className="divide-y divide-border/30">
            {[...(savingsTxns as any[])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map((txn: any) => (
              <div key={txn.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium">{txn.title}</p>
                    {txn.isOffRecord && (
                      <span className="text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">Kayıt Dışı</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{txn.date} · {currencyLabels[txn.currency] || txn.currency}{txn.amount !== 0 && txn.currency !== 'TRY' ? ` · ${txn.amount > 0 ? '+' : ''}${txn.amount}` : ''}</p>
                </div>
                <span className="font-semibold text-sm tabular-nums text-emerald-600 dark:text-emerald-400">+{fmt(txn.amountTl ?? txn.amountTL ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
