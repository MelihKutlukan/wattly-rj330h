/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Room, Device, Consumption, Bill, AppSettings } from '../types';
import { IconRenderer } from './IconRenderer';
import { 
  Zap, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Plus, 
  Home, 
  Clock, 
  Star, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  rooms: Room[];
  devices: Device[];
  consumptions: Consumption[];
  bills: Bill[];
  settings: AppSettings;
  onNavigate: (tab: string) => void;
  onOpenAddConsumption: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  rooms,
  devices,
  consumptions,
  bills,
  settings,
  onNavigate,
  onOpenAddConsumption
}) => {
  // Format helpers
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' ' + settings.currency;
  };

  const formatKwh = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' kWh';
  };

  // 1. DATE HELPERS
  const todayStr = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthStr = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`;

  // 2. METRIC CALCULATIONS
  // Today's consumption
  const todayConsumptions = consumptions.filter(c => c.date === todayStr);
  const todayKwh = todayConsumptions.reduce((sum, c) => sum + c.kwh, 0);
  const todayCost = todayConsumptions.reduce((sum, c) => sum + c.totalCost, 0);

  // Current Month's consumption
  const currentMonthConsumptions = consumptions.filter(c => c.date.startsWith(currentMonthStr));
  const currentMonthKwh = currentMonthConsumptions.reduce((sum, c) => sum + c.kwh, 0);
  const currentMonthCost = currentMonthConsumptions.reduce((sum, c) => sum + c.totalCost, 0);

  // Previous Month's consumption
  const lastMonthConsumptions = consumptions.filter(c => c.date.startsWith(lastMonthStr));
  const lastMonthKwh = lastMonthConsumptions.reduce((sum, c) => sum + c.kwh, 0);
  const lastMonthCost = lastMonthConsumptions.reduce((sum, c) => sum + c.totalCost, 0);

  // Growth / Decline percentage
  let growthPercent = 0;
  let hasComparisonData = false;
  if (lastMonthKwh > 0) {
    growthPercent = ((currentMonthKwh - lastMonthKwh) / lastMonthKwh) * 100;
    hasComparisonData = true;
  }

  // Most consuming room
  const roomConsumptionMap: Record<string, number> = {};
  consumptions.forEach(c => {
    if (c.date.startsWith(currentMonthStr)) {
      roomConsumptionMap[c.roomId] = (roomConsumptionMap[c.roomId] || 0) + c.kwh;
    }
  });
  let topRoomId = '';
  let topRoomKwh = 0;
  Object.entries(roomConsumptionMap).forEach(([roomId, kwh]) => {
    if (kwh > topRoomKwh) {
      topRoomKwh = kwh;
      topRoomId = roomId;
    }
  });
  const topRoom = rooms.find(r => r.id === topRoomId);

  // Most consuming device
  const deviceConsumptionMap: Record<string, number> = {};
  consumptions.forEach(c => {
    if (c.date.startsWith(currentMonthStr)) {
      deviceConsumptionMap[c.deviceId] = (deviceConsumptionMap[c.deviceId] || 0) + c.kwh;
    }
  });
  let topDeviceId = '';
  let topDeviceKwh = 0;
  Object.entries(deviceConsumptionMap).forEach(([deviceId, kwh]) => {
    if (kwh > topDeviceKwh) {
      topDeviceKwh = kwh;
      topDeviceId = deviceId;
    }
  });
  const topDevice = devices.find(d => d.id === topDeviceId);

  // 3. TAHMİNİ AY SONU FATURASI
  // Formula: Current Month Consumption / Passed Days of Month * Total Days in Month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const currentDay = new Date().getDate();
  const passedDays = currentDay > 0 ? currentDay : 1;
  const estimatedMonthlyKwh = (currentMonthKwh / passedDays) * daysInMonth;
  const estimatedMonthlyBill = estimatedMonthlyKwh * settings.unitPrice;

  // Unpaid bills check
  const unpaidBills = bills.filter(b => !b.isPaid);
  const totalUnpaidAmount = unpaidBills.reduce((sum, b) => sum + b.totalAmount, 0);

  // Favorite devices list
  const favoriteDevices = devices.filter(d => d.isFavorite);

  // 4. LATEST CONSUMPTION ENTRIES
  const sortedConsumptions = [...consumptions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 4);

  // 5. MINI BAR CHART (Last 7 days)
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(new Date().getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dailyKwh = consumptions
      .filter(c => c.date === dateStr)
      .reduce((sum, c) => sum + c.kwh, 0);
    const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
    return { dayName, kwh: dailyKwh, dateStr };
  }).reverse();

  const maxWeeklyKwh = Math.max(...last7DaysData.map(d => d.kwh), 1);

  // Target budget check
  const budgetAlert = settings.monthlyBudget && currentMonthCost > settings.monthlyBudget;
  const targetAlert = settings.consumptionTargetKwh && currentMonthKwh > settings.consumptionTargetKwh;

  return (
    <div id="dashboard-container" className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Wattly
          </h1>
          <p className="text-xs text-slate-400">Akıllı Elektrik Takip Sistemi</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-800 rounded-xl px-3 py-1.5">
          <Clock size={14} className="text-blue-400" />
          <span className="text-xs text-slate-300 font-medium font-mono">
            {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Warning Banners */}
      {budgetAlert && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-400 animate-pulse">
          <ShieldAlert size={20} className="shrink-0" />
          <div className="text-xs font-semibold">
            Bütçe Aşımı Uyarısı! Bu ayki bütçe hedefinizi ({formatMoney(settings.monthlyBudget || 0)}) aştınız. Güncel: {formatMoney(currentMonthCost)}
          </div>
        </div>
      )}

      {unpaidBills.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-400">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="shrink-0 animate-bounce" />
            <div className="text-xs">
              <span className="font-bold">Ödenmemiş Fatura!</span> {unpaidBills.length} adet faturanız ödenmeyi bekliyor. Toplam: <span className="font-mono font-bold">{formatMoney(totalUnpaidAmount)}</span>
            </div>
          </div>
          <button onClick={() => onNavigate('bills')} className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 shrink-0">
            Öde <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Main Glassmorphism Card: Current Month Estimation */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-emerald-600/5 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-300 font-semibold tracking-wide uppercase bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">
              Bu Ayki Tahmin
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              {hasComparisonData ? (
                growthPercent > 0 ? (
                  <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    <TrendingUp size={12} /> +{growthPercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <TrendingDown size={12} /> {growthPercent.toFixed(1)}%
                  </span>
                )
              ) : (
                <span className="text-slate-400 font-medium">Kıyas için veri bekleniyor</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 font-medium">Tahmini Ay Sonu Faturası</span>
            <div className="text-4xl font-extrabold tracking-tight text-white font-mono mt-0.5">
              {formatMoney(estimatedMonthlyBill)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Güncel Tüketim</span>
              <div className="text-sm font-extrabold text-blue-400 font-mono">{formatKwh(currentMonthKwh)}</div>
              <div className="text-[11px] text-slate-400 font-medium">Tutar: {formatMoney(currentMonthCost)}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tahmini Tüketim</span>
              <div className="text-sm font-extrabold text-emerald-400 font-mono">{formatKwh(estimatedMonthlyKwh)}</div>
              <div className="text-[11px] text-slate-400 font-medium">Birim Fiyat: {settings.unitPrice.toFixed(2)} TL</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Daily & Room/Device highlights */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-blue-400">
            <Zap size={16} />
            <span className="text-xs font-bold text-slate-300">Bugünkü Durum</span>
          </div>
          <div className="space-y-0.5">
            <div className="text-lg font-black font-mono text-white">{formatKwh(todayKwh)}</div>
            <div className="text-xs text-emerald-400 font-bold font-mono">{formatMoney(todayCost)}</div>
          </div>
        </div>

        {/* Most consumed device/room */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-emerald-400">
            <Coins size={16} />
            <span className="text-xs font-bold text-slate-300">Zirve Tüketici</span>
          </div>
          {topDevice ? (
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-bold text-white truncate">{topDevice.name}</div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>{topRoom?.name || 'Oda'}</span>
                <span>•</span>
                <span className="font-mono text-rose-400 font-bold">{formatKwh(topDeviceKwh)}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Henüz yeterli tüketim verisi yok.</div>
          )}
        </div>
      </div>

      {/* Mini Chart Component (Custom interactive SVG bar chart for 7-day trend) */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Son 7 Günlük Tüketim</h3>
            <p className="text-[10px] text-slate-400">Haftalık elektrik kullanım trendi</p>
          </div>
          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 font-mono">
            Orta: {formatKwh(last7DaysData.reduce((sum, d) => sum + d.kwh, 0) / 7)}
          </span>
        </div>

        {/* Custom SVG Bar Chart */}
        <div className="h-28 flex items-end justify-between gap-1 pt-2">
          {last7DaysData.map((day, idx) => {
            const barHeightPercent = (day.kwh / maxWeeklyKwh) * 100;
            const isToday = day.dateStr === todayStr;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                {/* Tooltip on hover */}
                <div className="absolute mb-14 bg-slate-950 border border-slate-800 text-[9px] font-bold text-white py-1 px-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono">
                  {day.kwh.toFixed(2)} kWh
                </div>

                {/* Bar */}
                <div className="w-full bg-slate-800/50 rounded-md h-20 flex items-end overflow-hidden">
                  <div 
                    style={{ height: `${Math.max(barHeightPercent, 4)}%` }}
                    className={`w-full rounded-b-md rounded-t transition-all duration-500 ${
                      isToday 
                        ? 'bg-gradient-to-t from-blue-600 to-emerald-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]' 
                        : 'bg-gradient-to-t from-slate-700 to-blue-500/60'
                    }`}
                  />
                </div>

                {/* X Axis labels */}
                <span className={`text-[9px] font-bold ${isToday ? 'text-blue-400 font-extrabold' : 'text-slate-500'}`}>
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Favorite Devices list if exists */}
      {favoriteDevices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Favori Cihazlarım</h3>
          <div className="grid grid-cols-2 gap-3">
            {favoriteDevices.map((device) => {
              const r = rooms.find(room => room.id === device.roomId);
              const deviceKwh = consumptions
                .filter(c => c.deviceId === device.id && c.date.startsWith(currentMonthStr))
                .reduce((sum, c) => sum + c.kwh, 0);
              return (
                <div key={device.id} className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-white truncate">{device.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 truncate block">{r?.name || 'Oda'}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold font-mono text-blue-400 block">{deviceKwh.toFixed(1)} kWh</span>
                    <span className="text-[9px] text-slate-500 font-mono">{formatMoney(deviceKwh * settings.unitPrice)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Latest records list */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Son Tüketim Girişleri</h3>
          <button onClick={() => onNavigate('devices')} className="text-xs text-blue-400 font-bold hover:underline flex items-center gap-1">
            Tüm Kayıtlar <ArrowRight size={12} />
          </button>
        </div>

        {sortedConsumptions.length > 0 ? (
          <div className="space-y-2.5">
            {sortedConsumptions.map((entry) => {
              const d = devices.find(dev => dev.id === entry.deviceId);
              const r = rooms.find(room => room.id === entry.roomId);
              return (
                <div key={entry.id} className="flex justify-between items-center bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 bg-slate-800/80 border border-slate-700/50">
                      <IconRenderer name={d?.type ? DEVICE_TYPES.find(dt => dt.id === d.type)?.icon || 'Radio' : 'Radio'} size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{d?.name || 'Cihaz'}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="font-semibold" style={{ color: r?.color || '#3b82f6' }}>{r?.name || 'Oda'}</span>
                        <span>•</span>
                        <span>{new Date(entry.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-white">{formatKwh(entry.kwh)}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">{formatMoney(entry.totalCost)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl p-8 text-center space-y-3">
            <Zap size={24} className="text-slate-600 mx-auto animate-bounce" />
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Henüz tüketim kaydı girilmemiş. Aşağıdaki hızlı işlem butonunu kullanarak ilk kaydı yapabilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) for fast entry */}
      <div className="fixed bottom-20 right-4 z-40 max-w-md mx-auto">
        <button
          onClick={onOpenAddConsumption}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(59,130,246,0.4)] hover:scale-110 active:scale-95 transition-all focus:outline-none border border-blue-400/20"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
};

// Constant device mapping helper in scope
const DEVICE_TYPES = [
  { id: 'Televizyon', icon: 'Tv' },
  { id: 'Buzdolabı', icon: 'Refrigerator' },
  { id: 'Çamaşır Makinesi', icon: 'WashingMachine' },
  { id: 'Bulaşık Makinesi', icon: 'Waves' },
  { id: 'Klima', icon: 'Wind' },
  { id: 'Bilgisayar', icon: 'Cpu' },
  { id: 'Kombi', icon: 'Flame' },
  { id: 'Fırın', icon: 'CookingPot' },
  { id: 'Aydınlatma', icon: 'Lightbulb' },
  { id: 'Şarj Cihazı', icon: 'PlugZap' },
  { id: 'Akıllı Priz', icon: 'ToggleRight' },
  { id: 'Diğer', icon: 'Radio' }
];
