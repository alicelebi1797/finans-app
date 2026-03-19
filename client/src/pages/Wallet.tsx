import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Plus, Minus, Copy, Trash2, Landmark, DollarSign, Euro, Coins, Check, Heart, Pencil, X } from 'lucide-react';
import { Card, Button } from '@/components/ui-elements';
import { SwipeRow } from '@/components/SwipeRow';
import { ConfirmModal } from '@/components/ConfirmModal';
import { cn } from '@/lib/utils';

const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
const inp = "w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors";
const lbl = "text-sm font-medium block mb-1.5 text-muted-foreground";

type Tab = 'savings' | 'ibans';

export default function Wallet() {
  const [tab, setTab] = useState<Tab>('savings');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number; name: string } | null>(null);
  const [addIban, setAddIban] = useState(false);
  const [editIbanId, setEditIbanId] = useState<number | null>(null);
  const [ibanForm, setIbanForm] = useState({ title: '', iban: '' });
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [extraForm, setExtraForm] = useState({ title: 'Diğer Birikim', amount: '', addAmount: '' });
  const [extraEditId, setExtraEditId] = useState<number | null>(null);
  const [extraInfoEdit, setExtraInfoEdit] = useState<{ id: number; title: string; currency: string } | null>(null);
  const [showNewExtra, setShowNewExtra] = useState(false);
  const [addingMode, setAddingMode] = useState<{ currency: 'USD' | 'EUR' | 'GOLD'; type: 'add' | 'subtract' } | null>(null);
  const [addInput, setAddInput] = useState('');
  const [addIsOffRecord, setAddIsOffRecord] = useState(false);
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const { data: ibans = [] } = useQuery({ queryKey: ['/api/ibans'], queryFn: () => fetch('/api/ibans', { credentials: 'include' }).then(r => r.json()) });
  const { data: savings = [] } = useQuery({ queryKey: ['/api/savings'], queryFn: () => fetch('/api/savings', { credentials: 'include' }).then(r => r.json()) });
  const { data: extraSavings = [] } = useQuery({ queryKey: ['/api/extra-savings'], queryFn: () => fetch('/api/extra-savings', { credentials: 'include' }).then(r => r.json()) });
  const { data: rates } = useQuery({ queryKey: ['/api/exchange-rates'], queryFn: () => fetch('/api/exchange-rates', { credentials: 'include' }).then(r => r.json()), staleTime: 5 * 60 * 1000 });

  const createIbanMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/ibans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/ibans'] }); setAddIban(false); setIbanForm({ title: '', iban: '' }); }
  });

  const updateIbanMutation = useMutation({
    mutationFn: ({ id, data }: any) => fetch(`/api/ibans/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/ibans'] }); setEditIbanId(null); setIbanForm({ title: '', iban: '' }); }
  });

  const deleteIbanMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/ibans/${id}`, { method: 'DELETE', credentials: 'include' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/ibans'] })
  });

  const savingsMutation = useMutation({
    mutationFn: ({ currency, amount }: any) => fetch(`/api/savings/${currency}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ amount: parseFloat(String(amount).replace(',', '.')) }) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/savings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/savings-transactions'] });
      setAddInput('');
      setAddingMode(null);
      setAddIsOffRecord(false);
    }
  });

  const upsertExtraMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/extra-savings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/extra-savings'] }); setExtraForm({ title: 'Diğer Birikim', amount: '', addAmount: '' }); setShowNewExtra(false); }
  });

  const offRecordMutation = useMutation({
    mutationFn: ({ currency, amount }: { currency: string; amount: string }) =>
      fetch(`/api/savings/${currency}/off-record`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ amount: parseFloat(amount.replace(',', '.')) }) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/savings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/savings-transactions'] });
      setAddInput('');
      setAddingMode(null);
      setAddIsOffRecord(false);
    }
  });

  const updateExtraInfoMutation = useMutation({
    mutationFn: ({ id, title, currency }: { id: number; title: string; currency: string }) =>
      fetch(`/api/extra-savings/${id}/info`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ title, currency }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/extra-savings'] }); setExtraInfoEdit(null); }
  });

  const addExtraMutation = useMutation({
    mutationFn: ({ id, amount }: any) => fetch(`/api/extra-savings/${id}/add`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ amount: parseFloat(String(amount).replace(',', '.')) }) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/extra-savings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/savings-transactions'] });
      setExtraForm(prev => ({ ...prev, addAmount: '' }));
      setExtraEditId(null);
    }
  });

  const getSavingsAmount = (currency: string) => (savings as any[]).find((s: any) => s.currency === currency)?.amount || 0;
  const getSavingsTRY = (currency: string, amount: number) => {
    if (!rates || amount === 0) return 0;
    if (currency === 'USD') return amount * (rates as any).usd;
    if (currency === 'EUR') return amount * (rates as any).eur;
    if (currency === 'GOLD') return amount * (rates as any).gold;
    return 0;
  };
  const totalSavingsTRY = ['USD', 'EUR', 'GOLD'].reduce((sum, c) => sum + getSavingsTRY(c, getSavingsAmount(c)), 0);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'iban') deleteIbanMutation.mutate(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const openAddMode = (c: 'USD' | 'EUR' | 'GOLD', type: 'add' | 'subtract') => {
    setAddingMode({ currency: c, type });
    setAddInput('');
    setAddIsOffRecord(false);
    setOpenRowId(null);
  };
  const closeAddMode = () => { setAddingMode(null); setAddInput(''); setAddIsOffRecord(false); };

  const handleAddSubmit = () => {
    if (!addingMode || !addInput) return;
    const { currency, type } = addingMode;
    const delta = parseFloat(addInput.replace(',', '.'));
    if (isNaN(delta) || delta <= 0) return;
    if (type === 'add') {
      if (addIsOffRecord) {
        offRecordMutation.mutate({ currency, amount: addInput });
      } else {
        const current = getSavingsAmount(currency);
        savingsMutation.mutate({ currency, amount: String(current + delta) });
      }
    } else {
      const current = getSavingsAmount(currency);
      savingsMutation.mutate({ currency, amount: String(Math.max(0, current - delta)) });
    }
  };

  const currencyInfo = {
    USD: { label: 'Dolar', symbol: '$', Icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    EUR: { label: 'Euro', symbol: '€', Icon: Euro, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    GOLD: { label: 'Gram Altın', symbol: 'gr', Icon: Coins, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-display font-bold">Cüzdanım</h1>
        <p className="text-muted-foreground mt-1 text-sm">IBAN ve birikimlerinizi yönetin</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl">
        {([{ key: 'savings', label: 'Birikimlerim' }, { key: 'ibans', label: "IBAN'larım" }] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Birikimlerim Tab */}
      {tab === 'savings' && (
        <div className="space-y-4">
          {/* Summary card */}
          {totalSavingsTRY > 0 && (
            <Card className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground border-primary/20">
              <p className="font-medium opacity-80 text-sm mb-1">Toplam Birikim (₺)</p>
              <p className="text-3xl font-bold">{fmt(totalSavingsTRY)}</p>
              <p className="text-xs opacity-60 mt-1">Güncel kurlar üzerinden hesaplandı</p>
            </Card>
          )}

          {/* USD / EUR / GOLD rows */}
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-border/30">
              {(['USD', 'EUR', 'GOLD'] as const).map(c => {
                const info = currencyInfo[c];
                const amount = getSavingsAmount(c);
                const tryValue = getSavingsTRY(c, amount);
                const isActiveMode = addingMode?.currency === c;
                const isPending = savingsMutation.isPending || offRecordMutation.isPending;

                return (
                  <div key={c}>
                    <SwipeRow
                      id={`savings-${c}`}
                      openRowId={openRowId}
                      setOpenRowId={setOpenRowId}
                      hideDesktopActions
                      customActions={[
                        {
                          label: 'Ekle',
                          icon: <Plus size={16} className="text-white" />,
                          onClick: () => openAddMode(c, 'add'),
                          className: 'bg-emerald-600 hover:bg-emerald-700',
                        },
                        {
                          label: 'Azalt',
                          icon: <Minus size={16} className="text-white" />,
                          onClick: () => openAddMode(c, 'subtract'),
                          className: 'bg-orange-500 hover:bg-orange-600',
                        },
                      ]}
                    >
                      <div className="flex items-center gap-3 px-4 py-3.5 group">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", info.bg)}>
                          <info.Icon className={cn("w-4.5 h-4.5", info.color)} size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{info.label}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {Number(amount).toLocaleString('tr-TR', { maximumFractionDigits: 3 })} {c === 'GOLD' ? 'gram' : info.symbol}
                          </p>
                        </div>
                        <p className={cn("text-sm font-bold tabular-nums", isActiveMode ? 'mr-2' : 'mr-8 md:mr-2', info.color)}>{fmt(tryValue)}</p>
                        {/* Desktop add/subtract buttons on hover */}
                        <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                          <button
                            onClick={() => openAddMode(c, 'add')}
                            data-testid={`button-add-savings-${c}`}
                            className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 hover:bg-emerald-500/20 transition-all">
                            <Plus size={13} />
                          </button>
                          <button
                            onClick={() => openAddMode(c, 'subtract')}
                            data-testid={`button-subtract-savings-${c}`}
                            className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 hover:bg-orange-500/20 transition-all">
                            <Minus size={13} />
                          </button>
                        </div>
                      </div>
                    </SwipeRow>

                    {/* Unified add / subtract form */}
                    {isActiveMode && (
                      <div className={cn("px-4 pb-4 border-t", addingMode.type === 'add' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-orange-500/5 border-orange-500/20')}>
                        <div className="flex items-center justify-between pt-3 mb-2">
                          <p className={cn("text-xs font-semibold", addingMode.type === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400')}>
                            {addingMode.type === 'add' ? `Ekle — ${info.label}` : `Azalt — ${info.label}`}
                          </p>
                          {addingMode.type === 'add' && (
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={addIsOffRecord}
                                  onChange={e => setAddIsOffRecord(e.target.checked)}
                                  data-testid={`checkbox-offrecord-${c}`}
                                />
                                <div className={cn(
                                  "w-9 h-5 rounded-full transition-colors",
                                  addIsOffRecord ? 'bg-amber-500' : 'bg-border'
                                )} />
                                <div className={cn(
                                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                                  addIsOffRecord ? 'translate-x-4' : 'translate-x-0'
                                )} />
                              </div>
                              <span className={cn("text-xs font-medium", addIsOffRecord ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
                                Kayıt Dışı
                              </span>
                            </label>
                          )}
                        </div>
                        {addIsOffRecord && addingMode.type === 'add' && (
                          <p className="text-xs text-muted-foreground mb-2">Bakiyene eklenir ancak bu ay gider olarak sayılmaz.</p>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            className={inp}
                            placeholder={`Miktar (${c === 'GOLD' ? 'gram' : info.symbol})...`}
                            value={addInput}
                            onChange={e => setAddInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddSubmit()}
                            autoFocus
                            data-testid={`input-add-savings-${c}`}
                          />
                          <button
                            onClick={handleAddSubmit}
                            disabled={!addInput || isPending}
                            data-testid={`save-add-savings-${c}`}
                            className={cn("px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition-colors whitespace-nowrap flex-shrink-0",
                              addIsOffRecord && addingMode.type === 'add' ? 'bg-amber-600 hover:bg-amber-700' :
                              addingMode.type === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-500 hover:bg-orange-600'
                            )}>
                            {isPending ? '...' : addingMode.type === 'add' ? 'Ekle' : 'Azalt'}
                          </button>
                          <button
                            onClick={closeAddMode}
                            className="p-2.5 rounded-xl border-2 border-border text-muted-foreground hover:border-foreground transition-colors flex-shrink-0">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </Card>

          {/* Diğer Birikimler */}
          <div>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diğer Birikimler</h2>
              <button
                data-testid="button-add-extra-savings"
                onClick={() => { setShowNewExtra(true); setExtraForm({ title: 'Diğer Birikim', amount: '', addAmount: '' }); }}
                className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors">
                <Plus size={14} />
              </button>
            </div>
            {(extraSavings as any[]).length > 0 && (
              <div className="space-y-3">
                {(extraSavings as any[]).map((es: any) => {
                  const r = rates as any;
                  const rate = es.currency === 'GOLD' ? (r?.gold || 0) : es.currency === 'USD' ? (r?.usd || 0) : es.currency === 'EUR' ? (r?.eur || 0) : 1;
                  const tryVal = es.amount * rate;
                  const unitLabel = es.currency === 'GOLD' ? 'gram' : es.currency === 'USD' ? 'USD' : es.currency === 'EUR' ? 'EUR' : es.currency;
                  const addPlaceholder = `Eklenecek ${unitLabel}...`;
                  const isEditingInfo = extraInfoEdit?.id === es.id;
                  return (
                    <Card key={es.id} className="p-4">
                      {isEditingInfo ? (
                        <div className="space-y-3">
                          <div>
                            <label className={lbl}>Birikim Adı</label>
                            <input className={inp} value={extraInfoEdit.title}
                              onChange={e => setExtraInfoEdit(p => p ? { ...p, title: e.target.value } : p)} />
                          </div>
                          <div>
                            <label className={lbl}>Birikim Cinsi</label>
                            <select className={inp} value={extraInfoEdit.currency}
                              onChange={e => setExtraInfoEdit(p => p ? { ...p, currency: e.target.value } : p)}>
                              <option value="GOLD">Altın (gram)</option>
                              <option value="USD">Dolar (USD)</option>
                              <option value="EUR">Euro (EUR)</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => updateExtraInfoMutation.mutate(extraInfoEdit!)} disabled={updateExtraInfoMutation.isPending}
                              className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                              Kaydet
                            </button>
                            <button onClick={() => setExtraInfoEdit(null)}
                              className="px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium transition-colors">
                              İptal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Coins size={18} className="text-amber-600 dark:text-amber-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{es.title}</p>
                                <p className="text-xs text-muted-foreground">{Number(es.amount).toLocaleString('tr-TR', { maximumFractionDigits: 3 })} {unitLabel}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {rate > 0 && <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">{fmt(tryVal)}</p>}
                              <button
                                data-testid={`button-edit-extra-${es.id}`}
                                onClick={() => setExtraInfoEdit({ id: es.id, title: es.title, currency: es.currency })}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                                <Pencil size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <input type="text" inputMode="decimal" className={inp} placeholder={addPlaceholder}
                              value={extraEditId === es.id ? extraForm.addAmount : ''}
                              onChange={e => { setExtraEditId(es.id); setExtraForm(prev => ({ ...prev, addAmount: e.target.value })); }} />
                            <button
                              onClick={() => { if (extraForm.addAmount) addExtraMutation.mutate({ id: es.id, amount: extraForm.addAmount }); }}
                              disabled={!extraForm.addAmount || addExtraMutation.isPending}
                              className="px-4 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                              Ekle
                            </button>
                          </div>
                        </>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {(extraSavings as any[]).length === 0 && !showNewExtra && (
              <p className="text-xs text-muted-foreground px-0.5 py-1">Henüz başka birikim eklenmemiş. + ile ekleyebilirsiniz.</p>
            )}

            {showNewExtra && (
              <Card className="p-4">
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Birikim Adı</label>
                    <input type="text" className={inp} placeholder="Örn: Babam için altın"
                      value={extraForm.title} onChange={e => setExtraForm(prev => ({ ...prev, title: e.target.value }))} autoFocus />
                  </div>
                  <div>
                    <label className={lbl}>Birikim Cinsi</label>
                    <select className={inp} value={extraForm.addAmount || 'GOLD'}
                      onChange={e => setExtraForm(prev => ({ ...prev, addAmount: e.target.value }))}>
                      <option value="GOLD">Altın (gram)</option>
                      <option value="USD">Dolar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Başlangıç miktarı</label>
                    <input type="text" inputMode="decimal" className={inp} placeholder="0,00"
                      value={extraForm.amount} onChange={e => setExtraForm(prev => ({ ...prev, amount: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => upsertExtraMutation.mutate({ title: extraForm.title || 'Diğer Birikim', currency: extraForm.addAmount || 'GOLD', amount: parseFloat(String(extraForm.amount).replace(',', '.')) || 0 })}
                      disabled={upsertExtraMutation.isPending}
                      data-testid="button-create-extra-savings"
                      className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors">
                      {upsertExtraMutation.isPending ? 'Kaydediliyor...' : 'Birikimi Oluştur'}
                    </button>
                    <button
                      onClick={() => setShowNewExtra(false)}
                      className="px-4 py-2.5 rounded-xl border-2 border-border text-sm font-medium text-muted-foreground hover:border-foreground transition-colors">
                      İptal
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* IBAN'larım Tab */}
      {tab === 'ibans' && (
        <div className="space-y-3">
          <Button size="sm" onClick={() => { setAddIban(true); setEditIbanId(null); setIbanForm({ title: '', iban: '' }); }} data-testid="add-iban">
            <Plus className="w-4 h-4 mr-1.5" /> IBAN Ekle
          </Button>

          {(ibans as any[]).map((iban: any) => (
            <Card key={iban.id} data-testid={`iban-${iban.id}`} className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Landmark size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{iban.title}</p>
                <p className="font-mono text-xs text-muted-foreground truncate">{iban.iban}</p>
              </div>
              <button onClick={() => copyToClipboard(iban.iban, iban.id)} data-testid={`copy-iban-${iban.id}`}
                className={cn("p-2 rounded-lg transition-all flex-shrink-0", copiedId === iban.id ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10')}>
                {copiedId === iban.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={() => { setEditIbanId(iban.id); setIbanForm({ title: iban.title, iban: iban.iban }); setAddIban(false); }}
                data-testid={`edit-iban-${iban.id}`}
                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex-shrink-0">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteConfirm({ type: 'iban', id: iban.id, name: iban.title })}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
          {(ibans as any[]).length === 0 && !addIban && !editIbanId && (
            <p className="text-muted-foreground text-sm py-2">Henüz IBAN eklenmemiş</p>
          )}

          {(addIban || editIbanId !== null) && (
            <Card className="p-5">
              <h3 className="font-semibold mb-4">{editIbanId ? 'IBAN Düzenle' : 'Yeni IBAN'}</h3>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Başlık (ör. Akbank Vadesiz)</label>
                  <input className={inp} placeholder="Akbank Vadesiz" value={ibanForm.title} onChange={e => setIbanForm({ ...ibanForm, title: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>IBAN Numarası</label>
                  <input className={inp} placeholder="TR..." value={ibanForm.iban} onChange={e => setIbanForm({ ...ibanForm, iban: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setAddIban(false); setEditIbanId(null); setIbanForm({ title: '', iban: '' }); }}
                    className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-medium hover:border-foreground transition-colors">İptal</button>
                  <button
                    onClick={() => editIbanId ? updateIbanMutation.mutate({ id: editIbanId, data: ibanForm }) : createIbanMutation.mutate(ibanForm)}
                    disabled={!ibanForm.title || !ibanForm.iban || createIbanMutation.isPending || updateIbanMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {editIbanId ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      <ConfirmModal open={!!deleteConfirm} message={`"${deleteConfirm?.name}" silinecek. Emin misiniz?`} onConfirm={confirmDelete} onCancel={() => setDeleteConfirm(null)} />
    </div>
  );
}
