/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bill } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Coins, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Info
} from 'lucide-react';

interface BillsProps {
  bills: Bill[];
  currency: string;
  onAddBill: (month: number, year: number, totalKwh: number, totalAmount: number, dueDate: string, isPaid: boolean, note?: string) => void;
  onEditBill: (id: string, month: number, year: number, totalKwh: number, totalAmount: number, dueDate: string, isPaid: boolean, note?: string) => void;
  onDeleteBill: (id: string) => void;
  onTogglePaid: (id: string) => void;
}

const MONTHS_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export const Bills: React.FC<BillsProps> = ({
  bills,
  currency,
  onAddBill,
  onEditBill,
  onDeleteBill,
  onTogglePaid
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Form states
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [totalKwh, setTotalKwh] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // 1. STATISTICS CALCULATIONS
  const sortedBills = [...bills].sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);

  const averageAmount = bills.length > 0 ? bills.reduce((sum, b) => sum + b.totalAmount, 0) / bills.length : 0;
  
  let maxBill: Bill | null = null;
  let minBill: Bill | null = null;
  if (bills.length > 0) {
    maxBill = bills.reduce((prev, current) => (prev.totalAmount > current.totalAmount) ? prev : current);
    minBill = bills.reduce((prev, current) => (prev.totalAmount < current.totalAmount) ? prev : current);
  }

  // TL and Percentage diff between two latest bills
  let diffText = '';
  let diffPercent = 0;
  let diffAmount = 0;
  let isIncrease = false;
  
  if (sortedBills.length >= 2) {
    const latest = sortedBills[0];
    const prev = sortedBills[1];
    diffAmount = latest.totalAmount - prev.totalAmount;
    diffPercent = (diffAmount / prev.totalAmount) * 100;
    isIncrease = diffAmount > 0;
    diffText = `${MONTHS_NAMES[latest.month - 1]} vs ${MONTHS_NAMES[prev.month - 1]}`;
  }

  const handleOpenAdd = () => {
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setTotalKwh('');
    setTotalAmount('');
    setDueDate('');
    setIsPaid(false);
    setNote('');
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (bill: Bill) => {
    setSelectedBill(bill);
    setMonth(bill.month);
    setYear(bill.year);
    setTotalKwh(String(bill.totalKwh));
    setTotalAmount(String(bill.totalAmount));
    setDueDate(bill.dueDate);
    setIsPaid(bill.isPaid);
    setNote(bill.note || '');
    setError('');
    setShowEditModal(true);
  };

  const handleOpenDelete = (bill: Bill) => {
    setSelectedBill(bill);
    setShowDeleteModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalKwh || parseFloat(totalKwh) <= 0) {
      setError('Lütfen geçerli bir toplam tüketim (kWh) girin.');
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setError('Lütfen geçerli bir toplam tutar (TL) girin.');
      return;
    }
    if (!dueDate) {
      setError('Lütfen son ödeme tarihini seçin.');
      return;
    }

    onAddBill(
      month,
      year,
      parseFloat(totalKwh),
      parseFloat(totalAmount),
      dueDate,
      isPaid,
      note.trim() || undefined
    );
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    if (!totalKwh || parseFloat(totalKwh) <= 0) {
      setError('Lütfen geçerli bir toplam tüketim (kWh) girin.');
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setError('Lütfen geçerli bir toplam tutar (TL) girin.');
      return;
    }
    if (!dueDate) {
      setError('Lütfen son ödeme tarihini seçin.');
      return;
    }

    onEditBill(
      selectedBill.id,
      month,
      year,
      parseFloat(totalKwh),
      parseFloat(totalAmount),
      dueDate,
      isPaid,
      note.trim() || undefined
    );
    setShowEditModal(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedBill) return;
    onDeleteBill(selectedBill.id);
    setShowDeleteModal(false);
  };

  return (
    <div id="bills-container" className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Fatura Takibi</h1>
          <p className="text-xs text-slate-400">Geçmiş faturaları kaydedip takip edin</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 h-10 rounded-2xl flex items-center gap-1.5 shadow-[0_4px_12px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
        >
          <Plus size={16} /> Fatura Ekle
        </button>
      </div>

      {/* Statistics Block */}
      {bills.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/30 border border-slate-800 p-4 rounded-3xl backdrop-blur-sm">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Ort. Fatura Tutarı</span>
            <span className="text-sm font-black text-white font-mono">
              {averageAmount.toFixed(2)} {currency}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">En Yüksek Fatura</span>
            <span className="text-sm font-black text-rose-400 font-mono">
              {maxBill ? `${maxBill.totalAmount.toFixed(2)} ${currency}` : '-'}
            </span>
            <span className="text-[9px] text-slate-400 block font-medium">
              {maxBill ? `${MONTHS_NAMES[maxBill.month - 1]} ${maxBill.year}` : ''}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">En Düşük Fatura</span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {minBill ? `${minBill.totalAmount.toFixed(2)} ${currency}` : '-'}
            </span>
            <span className="text-[9px] text-slate-400 block font-medium">
              {minBill ? `${MONTHS_NAMES[minBill.month - 1]} ${minBill.year}` : ''}
            </span>
          </div>

          <div className="space-y-1 col-span-2 md:col-span-1 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-800/80 md:pl-4">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Önceki Aya Göre</span>
            {sortedBills.length >= 2 ? (
              <span className={`text-xs font-black font-mono flex items-center gap-1 ${isIncrease ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isIncrease ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isIncrease ? '+' : ''}{diffAmount.toFixed(2)} {currency} ({diffPercent.toFixed(1)}%)
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">Karşılaştırmak için 2 fatura gerekiyor</span>
            )}
            <span className="text-[9px] text-slate-400 block font-medium">{diffText}</span>
          </div>
        </div>
      )}

      {/* Bills List */}
      {sortedBills.length > 0 ? (
        <div className="space-y-3">
          {sortedBills.map((bill) => {
            const isOverdue = !bill.isPaid && new Date(bill.dueDate) < new Date();
            return (
              <div
                key={bill.id}
                className={`bg-slate-900/40 border rounded-3xl p-4 flex items-center justify-between transition-all duration-300 ${
                  bill.isPaid 
                    ? 'border-slate-800' 
                    : isOverdue 
                      ? 'border-rose-500/30 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.05)]' 
                      : 'border-amber-500/20 bg-amber-500/5'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Status Toggle Icon */}
                  <button
                    onClick={() => onTogglePaid(bill.id)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      bill.isPaid 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : isOverdue 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                    title={bill.isPaid ? 'Ödendi' : 'Ödenmedi (Değiştirmek için tıklayın)'}
                  >
                    {bill.isPaid ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </button>

                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      {MONTHS_NAMES[bill.month - 1]} {bill.year}
                      {!bill.isPaid && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${isOverdue ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {isOverdue ? 'Süresi Geçti' : 'Bekliyor'}
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                      <span>{bill.totalKwh.toFixed(1)} kWh</span>
                      <span>•</span>
                      <span>Son Ödeme: {new Date(bill.dueDate).toLocaleDateString('tr-TR')}</span>
                    </p>
                    {bill.note && <p className="text-[9px] text-slate-500 mt-1 italic font-medium truncate">{bill.note}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono shrink-0">
                    <span className="text-sm font-black text-white">{bill.totalAmount.toFixed(2)} {currency}</span>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(bill)}
                      className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/20"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(bill)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/10"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Calendar size={36} className="text-slate-600 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-bold text-white text-sm">Hiç Fatura Girilmemiş</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Elektrik faturalarınızı buraya girerek geçmiş dönem kıyaslamalarını ve tasarruf verilerinizi görebilirsiniz.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="mx-auto bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> Fatura Ekle
          </button>
        </div>
      )}

      {/* ADD BILL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-lg font-black text-white">Yeni Fatura Ekle</h2>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Dönem Ayı</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {MONTHS_NAMES.map((name, index) => (
                      <option key={index + 1} value={index + 1}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Dönem Yılı</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Toplam Tüketim (kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Örn: 240.5"
                    value={totalKwh}
                    onChange={(e) => setTotalKwh(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Fatura Tutarı (TL)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Örn: 781.60"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">Son Ödeme Tarihi</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-800/40 p-3.5 border border-slate-800 rounded-2xl">
                <input
                  type="checkbox"
                  id="isPaidAdd"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700"
                />
                <label htmlFor="isPaidAdd" className="text-xs font-bold text-slate-200 cursor-pointer select-none">Fatura Ödendi</label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">Not</label>
                <textarea
                  placeholder="Fatura hakkında notlar veya hatırlatıcı..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-16 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}

              <button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Faturayı Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BILL MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-lg font-black text-white">Faturayı Düzenle</h2>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Dönem Ayı</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {MONTHS_NAMES.map((name, index) => (
                      <option key={index + 1} value={index + 1}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Dönem Yılı</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Toplam Tüketim (kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalKwh}
                    onChange={(e) => setTotalKwh(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Fatura Tutarı (TL)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">Son Ödeme Tarihi</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-800/40 p-3.5 border border-slate-800 rounded-2xl">
                <input
                  type="checkbox"
                  id="isPaidEdit"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-800 border-slate-700"
                />
                <label htmlFor="isPaidEdit" className="text-xs font-bold text-slate-200 cursor-pointer select-none">Fatura Ödendi</label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">Not</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-16 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}

              <button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Değişiklikleri Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {showDeleteModal && selectedBill && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle size={24} className="animate-pulse" />
            </div>
            <h2 className="text-base font-black text-white">Faturayı Silmek İstediğinize Emin misiniz?</h2>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>{MONTHS_NAMES[selectedBill.month - 1]} {selectedBill.year}</strong> dönemine ait faturayı kalıcı olarak silmek istiyorsunuz. Bu işlem geri alınamaz.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="h-10 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmDelete}
                className="h-10 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Evet, Sil!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
