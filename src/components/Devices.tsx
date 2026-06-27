import React, { useState } from 'react';
import { Room, Device, Consumption, DEVICE_TYPES, AC_CONSUMPTION_KW } from '../types';
import { IconRenderer } from './IconRenderer';
import {
  Plus, Edit2, Trash2, X, Search, Star, ArrowLeft,
  AlertTriangle, Zap, ToggleLeft, ToggleRight, Calculator,
  ChevronDown, ChevronUp, Calendar, Coins
} from 'lucide-react';

interface DevicesProps {
  rooms: Room[];
  devices: Device[];
  consumptions: Consumption[];
  currency: string;
  onAddDevice: (roomId: string, name: string, type: string, smartPlugName?: string, averageWatt?: number, note?: string, acBtu?: 9000|12000|18000|24000, acEnergyClass?: 'A+'|'A++'|'A+++', acIsInverter?: boolean, heaterPowerKw?: 3|4|5) => void;
  onEditDevice: (id: string, roomId: string, name: string, type: string, smartPlugName?: string, averageWatt?: number, note?: string, acBtu?: 9000|12000|18000|24000, acEnergyClass?: 'A+'|'A++'|'A+++', acIsInverter?: boolean, heaterPowerKw?: 3|4|5) => void;
  onDeleteDevice: (id: string) => void;
  onToggleActive: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteConsumption: (id: string) => void;
  onEditConsumption: (id: string, date: string, kwh: number, unitPrice: number, totalCost: number, note?: string) => void;
  defaultUnitPrice: number;
}

// ─── Cihaz Hesap Makinesi ────────────────────────────────────────────────────
const DeviceCalculator: React.FC<{
  type: string;
  acBtu: 9000|12000|18000|24000;
  setAcBtu: (v: 9000|12000|18000|24000) => void;
  acEnergyClass: 'A+'|'A++'|'A+++';
  setAcEnergyClass: (v: 'A+'|'A++'|'A+++') => void;
  heaterPowerKw: 3|4|5;
  setHeaterPowerKw: (v: 3|4|5) => void;
  currency: string;
  unitPrice: number;
  onApplyWatt: (watt: number) => void;
}> = ({ type, acBtu, setAcBtu, acEnergyClass, setAcEnergyClass, heaterPowerKw, setHeaterPowerKw, currency, unitPrice, onApplyWatt }) => {
  const [hours, setHours]           = useState(8);
  const [heaterMin, setHeaterMin]   = useState(45);
  const [heaterDays, setHeaterDays] = useState(30);
  const [watt, setWatt]             = useState(100);

  const isAc     = type === 'Klima';
  const isHeater = type === 'Şofben';

  const acHourlyKw    = isAc ? (AC_CONSUMPTION_KW[String(acBtu)]?.[acEnergyClass] ?? 0.6) : 0;
  const acDailyKwh    = acHourlyKw * hours;
  const acMonthlyKwh  = acDailyKwh * 30;
  const acMonthlyCost = acMonthlyKwh * unitPrice;

  const heaterKw         = heaterPowerKw;
  const heaterHours      = heaterMin / 60;
  const heaterSingleKwh  = heaterKw * heaterHours;
  const heaterSingleCost = heaterSingleKwh * unitPrice;
  const heaterMonKwh     = heaterSingleKwh * heaterDays;
  const heaterMonCost    = heaterMonKwh * unitPrice;

  const genDailyKwh    = (watt / 1000) * hours;
  const genMonthlyKwh  = genDailyKwh * 30;
  const genMonthlyCost = genMonthlyKwh * unitPrice;

  const fmtTL = (v: number) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(v) + ' ' + currency;

  const inputCls  = "w-full h-8 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2 text-[10px] text-stone-900 dark:text-stone-100 focus:outline-none font-mono";

  const resultRow = (label: string, kwh: number, cost: number) => (
    <div key={label} className="flex justify-between items-center py-1.5 border-b border-stone-200 dark:border-stone-800/50">
      <span className="text-[10px] text-stone-500 font-bold">{label}</span>
      <div className="text-right">
        <span className="text-xs font-black text-amber-500 font-mono">{kwh.toFixed(2)} kWh</span>
        <span className="text-[10px] text-emerald-500 font-mono ml-2">{fmtTL(cost)}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-stone-50 dark:bg-stone-950/60 border border-amber-500/20 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
          <Calculator size={13} /> Tüketim Simülatörü
        </span>
        <span className="text-[9px] text-stone-400">Birim: {unitPrice.toFixed(2)} TL/kWh</span>
      </div>

      {isAc && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold block">BTU</label>
              <select value={acBtu} onChange={e => setAcBtu(+e.target.value as any)} className={inputCls}>
                {[9000,12000,18000,24000].map(b => <option key={b} value={b}>{b/1000}K</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold block">Enerji Sınıfı</label>
              <select value={acEnergyClass} onChange={e => setAcEnergyClass(e.target.value as any)} className={inputCls}>
                {['A+','A++','A+++'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold flex justify-between">
                <span>Günlük Saat</span>
                <span className="text-amber-500">{hours}s</span>
              </label>
              <input type="range" min={1} max={24} value={hours} onChange={e => setHours(+e.target.value)}
                className="w-full accent-amber-500" />
            </div>
          </div>
          <div className="space-y-1">
            {resultRow('Saatlik', acHourlyKw, acHourlyKw * unitPrice)}
            {resultRow('Günlük', acDailyKwh, acDailyKwh * unitPrice)}
            {resultRow('Aylık (30 gün)', acMonthlyKwh, acMonthlyCost)}
          </div>
          <button type="button" onClick={() => onApplyWatt(Math.round(acHourlyKw * 1000))}
            className="w-full h-8 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg transition-all">
            Ortalama Gücü Uygula ({Math.round(acHourlyKw * 1000)} W)
          </button>
          <p className="text-[9px] text-stone-400 text-center">*İnverter klimanın kompresör ~%60 yükte çalışması baz alınmıştır.</p>
        </>
      )}

      {isHeater && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold block">Güç (kW)</label>
              <select value={heaterPowerKw} onChange={e => setHeaterPowerKw(+e.target.value as any)} className={inputCls}>
                {[3,4,5].map(p => <option key={p} value={p}>{p} kW</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold block">Aylık Kullanım</label>
              <div className="flex items-center gap-1 h-8 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2">
                <input type="number" min={1} max={30} value={heaterDays} onChange={e => setHeaterDays(+e.target.value)}
                  className="w-full bg-transparent text-[10px] text-stone-900 dark:text-stone-100 focus:outline-none font-mono" />
                <span className="text-[9px] text-stone-400">gün</span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] text-stone-500 font-bold">Kullanım Süresi</label>
              <span className="text-[10px] text-amber-500 font-bold">
                {heaterMin >= 60 ? `${Math.floor(heaterMin/60)}s ${heaterMin%60 > 0 ? heaterMin%60+'dk' : ''}` : `${heaterMin}dk`}
              </span>
            </div>
            <input type="range" min={5} max={180} step={5} value={heaterMin} onChange={e => setHeaterMin(+e.target.value)}
              className="w-full accent-amber-500" />
          </div>
          <div className="space-y-1">
            {resultRow('Banyo Başı', heaterSingleKwh, heaterSingleCost)}
            {resultRow(`Aylık (${heaterDays} gün)`, heaterMonKwh, heaterMonCost)}
          </div>
          <button type="button" onClick={() => onApplyWatt(heaterPowerKw * 1000)}
            className="w-full h-8 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg transition-all">
            Gücü Uygula ({heaterPowerKw * 1000} W)
          </button>
          <p className="text-[9px] text-stone-400 text-center">*Anlık su ısıtıcı tam güçte çalışmaktadır.</p>
        </>
      )}

      {!isAc && !isHeater && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold block">Güç (Watt)</label>
              <input type="number" min={1} value={watt} onChange={e => setWatt(+e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-stone-500 font-bold flex justify-between">
                <span>Günlük Saat</span>
                <span className="text-amber-500">{hours}s</span>
              </label>
              <input type="range" min={0.5} max={24} step={0.5} value={hours} onChange={e => setHours(+e.target.value)}
                className="w-full accent-amber-500 mt-2" />
            </div>
          </div>
          <div className="space-y-1">
            {resultRow('1 Saat', watt/1000, (watt/1000)*unitPrice)}
            {resultRow('Günlük', genDailyKwh, genDailyKwh*unitPrice)}
            {resultRow('Aylık (30 gün)', genMonthlyKwh, genMonthlyCost)}
          </div>
          <button type="button" onClick={() => onApplyWatt(watt)}
            className="w-full h-8 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg transition-all">
            Bu Değeri Güç Alanına Uygula ({watt} W)
          </button>
        </>
      )}
    </div>
  );
};

// ─── Ana Cihazlar Bileşeni ───────────────────────────────────────────────────
export const Devices: React.FC<DevicesProps> = ({
  rooms, devices, consumptions, currency,
  onAddDevice, onEditDevice, onDeleteDevice,
  onToggleActive, onToggleFavorite, onDeleteConsumption, onEditConsumption,
  defaultUnitPrice
}) => {
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDevice, setSelectedDevice]   = useState<Device | null>(null);
  const [deviceDetailId, setDeviceDetailId]   = useState<string | null>(null);
  const [editCons, setEditCons]               = useState<Consumption | null>(null);
  const [showCalc, setShowCalc]               = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter]   = useState('ALL');
  const [typeFilter, setTypeFilter]   = useState('ALL');
  const [sortBy, setSortBy]           = useState<'CONSUMPTION'|'NAME'|'NEWEST'>('CONSUMPTION');

  const [name, setName]               = useState('');
  const [roomId, setRoomId]           = useState('');
  const [type, setType]               = useState('Televizyon');
  const [smartPlugName, setSmartPlugName] = useState('');
  const [averageWatt, setAverageWatt] = useState('');
  const [note, setNote]               = useState('');
  const [acBtu, setAcBtu]             = useState<9000|12000|18000|24000>(12000);
  const [acEnergyClass, setAcEnergyClass] = useState<'A+'|'A++'|'A+++'>('A++');
  const [acIsInverter, setAcIsInverter] = useState(true);
  const [heaterPowerKw, setHeaterPowerKw] = useState<3|4|5>(4);
  const [formError, setFormError]     = useState('');

  const [editConsDate, setEditConsDate]             = useState('');
  const [editConsKwh, setEditConsKwh]               = useState('');
  const [editConsUnitPrice, setEditConsUnitPrice]   = useState('');
  const [editConsNote, setEditConsNote]             = useState('');

  const curMonStr = new Date().toISOString().substring(0, 7);

  const getStats = (id: string) => {
    const dc = consumptions.filter(c => c.deviceId === id && c.date.startsWith(curMonStr));
    return { kwh: dc.reduce((s, c) => s + c.kwh, 0), cost: dc.reduce((s, c) => s + c.totalCost, 0) };
  };

  const clearForm = () => {
    setName(''); setRoomId(rooms[0]?.id || ''); setType('Televizyon');
    setSmartPlugName(''); setAverageWatt(''); setNote('');
    setAcBtu(12000); setAcEnergyClass('A++'); setAcIsInverter(true); setHeaterPowerKw(4);
    setFormError(''); setShowCalc(false);
  };

  const fillForm = (d: Device) => {
    setName(d.name); setRoomId(d.roomId); setType(d.type);
    setSmartPlugName(d.smartPlugName || '');
    setAverageWatt(d.averageWatt ? String(d.averageWatt) : '');
    setNote(d.note || '');
    setAcBtu(d.acBtu || 12000);
    setAcEnergyClass(d.acEnergyClass || 'A++');
    setAcIsInverter(d.acIsInverter !== false);
    setHeaterPowerKw(d.heaterPowerKw || 4);
    setFormError(''); setShowCalc(false);
  };

  const handleOpenAdd = () => {
    if (rooms.length === 0) { setFormError('Önce bir oda ekleyin.'); return; }
    clearForm();
    setShowAddModal(true);
  };

  const validateAndGet = () => {
    if (!name.trim()) { setFormError('Cihaz adı boş bırakılamaz.'); return null; }
    const w = averageWatt ? parseFloat(averageWatt) : undefined;
    if (w !== undefined && (isNaN(w) || w < 0)) { setFormError('Geçerli bir Watt değeri girin.'); return null; }
    return { w };
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateAndGet();
    if (!res) return;
    onAddDevice(roomId, name.trim(), type, smartPlugName.trim() || undefined, res.w, note.trim() || undefined,
      type === 'Klima' ? acBtu : undefined,
      type === 'Klima' ? acEnergyClass : undefined,
      type === 'Klima' ? acIsInverter : undefined,
      type === 'Şofben' ? heaterPowerKw : undefined);
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    const res = validateAndGet();
    if (!res) return;
    onEditDevice(selectedDevice.id, roomId, name.trim(), type, smartPlugName.trim() || undefined, res.w, note.trim() || undefined,
      type === 'Klima' ? acBtu : undefined,
      type === 'Klima' ? acEnergyClass : undefined,
      type === 'Klima' ? acIsInverter : undefined,
      type === 'Şofben' ? heaterPowerKw : undefined);
    setShowEditModal(false);
  };

  const openEditCons = (c: Consumption) => {
    setEditCons(c);
    setEditConsDate(c.date);
    setEditConsKwh(String(c.kwh));
    setEditConsUnitPrice(String(c.unitPrice));
    setEditConsNote(c.note || '');
  };

  const handleSaveEditCons = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCons) return;
    const kwh = parseFloat(editConsKwh);
    const up  = parseFloat(editConsUnitPrice);
    if (isNaN(kwh) || kwh <= 0 || isNaN(up) || up <= 0) return;
    onEditConsumption(editCons.id, editConsDate, kwh, up, parseFloat((kwh * up).toFixed(2)), editConsNote.trim() || undefined);
    setEditCons(null);
  };

  const filtered = devices.filter(d => {
    const q = searchQuery.toLowerCase();
    return (d.name.toLowerCase().includes(q) || (d.smartPlugName || '').toLowerCase().includes(q) || (d.note || '').toLowerCase().includes(q))
      && (roomFilter === 'ALL' || d.roomId === roomFilter)
      && (typeFilter === 'ALL' || d.type === typeFilter);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'NAME')   return a.name.localeCompare(b.name, 'tr-TR');
    if (sortBy === 'NEWEST') return b.createdAt - a.createdAt;
    return getStats(b.id).kwh - getStats(a.id).kwh;
  });

  const inputCls = "w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-4 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500";


  // Cihaz Detay
  if (deviceDetailId) {
    const dev = devices.find(d => d.id === deviceDetailId);
    if (!dev) { setDeviceDetailId(null); return null; }
    const dRoom    = rooms.find(r => r.id === dev.roomId);
    const dStats   = getStats(dev.id);
    const dCons    = [...consumptions.filter(c => c.deviceId === dev.id)].sort((a, b) => b.createdAt - a.createdAt);
    const typeInfo = DEVICE_TYPES.find(dt => dt.id === dev.type);

    return (
      <div className="space-y-5 pb-24 animate-fade-in">
        <button onClick={() => setDeviceDetailId(null)}
          className="flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-3 py-1.5 rounded-xl transition-all">
          <ArrowLeft size={14} /> Geri
        </button>

        <div className="p-5 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20">
                <IconRenderer name={typeInfo?.icon || 'Radio'} size={22} className="text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-black text-stone-900 dark:text-stone-50">{dev.name}</h2>
                  {dev.isFavorite && <Star size={13} className="text-amber-400 fill-amber-400" />}
                </div>
                <p className="text-xs font-medium" style={{ color: dRoom?.color }}>{dRoom?.name || 'Oda'}</p>
              </div>
            </div>
            <button onClick={() => onToggleActive(dev.id)}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${dev.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700'}`}>
              {dev.isActive ? <><ToggleRight size={16} /> Aktif</> : <><ToggleLeft size={16} /> Pasif</>}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stone-100 dark:border-stone-800/60">
            <div>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Bu Ayki Tüketim</span>
              <span className="text-base font-black text-amber-500 font-mono">{dStats.kwh.toFixed(1)} kWh</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Tahmini Maliyet</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(dStats.cost)} {currency}
              </span>
            </div>
          </div>

          {(dev.smartPlugName || dev.averageWatt || dev.note) && (
            <div className="bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-800 rounded-2xl p-3 text-xs space-y-1.5">
              {dev.smartPlugName && <div className="flex justify-between"><span className="text-stone-400">Akıllı Priz:</span><span className="text-blue-500 font-mono font-bold">{dev.smartPlugName}</span></div>}
              {dev.averageWatt   && <div className="flex justify-between"><span className="text-stone-400">Ortalama Güç:</span><span className="text-emerald-500 font-mono font-bold">{dev.averageWatt} W</span></div>}
              {dev.note && <p className="text-stone-400 italic pt-1 border-t border-stone-200 dark:border-stone-800/50">{dev.note}</p>}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Tüketim Geçmişi ({dCons.length})</h3>
          {dCons.length > 0 ? (
            <div className="space-y-2">
              {dCons.map(entry => (
                <div key={entry.id} className="flex justify-between items-center bg-white dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800/60 rounded-2xl p-3.5">
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">{new Date(entry.date).toLocaleDateString('tr-TR', { day:'2-digit', month:'long', year:'numeric' })}</h4>
                    {entry.note && <p className="text-[10px] text-stone-400 italic truncate">{entry.note}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100">{entry.kwh.toFixed(2)} kWh</div>
                      <div className="text-[10px] text-stone-400">{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(entry.totalCost)} {currency}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditCons(entry)}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/10 transition-all">
                        <Edit2 size={11} />
                      </button>
                      <button onClick={() => onDeleteConsumption(entry.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/10">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 bg-stone-50 dark:bg-stone-900/10 p-4 border border-dashed border-stone-300 dark:border-stone-800 rounded-2xl text-center">Henüz tüketim kaydı girilmemiş.</p>
          )}
        </div>

        {/* Tüketim Düzenleme — bottom sheet */}
        {editCons && (
          <>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setEditCons(null)} />
            <div className="fixed inset-x-0 z-50 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl w-full max-w-md mx-auto animate-slide-up"
              style={{top:'15vh', bottom:0}}
              onClick={e => e.stopPropagation()}>
              <form onSubmit={handleSaveEditCons} className="h-full flex flex-col">
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" />
                </div>
                <div className="px-5 pb-3 flex justify-between items-center shrink-0">
                  <h2 className="text-base font-black text-stone-900 dark:text-stone-50">Tüketim Kaydını Düzenle</h2>
                  <div className="flex items-center gap-2">
                    <button type="submit" className="px-3 h-8 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg transition-colors">
                      Kaydet
                    </button>
                    <button type="button" onClick={() => setEditCons(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-5 space-y-4 pb-6">
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-500 dark:text-stone-400 font-bold flex items-center gap-1">
                      <Calendar size={11} className="text-amber-500" /> Tarih
                    </label>
                    <input type="date" value={editConsDate} onChange={e => setEditConsDate(e.target.value)}
                      className={inputCls + " font-mono"} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-stone-500 dark:text-stone-400 font-bold flex items-center gap-1">
                        <Zap size={11} className="text-amber-500" /> kWh
                      </label>
                      <input type="number" step="0.01" min="0.01" value={editConsKwh} onChange={e => setEditConsKwh(e.target.value)}
                        className={inputCls + " font-mono"} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-stone-500 dark:text-stone-400 font-bold flex items-center gap-1">
                        <Coins size={11} className="text-emerald-500" /> TL/kWh
                      </label>
                      <input type="number" step="0.01" min="0.01" value={editConsUnitPrice} onChange={e => setEditConsUnitPrice(e.target.value)}
                        className={inputCls + " font-mono"} />
                    </div>
                  </div>
                  {editConsKwh && editConsUnitPrice && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                      <span className="text-xs font-black text-stone-900 dark:text-stone-50 font-mono">
                        {(parseFloat(editConsKwh) * parseFloat(editConsUnitPrice)).toFixed(2)} {currency}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-500 dark:text-stone-400 font-bold">Not</label>
                    <input type="text" value={editConsNote} onChange={e => setEditConsNote(e.target.value)}
                      className={inputCls} />
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-50">Cihazlar</h1>
          <p className="text-xs text-stone-400">Elektrikli cihazları yönetin</p>
        </div>
        <button onClick={handleOpenAdd}
          className="bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-4 h-10 rounded-2xl flex items-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.3)] transition-all">
          <Plus size={15} /> Cihaz Ekle
        </button>
      </div>

      {/* Arama & Filtreler */}
      <div className="space-y-3 bg-white dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl">
        <div className="relative">
          <input type="text" placeholder="Cihaz ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-9 pr-4 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 placeholder-stone-400" />
          <Search size={13} className="absolute left-3 top-3.5 text-stone-400" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: roomFilter, onChange: setRoomFilter, options: [{ value: 'ALL', label: 'Tüm Odalar' }, ...rooms.map(r => ({ value: r.id, label: r.name }))] },
            { value: typeFilter, onChange: setTypeFilter, options: [{ value: 'ALL', label: 'Tüm Türler' }, ...DEVICE_TYPES.map(dt => ({ value: dt.id, label: dt.label }))] },
            { value: sortBy,    onChange: (v: any) => setSortBy(v), options: [{ value: 'CONSUMPTION', label: 'En Çok Tüketen' }, { value: 'NAME', label: 'İsim (A-Z)' }, { value: 'NEWEST', label: 'En Yeni' }] },
          ].map((sel, i) => (
            <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)}
              className="w-full h-9 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2 text-[10px] font-bold text-stone-600 dark:text-stone-300 focus:outline-none">
              {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* Cihaz Listesi */}
      {sorted.length > 0 ? (
        <div className="space-y-2.5">
          {sorted.map(device => {
            const r     = rooms.find(rm => rm.id === device.roomId);
            const stats = getStats(device.id);
            const icon  = DEVICE_TYPES.find(dt => dt.id === device.type)?.icon || 'Radio';
            return (
              <div key={device.id} onClick={() => setDeviceDetailId(device.id)}
                className="bg-white dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-900/60 rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer active:scale-[0.99]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500/10 border border-amber-500/10 shrink-0">
                    <IconRenderer name={icon} size={19} className="text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{device.name}</h3>
                      <button type="button" onClick={e => { e.stopPropagation(); onToggleFavorite(device.id); }}>
                        <Star size={11} className={device.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-stone-300 dark:text-stone-600 hover:text-amber-400'} />
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                      <span style={{ color: r?.color }}>{r?.name}</span>
                      <span>•</span>
                      <span>{device.type}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-amber-500 block">{stats.kwh.toFixed(1)} kWh</span>
                    <span className="text-[9px] text-stone-400">{new Intl.NumberFormat('tr-TR').format(stats.cost)} {currency}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={e => { e.stopPropagation(); setSelectedDevice(device); fillForm(device); setShowEditModal(true); }}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-300 border border-stone-200 dark:border-stone-700/20">
                      <Edit2 size={11} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setSelectedDevice(device); setShowDeleteModal(true); }}
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
        <div className="bg-stone-50 dark:bg-stone-900/20 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl p-10 text-center space-y-4">
          <Zap size={32} className="text-stone-300 dark:text-stone-700 mx-auto animate-pulse" />
          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">Cihaz Bulunamadı</h3>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">Arama kriterleriyle eşleşen cihaz yok veya henüz cihaz eklemediniz.</p>
          <button onClick={handleOpenAdd}
            className="mx-auto bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all">
            <Plus size={13} /> Cihaz Ekle
          </button>
        </div>
      )}

      {/* Add / Edit modal */}
      {(showAddModal || showEditModal) && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowAddModal(false); setShowEditModal(false); }} />
          <div className="fixed inset-x-0 z-50 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl w-full max-w-md mx-auto animate-slide-up"
            style={{top:'15vh', bottom:0}}
            onClick={e => e.stopPropagation()}>
            <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="h-full flex flex-col">
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" />
              </div>
              <div className="px-5 pb-3 flex justify-between items-center shrink-0">
                <h2 className="text-base font-black text-stone-900 dark:text-stone-50">
                  {showAddModal ? 'Yeni Cihaz Ekle' : 'Cihazı Düzenle'}
                </h2>
                <div className="flex items-center gap-2">
                  <button type="submit" className="px-3 h-8 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg transition-colors">
                    Kaydet
                  </button>
                  <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-5 space-y-4 pb-6">
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-500 dark:text-stone-400 font-bold">Cihaz Adı</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Arçelik Klima"
                    className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-500 dark:text-stone-400 font-bold">Oda</label>
                    <select value={roomId} onChange={e => setRoomId(e.target.value)} className={inputCls}>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-500 dark:text-stone-400 font-bold">Cihaz Türü</label>
                    <select value={type} onChange={e => { setType(e.target.value); setAverageWatt(String(DEVICE_TYPES.find(dt => dt.id === e.target.value)?.defaultWatt || '')); }}
                      className={inputCls}>
                      {DEVICE_TYPES.map(dt => <option key={dt.id} value={dt.id}>{dt.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-500 dark:text-stone-400 font-bold">Akıllı Priz <span className="text-stone-400">(opt.)</span></label>
                    <input type="text" value={smartPlugName} onChange={e => setSmartPlugName(e.target.value)} placeholder="TUYA_1"
                      className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-500 dark:text-stone-400 font-bold">Ortalama Güç (W)</label>
                    <input type="number" value={averageWatt} onChange={e => setAverageWatt(e.target.value)} placeholder="Örn: 1500"
                      className={inputCls + " font-mono"} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-500 dark:text-stone-400 font-bold">Not</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ek notlar..."
                    className="w-full h-14 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-3 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 resize-none" />
                </div>
                <button type="button" onClick={() => setShowCalc(v => !v)}
                  className="w-full h-9 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                  <Calculator size={12} />
                  {showCalc ? 'Simülatörü Gizle' : 'Tüketim Simülatörü Aç'}
                  {showCalc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {showCalc && (
                  <DeviceCalculator
                    type={type} acBtu={acBtu} setAcBtu={setAcBtu}
                    acEnergyClass={acEnergyClass} setAcEnergyClass={setAcEnergyClass}
                    heaterPowerKw={heaterPowerKw} setHeaterPowerKw={setHeaterPowerKw}
                    currency={currency} unitPrice={defaultUnitPrice}
                    onApplyWatt={w => setAverageWatt(String(w))}
                  />
                )}
                {formError && <p className="text-[10px] text-rose-500 font-semibold">{formError}</p>}
              </div>
            </form>

          </div>
        </>
      )}

      {/* Silme onayı — bottom sheet */}
      {showDeleteModal && selectedDevice && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl w-full max-w-md mx-auto animate-slide-up pb-safe"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" />
            </div>
            <div className="px-5 pb-6 pt-2 space-y-4 text-center">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={22} />
              </div>
              <h2 className="text-base font-black text-stone-900 dark:text-stone-50">Cihazı Sil?</h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                <strong>{selectedDevice.name}</strong> ve buna ait tüm tüketim geçmişi kalıcı olarak silinecek.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="h-11 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold rounded-xl text-xs">
                  Vazgeç
                </button>
                <button onClick={() => { onDeleteDevice(selectedDevice.id); setShowDeleteModal(false); }}
                  className="h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs">
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
