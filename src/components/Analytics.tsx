import React, { useState } from 'react';
import { Room, Device, Consumption, DEVICE_TYPES } from '../types';
import { Lightbulb, TrendingUp, TrendingDown, Zap, Award, Layers, BarChart3, Leaf } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface AnalyticsProps {
  rooms: Room[];
  devices: Device[];
  consumptions: Consumption[];
  currency: string;
  unitPrice: number;
  co2Factor?: number;
  onNavigate?: (tab: string) => void;
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-stone-900 border border-stone-700 rounded-2xl p-3 shadow-2xl text-xs min-w-[140px]">
      <p className="text-stone-400 font-bold mb-2 text-[10px] uppercase tracking-wider">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-stone-300 font-medium">{p.name}</span>
          </div>
          <span className="font-black font-mono" style={{ color: p.color }}>
            {p.dataKey === 'cost' ? `${p.value.toFixed(2)} ${currency}` : `${p.value.toFixed(2)} kWh`}
          </span>
        </div>
      ))}
    </div>
  );
};

export const Analytics: React.FC<AnalyticsProps> = ({
  rooms, devices, consumptions, currency, unitPrice, co2Factor = 0.47, onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'WEEK' | 'MONTH'>('MONTH');

  const fmt    = (v: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v);
  const fmtKwh = (v: number) => `${fmt(v)} kWh`;
  const fmtTL  = (v: number) => `${fmt(v)} ${currency}`;

  const today      = new Date();
  const curMonStr  = today.toISOString().substring(0, 7);
  const lastMonth  = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonStr = lastMonth.toISOString().substring(0, 7);

  const thisMonCons = consumptions.filter(c => c.date.startsWith(curMonStr));
  const thisMonKwh  = thisMonCons.reduce((s, c) => s + c.kwh, 0);
  const thisMonCost = thisMonCons.reduce((s, c) => s + c.totalCost, 0);
  const lastMonCons = consumptions.filter(c => c.date.startsWith(lastMonStr));
  const lastMonKwh  = lastMonCons.reduce((s, c) => s + c.kwh, 0);
  const lastMonCost = lastMonCons.reduce((s, c) => s + c.totalCost, 0);

  const monthKwhDiff    = thisMonKwh - lastMonKwh;
  const monthKwhPct     = lastMonKwh > 0 ? (monthKwhDiff / lastMonKwh) * 100 : 0;
  const daysPassedInMon = today.getDate() || 1;
  const daysInMonth     = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const avgDailyKwh     = thisMonKwh / daysPassedInMon;
  const estimatedKwh    = avgDailyKwh * daysInMonth;
  const estimatedBill   = estimatedKwh * unitPrice;

  // CO2
  const co2ThisMonth = thisMonKwh * co2Factor;
  const co2LastMonth = lastMonKwh * co2Factor;
  const co2Estimated = estimatedKwh * co2Factor;

  const getWeekKwh = (weeksAgo: number) => {
    const end   = new Date(); end.setDate(end.getDate() - weeksAgo * 7);
    const start = new Date(); start.setDate(start.getDate() - (weeksAgo + 1) * 7);
    return consumptions.filter(c => { const d = new Date(c.date); return d >= start && d < end; })
      .reduce((s, c) => s + c.kwh, 0);
  };
  const thisWeekKwh = getWeekKwh(0);
  const lastWeekKwh = getWeekKwh(1);
  const weekDiff    = thisWeekKwh - lastWeekKwh;
  const weekPct     = lastWeekKwh > 0 ? (weekDiff / lastWeekKwh) * 100 : 0;

  const days      = activeTab === 'WEEK' ? 7 : 14;
  const chartData = Array.from({ length: days }).map((_, i) => {
    const d  = new Date();
    d.setDate(today.getDate() - (days - 1 - i));
    const ds = d.toISOString().split('T')[0];
    const dc = consumptions.filter(c => c.date === ds);
    return {
      name: d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
      kwh:  parseFloat(dc.reduce((s, c) => s + c.kwh, 0).toFixed(2)),
      cost: parseFloat(dc.reduce((s, c) => s + c.totalCost, 0).toFixed(2)),
    };
  });

  const roomMap: Record<string, { kwh: number; cost: number; color: string; name: string }> = {};
  rooms.forEach(r => { roomMap[r.id] = { kwh: 0, cost: 0, color: r.color, name: r.name }; });
  thisMonCons.forEach(c => { if (roomMap[c.roomId]) { roomMap[c.roomId].kwh += c.kwh; roomMap[c.roomId].cost += c.totalCost; } });
  const roomDist  = Object.values(roomMap).filter(r => r.kwh > 0).sort((a, b) => b.kwh - a.kwh);
  const totalRKwh = roomDist.reduce((s, r) => s + r.kwh, 0) || 1;

  const devMap: Record<string, { kwh: number; cost: number; name: string; type: string }> = {};
  devices.forEach(d => { devMap[d.id] = { kwh: 0, cost: 0, name: d.name, type: d.type }; });
  thisMonCons.forEach(c => { if (devMap[c.deviceId]) { devMap[c.deviceId].kwh += c.kwh; devMap[c.deviceId].cost += c.totalCost; } });
  const devRanking = Object.entries(devMap).map(([id, info]) => ({ id, ...info })).filter(d => d.kwh > 0);
  const topDevices = [...devRanking].sort((a, b) => b.kwh - a.kwh).slice(0, 5);
  const loDevices  = [...devRanking].sort((a, b) => a.kwh - b.kwh).slice(0, 5);
  const maxDevKwh  = topDevices[0]?.kwh || 1;

  const insights: string[] = [];
  if (lastMonKwh > 0) {
    if (monthKwhPct > 5) insights.push(`⚡ Bu ay tüketiminiz geçen aya göre %${monthKwhPct.toFixed(1)} arttı. Klimanızı veya şofbeni gözden geçirin.`);
    else if (monthKwhPct < -5) insights.push(`✅ Harika! Bu ay %${Math.abs(monthKwhPct).toFixed(1)} daha az tükettiniz. Böyle devam!`);
    else insights.push(`📊 Tüketiminiz geçen ayla dengelidir (%${monthKwhPct.toFixed(1)} fark).`);
  }
  if (roomDist.length > 0) {
    const pct = ((roomDist[0].kwh / totalRKwh) * 100).toFixed(0);
    insights.push(`🏠 En yüksek tüketim "${roomDist[0].name}" odasında — toplam tüketimin %${pct}'i.`);
  }
  if (topDevices.length > 0) {
    insights.push(`🔌 En çok elektrik harcayan: "${topDevices[0].name}". Bekleme modundan kaçının.`);
  }
  insights.push(`📅 Bu hızla ay sonu faturanız yaklaşık ${fmtTL(estimatedBill)} olacak.`);
  if (co2ThisMonth > 0) {
    insights.push(`🌱 Bu ayki tahmini CO₂ ayak iziniz: ${co2Estimated.toFixed(1)} kg — bir ağacın yıllık tuttuğu karbon miktarına eşdeğer.`);
  }

  const cardCls = "bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800";

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-stone-900 dark:text-stone-50">Akıllı Analiz</h1>
        <p className="text-xs text-stone-400">Tüketim verilerini derinlemesine inceleyin</p>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Günlük Ort.', value: fmtKwh(avgDailyKwh), sub: 'Bu ay ortalaması', color: 'text-amber-500' },
          { label: 'Ay Sonu Tahmini', value: fmtTL(estimatedBill), sub: fmtKwh(estimatedKwh), color: 'text-emerald-500' },
          { label: 'Bu Ay Toplam', value: fmtKwh(thisMonKwh), sub: fmtTL(thisMonCost), color: 'text-blue-500' },
          { label: 'Geçen Ay', value: fmtKwh(lastMonKwh), sub: fmtTL(lastMonCost), color: 'text-stone-400' },
        ].map((card, i) => (
          <div key={i} onClick={() => onNavigate?.('devices')}
            className={`${cardCls} rounded-2xl p-4 space-y-1.5 hover:border-amber-500/30 transition-all cursor-pointer active:scale-95`}>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">{card.label}</span>
            <span className={`text-base font-black font-mono ${card.color}`}>{card.value}</span>
            <span className="text-[10px] text-stone-400 block">{card.sub}</span>
          </div>
        ))}
      </div>

      {/* CO2 Karbon Takip Kartı */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Leaf size={16} className="text-emerald-500" />
          <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">CO₂ Karbon Ayak İzi</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Bu Ay</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono block">{co2ThisMonth.toFixed(1)}</span>
            <span className="text-[9px] text-stone-400">kg CO₂</span>
          </div>
          <div className="text-center border-x border-emerald-500/20">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Geçen Ay</span>
            <span className="text-lg font-black text-stone-600 dark:text-stone-400 font-mono block">{co2LastMonth.toFixed(1)}</span>
            <span className="text-[9px] text-stone-400">kg CO₂</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">Tahmini</span>
            <span className="text-lg font-black text-amber-500 font-mono block">{co2Estimated.toFixed(1)}</span>
            <span className="text-[9px] text-stone-400">kg CO₂</span>
          </div>
        </div>
        <p className="text-[10px] text-stone-400 text-center">Türkiye elektrik şebekesi ort. {co2Factor} kg CO₂/kWh</p>
      </div>

      {/* Trend Grafiği */}
      <div className={`${cardCls} rounded-3xl p-5 space-y-4`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Günlük Tüketim Trendi</h3>
            <p className="text-[10px] text-stone-400 mt-0.5">kWh tüketimi ve TL maliyeti</p>
          </div>
          <div className="flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1 border border-stone-200 dark:border-stone-700 gap-1">
            {(['WEEK', 'MONTH'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`text-[9px] font-extrabold px-3 py-1 rounded-lg transition-all ${activeTab === t ? 'bg-amber-500 text-white' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}>
                {t === 'WEEK' ? '7 Gün' : '14 Gün'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,113,108,0.15)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#78716c', fontSize: 8, fontWeight: 700 }} axisLine={false} tickLine={false} interval={activeTab === 'MONTH' ? 1 : 0} />
              <YAxis yAxisId="kwh" tick={{ fill: '#f59e0b', fontSize: 8 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="cost" orientation="right" tick={{ fill: '#10b981', fontSize: 8 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'rgba(245,158,11,0.06)' }} />
              <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '8px', color: '#a8a29e' }} />
              <Bar yAxisId="kwh" dataKey="kwh" name="kWh" fill="url(#barGrad)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Line yAxisId="cost" dataKey="cost" name="TL" type="monotone" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Haftalık / Aylık Kıyas */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Haftalık Kıyas', diff: weekDiff, pct: weekPct },
          { label: 'Aylık Kıyas',    diff: monthKwhDiff, pct: monthKwhPct },
        ].map((card, i) => (
          <div key={i} className={`${cardCls} rounded-2xl p-4 space-y-2`}>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">{card.label}</span>
            <span className={`text-xs font-black flex items-center gap-1 ${card.diff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {card.diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {card.diff > 0 ? '+' : ''}{card.pct.toFixed(1)}%
            </span>
            <span className="text-[10px] text-stone-400 font-mono">{card.diff > 0 ? '+' : ''}{card.diff.toFixed(1)} kWh</span>
          </div>
        ))}
      </div>

      {/* Odalara Dağılım */}
      {roomDist.length > 0 && (
        <div className={`${cardCls} rounded-3xl p-5 space-y-4`}>
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-amber-500" />
            <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Odalara Göre Dağılım</h3>
          </div>
          <div className="space-y-3">
            {roomDist.map(r => {
              const pct = (r.kwh / totalRKwh) * 100;
              return (
                <div key={r.name} className="space-y-1.5 cursor-pointer" onClick={() => onNavigate?.('rooms')}>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                      {r.name}
                    </span>
                    <span className="text-stone-500 font-mono">{r.kwh.toFixed(1)} kWh ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: r.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* En Çok / En Az Tüketen */}
      <div className="grid grid-cols-1 gap-4">
        {[
          { title: 'En Çok Tüketen 5', data: topDevices, color: '#f43f5e', icon: <Zap size={14} className="text-rose-500" /> },
          { title: 'En Az Tüketen 5',  data: loDevices,  color: '#10b981', icon: <Award size={14} className="text-emerald-500" /> },
        ].map(({ title, data, color, icon }) => (
          <div key={title} className={`${cardCls} rounded-3xl p-5 space-y-3`}>
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">{title}</h3>
            </div>
            {data.length > 0 ? (
              <div className="space-y-2.5">
                {data.map((dev, idx) => {
                  const pct = (dev.kwh / maxDevKwh) * 100;
                  return (
                    <div key={dev.id} className="space-y-1 cursor-pointer" onClick={() => onNavigate?.('devices')}>
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-stone-900 dark:text-stone-100 truncate">{idx + 1}. {dev.name}</span>
                        <span className="text-stone-400 font-mono shrink-0 ml-2">{dev.kwh.toFixed(1)} kWh</span>
                      </div>
                      <div className="h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-400 text-center py-3">Bu ay tüketim kaydı yok.</p>
            )}
          </div>
        ))}
      </div>

      {/* Akıllı Öneriler */}
      <div className={`${cardCls} rounded-3xl p-5 space-y-3`}>
        <div className="flex items-center gap-2">
          <Lightbulb size={15} className="text-amber-500 animate-pulse" />
          <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Akıllı Öneriler</h3>
        </div>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className="flex gap-2.5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium bg-stone-50 dark:bg-stone-800/50 rounded-xl p-3">
              <p>{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
