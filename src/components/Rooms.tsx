/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Room, Device, Consumption, ROOM_ICONS, ROOM_COLORS } from '../types';
import { IconRenderer } from './IconRenderer';
import { Plus, Edit2, Trash2, X, AlertTriangle, Eye, ArrowLeft, Info, Home } from 'lucide-react';

interface RoomsProps {
  rooms: Room[];
  devices: Device[];
  consumptions: Consumption[];
  currency: string;
  onAddRoom: (name: string, icon: string, color: string) => void;
  onEditRoom: (id: string, name: string, icon: string, color: string) => void;
  onDeleteRoom: (id: string) => void;
}

export const Rooms: React.FC<RoomsProps> = ({
  rooms,
  devices,
  consumptions,
  currency,
  onAddRoom,
  onEditRoom,
  onDeleteRoom
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomDetailId, setRoomDetailId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Sofa');
  const [color, setColor] = useState('#3b82f6');
  const [error, setError] = useState('');

  // 1. STATS CALCULATIONS
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM

  const getRoomStats = (roomId: string) => {
    const roomDevices = devices.filter(d => d.roomId === roomId);
    const roomConsumptions = consumptions.filter(c => c.roomId === roomId && c.date.startsWith(currentMonthStr));
    const kwh = roomConsumptions.reduce((sum, c) => sum + c.kwh, 0);
    const cost = roomConsumptions.reduce((sum, c) => sum + c.totalCost, 0);

    return {
      devicesCount: roomDevices.length,
      kwh,
      cost
    };
  };

  const handleOpenAdd = () => {
    setName('');
    setIcon('Sofa');
    setColor('#3b82f6');
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRoom(room);
    setName(room.name);
    setIcon(room.icon);
    setColor(room.color);
    setError('');
    setShowEditModal(true);
  };

  const handleOpenDelete = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRoom(room);
    setShowDeleteModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Oda adı boş bırakılamaz.');
      return;
    }
    onAddRoom(name.trim(), icon, color);
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    if (!name.trim()) {
      setError('Oda adı boş bırakılamaz.');
      return;
    }
    onEditRoom(selectedRoom.id, name.trim(), icon, color);
    setShowEditModal(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedRoom) return;
    onDeleteRoom(selectedRoom.id);
    setShowDeleteModal(false);
    if (roomDetailId === selectedRoom.id) {
      setRoomDetailId(null);
    }
  };

  // Detailed Room sub-view
  if (roomDetailId) {
    const r = rooms.find(room => room.id === roomDetailId);
    if (!r) {
      setRoomDetailId(null);
      return null;
    }
    const rStats = getRoomStats(r.id);
    const rDevices = devices.filter(d => d.roomId === r.id);
    const rConsumptions = consumptions
      .filter(c => c.roomId === r.id)
      .sort((a, b) => b.createdAt - a.createdAt);

    return (
      <div className="space-y-6 pb-20 animate-fade-in">
        <button
          onClick={() => setRoomDetailId(null)}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl w-fit"
        >
          <ArrowLeft size={14} /> Geri Dön
        </button>

        {/* Room Header Info Card */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 flex items-start justify-between relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: r.color }}
              >
                <IconRenderer name={r.icon} size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{r.name}</h2>
                <p className="text-xs text-slate-400">{rStats.devicesCount} bağlı cihaz</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bu Ayki Toplam</span>
                <span className="text-base font-extrabold text-blue-400 font-mono">{rStats.kwh.toFixed(1)} kWh</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Toplam Maliyet</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(rStats.cost)} {currency}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Connected devices in room */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bağlı Cihazlar ({rDevices.length})</h3>
          {rDevices.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {rDevices.map((device) => {
                const deviceKwh = consumptions
                  .filter(c => c.deviceId === device.id && c.date.startsWith(currentMonthStr))
                  .reduce((sum, c) => sum + c.kwh, 0);
                return (
                  <div key={device.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-3 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate">{device.name}</h4>
                      <span className="text-[9px] text-slate-400 block mt-0.5">{device.type}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-blue-400 block font-mono">{deviceKwh.toFixed(1)} kWh</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 bg-slate-900/10 p-4 border border-dashed border-slate-800 rounded-2xl text-center">
              Bu odaya bağlı hiçbir cihaz bulunamadı.
            </p>
          )}
        </div>

        {/* Historical entries for this room */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Oda Tüketim Geçmişi</h3>
          {rConsumptions.length > 0 ? (
            <div className="space-y-2.5">
              {rConsumptions.map((entry) => {
                const d = devices.find(dev => dev.id === entry.deviceId);
                return (
                  <div key={entry.id} className="flex justify-between items-center bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4">
                    <div>
                      <h4 className="text-xs font-bold text-white">{d?.name || 'Bilinmeyen Cihaz'}</h4>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                        {new Date(entry.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-white">{entry.kwh.toFixed(2)} kWh</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(entry.totalCost)} {currency}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 bg-slate-900/10 p-4 border border-dashed border-slate-800 rounded-2xl text-center">
              Bu odaya ait tüketim kaydı bulunmuyor.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="rooms-container" className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Oda Yönetimi</h1>
          <p className="text-xs text-slate-400">Ev odalarını tanımlayın ve yönetin</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 h-10 rounded-2xl flex items-center gap-1.5 shadow-[0_4px_12px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
        >
          <Plus size={16} /> Oda Ekle
        </button>
      </div>

      {/* Rooms Grid */}
      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((room) => {
            const stats = getRoomStats(room.id);
            return (
              <div
                key={room.id}
                onClick={() => setRoomDetailId(room.id)}
                className="group cursor-pointer bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60 rounded-3xl p-5 flex items-start justify-between transition-all duration-300 relative overflow-hidden"
              >
                <div className="space-y-4 w-full">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: room.color }}
                    >
                      <IconRenderer name={room.icon} size={20} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-black text-white truncate">{room.name}</h2>
                      <p className="text-[10px] text-slate-400">{stats.devicesCount} bağlı cihaz</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Tüketim (Ay)</span>
                      <span className="text-xs font-black text-blue-400 font-mono">{stats.kwh.toFixed(1)} kWh</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Maliyet</span>
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(stats.cost)} {currency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Controls */}
                <div className="flex gap-1 shrink-0 ml-2">
                  <button
                    onClick={(e) => handleOpenEdit(room, e)}
                    className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/20"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(room, e)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/10"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <Home size={36} className="text-slate-600 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-bold text-white text-sm">İlk Odanızı Ekleyin</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Elektrik takibine başlamak için öncelikle salon, mutfak veya yatak odası gibi bir alan tanımlamalısınız.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="mx-auto bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> Yeni Oda Ekle
          </button>
        </div>
      )}

      {/* ADD ROOM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-fade-in relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-lg font-black text-white">Yeni Oda Ekle</h2>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">Oda Adı</label>
                <input
                  type="text"
                  placeholder="Örn: Salon, Çocuk Odası"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
              </div>

              {/* Icon grid select */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">İkon Seçimi</label>
                <div className="grid grid-cols-7 gap-2">
                  {ROOM_ICONS.map((ico) => (
                    <button
                      key={ico.name}
                      type="button"
                      onClick={() => setIcon(ico.name)}
                      className={`h-10 rounded-lg flex items-center justify-center border transition-all ${
                        icon === ico.name
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-md'
                          : 'bg-slate-800 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                      title={ico.label}
                    >
                      <IconRenderer name={ico.name} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color grid select */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">Oda Rengi</label>
                <div className="grid grid-cols-7 gap-2">
                  {ROOM_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setColor(col.hex)}
                      className={`h-10 rounded-lg flex items-center justify-center border transition-all relative ${
                        color === col.hex ? 'border-white scale-105' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: col.hex }}
                    >
                      {color === col.hex && <div className="absolute w-2 h-2 bg-white rounded-full" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Odayı Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-fade-in relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-lg font-black text-white">Odayı Düzenle</h2>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">Oda Adı</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 bg-slate-800 border border-slate-700 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
              </div>

              {/* Icon grid select */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">İkon Seçimi</label>
                <div className="grid grid-cols-7 gap-2">
                  {ROOM_ICONS.map((ico) => (
                    <button
                      key={ico.name}
                      type="button"
                      onClick={() => setIcon(ico.name)}
                      className={`h-10 rounded-lg flex items-center justify-center border transition-all ${
                        icon === ico.name
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-md'
                          : 'bg-slate-800 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                      title={ico.label}
                    >
                      <IconRenderer name={ico.name} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color select */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold block">Oda Rengi</label>
                <div className="grid grid-cols-7 gap-2">
                  {ROOM_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setColor(col.hex)}
                      className={`h-10 rounded-lg flex items-center justify-center border transition-all relative ${
                        color === col.hex ? 'border-white scale-105' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: col.hex }}
                    >
                      {color === col.hex && <div className="absolute w-2 h-2 bg-white rounded-full" />}
                    </button>
                  ))}
                </div>
              </div>

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

      {/* CONFIRM DELETE MODAL (CASCADE warning indicator!) */}
      {showDeleteModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertTriangle size={24} className="animate-bounce" />
            </div>
            <h2 className="text-base font-black text-white">Odayı Silmek İstediğinize Emin misiniz?</h2>
            
            <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-400 text-xs leading-relaxed space-y-1 text-left">
              <div className="font-bold flex items-center gap-1"><Info size={12} /> DİKKAT: Kalıcı Veri Kaybı!</div>
              <p>
                <strong>{selectedRoom.name}</strong> odasını silmek, bu odaya bağlı <strong>tüm cihazları</strong> ve bu cihazlara ait <strong>tüm tüketim geçmişini</strong> kalıcı olarak silecektir. Bu işlem geri alınamaz!
              </p>
            </div>

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
                Evet, Cascade Sil!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
