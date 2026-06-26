/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Room, Device, Consumption } from '../types';
import { IconRenderer } from './IconRenderer';
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
  rooms,
  devices,
  defaultUnitPrice,
  currency,
  onAddConsumption,
  onClose
}) => {
  const [deviceId, setDeviceId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [kwhInput, setKwhInput] = useState('');
  const [unitPriceInput, setUnitPriceInput] = useState(String(defaultUnitPrice));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Set default device if devices exist
  useEffect(() => {
    if (devices.length > 0 && !deviceId) {
      setDeviceId(devices[0].id);
    }
  }, [devices, deviceId]);

  // Calculations
  const kwh = parseFloat(kwhInput) || 0;
  const unitPrice = parseFloat(unitPriceInput) || 0;
  const calculatedCost = kwh * unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!deviceId) {
      setError('Lütfen bir cihaz seçin.');
      return;
    }
    if (!kwhInput || kwh <= 0) {
      setError('Lütfen sıfırdan büyük geçerli bir tüketim miktarı (kWh) girin.');
      return;
    }
    if (!unitPriceInput || unitPrice <= 0) {
      setError('Lütfen sıfırdan büyük geçerli bir birim fiyat girin.');
      return;
    }
    if (!date) {
      setError('Lütfen tüketim tarihini seçin.');
      return;
    }

    const selectedDevice = devices.find(d => d.id === deviceId);
    if (!selectedDevice) {
      setError('Seçilen cihaz sistemde bulunamadı.');
      return;
    }

    try {
      onAddConsumption(
        deviceId,
        selectedDevice.roomId,
        date,
        kwh,
        unitPrice,
        parseFloat(calculatedCost.toFixed(2)),
        note.trim() || undefined
      );

      // Show success
      setSuccess(true);
      setKwhInput('');
      setNote('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError('Kayıt eklenirken bir hata oluştu.');
    }
  };

  return (
    <div id="add-consumption-container" className="space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-black text-white">Yeni Tüketim Girişi</h1>
          <p className="text-xs text-slate-400 font-medium">Cihaza ait elektrik tüketimini kaydedin</p>
        </div>
      </div>

      {success ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-3 animate-pulse">
          <Sparkles size={40} className="text-emerald-400 mx-auto" />
          <h2 className="text-sm font-bold text-white">Tüketim Kaydedildi!</h2>
          <p className="text-xs text-slate-400">Veriler Room Database'e (Local State) başarıyla işlendi.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 bg-slate-900/30 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-2xl text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Device Selection dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold block">Tüketim Yapan Cihaz</label>
            {devices.length > 0 ? (
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {rooms.map(room => {
                  const roomDevs = devices.filter(d => d.roomId === room.id);
                  if (roomDevs.length === 0) return null;
                  return (
                    <optgroup key={room.id} label={room.name} className="bg-slate-900 font-bold text-slate-300">
                      {roomDevs.map(dev => (
                        <option key={dev.id} value={dev.id} className="text-white font-medium">
                          {dev.name} {dev.smartPlugName ? `(${dev.smartPlugName})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            ) : (
              <p className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                Sistemde kayıtlı cihaz bulunmamaktadır. Önce "Cihazlar" sekmesinden cihaz eklemelisiniz.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tüketim Miktarı (kWh) */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-bold flex items-center gap-1">
                Tüketim Miktarı <Zap size={12} className="text-blue-400" />
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Örn: 7.2"
                  value={kwhInput}
                  onChange={(e) => setKwhInput(e.target.value)}
                  className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
                <span className="absolute right-3 top-3.5 text-[10px] text-slate-400 font-bold">kWh</span>
              </div>
            </div>

            {/* Birim Fiyat (TL/kWh) */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-bold flex items-center gap-1">
                Birim Fiyat <Coins size={12} className="text-emerald-400" />
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={unitPriceInput}
                  onChange={(e) => setUnitPriceInput(e.target.value)}
                  className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
                <span className="absolute right-3 top-3.5 text-[10px] text-slate-400 font-bold">TL/kWh</span>
              </div>
            </div>
          </div>

          {/* Date Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold flex items-center gap-1">
              Tüketim Tarihi <Calendar size={12} className="text-purple-400" />
            </label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
            />
          </div>

          {/* Auto-Calculated Cost Preview Box */}
          {kwh > 0 && unitPrice > 0 && (
            <div className="bg-gradient-to-r from-blue-600/10 to-emerald-500/10 border border-blue-500/20 rounded-2xl p-4 text-center space-y-1 animate-fade-in">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hesaplanan Tutar</span>
              <div className="text-2xl font-black text-white font-mono">
                {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calculatedCost)} {currency}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold font-mono">
                Hesaplama Formülü: {kwh.toFixed(2)} kWh × {unitPrice.toFixed(2)} TL = {calculatedCost.toFixed(2)} TL
              </div>
            </div>
          )}

          {/* Note area */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold">Özel Not</label>
            <textarea
              placeholder="Ek notlar (örn: Günlük çalışma saati, ek bilgi)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-20 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={devices.length === 0}
              className="h-11 bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-[0_4px_12px_rgba(59,130,246,0.25)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
            >
              Tüketim Kaydet
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
