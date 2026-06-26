/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Room, Device, Consumption, DEVICE_TYPES } from '../types';
import { IconRenderer } from './IconRenderer';
import { 
  BarChart3, 
  Lightbulb, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Zap, 
  Coins, 
  Layers,
  Award
} from 'lucide-react';

interface AnalyticsProps {
  rooms: Room[];
  devices: Device[];
  consumptions: Consumption[];
  currency: string;
  unitPrice: number;
}

export const Analytics: React.FC<AnalyticsProps> = ({
  rooms,
  devices,
  consumptions,
  currency,
  unitPrice
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'CONSUMPTION' | 'COST'>('CONSUMPTION');

  // Helpers
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' ' + currency;
  };

  const formatKwh = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' kWh';
  };

  // 1. DATES HELPERS
  const today = new Date();
  const currentMonthStr = today.toISOString().substring(0, 7); // YYYY-MM
  
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthStr = lastMonthDate.toISOString().substring(0, 7);

  // 2. CALC COMPARISONS (This month vs Last month)
  const thisMonthConsumptions = consumptions.filter(c => c.date.startsWith(currentMonthStr));
  const thisMonthKwh = thisMonthConsumptions.reduce((sum, c) => sum + c.kwh, 0);
  const thisMonthCost = thisMonthConsumptions.reduce((sum, c) => sum + c.totalCost, 0);

  const lastMonthConsumptions = consumptions.filter(c => c.date.startsWith(lastMonthStr));
  const lastMonthKwh = lastMonthConsumptions.reduce((sum, c) => sum + c.kwh, 0);
  const lastMonthCost = lastMonthConsumptions.reduce((sum, c) => sum + c.totalCost, 0);

  // Growth calculations
  let monthlyKwhDiff = thisMonthKwh - lastMonthKwh;
  let monthlyKwhDiffPercent = lastMonthKwh > 0 ? (monthlyKwhDiff / lastMonthKwh) * 100 : 0;

  // 3. WEEKLY COMPARISONS (This week vs Last week)
  const getWeekStats = (weeksAgo: number) => {
    const end = new Date();
    end.setDate(end.getDate() - (weeksAgo * 7));
    const start = new Date();
    start.setDate(start.getDate() - ((weeksAgo + 1) * 7));
    
    const weekConsumptions = consumptions.filter(c => {
      const cDate = new Date(c.date);
      return cDate >= start && cDate < end;
    });
    
    return {
      kwh: weekConsumptions.reduce((sum, c) => sum + c.kwh, 0),
      cost: weekConsumptions.reduce((sum, c) => sum + c.totalCost, 0)
    };
  };

  const thisWeekStats = getWeekStats(0);
  const lastWeekStats = getWeekStats(1);
  
  let weeklyKwhDiff = thisWeekStats.kwh - lastWeekStats.kwh;
  let weeklyKwhDiffPercent = lastWeekStats.kwh > 0 ? (weeklyKwhDiff / lastWeekStats.kwh) * 100 : 0;

  // 4. DAILY AVERAGES
  const daysPassedInMonth = today.getDate() || 1;
  const avgDailyKwh = thisMonthKwh / daysPassedInMonth;
  const avgMonthlyCost = thisMonthCost;

  // 5. AY SONU TAHMİNİ
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const estimatedMonthlyKwh = avgDailyKwh * daysInMonth;
  const estimatedMonthlyBill = estimatedMonthlyKwh * unitPrice;

  // 6. TOP & BOTTOM DEVICES LIST
  // Sum consumption per device this month
  const deviceSumMap: Record<string, { kwh: number; cost: number; name: string; type: string }> = {};
  devices.forEach(d => {
    deviceSumMap[d.id] = { kwh: 0, cost: 0, name: d.name, type: d.type };
  });

  consumptions.forEach(c => {
    if (c.date.startsWith(currentMonthStr)) {
      if (deviceSumMap[c.deviceId]) {
        deviceSumMap[c.deviceId].kwh += c.kwh;
        deviceSumMap[c.deviceId].cost += c.totalCost;
      }
    }
  });

  const deviceRanking = Object.entries(deviceSumMap)
    .map(([id, info]) => ({ id, ...info }))
    .filter(d => d.kwh > 0);

  const topDevices = [...deviceRanking]
    .sort((a, b) => b.kwh - a.kwh)
    .slice(0, 5);

  const bottomDevices = [...deviceRanking]
    .sort((a, b) => a.kwh - b.kwh)
    .slice(0, 5);

  const maxDeviceKwh = topDevices.length > 0 ? topDevices[0].kwh : 1;

  // 7. ROOM DISTRIBUTION
  const roomSumMap: Record<string, { kwh: number; cost: number; name: string; color: string; icon: string }> = {};
  rooms.forEach(r => {
    roomSumMap[r.id] = { kwh: 0, cost: 0, name: r.name, color: r.color, icon: r.icon };
  });

  consumptions.forEach(c => {
    if (c.date.startsWith(currentMonthStr)) {
      if (roomSumMap[c.roomId]) {
        roomSumMap[c.roomId].kwh += c.kwh;
        roomSumMap[c.roomId].cost += c.totalCost;
      }
    }
  });

  const roomDistribution = Object.entries(roomSumMap)
    .map(([id, info]) => ({ id, ...info }))
    .filter(r => r.kwh > 0)
    .sort((a, b) => b.kwh - a.kwh);

  const totalRoomKwh = roomDistribution.reduce((sum, r) => sum + r.kwh, 0) || 1;

  // 8. DATA FOR TREND LINE CHART (Last 12 Days Daily Breakdown)
  const last12DaysData = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
    
    const dailyKwh = consumptions
      .filter(c => c.date === dateStr)
      .reduce((sum, c) => sum + c.kwh, 0);
      
    const dailyCost = consumptions
      .filter(c => c.date === dateStr)
      .reduce((sum, c) => sum + c.totalCost, 0);

    return { dayName, kwh: dailyKwh, cost: dailyCost, dateStr };
  }).reverse();

  const maxWeeklyVal = Math.max(...last12DaysData.map(d => activeChartTab === 'CONSUMPTION' ? d.kwh : d.cost), 1);

  // 9. SMART AI INSIGHTS
  const insights: string[] = [];

  // Insight 1: Growth comparing
  if (lastMonthKwh > 0) {
    if (monthlyKwhDiffPercent > 5) {
      insights.push(`Elektrik tüketiminiz geçen aya göre %${monthlyKwhDiffPercent.toFixed(1)} oranında arttı. Cihaz kapatma alışkanlıklarınızı gözden geçirebilirsiniz.`);
    } else if (monthlyKwhDiffPercent < -5) {
      insights.push(`Harika! Elektrik kullanımınız geçen aya kıyasla %${Math.abs(monthlyKwhDiffPercent).toFixed(1)} azaldı. Çevre ve bütçe dostu kullanım için tebrikler!`);
    } else {
      insights.push(`Tüketiminiz geçen ay ile neredeyse dengeli (%${monthlyKwhDiffPercent.toFixed(1)} fark). Mevcut enerji yönetiminiz stabil durumda.`);
    }
  }

  // Insight 2: Room level insights
  if (roomDistribution.length > 0) {
    const mainRoom = roomDistribution[0];
    const roomPercent = (mainRoom.kwh / totalRoomKwh) * 100;
    insights.push(`Bu ay en yüksek elektrik sarfiyatı ${mainRoom.name} odasında gerçekleşti (Toplam tüketimin %${roomPercent.toFixed(0)}'i).`);
  }

  // Insight 3: Device levels
  if (topDevices.length > 0) {
    const topDev = topDevices[0];
    insights.push(`Bu ay en fazla elektrik tüketen cihaz "${topDev.name}" oldu. Enerji tasarrufu için bekleme (standby) modunda bırakmamaya özen gösterin.`);
  }

  // Insight 4: Prediction levels
  insights.push(`Mevcut tüketim hızıyla bu ay sonu tahmini faturanızın ${formatMoney(estimatedMonthlyBill)} olması öngörülmektedir.`);

  return (
    <div id="analytics-container" className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Akıllı Analiz</h1>
        <p className="text-xs text-slate-400">Tüketim verilerini ve trendleri analiz edin</p>
      </div>

      {/* Grid: Overview Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-4 space-y-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Günlük Ortalama</span>
          <div className="text-lg font-black text-white font-mono">{formatKwh(avgDailyKwh)}</div>
          <p className="text-[9px] text-slate-400 font-medium">Bu ayki verilere dayanmaktadır</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-4 space-y-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tahmini Ay Sonu Fatura</span>
          <div className="text-lg font-black text-emerald-400 font-mono">{formatMoney(estimatedMonthlyBill)}</div>
          <p className="text-[9px] text-slate-400 font-medium">Birim Fiyat: {unitPrice.toFixed(2)} TL</p>
        </div>
      </div>

      {/* Chart Panel with Custom Interactive SVG Bar/Line Chart */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Son 12 Günlük Trend</h3>
            <p className="text-[10px] text-slate-400">Tüketim ve maliyet dalgalanmaları</p>
          </div>
          
          {/* Chart Toggle tabs */}
          <div className="flex bg-slate-800/80 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => setActiveChartTab('CONSUMPTION')}
              className={`text-[9px] font-extrabold px-3 py-1 rounded-lg transition-all ${
                activeChartTab === 'CONSUMPTION' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              kWh
            </button>
            <button
              onClick={() => setActiveChartTab('COST')}
              className={`text-[9px] font-extrabold px-3 py-1 rounded-lg transition-all ${
                activeChartTab === 'COST' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TL
            </button>
          </div>
        </div>

        {/* Custom SVG Line-Area Chart with Tooltips */}
        <div className="h-44 relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="border-t border-slate-700 w-full" />
            ))}
          </div>

          {/* SVG canvas */}
          <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeChartTab === 'CONSUMPTION' ? '#3b82f6' : '#10b981'} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={activeChartTab === 'CONSUMPTION' ? '#3b82f6' : '#10b981'} stopOpacity="0.0"/>
              </linearGradient>
            </defs>

            {/* Build paths for Line and Area */}
            {(() => {
              const points = last12DaysData.map((item, index) => {
                const val = activeChartTab === 'CONSUMPTION' ? item.kwh : item.cost;
                const x = (index / (last12DaysData.length - 1)) * 400;
                const y = 110 - (val / maxWeeklyVal) * 95;
                return { x, y };
              });

              const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} 110 L ${points[0].x} 110 Z` : '';

              return (
                <>
                  {/* Area fill */}
                  {areaPath && <path d={areaPath} fill="url(#chartGrad)" />}
                  {/* Line */}
                  {linePath && (
                    <path 
                      d={linePath} 
                      fill="none" 
                      stroke={activeChartTab === 'CONSUMPTION' ? '#3b82f6' : '#10b981'} 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {/* Dots */}
                  {points.map((p, idx) => (
                    <circle 
                      key={idx} 
                      cx={p.x} 
                      cy={p.y} 
                      r="3.5" 
                      fill={activeChartTab === 'CONSUMPTION' ? '#60a5fa' : '#34d399'} 
                      stroke="#0f172a" 
                      strokeWidth="1.5" 
                    />
                  ))}
                </>
              );
            })()}
          </svg>

          {/* X Axis Labels under SVG */}
          <div className="flex justify-between text-[8px] text-slate-500 font-bold mt-2 font-mono">
            {last12DaysData.map((item, idx) => (
              <span key={idx} className={idx % 2 === 0 ? 'opacity-100' : 'opacity-40'}>
                {item.dayName.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Comparisons: Weekly & Monthly Diff Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly Comparison */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-4 space-y-1.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Haftalık Kıyas</span>
          <div className="flex items-center gap-1.5">
            {weeklyKwhDiff > 0 ? (
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-0.5">
                <TrendingUp size={10} /> +{weeklyKwhDiffPercent.toFixed(1)}%
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                <TrendingDown size={10} /> {weeklyKwhDiffPercent.toFixed(1)}%
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-400 font-semibold block">Fark: {weeklyKwhDiff.toFixed(1)} kWh</span>
        </div>

        {/* Monthly Comparison */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-4 space-y-1.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Aylık Kıyas</span>
          <div className="flex items-center gap-1.5">
            {monthlyKwhDiff > 0 ? (
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-0.5">
                <TrendingUp size={10} /> +{monthlyKwhDiffPercent.toFixed(1)}%
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                <TrendingDown size={10} /> {monthlyKwhDiffPercent.toFixed(1)}%
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-400 font-semibold block">Fark: {monthlyKwhDiff.toFixed(1)} kWh</span>
        </div>
      </div>

      {/* Room-by-room Distribution Breakdown */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-blue-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Odalara Göre Dağılım</h3>
        </div>

        {roomDistribution.length > 0 ? (
          <div className="space-y-3.5">
            {roomDistribution.map((room) => {
              const percent = (room.kwh / totalRoomKwh) * 100;
              return (
                <div key={room.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full block shrink-0" style={{ backgroundColor: room.color }} />
                      {room.name}
                    </span>
                    <span className="text-slate-300 font-mono">
                      {room.kwh.toFixed(1)} kWh ({percent.toFixed(0)}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${percent}%`,
                        backgroundColor: room.color
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-800 rounded-2xl">
            Odalar dağılım analizi için henüz tüketim kaydı girilmemiş.
          </p>
        )}
      </div>

      {/* Top 5 Most Consuming & Efficient Devices Grid */}
      <div className="space-y-4">
        {/* Most Consuming List */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-400">
            <Zap size={16} />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">En Çok Tüketen 5 Cihaz</h3>
          </div>

          {topDevices.length > 0 ? (
            <div className="space-y-2.5">
              {topDevices.map((dev, idx) => {
                const percentOfMax = (dev.kwh / maxDeviceKwh) * 100;
                return (
                  <div key={dev.id} className="flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-white truncate">{idx + 1}. {dev.name}</span>
                        <span className="text-slate-400 font-mono shrink-0">{dev.kwh.toFixed(1)} kWh</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-rose-500 rounded-full" 
                          style={{ width: `${percentOfMax}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">Veri yok.</p>
          )}
        </div>

        {/* Most Efficient List */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Award size={16} />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">En Tasarruflu Cihazlar</h3>
          </div>

          {bottomDevices.length > 0 ? (
            <div className="space-y-2.5">
              {bottomDevices.map((dev, idx) => {
                const percentOfMax = (dev.kwh / maxDeviceKwh) * 100;
                return (
                  <div key={dev.id} className="flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-white truncate">{idx + 1}. {dev.name}</span>
                        <span className="text-slate-400 font-mono shrink-0">{dev.kwh.toFixed(1)} kWh</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" 
                          style={{ width: `${percentOfMax}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">Veri yok.</p>
          )}
        </div>
      </div>

      {/* Smart Suggestions & Insights Panel */}
      <div className="bg-gradient-to-br from-blue-600/5 to-purple-600/5 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-blue-400">
          <Lightbulb size={16} className="animate-pulse" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Akıllı Öneriler</h3>
        </div>

        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex gap-2.5 text-xs text-slate-300 leading-relaxed font-medium">
              <span className="text-blue-400 shrink-0 select-none">•</span>
              <p>{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
