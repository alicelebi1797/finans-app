import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function getMonths(count = 6) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      defaultLabel: TR_MONTHS[d.getMonth()],
    };
  });
}

const BASE_MONTHS = getMonths(6);

const DEFAULT_EXPENSE_ROWS = [
  { id: 'gider_1', label: 'Gider 1' },
  { id: 'gider_2', label: 'Gider 2' },
  { id: 'gider_3', label: 'Gider 3' },
];

const DEFAULT_INCOME_ROWS = [
  { id: 'gelir_1', label: 'Gelir 1' },
  { id: 'gelir_2', label: 'Gelir 2' },
  { id: 'gelir_3', label: 'Gelir 3' },
];

function fmtTL(val: number | undefined) {
  if (!val && val !== 0) return '';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
}
function fmtEUR(val: number | undefined) {
  if (!val && val !== 0) return '';
  return `€${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val)}`;
}
function fmtNum(val: number, decimals = 2) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: decimals, minimumFractionDigits: 0 }).format(val);
}
function genId() {
  return 'row_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}
function parseTL(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : Math.round(n);
}

/* ─── InlineEdit (standalone) ─────────────────────────────────────── */
const InlineEdit = memo(function InlineEdit({
  value, onSave, onCancel, placeholder = '', className = '', numeric = false, onLiveChange
}: {
  value: string; onSave: (v: string) => void; onCancel: () => void;
  placeholder?: string; className?: string; numeric?: boolean;
  onLiveChange?: (v: string) => void;
}) {
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <input
      ref={ref}
      value={val}
      onChange={e => { setVal(e.target.value); onLiveChange?.(e.target.value); }}
      onBlur={() => onSave(val)}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); onSave(val); }
        if (e.key === 'Escape') onCancel();
      }}
      placeholder={placeholder}
      inputMode={numeric ? 'decimal' : 'text'}
      className={cn('bg-transparent outline-none border-none w-full tabular-nums', className)}
    />
  );
});

/* ─── DataCell (top-level so React never remounts it on parent re-render) ─ */
interface DataCellProps {
  rowId: string;
  monthKey: string;
  isEur?: boolean;
  isNote?: boolean;
  readOnly?: boolean;
  overrideVal?: string | number;
  cellClass?: string;
  isBirikimTL?: boolean;
  value: string | number | undefined;
  isActive: boolean;
  birikimLiveVal: string;
  rates?: { usd: number; eur: number; gold: number };
  onActivate: () => void;
  onSave: (v: string) => void;
  onCancel: () => void;
  onLiveChange?: (v: string) => void;
}

const DataCell = memo(function DataCell({
  isEur, isNote, readOnly, overrideVal, cellClass = '', isBirikimTL,
  value: rawVal, isActive, birikimLiveVal, rates,
  onActivate, onSave, onCancel, onLiveChange,
}: DataCellProps) {
  const display = overrideVal !== undefined ? overrideVal
    : isNote ? (rawVal || '')
    : isEur ? fmtEUR(typeof rawVal === 'number' ? rawVal : undefined)
    : fmtTL(typeof rawVal === 'number' ? rawVal : undefined);

  const sharedCls = cn(
    'h-10 px-2 text-xs font-medium tabular-nums text-center align-middle min-w-[96px]',
    'border-r border-border/40 last:border-r-0 overflow-hidden',
    cellClass
  );

  const showPopup = isBirikimTL && isActive && !!rates;
  const liveTL = showPopup ? parseTL(birikimLiveVal) : 0;

  if (readOnly) {
    return (
      <td className={sharedCls}>
        {display || <span className="text-muted-foreground/25">—</span>}
      </td>
    );
  }

  if (isActive) {
    return (
      <td className={cn(sharedCls, 'p-0 ring-2 ring-inset ring-primary/60 relative')} style={{ overflow: 'visible' }}>
        <div className="flex items-center justify-center h-10 px-1">
          <InlineEdit
            value={rawVal !== undefined && rawVal !== '' ? String(rawVal) : ''}
            onSave={onSave}
            onCancel={onCancel}
            placeholder={isNote ? 'Not...' : '0'}
            numeric={!isNote}
            onLiveChange={onLiveChange}
            className={cn('text-center text-xs w-full', isNote ? 'italic' : 'font-medium tabular-nums')}
          />
        </div>
        {showPopup && rates && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg p-2.5 min-w-[130px] pointer-events-none">
            <div className="space-y-1.5">
              {[
                { flag: '🇺🇸', label: 'Dolar',  val: liveTL > 0 ? `$${fmtNum(liveTL / rates.usd, 1)}` : '—' },
                { flag: '🇪🇺', label: 'Euro',   val: liveTL > 0 ? `€${fmtNum(liveTL / rates.eur, 1)}` : '—' },
                { flag: '🥇', label: 'Altın',  val: liveTL > 0 ? `${fmtNum(liveTL / rates.gold, 3)} gr` : '—' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span>{item.flag}</span><span>{item.label}</span>
                  </span>
                  <span className="text-[11px] font-semibold tabular-nums">{item.val}</span>
                </div>
              ))}
            </div>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-popover border-l border-t border-border rotate-45" />
          </div>
        )}
      </td>
    );
  }

  return (
    <td
      className={cn(sharedCls, 'cursor-pointer hover:bg-primary/5 transition-colors duration-100')}
      onClick={onActivate}
    >
      {display || <span className="text-muted-foreground/25">—</span>}
    </td>
  );
});

/* ─── Main page ────────────────────────────────────────────────────── */
export default function FutureMonths() {
  const { data: rawData = {}, isLoading } = useQuery<Record<string, any>>({
    queryKey: ['/api/planning'],
    queryFn: () => fetch('/api/planning', { credentials: 'include' }).then(r => r.json()),
  });

  const { data: rates } = useQuery<{ usd: number; eur: number; gold: number }>({
    queryKey: ['/api/exchange-rates'],
    staleTime: 5 * 60 * 1000,
  });

  const [localData, setLocalData]     = useState<Record<string, any>>({});
  const [initialized, setInitialized] = useState(false);
  const merged = { ...rawData, ...localData };

  const [expenseRows, setExpenseRows] = useState<{ id: string; label: string }[]>(DEFAULT_EXPENSE_ROWS);
  const [incomeRows,  setIncomeRows]  = useState<{ id: string; label: string }[]>(DEFAULT_INCOME_ROWS);
  const [monthLabels, setMonthLabels] = useState<Record<string, string>>({});

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, any>) =>
      fetch('/api/planning', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/planning'] }),
  });

  useEffect(() => {
    if (!isLoading && !initialized) {
      const eRows: { id: string; label: string }[] = rawData['_expense_rows'] || DEFAULT_EXPENSE_ROWS;
      const iRows: { id: string; label: string }[] = rawData['_income_rows']  || DEFAULT_INCOME_ROWS;

      if (rawData['_expense_rows']) setExpenseRows(eRows);
      if (rawData['_income_rows'])  setIncomeRows(iRows);
      if (rawData['_month_labels']) setMonthLabels(rawData['_month_labels']);

      // Roll-over: if the last column (6th month) has no data, copy from the 5th month
      const lastMonth = BASE_MONTHS[BASE_MONTHS.length - 1].key;
      const prevMonth = BASE_MONTHS[BASE_MONTHS.length - 2].key;
      const allRowIds = [
        ...eRows.map((r: { id: string }) => r.id),
        'birikim_tl',
        ...iRows.map((r: { id: string }) => r.id),
      ];
      const lastHasData = allRowIds.some(id => rawData[`${id}|${lastMonth}`] !== undefined);
      if (!lastHasData) {
        const patch: Record<string, any> = {};
        allRowIds.forEach(id => {
          const v = rawData[`${id}|${prevMonth}`];
          if (v !== undefined) patch[`${id}|${lastMonth}`] = v;
          const note = rawData[`${id}_note|${prevMonth}`];
          if (note !== undefined) patch[`${id}_note|${lastMonth}`] = note;
        });
        if (Object.keys(patch).length > 0) {
          const next = { ...rawData, ...patch };
          setLocalData(patch);
          saveMutation.mutate(next);
        }
      }

      setInitialized(true);
    }
  }, [rawData, isLoading, initialized, saveMutation]);

  const persist = useCallback((patch: Record<string, any>) => {
    const next = { ...merged, ...patch };
    setLocalData(prev => ({ ...prev, ...patch }));
    saveMutation.mutate(next);
  }, [merged, saveMutation]);

  const persistRows = useCallback((eRows: typeof expenseRows, iRows: typeof incomeRows) => {
    persist({ _expense_rows: eRows, _income_rows: iRows });
  }, [persist]);

  const getNum = (rowId: string, monthKey: string): number => {
    const v = merged[`${rowId}|${monthKey}`];
    return typeof v === 'number' ? v : 0;
  };

  const expenseIdsForHarcama = [...expenseRows.map(r => r.id), 'birikim_tl'];
  const calcTotalIncome    = (mk: string) => incomeRows.reduce((s, r) => s + getNum(r.id, mk), 0);
  const calcTotalExpenses  = (mk: string) => expenseIdsForHarcama.reduce((s, id) => s + getNum(id, mk), 0);
  const calcHarcama        = (mk: string) => calcTotalIncome(mk) - calcTotalExpenses(mk);

  const [editingCell,  setEditingCell]  = useState<{ rowId: string; monthKey: string; isNote?: boolean } | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ section: 'expense' | 'income'; id: string } | null>(null);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [hoverRow,     setHoverRow]     = useState<string | null>(null);
  const [birikimLive,  setBirikimLive]  = useState('');

  const months = BASE_MONTHS.map(m => ({
    ...m,
    label: monthLabels[m.key] || m.defaultLabel,
  }));

  const saveCell = useCallback((rowId: string, monthKey: string, rawVal: string, isNote: boolean) => {
    const storageKey = `${isNote ? rowId + '_note' : rowId}|${monthKey}`;
    let parsed: number | string = rawVal.trim();
    if (!isNote) {
      const n = parseFloat(rawVal.replace(/[^0-9.,-]/g, '').replace(',', '.'));
      parsed = isNaN(n) ? 0 : Math.round(n);
    }
    const patch: Record<string, any> = { [storageKey]: parsed };
    setLocalData(prev => ({ ...prev, ...patch }));
    saveMutation.mutate({ ...merged, ...patch });
    setEditingCell(null);
    setBirikimLive('');
  }, [merged, saveMutation]);

  const addRow = (section: 'expense' | 'income') => {
    const newRow = { id: genId(), label: 'Yeni Satır' };
    if (section === 'expense') {
      const next = [...expenseRows, newRow];
      setExpenseRows(next);
      persistRows(next, incomeRows);
    } else {
      const next = [...incomeRows, newRow];
      setIncomeRows(next);
      persistRows(expenseRows, next);
    }
  };

  const deleteRow = (section: 'expense' | 'income', id: string) => {
    if (section === 'expense') {
      const next = expenseRows.filter(r => r.id !== id);
      setExpenseRows(next);
      persistRows(next, incomeRows);
    } else {
      const next = incomeRows.filter(r => r.id !== id);
      setIncomeRows(next);
      persistRows(expenseRows, next);
    }
  };

  const saveLabel = (section: 'expense' | 'income', id: string, newLabel: string) => {
    const trimmed = newLabel.trim() || 'Satır';
    if (section === 'expense') {
      const next = expenseRows.map(r => r.id === id ? { ...r, label: trimmed } : r);
      setExpenseRows(next);
      persistRows(next, incomeRows);
    } else {
      const next = incomeRows.map(r => r.id === id ? { ...r, label: trimmed } : r);
      setIncomeRows(next);
      persistRows(expenseRows, next);
    }
    setEditingLabel(null);
  };

  const saveMonthLabel = (key: string, val: string) => {
    const next = { ...monthLabels, [key]: val.trim() || BASE_MONTHS.find(m => m.key === key)?.defaultLabel || '' };
    setMonthLabels(next);
    persist({ _month_labels: next });
    setEditingMonth(null);
  };

  /* Helper: build DataCell props */
  const cellProps = (
    rowId: string, monthKey: string,
    opts: { isEur?: boolean; isNote?: boolean; cellClass?: string; isBirikimTL?: boolean } = {}
  ) => {
    const { isEur, isNote, cellClass, isBirikimTL } = opts;
    const storageKey = isNote ? `${rowId}_note|${monthKey}` : `${rowId}|${monthKey}`;
    const isActive = editingCell?.rowId === rowId && editingCell?.monthKey === monthKey
      && (isNote ? !!editingCell.isNote : !editingCell.isNote);
    return {
      rowId, monthKey, isEur, isNote, cellClass,
      isBirikimTL: !!isBirikimTL,
      value: merged[storageKey],
      isActive,
      birikimLiveVal: isBirikimTL && isActive ? birikimLive : '',
      rates,
      onActivate: () => {
        setEditingCell({ rowId, monthKey, isNote });
        if (isBirikimTL) setBirikimLive(merged[storageKey] !== undefined ? String(merged[storageKey]) : '');
      },
      onSave:   (v: string) => saveCell(rowId, monthKey, v, !!isNote),
      onCancel: () => { setEditingCell(null); setBirikimLive(''); },
      onLiveChange: isBirikimTL ? (v: string) => setBirikimLive(v) : undefined,
    } satisfies DataCellProps;
  };

  const SectionHeader = ({ label, color }: { label: string; color: 'amber' | 'emerald' }) => (
    <tr>
      <td
        colSpan={months.length + 1}
        className={cn(
          'px-4 py-2 text-xs font-bold uppercase tracking-widest sticky left-0',
          color === 'amber'
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-y border-amber-200/60 dark:border-amber-700/40'
            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-y border-emerald-200/60 dark:border-emerald-700/40'
        )}
      >
        {label}
      </td>
    </tr>
  );

  const LabelCell = ({ section, row }: { section: 'expense' | 'income'; row: { id: string; label: string } }) => (
    <div className="flex items-center gap-1.5 min-h-[40px]">
      {editingLabel?.section === section && editingLabel?.id === row.id ? (
        <InlineEdit
          value={row.label}
          onSave={v => saveLabel(section, row.id, v)}
          onCancel={() => setEditingLabel(null)}
          className="text-xs font-medium flex-1"
        />
      ) : (
        <span
          className="text-xs font-medium flex-1 cursor-pointer hover:text-primary transition-colors truncate max-w-[120px]"
          onClick={() => setEditingLabel({ section, id: row.id })}
          title={row.label}
        >
          {row.label}
        </span>
      )}
      <button
        onClick={() => deleteRow(section, row.id)}
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all',
          hoverRow === row.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Gelecek Aylar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Aylık gelir-gider planlaması. Hücrelere tıklayarak düzenleyebilirsiniz.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60 border-b border-border">
                <th className="sticky left-0 z-20 bg-muted/80 backdrop-blur-sm px-4 py-3 text-left text-xs font-semibold text-muted-foreground min-w-[160px] border-r border-border/60">
                  Kalem
                </th>
                {months.map(m => (
                  <th
                    key={m.key}
                    className="px-2 py-3 text-center text-xs font-semibold text-muted-foreground min-w-[96px] border-r border-border/40 last:border-r-0 group cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => setEditingMonth(m.key)}
                  >
                    {editingMonth === m.key ? (
                      <InlineEdit
                        value={m.label}
                        onSave={v => saveMonthLabel(m.key, v)}
                        onCancel={() => setEditingMonth(null)}
                        className="text-center text-xs font-semibold w-full"
                      />
                    ) : (
                      <span className="group-hover:text-primary transition-colors">{m.label}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <SectionHeader label="Giderler" color="amber" />

              {expenseRows.map(row => (
                <tr
                  key={row.id}
                  onMouseEnter={() => setHoverRow(row.id)}
                  onMouseLeave={() => setHoverRow(null)}
                  className="group border-b border-border/30 hover:bg-amber-50/60 dark:hover:bg-amber-900/10 transition-colors duration-100"
                >
                  <td className="sticky left-0 z-10 bg-card group-hover:bg-amber-50/80 dark:group-hover:bg-amber-900/10 px-3 py-0 border-r border-border/40 transition-colors">
                    <LabelCell section="expense" row={row} />
                  </td>
                  {months.map(m => <DataCell key={m.key} {...cellProps(row.id, m.key)} />)}
                </tr>
              ))}

              {/* ── BİRİKİM ── */}
              <tr className="border-b border-border/10 bg-amber-50/40 dark:bg-amber-900/10">
                <td className="sticky left-0 z-10 bg-amber-50/60 dark:bg-amber-900/15 px-3 border-r border-border/40">
                  <div className="min-h-[40px] flex flex-col justify-center">
                    <p className="text-xs font-medium">Birikim</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">TL</p>
                  </div>
                </td>
                {months.map(m => (
                  <DataCell key={m.key} {...cellProps('birikim_tl', m.key, {
                    isBirikimTL: true,
                    cellClass: 'bg-amber-50/40 dark:bg-amber-900/10',
                  })} />
                ))}
              </tr>

              {/* Add expense row */}
              <tr className="border-b border-border/40">
                <td colSpan={months.length + 1} className="py-2 px-4 cursor-pointer group" onClick={() => addRow('expense')}>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/50 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    <Plus className="w-3.5 h-3.5" /><span>Gider satırı ekle</span>
                  </div>
                </td>
              </tr>

              {/* ── NET KALAN ── */}
              <tr className="border-b border-primary/20">
                <td className="sticky left-0 z-10 px-4 py-0 bg-primary/10 border-r border-primary/20">
                  <div className="flex items-center min-h-[42px]">
                    <span className="text-xs font-bold text-primary">NET KALAN</span>
                  </div>
                </td>
                {months.map(m => {
                  const val = calcHarcama(m.key);
                  return (
                    <td key={m.key} className="h-[42px] px-2 text-center text-xs font-bold tabular-nums min-w-[96px] border-r border-primary/20 last:border-r-0 bg-primary/5">
                      <span className={cn(
                        'font-bold',
                        val !== 0 ? (val > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400') : 'text-muted-foreground/30'
                      )}>
                        {val !== 0 ? fmtTL(val) : '—'}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* ── GELİRLER ── */}
              <SectionHeader label="Gelirler" color="emerald" />

              <tr className="border-b border-border/30 bg-emerald-50/50 dark:bg-emerald-900/10">
                <td className="sticky left-0 z-10 bg-emerald-50/70 dark:bg-emerald-900/15 px-4 py-0 border-r border-border/40">
                  <div className="flex items-center min-h-[40px]">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Toplam Gelir</span>
                  </div>
                </td>
                {months.map(m => {
                  const val = calcTotalIncome(m.key);
                  return (
                    <td key={m.key} className="h-10 px-2 text-center text-xs font-bold tabular-nums min-w-[96px] border-r border-border/40 last:border-r-0 text-emerald-700 dark:text-emerald-400">
                      {val !== 0 ? fmtTL(val) : <span className="text-muted-foreground/25">—</span>}
                    </td>
                  );
                })}
              </tr>

              {incomeRows.map(row => {
                const isDiger = row.id === 'diger_income';
                return [
                  <tr
                    key={row.id}
                    onMouseEnter={() => setHoverRow(row.id)}
                    onMouseLeave={() => setHoverRow(null)}
                    className={cn(
                      'group border-b transition-colors duration-100',
                      isDiger ? 'border-border/10' : 'border-border/30',
                      'hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10'
                    )}
                  >
                    <td
                      className="sticky left-0 z-10 bg-card group-hover:bg-emerald-50/80 dark:group-hover:bg-emerald-900/10 px-3 py-0 border-r border-border/40 transition-colors"
                      rowSpan={isDiger ? 2 : 1}
                    >
                      <LabelCell section="income" row={row} />
                    </td>
                    {months.map(m => <DataCell key={m.key} {...cellProps(row.id, m.key)} />)}
                  </tr>,
                  isDiger && (
                    <tr key={`${row.id}_note`} className="border-b border-border/30 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors">
                      {months.map(m => (
                        <DataCell key={m.key} {...cellProps(row.id, m.key, {
                          isNote: true,
                          cellClass: 'italic text-muted-foreground text-[11px] bg-emerald-50/20 dark:bg-emerald-900/5',
                        })} />
                      ))}
                    </tr>
                  ),
                ];
              })}

              <tr>
                <td colSpan={months.length + 1} className="py-2.5 px-4 cursor-pointer group" onClick={() => addRow('income')}>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <Plus className="w-3.5 h-3.5" /><span>Gelir satırı ekle</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2.5 border-t border-border/30 bg-muted/20 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground/60">
            Hücreye tıkla → düzenle · İlk aya girilen değer sonraki boş aylara otomatik yayılır
          </p>
          {saveMutation.isPending && (
            <span className="text-[11px] text-muted-foreground/60 animate-pulse">Kaydediliyor...</span>
          )}
        </div>
      </div>
    </div>
  );
}
