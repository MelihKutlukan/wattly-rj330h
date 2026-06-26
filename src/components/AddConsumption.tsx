import React, { useState, useEffect } from 'react';
import { Room, Device } from '../types';
import { Calendar, Zap, AlertCircle, Coins, ArrowLeft, Sparkles } from 'lucide-react';

interface AddConsumptionProps {
  rooms: Room[];
  devices: Device[];
  defaultUnitPrice: number;
  currency: string;
  onAddConsumption: (deviceId: string, roomId: string, date: string, kwh: number, unitPrice: number, totalCost: number, note?: string) => void;
  onClose: () => void;
}

export const AddConsumption: React.FC<AddConsumptionProps> = ({
  rooms, devices, defaultUnitPrice, currency, onAddConsumption, onClose
}) => {
  const [deviceId, setDeviceId]           = useState('');
  const [date, setDate]                   = useState(new Date().toISOString().split('T')[0]);
  const [kwhInput, setKwhInput]           = useState('');
  const [unitPriceInput, setUnitPriceInput] = useState(String(defaultUnitPrice));
  const [note, setNote]                   = useState('');
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);

  useEffect(() => {
    if (devices.length > 0 && !deviceId) setDeviceId(devices[0].id);
  }, [devices, deviceId]);

  const kwh            = parseFloat(kwhInput) || 0;
  const unitPrice      = parseFloat(unitPriceInput) || 0;
  const calculatedCost = kwh * unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!deviceId)             { setError('Lütfen bir cihaz seçin.'); return; }
    if (!kwhInput || kwh <= 0) { setError('Geçerli bir tüketim miktarı (kWh) girin.'); return; }
    if (!unitPriceInput || unitPrice <= 0) { setError('Geçerli bir birim fiyat girin.'); return; }
    if (!date)                 { setError('Tüketim tarihini seçin.'); return; }

    const selectedDevice = devices.find(d => d.id === deviceId);
    if (!selectedDevice) { setError('Seçilen cihaz bulunamadı.'); return; }

    try {
      onAddConsumption(deviceId, selectedDevice.roomId, date, kwh, unitPrice, parseFloat(calculatedCost.toFixed(2)), note.trim() || undefined);
      setSuccess(true);
      setKwhInput(''); setNote('');
      setTimeout(() => { setSuccess(false); onClose(); }, 1500);
    } catch {
      setError('Kayıt eklenirken hata oluştu.');
    }
  };

  const inputCls = "w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-4 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-mono font-bold";

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onClose}
          className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-black text-stone-900 dark:text-stone-50">Yeni Tüketim Girişi</h1>
          <p className="text-xs text-stone-400">Cihaza ait elektrik tüketimini kaydedin</p>
        </div>
      </div>

      {success ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-3 animate-pulse">
          <Sparkles size={40} className="text-emerald-500 mx-auto" />
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">Tüketim Kaydedildi!</h2>
          <p className="text-xs text-stone-400">Veriler başarıyla işlendi.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 p-6 rounded-3xl">
          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3.5 rounded-2xl text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-stone-500 dark:text-stone-400 font-bold block">Tüketim Yapan Cihaz</label>
            {devices.length > 0 ? (
              <select value={deviceId} onChange={e => setDeviceId(e.target.value)}
                className="w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500">
                {rooms.map(room => {
                  const roomDevs = devices.filter(d => d.roomId === room.id);
                  if (roomDevs.length === 0) return null;
                  return (
                    <optgroup key={room.id} label={room.name}>
                      {roomDevs.map(dev => (
                        <option key={dev.id} value={dev.id}>
                          {dev.name}{dev.smartPlugName ? ` (${dev.smartPlugName})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            ) : (
              <p className="text-xs text-rose-500 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                Kayıtlı cihaz yok. Önce "Cihazlar" sekmesinden cihaz ekleyin.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500 dark:text-stone-400 font-bold flex items-center gap-1">
                Tüketim <Zap size={12} className="text-amber-500" />
              </label>
              <div className="relative">
                <input type="number" step="0.01" min="0.01" placeholder="7.2" value={kwhInput}
                  onChange={e => setKwhInput(e.target.value)}
                  className="w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl pl-4 pr-12 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-mono font-bold" />
                <span className="absolute right-3 top-3.5 text-[10px] text-stone-400 font-bold">kWh</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-stone-500 dark:text-stone-400 font-bold flex items-center gap-1">
                Birim Fiyat <Coins size={12} className="text-emerald-500" />
              </label>
              <div className="relative">
                <input type="number" step="0.01" min="0.01" value={unitPriceInput}
                  onChange={e => setUnitPriceInput(e.target.value)}
                  className="w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl pl-4 pr-16 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-mono font-bold" />
                <span className="absolute right-3 top-3.5 text-[10px] text-stone-400 font-bold">TL/kWh</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-stone-500 dark:text-stone-400 font-bold flex items-center gap-1">
              Tüketim Tarihi <Calendar size={12} className="text-stone-400" />
            </label>
            <input type="date" value={date} max={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>

          {kwh > 0 && unitPrice > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center space-y-1 animate-fade-in">
              <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Hesaplanan Tutar</span>
              <div className="text-2xl font-black text-stone-900 dark:text-stone-50 font-mono">
                {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calculatedCost)} {currency}
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                {kwh.toFixed(2)} kWh × {unitPrice.toFixed(2)} TL = {calculatedCost.toFixed(2)} TL
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-stone-500 dark:text-stone-400 font-bold">Özel Not</label>
            <textarea placeholder="Ek notlar (çalışma saati, vb.)..." value={note} onChange={e => setNote(e.target.value)}
              className="w-full h-20 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="h-11 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs transition-colors">
              Vazgeç
            </button>
            <button type="submit" disabled={devices.length === 0}
              className="h-11 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 disabled:pointer-events-none">
              Tüketim Kaydet
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
