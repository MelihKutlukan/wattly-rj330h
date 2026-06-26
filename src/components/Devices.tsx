/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Room, Device, Consumption, DEVICE_TYPES } from '../types';
import { IconRenderer } from './IconRenderer';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Search, 
  Filter, 
  Star, 
  ArrowLeft, 
  AlertTriangle,
  Zap,
  Tag,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface DevicesProps {
  rooms: Room[];
  devices: Device[];
  consumptions: Consumption[];
  currency: string;
  onAddDevice: (roomId: string, name: string, type: string, smartPlugName?: string, averageWatt?: number, note?: string) => void;
  onEditDevice: (id: string, roomId: string, name: string, type: string, smartPlugName?: string, averageWatt?: number, note?: string) => void;
  onDeleteDevice: (id: string) => void;
  onToggleActive: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteConsumption: (id: string) => void;
}

export const Devices: React.FC<DevicesProps> = ({
  rooms,
  devices,
  consumptions,
  currency,
  onAddDevice,
  onEditDevice,
  onDeleteDevice,
  onToggleActive,
  onToggleFavorite,
  onDeleteConsumption
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceDetailId, setDeviceDetailId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'CONSUMPTION' | 'NAME' | 'NEWEST'>('CONSUMPTION');

  // Form states
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [type, setType] = useState('Televizyon');
  const [smartPlugName, setSmartPlugName] = useState('');
  const [averageWatt, setAverageWatt] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const currentMonthStr = new Date().toISOString().substring(0, 7);

  // 1. STATS & CALCULATIONS
  const getDeviceStats = (deviceId: string) => {
    const devConsumptions = consumptions.filter(c => c.deviceId === deviceId && c.date.startsWith(currentMonthStr));
    const kwh = devConsumptions.reduce((sum, c) => sum + c.kwh, 0);
    const cost = devConsumptions.reduce((sum, c) => sum + c.totalCost, 0);
    return { kwh, cost };
  };

  const handleOpenAdd = () => {
    if (rooms.length === 0) {
      setError('Lütfen cihaz eklemeden önce en az bir oda ekleyin.');
      return;
    }
    setName('');
    setRoomId(rooms[0].id);
    setType('Televizyon');
    setSmartPlugName('');
    setAverageWatt('');
    setNote('');
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDevice(device);
    setName(device.name);
    setRoomId(device.roomId);
    setType(device.type);
    setSmartPlugName(device.smartPlugName || '');
    setAverageWatt(device.averageWatt ? String(device.averageWatt) : '');
    setNote(device.note || '');
    setError('');
    setShowEditModal(true);
  };

  const handleOpenDelete = (device: Device, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDevice(device);
    setShowDeleteModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Cihaz adı boş bırakılamaz.');
      return;
    }
    const wattVal = averageWatt ? parseFloat(averageWatt) : undefined;
    if (wattVal !== undefined && (isNaN(wattVal) || wattVal < 0)) {
      setError('Lütfen geçerli bir güç değeri (Watt) girin.');
      return;
    }
    onAddDevice(roomId, name.trim(), type, smartPlugName.trim() || undefined, wattVal, note.trim() || undefined);
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    if (!name.trim()) {
      setError('Cihaz adı boş bırakılamaz.');
      return;
    }
    const wattVal = averageWatt ? parseFloat(averageWatt) : undefined;
    if (wattVal !== undefined && (isNaN(wattVal) || wattVal < 0)) {
      setError('Lütfen geçerli bir güç değeri (Watt) girin.');
      return;
    }
    onEditDevice(selectedDevice.id, roomId, name.trim(), type, smartPlugName.trim() || undefined, wattVal, note.trim() || undefined);
    setShowEditModal(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedDevice) return;
    onDeleteDevice(selectedDevice.id);
    setShowDeleteModal(false);
    if (deviceDetailId === selectedDevice.id) {
      setDeviceDetailId(null);
    }
  };

  // 2. SEARCH & FILTERING LOGIC
  const filteredDevices = devices.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (d.smartPlugName && d.smartPlugName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (d.note && d.note.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRoom = roomFilter === 'ALL' || d.roomId === roomFilter;
    const matchesType = typeFilter === 'ALL' || d.type === typeFilter;
    return matchesSearch && matchesRoom && matchesType;
  });

  const sortedDevices = [...filteredDevices].sort((a, b) => {
    if (sortBy === 'NAME') {
      return a.name.localeCompare(b.name, 'tr-TR');
    }
    if (sortBy === 'NEWEST') {
      return b.createdAt - a.createdAt;
    }
    // Sort by consumption descending
    const statsA = getDeviceStats(a.id);
    const statsB = getDeviceStats(b.id);
    return statsB.kwh - statsA.kwh;
  });

  // Render detail view of a single device
  if (deviceDetailId) {
    const dev = devices.find(d => d.id === deviceDetailId);
    if (!dev) {
      setDeviceDetailId(null);
      return null;
    }
    const dRoom = rooms.find(r => r.id === dev.roomId);
    const dStats = getDeviceStats(dev.id);
    const dConsumptions = consumptions
      .filter(c => c.deviceId === dev.id)
      .sort((a, b) => b.createdAt - a.createdAt);

    return (
      <div className="space-y-6 pb-20 animate-fade-in">
        <button
          onClick={() => setDeviceDetailId(null)}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl w-fit"
        >
          <ArrowLeft size={14} /> Geri Dön
        </button>

        {/* Device Header Info Card */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 flex items-start justify-between relative overflow-hidden">
          <div className="space-y-4 w-full">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-blue-400 bg-blue-500/10 border border-blue-500/20">
                  <IconRenderer name={DEVICE_TYPES.find(dt => dt.id === dev.type)?.icon || 'Radio'} size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-lg font-black text-white">{dev.name}</h2>
                    {dev.isFavorite && <Star size={14} className="text-amber-400 fill-amber-400" />}
                  </div>
                  <p className="text-xs text-slate-400" style={{ color: dRoom?.color }}>{dRoom?.name || 'Bilinmeyen Oda'}</p>
                </div>
              </div>

              {/* Status toggle on Detail page */}
              <button 
                onClick={() => onToggleActive(dev.id)}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                {dev.isActive ? (
                  <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Aktif <ToggleRight size={18} />
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                    Pasif <ToggleLeft size={18} />
                  </span>
                )}
              </button>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/60">
              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Bu Ayki Tüketim</span>
                <span className="text-base font-extrabold text-blue-400 font-mono">{dStats.kwh.toFixed(1)} kWh</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Tahmini Tutar</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(dStats.cost)} {currency}
                </span>
              </div>
            </div>

            {/* Supplementary Details */}
            {(dev.smartPlugName || dev.averageWatt || dev.note) && (
              <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl text-xs space-y-2 text-slate-300">
                {dev.smartPlugName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Akıllı Priz Adı:</span>
                    <span className="font-mono text-blue-300 font-bold">{dev.smartPlugName}</span>
                  </div>
                )}
                {dev.averageWatt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Güç Değeri (Ortalama):</span>
                    <span className="font-mono text-emerald-300 font-bold">{dev.averageWatt} W</span>
                  </div>
                )}
                {dev.note && (
                  <div className="pt-2 border-t border-slate-800/40">
                    <span className="text-slate-500 font-bold block mb-1">Not:</span>
                    <p className="italic text-slate-400 font-medium">{dev.note}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History of this device */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tüketim Geçmişi ({dConsumptions.length})</h3>
          {dConsumptions.length > 0 ? (
            <div className="space-y-2.5">
              {dConsumptions.map((entry) => {
                return (
                  <div key={entry.id} className="flex justify-between items-center bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white">
                        {new Date(entry.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </h4>
                      {entry.note && <p className="text-[10px] text-slate-500 italic font-medium">{entry.note}</p>}
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <div className="text-right">
                        <div className="text-xs font-bold text-white">{entry.kwh.toFixed(2)} kWh</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(entry.totalCost)} {currency}
                        </div>
                      </div>
                      
                      {/* Delete individual consumption */}
                      <button
                        onClick={() => onDeleteConsumption(entry.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 cursor-pointer"
                        title="Kaydı Sil"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 bg-slate-900/10 p-4 border border-dashed border-slate-800 rounded-2xl text-center">
              Bu cihaza ait henüz bir tüketim kaydı girilmemiş.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="devices-container" className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Cihaz / Akıllı Priz</h1>
          <p className="text-xs text-slate-400">Elektrikli ev eşyalarını yönetin</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 h-10 rounded-2xl flex items-center gap-1.5 shadow-[0_4px_12px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
        >
          <Plus size={16} /> Cihaz Ekle
        </button>
      </div>

      {/* Search & Filters block */}
      <div className="space-y-3 bg-slate-900/30 border border-slate-800 p-4 rounded-3xl backdrop-blur-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Cihaz adı, priz adı veya notlarda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
          <Search size={14} className="absolute left-3 top-3 text-slate-500" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Room filter select */}
          <div className="relative">
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2 text-[10px] font-bold text-slate-300 focus:outline-none"
            >
              <option value="ALL">Tüm Odalar</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Type filter select */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2 text-[10px] font-bold text-slate-300 focus:outline-none"
            >
              <option value="ALL">Tüm Türler</option>
              {DEVICE_TYPES.map(dt => (
                <option key={dt.id} value={dt.id}>{dt.label}</option>
              ))}
            </select>
          </div>

          {/* Sort selection select */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full h-9 bg-slate-800 border border-slate-700 rounded-lg px-2 text-[10px] font-bold text-slate-300 focus:outline-none"
            >
              <option value="CONSUMPTION">En Çok Tüketen</option>
              <option value="NAME">İsim (A-Z)</option>
              <option value="NEWEST">En Yeni</option>
            </select>
          </div>
        </div>
      </div>

      {/* Devices List */}
      {sortedDevices.length > 0 ? (
        <div className="space-y-3">
          {sortedDevices.map((device) => {
            const r = rooms.find(room => room.id === device.roomId);
            const stats = getDeviceStats(device.id);
            return (
              <div
                key={device.id}
                onClick={() => setDeviceDetailId(device.id)}
                className="bg-slate-900/40 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 rounded-3xl p-4 flex items-center justify-between transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-blue-400 bg-slate-800/80 border border-slate-700/50">
                    <IconRenderer name={DEVICE_TYPES.find(dt => dt.id === device.type)?.icon || 'Radio'} size={20} />
                  </div>
                  
                  {/* Text details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-white truncate">{device.name}</h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(device.id);
                        }}
                        className="text-slate-500 hover:text-amber-400 transition-colors"
                      >
                        <Star size={12} className={device.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-600'} />
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <span className="font-semibold" style={{ color: r?.color }}>{r?.name || 'Oda'}</span>
                      <span>•</span>
                      <span>{device.type}</span>
                    </p>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                  {/* Stats */}
                  <div className="text-right shrink-0 font-mono">
                    <span className="text-xs font-bold text-blue-400 block">{stats.kwh.toFixed(1)} kWh</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">{new Intl.NumberFormat('tr-TR').format(stats.cost)} {currency}</span>
                  </div>

                  {/* Settings dropdown / edits */}
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(device, e)}
                      className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/20"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={(e) => handleOpenDelete(device, e)}
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
          <Zap size={36} className="text-slate-600 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-bold text-white text-sm">Cihaz Bulunamadı</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Arama kriterlerinize uygun cihaz bulunamadı veya henüz hiç cihaz eklemediniz.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="mx-auto bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> Yeni Cihaz Ekle
          </button>
        </div>
      )}

      {/* ADD DEVICE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-lg font-black text-white">Yeni Cihaz Ekle</h2>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">Cihaz Adı</label>
                <input
                  type="text"
                  placeholder="Örn: Vestel Smart TV, Arçelik Klima"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Oda</label>
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Cihaz Türü</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {DEVICE_TYPES.map(dt => (
                      <option key={dt.id} value={dt.id}>{dt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold flex items-center gap-1">Akıllı Priz Adı <span className="text-[9px] text-slate-500">(Opsiyonel)</span></label>
                  <input
                    type="text"
                    placeholder="Örn: TUYA_PRIZ_1"
                    value={smartPlugName}
                    onChange={(e) => setSmartPlugName(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold flex items-center gap-1">Güç Değeri (Watt) <span className="text-[9px] text-slate-500">(Opsiyonel)</span></label>
                  <input
                    type="number"
                    placeholder="Örn: 1500"
                    value={averageWatt}
                    onChange={(e) => setAverageWatt(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">Özel Not</label>
                <textarea
                  placeholder="Cihaza ait özel not veya hatırlatıcı..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-20 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}

              <button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Cihazı Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEVICE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-lg font-black text-white">Cihazı Düzenle</h2>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">Cihaz Adı</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Oda</label>
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Cihaz Türü</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {DEVICE_TYPES.map(dt => (
                      <option key={dt.id} value={dt.id}>{dt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold flex items-center gap-1">Akıllı Priz Adı</label>
                  <input
                    type="text"
                    value={smartPlugName}
                    onChange={(e) => setSmartPlugName(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold flex items-center gap-1">Güç Değeri (Watt)</label>
                  <input
                    type="number"
                    value={averageWatt}
                    onChange={(e) => setAverageWatt(e.target.value)}
                    className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">Özel Not</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-20 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
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
      {showDeleteModal && selectedDevice && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle size={24} className="animate-pulse" />
            </div>
            <h2 className="text-base font-black text-white">Cihazı Silmek İstediğinize Emin misiniz?</h2>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>{selectedDevice.name}</strong> cihazını silmek, bu cihaza ait <strong>tüm tüketim geçmişini</strong> de geri alınamayacak şekilde kalıcı olarak silecektir. Devam etmek istiyor musunuz?
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
