import React, { useState } from 'react';
import { Bill } from '../types';
import {
  Plus, Edit2, Trash2, X, CheckCircle2, XCircle,
  Calendar, Coins, AlertTriangle, TrendingUp, TrendingDown
} from 'lucide-react';

interface BillsProps {
  bills: Bill[];
  currency: string;
  onAddBill:    (month: number, year: number, totalKwh: number, totalAmount: number, dueDate: string, isPaid: boolean, note?: string) => void;
  onEditBill:   (id: string, month: number, year: number, totalKwh: number, totalAmount: number, dueDate: string, isPaid: boolean, note?: string) => void;
  onDeleteBill: (id: string) => void;
  onTogglePaid: (id: string) => void;
}

const MONTHS_NAMES = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const inputCls  = "w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-4 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-mono font-bold";
const selectCls = "w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500";
const labelCls  = "text-xs text-stone-500 dark:text-stone-400 font-bold";

export const Bills: React.FC<BillsProps> = ({
  bills, currency, onAddBill, onEditBill, onDeleteBill, onTogglePaid
}) => {
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBill, setSelectedBill]       = useState<Bill | null>(null);

  const [month, setMonth]           = useState(new Date().getMonth() + 1);
  const [year, setYear]             = useState(new Date().getFullYear());
  const [totalKwh, setTotalKwh]     = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate]       = useState('');
  const [isPaid, setIsPaid]         = useState(false);
  const [note, setNote]             = useState('');
  const [error, setError]           = useState('');

  const sortedBills    = [...bills].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
  const averageAmount  = bills.length > 0 ? bills.reduce((s, b) => s + b.totalAmount, 0) / bills.length : 0;
  const maxBill        = bills.length > 0 ? bills.reduce((p, c) => p.totalAmount > c.totalAmount ? p : c) : null;
  const minBill        = bills.length > 0 ? bills.reduce((p, c) => p.totalAmount < c.totalAmount ? p : c) : null;

  let diffText = '', diffPercent = 0, diffAmount = 0, isIncrease = false;
  if (sortedBills.length >= 2) {
    diffAmount  = sortedBills[0].totalAmount - sortedBills[1].totalAmount;
    diffPercent = (diffAmount / sortedBills[1].totalAmount) * 100;
    isIncrease  = diffAmount > 0;
    diffText    = `${MONTHS_NAMES[sortedBills[0].month - 1]} vs ${MONTHS_NAMES[sortedBills[1].month - 1]}`;
  }

  const handleOpenAdd = () => {
    setMonth(new Date().getMonth() + 1); setYear(new Date().getFullYear());
    setTotalKwh(''); setTotalAmount(''); setDueDate('');
    setIsPaid(false); setNote(''); setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (bill: Bill) => {
    setSelectedBill(bill);
    setMonth(bill.month); setYear(bill.year);
    setTotalKwh(String(bill.totalKwh)); setTotalAmount(String(bill.totalAmount));
    setDueDate(bill.dueDate); setIsPaid(bill.isPaid);
    setNote(bill.note || ''); setError('');
    setShowEditModal(true);
  };

  const validate = () => {
    if (!totalKwh   || parseFloat(totalKwh) <= 0)   { setError('Geçerli bir kWh değeri girin.'); return false; }
    if (!totalAmount || parseFloat(totalAmount) <= 0) { setError('Geçerli bir tutar girin.'); return false; }
    if (!dueDate)                                     { setError('Son ödeme tarihini seçin.'); return false; }
    return true;
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onAddBill(month, year, parseFloat(totalKwh), parseFloat(totalAmount), dueDate, isPaid, note.trim() || undefined);
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !validate()) return;
    onEditBill(selectedBill.id, month, year, parseFloat(totalKwh), parseFloat(totalAmount), dueDate, isPaid, note.trim() || undefined);
    setShowEditModal(false);
  };

  const cardCls = "bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800";

  const BillForm = ({ onSubmit, title, onClose }: { onSubmit: (e: React.FormEvent) => void; title: string; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex flex-col justify-end animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl w-full max-w-md mx-auto animate-slide-up overflow-y-auto max-h-[92vh] pb-safe"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" />
        </div>
        <div className="px-5 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                <Coins size={16} className="text-amber-500" />
              </div>
              <h2 className="text-base font-black text-stone-900 dark:text-stone-50">{title}</h2>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Dönem Ayı</label>
                <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className={selectCls}>
                  {MONTHS_NAMES.map((name, i) => <option key={i+1} value={i+1}>{name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Yıl</label>
                <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Tüketim (kWh)</label>
                <input type="number" step="0.01" placeholder="240.5" value={totalKwh}
                  onChange={e => setTotalKwh(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Tutar ({currency})</label>
                <input type="number" step="0.01" placeholder="781.60" value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Son Ödeme Tarihi</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center gap-3 bg-stone-100 dark:bg-stone-800/40 p-3.5 border border-stone-200 dark:border-stone-800 rounded-2xl cursor-pointer"
              onClick={() => setIsPaid(!isPaid)}>
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isPaid ? 'bg-amber-500 border-amber-400' : 'border-stone-400 dark:border-stone-600'}`}>
                {isPaid && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-200 cursor-pointer select-none">Fatura Ödendi</label>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Not</label>
              <textarea placeholder="Fatura notları..." value={note} onChange={e => setNote(e.target.value)}
                className="w-full h-14 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 resize-none" />
            </div>
            {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
            <button type="submit"
              className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-xs transition-colors">
              Kaydet
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-50">Fatura Takibi</h1>
          <p className="text-xs text-stone-400">Geçmiş faturaları kaydedip takip edin</p>
        </div>
        <button onClick={handleOpenAdd}
          className="bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-4 h-10 rounded-2xl flex items-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.3)] transition-colors">
          <Plus size={16} /> Fatura Ekle
        </button>
      </div>

      {/* Statistics */}
      {bills.length > 0 && (
        <div className={`grid grid-cols-2 gap-3 ${cardCls} p-4 rounded-3xl`}>
          <div className="space-y-1">
            <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">Ort. Tutar</span>
            <span className="text-sm font-black text-stone-900 dark:text-stone-50 font-mono">{averageAmount.toFixed(2)} {currency}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">En Yüksek</span>
            <span className="text-sm font-black text-rose-500 font-mono">{maxBill ? `${maxBill.totalAmount.toFixed(2)} ${currency}` : '-'}</span>
            <span className="text-[9px] text-stone-400 block">{maxBill ? `${MONTHS_NAMES[maxBill.month - 1]} ${maxBill.year}` : ''}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">En Düşük</span>
            <span className="text-sm font-black text-emerald-500 font-mono">{minBill ? `${minBill.totalAmount.toFixed(2)} ${currency}` : '-'}</span>
            <span className="text-[9px] text-stone-400 block">{minBill ? `${MONTHS_NAMES[minBill.month - 1]} ${minBill.year}` : ''}</span>
          </div>
          <div className="space-y-1 border-l border-stone-200 dark:border-stone-800 pl-3">
            <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">Önceki Aya</span>
            {sortedBills.length >= 2 ? (
              <span className={`text-xs font-black font-mono flex items-center gap-1 ${isIncrease ? 'text-rose-500' : 'text-emerald-500'}`}>
                {isIncrease ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isIncrease ? '+' : ''}{diffAmount.toFixed(2)} {currency} ({diffPercent.toFixed(1)}%)
              </span>
            ) : (
              <span className="text-[10px] text-stone-400">2 fatura gerekiyor</span>
            )}
            <span className="text-[9px] text-stone-400 block">{diffText}</span>
          </div>
        </div>
      )}

      {/* Bills List */}
      {sortedBills.length > 0 ? (
        <div className="space-y-3">
          {sortedBills.map(bill => {
            const isOverdue = !bill.isPaid && new Date(bill.dueDate) < new Date();
            return (
              <div key={bill.id}
                className={`${cardCls} rounded-3xl p-4 flex items-center justify-between transition-all ${
                  !bill.isPaid && isOverdue  ? '!border-rose-500/30 bg-rose-500/5'
                : !bill.isPaid && !isOverdue ? '!border-amber-500/20 bg-amber-500/5'
                : ''}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <button onClick={() => onTogglePaid(bill.id)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                      bill.isPaid ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : isOverdue ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                    {bill.isPaid ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      {MONTHS_NAMES[bill.month - 1]} {bill.year}
                      {!bill.isPaid && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isOverdue ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {isOverdue ? 'Süresi Geçti' : 'Bekliyor'}
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1.5 font-mono">
                      <span>{bill.totalKwh.toFixed(1)} kWh</span>
                      <span>•</span>
                      <span>Son: {new Date(bill.dueDate).toLocaleDateString('tr-TR')}</span>
                    </p>
                    {bill.note && <p className="text-[9px] text-stone-400 mt-1 italic truncate">{bill.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-stone-900 dark:text-stone-50 font-mono shrink-0">{bill.totalAmount.toFixed(2)} {currency}</span>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleOpenEdit(bill)}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors border border-stone-200 dark:border-stone-700">
                      <Edit2 size={11} />
                    </button>
                    <button onClick={() => { setSelectedBill(bill); setShowDeleteModal(true); }}
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
        <div className="bg-stone-100 dark:bg-stone-900/20 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl p-12 text-center space-y-4">
          <Calendar size={36} className="text-stone-400 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">Hiç Fatura Girilmemiş</h3>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              Elektrik faturalarınızı girerek geçmiş dönem kıyaslamalarını görün.
            </p>
          </div>
          <button onClick={handleOpenAdd}
            className="mx-auto bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors">
            <Plus size={14} /> Fatura Ekle
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal  && <BillForm onSubmit={handleSaveAdd}  title="Yeni Fatura" onClose={() => setShowAddModal(false)} />}
      {showEditModal && <BillForm onSubmit={handleSaveEdit} title="Faturayı Düzenle" onClose={() => setShowEditModal(false)} />}

      {showDeleteModal && selectedBill && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-scale-in text-center">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-base font-black text-stone-900 dark:text-stone-50">Faturayı Sil?</h2>
            <p className="text-xs text-stone-500">
              <strong>{MONTHS_NAMES[selectedBill.month - 1]} {selectedBill.year}</strong> dönemi kalıcı olarak silinecek.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="h-10 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs">Vazgeç</button>
              <button onClick={() => { if (selectedBill) onDeleteBill(selectedBill.id); setShowDeleteModal(false); }}
                className="h-10 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
