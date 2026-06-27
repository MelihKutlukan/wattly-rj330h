import React, { useState } from 'react';
import { WaterBill } from '../types';
import {
  Plus, Edit2, Trash2, X, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, AlertTriangle, Droplets
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

interface WaterTrackerProps {
  waterBills: WaterBill[];
  currency: string;
  onAddWaterBill:    (month: number, year: number, cubicMeters: number, totalAmount: number, dueDate: string, isPaid: boolean, note?: string) => void;
  onEditWaterBill:   (id: string, month: number, year: number, cubicMeters: number, totalAmount: number, dueDate: string, isPaid: boolean, note?: string) => void;
  onDeleteWaterBill: (id: string) => void;
  onToggleWaterPaid: (id: string) => void;
}

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-stone-900 border border-stone-700 rounded-xl p-3 shadow-xl text-xs">
        <p className="text-stone-400 font-bold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-bold">
            {p.name}: {p.value} {p.name === 'm³' ? 'm³' : 'TL'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const inputCls = "w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-4 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-500 font-mono font-bold";
const selectCls = "w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-500";
const labelCls = "text-xs text-stone-500 dark:text-stone-400 font-bold";

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  waterBills, currency,
  onAddWaterBill, onEditWaterBill, onDeleteWaterBill, onToggleWaterPaid
}) => {
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected]               = useState<WaterBill | null>(null);
  const [activeChart, setActiveChart]         = useState<'m3' | 'amount'>('m3');

  const [month, setMonth]           = useState(new Date().getMonth() + 1);
  const [year, setYear]             = useState(new Date().getFullYear());
  const [cubicMeters, setCubicMeters] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate]       = useState('');
  const [isPaid, setIsPaid]         = useState(false);
  const [note, setNote]             = useState('');
  const [error, setError]           = useState('');

  const sorted = [...waterBills].sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  );

  const totalPaid   = waterBills.filter(b => b.isPaid).reduce((s, b) => s + b.totalAmount, 0);
  const totalUnpaid = waterBills.filter(b => !b.isPaid).reduce((s, b) => s + b.totalAmount, 0);
  const avgM3       = waterBills.length ? waterBills.reduce((s, b) => s + b.cubicMeters, 0) / waterBills.length : 0;
  const avgAmount   = waterBills.length ? waterBills.reduce((s, b) => s + b.totalAmount, 0) / waterBills.length : 0;

  let diffAmount = 0, diffPercent = 0, isIncrease = false;
  if (sorted.length >= 2) {
    diffAmount  = sorted[0].totalAmount - sorted[1].totalAmount;
    diffPercent = sorted[1].totalAmount ? (diffAmount / sorted[1].totalAmount) * 100 : 0;
    isIncrease  = diffAmount > 0;
  }

  const chartData = [...sorted].slice(0, 6).reverse().map(b => ({
    name: `${MONTHS[b.month - 1].slice(0, 3)} ${b.year}`,
    'm³':    b.cubicMeters,
    'Tutar': b.totalAmount,
  }));

  const resetForm = () => {
    setMonth(new Date().getMonth() + 1); setYear(new Date().getFullYear());
    setCubicMeters(''); setTotalAmount(''); setDueDate('');
    setIsPaid(false); setNote(''); setError('');
  };

  const handleOpenAdd = () => { resetForm(); setShowAddModal(true); };

  const handleOpenEdit = (bill: WaterBill) => {
    setSelected(bill);
    setMonth(bill.month); setYear(bill.year);
    setCubicMeters(String(bill.cubicMeters));
    setTotalAmount(String(bill.totalAmount));
    setDueDate(bill.dueDate);
    setIsPaid(bill.isPaid);
    setNote(bill.note || ''); setError('');
    setShowEditModal(true);
  };

  const validate = () => {
    if (!cubicMeters || parseFloat(cubicMeters) <= 0) { setError('Geçerli bir metreküp (m³) değeri girin.'); return false; }
    if (!totalAmount || parseFloat(totalAmount) <= 0)  { setError('Geçerli bir tutar girin.'); return false; }
    if (!dueDate)                                       { setError('Son ödeme tarihini seçin.'); return false; }
    return true;
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onAddWaterBill(month, year, parseFloat(cubicMeters), parseFloat(totalAmount), dueDate, isPaid, note.trim() || undefined);
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !validate()) return;
    onEditWaterBill(selected.id, month, year, parseFloat(cubicMeters), parseFloat(totalAmount), dueDate, isPaid, note.trim() || undefined);
    setShowEditModal(false);
  };

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v) + ' ' + currency;

  const closeModal = () => { setShowAddModal(false); setShowEditModal(false); };

  const cardCls = "bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 space-y-1 transition-all cursor-default";

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Başlık */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Droplets size={22} className="text-teal-500" /> Su Tüketimi
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">Aylık su faturalarını takip edin</p>
        </div>
        <button onClick={handleOpenAdd}
          className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 h-10 rounded-2xl flex items-center gap-1.5 shadow-[0_4px_12px_rgba(20,184,166,0.3)] transition-colors">
          <Plus size={16} /> Fatura Ekle
        </button>
      </div>

      {/* Özet kartlar */}
      {waterBills.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className={cardCls}>
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Ortalama m³</span>
            <span className="text-xl font-black text-teal-500 font-mono">{avgM3.toFixed(1)} m³</span>
          </div>
          <div className={cardCls}>
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Ort. Fatura</span>
            <span className="text-xl font-black text-stone-900 dark:text-stone-50 font-mono">{fmtMoney(avgAmount)}</span>
          </div>
          <div className={cardCls}>
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Toplam Ödendi</span>
            <span className="text-xl font-black text-emerald-500 font-mono">{fmtMoney(totalPaid)}</span>
          </div>
          <div className={`${cardCls} ${totalUnpaid > 0 ? '!border-amber-500/40 !bg-amber-500/5' : ''}`}>
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Bekleyen</span>
            <span className={`text-xl font-black font-mono ${totalUnpaid > 0 ? 'text-amber-500' : 'text-stone-400'}`}>{fmtMoney(totalUnpaid)}</span>
          </div>
        </div>
      )}

      {/* Önceki aya kıyasla */}
      {sorted.length >= 2 && (
        <div className={`flex items-center gap-3 rounded-2xl p-4 border text-sm font-bold ${isIncrease ? 'bg-rose-500/5 border-rose-500/20 text-rose-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
          {isIncrease ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          <span>
            {MONTHS[sorted[0].month - 1]} faturası önceki aya göre <strong>{isIncrease ? '+' : ''}{fmtMoney(diffAmount)}</strong> ({diffPercent.toFixed(1)}%)
          </span>
        </div>
      )}

      {/* Grafik */}
      {chartData.length >= 2 && (
        <div className="bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Son {chartData.length} Aylık Trend</h3>
              <p className="text-[10px] text-stone-400 mt-0.5">Su tüketim ve maliyet karşılaştırması</p>
            </div>
            <div className="flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1 border border-stone-200 dark:border-stone-700 gap-1">
              <button onClick={() => setActiveChart('m3')}
                className={`text-[9px] font-extrabold px-3 py-1 rounded-lg transition-all ${activeChart === 'm3' ? 'bg-teal-600 text-white' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}>
                m³
              </button>
              <button onClick={() => setActiveChart('amount')}
                className={`text-[9px] font-extrabold px-3 py-1 rounded-lg transition-all ${activeChart === 'amount' ? 'bg-blue-600 text-white' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}>
                TL
              </button>
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,113,108,0.15)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#78716c', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#78716c', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20,184,166,0.07)' }} />
                <Bar dataKey={activeChart === 'm3' ? 'm³' : 'Tutar'} fill={activeChart === 'm3' ? '#14b8a6' : '#3b82f6'}
                  radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Fatura Listesi */}
      {sorted.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Fatura Geçmişi</h3>
          {sorted.map(bill => {
            const isOverdue = !bill.isPaid && new Date(bill.dueDate) < new Date();
            const unitPrice = bill.cubicMeters > 0 ? bill.totalAmount / bill.cubicMeters : 0;
            return (
              <div key={bill.id}
                className={`bg-white dark:bg-stone-900/50 border rounded-3xl p-4 flex items-center justify-between transition-all ${
                  bill.isPaid ? 'border-stone-200 dark:border-stone-800'
                    : isOverdue ? 'border-rose-500/30 bg-rose-500/5'
                    : 'border-amber-500/30 bg-amber-500/5'
                }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => onToggleWaterPaid(bill.id)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                      bill.isPaid ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : isOverdue ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                    {bill.isPaid ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      {MONTHS[bill.month - 1]} {bill.year}
                      {!bill.isPaid && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isOverdue ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {isOverdue ? 'Gecikmiş' : 'Bekliyor'}
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1.5 font-mono">
                      <span className="text-teal-500 font-bold">{bill.cubicMeters} m³</span>
                      <span>•</span>
                      <span>{unitPrice.toFixed(2)} {currency}/m³</span>
                      <span>•</span>
                      <span>Son: {new Date(bill.dueDate).toLocaleDateString('tr-TR')}</span>
                    </p>
                    {bill.note && <p className="text-[9px] text-stone-400 italic mt-0.5 truncate">{bill.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-black text-stone-900 dark:text-stone-50 font-mono">{fmtMoney(bill.totalAmount)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenEdit(bill)}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition-colors border border-stone-200 dark:border-stone-700">
                      <Edit2 size={11} />
                    </button>
                    <button onClick={() => { setSelected(bill); setShowDeleteModal(true); }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/10">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-stone-100 dark:bg-stone-900/20 border border-dashed border-teal-300 dark:border-teal-800/50 rounded-3xl p-12 text-center space-y-4">
          <Droplets size={40} className="text-teal-400 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">Su Faturası Girilmemiş</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Aylık su faturalarını ekleyerek tüketim trendlerinizi analiz edin.
            </p>
          </div>
          <button onClick={handleOpenAdd}
            className="mx-auto bg-teal-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors">
            <Plus size={14} /> Su Faturası Ekle
          </button>
        </div>
      )}

      {/* Add / Edit modal — inline JSX (sub-component içinde tanımlamak her render'da unmount eder) */}
      {(showAddModal || showEditModal) && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div
            className="fixed inset-x-0 z-50 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl w-full max-w-md mx-auto animate-slide-up"
            style={{top:'15vh', bottom:0}}
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="h-full flex flex-col">
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" />
              </div>
              <div className="px-5 pb-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center">
                    <Droplets size={18} className="text-teal-500" />
                  </div>
                  <h2 className="text-base font-black text-stone-900 dark:text-stone-50">
                    {showAddModal ? 'Yeni Su Faturası' : 'Su Faturasını Düzenle'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button type="submit" className="px-3 h-8 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-colors">
                    Kaydet
                  </button>
                  <button type="button" onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-5 space-y-4 pb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Dönem Ayı</label>
                    <select value={month} onChange={e => setMonth(+e.target.value)} className={selectCls}>
                      {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Yıl</label>
                    <input type="number" value={year} onChange={e => setYear(+e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Tüketim (m³)</label>
                    <input type="number" step="0.01" placeholder="8.5" value={cubicMeters}
                      onChange={e => setCubicMeters(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Tutar ({currency})</label>
                    <input type="number" step="0.01" placeholder="340.00" value={totalAmount}
                      onChange={e => setTotalAmount(e.target.value)} className={inputCls} />
                  </div>
                </div>
                {cubicMeters && totalAmount && parseFloat(cubicMeters) > 0 && parseFloat(totalAmount) > 0 && (
                  <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-3 text-center">
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider block">Birim Fiyat</span>
                    <span className="text-xl font-black text-stone-900 dark:text-stone-50 font-mono">
                      {(parseFloat(totalAmount) / parseFloat(cubicMeters)).toFixed(2)} {currency}/m³
                    </span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className={labelCls}>Son Ödeme Tarihi</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
                </div>
                <div
                  className="flex items-center gap-3 bg-stone-100 dark:bg-stone-800/40 p-3.5 border border-stone-200 dark:border-stone-800 rounded-2xl cursor-pointer"
                  onClick={() => setIsPaid(!isPaid)}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isPaid ? 'bg-teal-600 border-teal-500' : 'border-stone-400 dark:border-stone-600'}`}>
                    {isPaid && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-200 cursor-pointer select-none">Fatura Ödendi</label>
                </div>
                <div className="space-y-1.5">
                  <label className={labelCls}>Not (Opsiyonel)</label>
                  <textarea placeholder="Fatura notları..." value={note} onChange={e => setNote(e.target.value)}
                    className="w-full h-14 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-500 resize-none" />
                </div>
                {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
              </div>
            </form>
          </div>
        </>
      )}

      {showDeleteModal && selected && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl w-full max-w-md mx-auto animate-slide-up pb-safe">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" /></div>
            <div className="px-5 pb-6 pt-2 space-y-4 text-center">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-base font-black text-stone-900 dark:text-stone-50">Faturayı Sil?</h2>
              <p className="text-xs text-stone-500">
                <strong>{MONTHS[selected.month - 1]} {selected.year}</strong> su faturası kalıcı olarak silinecek.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="h-11 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs">Vazgeç</button>
                <button onClick={() => { onDeleteWaterBill(selected.id); setShowDeleteModal(false); }}
                  className="h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs">Sil</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
