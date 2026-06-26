import React from 'react';
import { Room, Device, Consumption, Bill, AppSettings, DEVICE_TYPES } from '../types';
import { IconRenderer } from './IconRenderer';
import {
  Zap, Coins, TrendingUp, TrendingDown, AlertTriangle, Plus,
  Clock, Star, ShieldAlert, ArrowRight, BarChart3, FileSpreadsheet, Leaf
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
  rooms, devices, consumptions, bills, settings, onNavigate, onOpenAddConsumption
}) => {
  const formatMoney = (val: number) =>
    new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' ' + settings.currency;
  const formatKwh = (val: number) =>
    new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' kWh';

  const todayStr        = new Date().toISOString().split('T')[0];
  const currentYear     = new Date().getFullYear();
  const currentMonth    = new Date().getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const lastMonthYear   = currentMonth === 1 ? currentYear - 1 : currentYear;
  const lastMonth       = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthStr    = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}`;

  const todayConsumptions        = consumptions.filter(c => c.date === todayStr);
  const todayKwh                 = todayConsumptions.reduce((s, c) => s + c.kwh, 0);
  const todayCost                = todayConsumptions.reduce((s, c) => s + c.totalCost, 0);
  const currentMonthConsumptions = consumptions.filter(c => c.date.startsWith(currentMonthStr));
  const currentMonthKwh          = currentMonthConsumptions.reduce((s, c) => s + c.kwh, 0);
  const currentMonthCost         = currentMonthConsumptions.reduce((s, c) => s + c.totalCost, 0);
  const lastMonthKwh             = consumptions.filter(c => c.date.startsWith(lastMonthStr)).reduce((s, c) => s + c.kwh, 0);

  const growthPercent    = lastMonthKwh > 0 ? ((currentMonthKwh - lastMonthKwh) / lastMonthKwh) * 100 : 0;
  const hasComparison    = lastMonthKwh > 0;
  const daysInMonth      = new Date(currentYear, currentMonth, 0).getDate();
  const passedDays       = Math.max(new Date().getDate(), 1);
  const estMonthlyKwh    = (currentMonthKwh / passedDays) * daysInMonth;
  const estMonthlyBill   = estMonthlyKwh * settings.unitPrice;

  // CO2
  const co2Factor       = settings.co2Factor ?? 0.47;
  const co2ThisMonth    = currentMonthKwh * co2Factor;
  const co2Estimated    = estMonthlyKwh * co2Factor;

  const deviceKwhMap: Record<string, number> = {};
  currentMonthConsumptions.forEach(c => { deviceKwhMap[c.deviceId] = (deviceKwhMap[c.deviceId] || 0) + c.kwh; });
  const topDeviceId  = Object.entries(deviceKwhMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const topDevice    = devices.find(d => d.id === topDeviceId);
  const topDeviceKwh = deviceKwhMap[topDeviceId] || 0;
  const topRoom      = rooms.find(r => r.id === topDevice?.roomId);

  const unpaidBills       = bills.filter(b => !b.isPaid);
  const totalUnpaidAmount = unpaidBills.reduce((s, b) => s + b.totalAmount, 0);
  const budgetAlert       = settings.monthlyBudget && currentMonthCost > settings.monthlyBudget;

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(new Date().getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const kwh     = consumptions.filter(c => c.date === dateStr).reduce((s, c) => s + c.kwh, 0);
    return { dayName: d.toLocaleDateString('tr-TR', { weekday: 'short' }), kwh, dateStr };
  });
  const maxKwh       = Math.max(...last7Days.map(d => d.kwh), 1);
  const avgWeeklyKwh = last7Days.reduce((s, d) => s + d.kwh, 0) / 7;

  const favoriteDevices    = devices.filter(d => d.isFavorite);
  const sortedConsumptions = [...consumptions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  const cardCls = "bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800";

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-50">Wattly</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">Akıllı Elektrik Takip</p>
        </div>
        <div className={`flex items-center gap-2 ${cardCls} rounded-xl px-3 py-1.5`}>
          <Clock size={13} className="text-amber-500" />
          <span className="text-xs text-stone-600 dark:text-stone-300 font-medium font-mono">
            {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Budget Alert */}
      {budgetAlert && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 text-rose-600 dark:text-rose-400">
          <ShieldAlert size={18} className="shrink-0 animate-pulse" />
          <p className="text-xs font-semibold">Bütçe Aşımı! Hedef: {formatMoney(settings.monthlyBudget || 0)} — Güncel: {formatMoney(currentMonthCost)}</p>
        </div>
      )}

      {/* Unpaid bills alert */}
      {unpaidBills.length > 0 && (
        <button onClick={() => onNavigate('bills')}
          className="w-full flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-amber-600 dark:text-amber-400 text-left transition-all hover:bg-amber-500/15 active:scale-[0.99]">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} className="shrink-0 animate-bounce" />
            <p className="text-xs">
              <strong>{unpaidBills.length}</strong> ödenmemiş fatura · Toplam{' '}
              <span className="font-mono font-bold">{formatMoney(totalUnpaidAmount)}</span>
            </p>
          </div>
          <ArrowRight size={14} className="shrink-0" />
        </button>
      )}

      {/* Hero card */}
      <div className={`relative overflow-hidden ${cardCls} rounded-3xl p-5 shadow-sm`}>
        <div className="relative space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
              Bu Ayki Tahmin
            </span>
            {hasComparison && (
              growthPercent > 0 ? (
                <span className="flex items-center gap-1 text-rose-500 text-xs font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  <TrendingUp size={11} /> +{growthPercent.toFixed(1)}%
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <TrendingDown size={11} /> {growthPercent.toFixed(1)}%
                </span>
              )
            )}
          </div>

          <div>
            <p className="text-[10px] text-stone-400 font-bold mb-0.5">Tahmini Ay Sonu Faturası</p>
            <div className="text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 font-mono">{formatMoney(estMonthlyBill)}</div>
          </div>

          {/* CO2 badge */}
          {currentMonthKwh > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <Leaf size={11} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Bu ay ~{co2ThisMonth.toFixed(1)} kg CO₂ · Tahmini {co2Estimated.toFixed(1)} kg
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100 dark:border-stone-800/60">
            <button onClick={() => onNavigate('analytics')} className="space-y-0.5 text-left hover:opacity-80 transition-opacity">
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider flex items-center gap-1">
                <BarChart3 size={9} /> Güncel Tüketim
              </span>
              <div className="text-sm font-extrabold text-amber-500 font-mono">{formatKwh(currentMonthKwh)}</div>
              <div className="text-[11px] text-stone-400">{formatMoney(currentMonthCost)}</div>
            </button>
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">Tahmini Toplam</span>
              <div className="text-sm font-extrabold text-emerald-500 font-mono">{formatKwh(estMonthlyKwh)}</div>
              <div className="text-[11px] text-stone-400">{settings.unitPrice.toFixed(2)} TL/kWh</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNavigate('analytics')}
          className={`${cardCls} hover:border-amber-500/30 rounded-2xl p-4 text-left transition-all active:scale-[0.98] space-y-2.5`}>
          <div className="flex items-center gap-1.5 text-amber-500">
            <Zap size={14} />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Bugün</span>
          </div>
          <div>
            <div className="text-base font-black font-mono text-stone-900 dark:text-stone-50">{formatKwh(todayKwh)}</div>
            <div className="text-xs text-emerald-500 font-bold font-mono mt-0.5">{formatMoney(todayCost)}</div>
          </div>
        </button>

        <button onClick={() => onNavigate('devices')}
          className={`${cardCls} hover:border-amber-500/30 rounded-2xl p-4 text-left transition-all active:scale-[0.98] space-y-2.5`}>
          <div className="flex items-center gap-1.5 text-teal-500">
            <Coins size={14} />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Zirve</span>
          </div>
          {topDevice ? (
            <div className="min-w-0">
              <div className="text-xs font-bold text-stone-900 dark:text-stone-50 truncate">{topDevice.name}</div>
              <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                <span style={{ color: topRoom?.color }}>{topRoom?.name || 'Oda'}</span>
                <span>·</span>
                <span className="font-mono text-rose-500 font-bold">{topDeviceKwh.toFixed(1)} kWh</span>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-stone-400">Henüz veri yok</p>
          )}
        </button>
      </div>

      {/* 7-gün bar chart */}
      <div className={`${cardCls} rounded-2xl p-4 space-y-4`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Son 7 Gün</h3>
            <p className="text-[9px] text-stone-400 mt-0.5">Elektrik tüketim trendi</p>
          </div>
          <button onClick={() => onNavigate('analytics')}
            className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20 flex items-center gap-1 hover:bg-amber-500/20 transition-all">
            <BarChart3 size={9} /> Analiz
          </button>
        </div>

        <div className="h-24 flex items-end justify-between gap-1">
          {last7Days.map((day, idx) => {
            const barPct  = (day.kwh / maxKwh) * 100;
            const isToday = day.dateStr === todayStr;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                <div className="absolute bottom-7 bg-stone-900 dark:bg-stone-800 border border-stone-700 text-[8px] font-bold text-stone-100 py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono whitespace-nowrap">
                  {day.kwh.toFixed(2)} kWh
                </div>
                <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-md h-16 flex items-end overflow-hidden">
                  <div
                    style={{ height: `${Math.max(barPct, 4)}%` }}
                    className={`w-full rounded-b-sm rounded-t-sm transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-gradient-to-t from-stone-400 dark:from-stone-600 to-stone-300 dark:to-stone-500'
                    }`}
                  />
                </div>
                <span className={`text-[8px] font-bold leading-none ${isToday ? 'text-amber-500' : 'text-stone-400'}`}>
                  {day.dayName}
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-center text-[9px] text-stone-400 font-mono">
          Haf. Ort: {avgWeeklyKwh.toFixed(2)} kWh/gün
        </div>
      </div>

      {/* Favorite devices */}
      {favoriteDevices.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Favori Cihazlar</h3>
            <button onClick={() => onNavigate('devices')} className="text-[9px] text-amber-500 font-bold hover:underline flex items-center gap-0.5">
              Tümü <ArrowRight size={10} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {favoriteDevices.slice(0, 4).map(device => {
              const r      = rooms.find(r => r.id === device.roomId);
              const devKwh = consumptions
                .filter(c => c.deviceId === device.id && c.date.startsWith(currentMonthStr))
                .reduce((s, c) => s + c.kwh, 0);
              return (
                <button key={device.id} onClick={() => onNavigate('devices')}
                  className={`${cardCls} hover:border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-2 transition-all active:scale-[0.98]`}>
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1">
                      <Star size={9} className="text-amber-400 fill-amber-400 shrink-0" />
                      <span className="text-[10px] font-bold text-stone-900 dark:text-stone-50 truncate">{device.name}</span>
                    </div>
                    <span className="text-[8px] text-stone-400 block" style={{ color: r?.color }}>{r?.name || 'Oda'}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold font-mono text-amber-500 block">{devKwh.toFixed(1)}</span>
                    <span className="text-[8px] text-stone-400">kWh</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Latest consumptions */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Son Girişler</h3>
          <button onClick={() => onNavigate('devices')} className="text-[9px] text-amber-500 font-bold hover:underline flex items-center gap-0.5">
            Tüm Cihazlar <ArrowRight size={10} />
          </button>
        </div>

        {sortedConsumptions.length > 0 ? (
          <div className="space-y-2">
            {sortedConsumptions.map(entry => {
              const d       = devices.find(dev => dev.id === entry.deviceId);
              const r       = rooms.find(room => room.id === entry.roomId);
              const devIcon = DEVICE_TYPES.find(dt => dt.id === d?.type)?.icon || 'Radio';
              return (
                <button key={entry.id} onClick={() => onNavigate('devices')}
                  className={`w-full flex justify-between items-center ${cardCls} hover:border-stone-300 dark:hover:border-stone-700 rounded-2xl p-3.5 transition-all active:scale-[0.99] text-left`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0">
                      <IconRenderer name={devIcon} size={16} className="text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-50">{d?.name || 'Cihaz'}</h4>
                      <p className="text-[9px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                        <span style={{ color: r?.color || '#f59e0b' }}>{r?.name || 'Oda'}</span>
                        <span>·</span>
                        <span>{new Date(entry.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-stone-900 dark:text-stone-50">{formatKwh(entry.kwh)}</div>
                    <div className="text-[9px] text-stone-400 font-mono mt-0.5">{formatMoney(entry.totalCost)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl p-8 text-center space-y-3">
            <Zap size={24} className="text-stone-300 dark:text-stone-700 mx-auto" />
            <p className="text-xs text-stone-400 max-w-xs mx-auto">Henüz tüketim kaydı yok. Aşağıdaki + butonunu kullanın.</p>
          </div>
        )}
      </div>

      {/* Bills shortcut */}
      {bills.length > 0 && (
        <button onClick={() => onNavigate('bills')}
          className={`w-full flex items-center justify-between ${cardCls} hover:border-stone-300 dark:hover:border-stone-700 rounded-2xl p-4 transition-all active:scale-[0.99]`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center">
              <FileSpreadsheet size={16} className="text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-stone-900 dark:text-stone-50">Elektrik Faturaları</p>
              <p className="text-[9px] text-stone-400 mt-0.5">
                {unpaidBills.length > 0
                  ? `${unpaidBills.length} fatura ödeme bekliyor`
                  : `${bills.length} fatura kaydedildi — hepsi ödendi`}
              </p>
            </div>
          </div>
          <ArrowRight size={14} className="text-stone-400" />
        </button>
      )}

      {/* FAB */}
      <div className="fixed bottom-20 right-4 z-40">
        <button onClick={onOpenAddConsumption}
          className="w-14 h-14 bg-amber-500 hover:bg-amber-400 text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(245,158,11,0.45)] hover:scale-110 active:scale-95 transition-all border border-amber-400/20">
          <Plus size={26} />
        </button>
      </div>
    </div>
  );
};
