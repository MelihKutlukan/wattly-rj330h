import React, { useState } from 'react';
import { Room, Device, Consumption, ROOM_ICONS, ROOM_COLORS } from '../types';
import { IconRenderer } from './IconRenderer';
import { Plus, Edit2, Trash2, X, AlertTriangle, ArrowLeft, Info, Home } from 'lucide-react';

interface RoomsProps {
  rooms: Room[];
  devices: Device[];
  consumptions: Consumption[];
  currency: string;
  onAddRoom:    (name: string, icon: string, color: string) => void;
  onEditRoom:   (id: string, name: string, icon: string, color: string) => void;
  onDeleteRoom: (id: string) => void;
}

const inputCls  = "w-full h-11 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-4 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500";
const labelCls  = "text-xs text-stone-500 dark:text-stone-400 font-bold";
const cardCls   = "bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800";

export const Rooms: React.FC<RoomsProps> = ({
  rooms, devices, consumptions, currency,
  onAddRoom, onEditRoom, onDeleteRoom
}) => {
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom]       = useState<Room | null>(null);
  const [roomDetailId, setRoomDetailId]       = useState<string | null>(null);

  const [name, setName]   = useState('');
  const [icon, setIcon]   = useState('Sofa');
  const [color, setColor] = useState('#3b82f6');
  const [error, setError] = useState('');

  const currentMonthStr = new Date().toISOString().substring(0, 7);

  const getRoomStats = (roomId: string) => {
    const rc  = consumptions.filter(c => c.roomId === roomId && c.date.startsWith(currentMonthStr));
    return {
      devicesCount: devices.filter(d => d.roomId === roomId).length,
      kwh:  rc.reduce((s, c) => s + c.kwh, 0),
      cost: rc.reduce((s, c) => s + c.totalCost, 0),
    };
  };

  const handleOpenAdd = () => {
    setName(''); setIcon('Sofa'); setColor('#3b82f6'); setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRoom(room); setName(room.name); setIcon(room.icon); setColor(room.color); setError('');
    setShowEditModal(true);
  };

  const handleOpenDelete = (room: Room, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRoom(room); setShowDeleteModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Oda adı boş bırakılamaz.'); return; }
    onAddRoom(name.trim(), icon, color);
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    if (!name.trim()) { setError('Oda adı boş bırakılamaz.'); return; }
    onEditRoom(selectedRoom.id, name.trim(), icon, color);
    setShowEditModal(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedRoom) return;
    onDeleteRoom(selectedRoom.id);
    setShowDeleteModal(false);
    if (roomDetailId === selectedRoom.id) setRoomDetailId(null);
  };


  // Detay görünümü
  if (roomDetailId) {
    const r = rooms.find(room => room.id === roomDetailId);
    if (!r) { setRoomDetailId(null); return null; }
    const rStats = getRoomStats(r.id);
    const rDevices = devices.filter(d => d.roomId === r.id);
    const rConsumptions = consumptions.filter(c => c.roomId === r.id).sort((a, b) => b.createdAt - a.createdAt);

    return (
      <div className="space-y-6 pb-20 animate-fade-in">
        <button onClick={() => setRoomDetailId(null)}
          className={`flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors ${cardCls} px-3 py-1.5 rounded-xl w-fit`}>
          <ArrowLeft size={14} /> Geri Dön
        </button>

        <div className={`p-6 rounded-3xl ${cardCls}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: r.color }}>
              <IconRenderer name={r.icon} size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 dark:text-stone-50">{r.name}</h2>
              <p className="text-xs text-stone-400">{rStats.devicesCount} bağlı cihaz</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
            <div>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Bu Ayki Toplam</span>
              <span className="text-base font-extrabold text-amber-500 font-mono">{rStats.kwh.toFixed(1)} kWh</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Toplam Maliyet</span>
              <span className="text-base font-extrabold text-emerald-500 font-mono">
                {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(rStats.cost)} {currency}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Bağlı Cihazlar ({rDevices.length})</h3>
          {rDevices.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {rDevices.map(device => {
                const devKwh = consumptions
                  .filter(c => c.deviceId === device.id && c.date.startsWith(currentMonthStr))
                  .reduce((s, c) => s + c.kwh, 0);
                return (
                  <div key={device.id} className={`${cardCls} rounded-2xl p-3 flex justify-between items-center`}>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-50 truncate">{device.name}</h4>
                      <span className="text-[9px] text-stone-400 block mt-0.5">{device.type}</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-500 font-mono shrink-0">{devKwh.toFixed(1)} kWh</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-stone-400 bg-stone-100 dark:bg-stone-900/20 p-4 border border-dashed border-stone-300 dark:border-stone-800 rounded-2xl text-center">
              Bu odaya bağlı cihaz yok.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Tüketim Geçmişi</h3>
          {rConsumptions.length > 0 ? (
            <div className="space-y-2.5">
              {rConsumptions.map(entry => {
                const d = devices.find(dev => dev.id === entry.deviceId);
                return (
                  <div key={entry.id} className={`flex justify-between items-center ${cardCls} rounded-2xl p-4`}>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-50">{d?.name || 'Bilinmeyen Cihaz'}</h4>
                      <span className="text-[9px] text-stone-400 block mt-0.5">
                        {new Date(entry.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-50">{entry.kwh.toFixed(2)} kWh</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(entry.totalCost)} {currency}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-stone-400 bg-stone-100 dark:bg-stone-900/20 p-4 border border-dashed border-stone-300 dark:border-stone-800 rounded-2xl text-center">
              Bu odaya ait tüketim kaydı yok.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-50">Oda Yönetimi</h1>
          <p className="text-xs text-stone-400">Ev odalarını tanımlayın ve yönetin</p>
        </div>
        <button onClick={handleOpenAdd}
          className="bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-4 h-10 rounded-2xl flex items-center gap-1.5 shadow-[0_4px_12px_rgba(245,158,11,0.3)] transition-colors">
          <Plus size={16} /> Oda Ekle
        </button>
      </div>

      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {rooms.map(room => {
            const stats = getRoomStats(room.id);
            return (
              <div key={room.id} onClick={() => setRoomDetailId(room.id)}
                className={`cursor-pointer ${cardCls} hover:border-amber-500/30 rounded-3xl p-5 flex items-start justify-between transition-all`}>
                <div className="space-y-4 w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: room.color }}>
                      <IconRenderer name={room.icon} size={20} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-black text-stone-900 dark:text-stone-50 truncate">{room.name}</h2>
                      <p className="text-[10px] text-stone-400">{stats.devicesCount} cihaz</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">Tüketim (Ay)</span>
                      <span className="text-xs font-black text-amber-500 font-mono">{stats.kwh.toFixed(1)} kWh</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider block">Maliyet</span>
                      <span className="text-xs font-black text-emerald-500 font-mono">
                        {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(stats.cost)} {currency}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={e => handleOpenEdit(room, e)}
                    className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors border border-stone-200 dark:border-stone-700">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={e => handleOpenDelete(room, e)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/10">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-stone-100 dark:bg-stone-900/20 border border-dashed border-stone-300 dark:border-stone-800 rounded-3xl p-12 text-center space-y-4">
          <Home size={36} className="text-stone-400 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-bold text-stone-900 dark:text-stone-50 text-sm">İlk Odanızı Ekleyin</h3>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              Elektrik takibine başlamak için salon, mutfak veya yatak odası gibi bir alan tanımlayın.
            </p>
          </div>
          <button onClick={handleOpenAdd}
            className="mx-auto bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors">
            <Plus size={14} /> Yeni Oda Ekle
          </button>
        </div>
      )}

      {/* Add / Edit modal */}
      {(showAddModal || showEditModal) && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowAddModal(false); setShowEditModal(false); }} />
          <div
            className={`fixed bottom-0 inset-x-0 z-50 ${cardCls} rounded-t-3xl w-full max-w-md mx-auto animate-slide-up`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" />
            </div>
            <div className="px-5 pb-3 flex items-center justify-between">
              <h2 className="text-base font-black text-stone-900 dark:text-stone-50">
                {showAddModal ? 'Yeni Oda Ekle' : 'Odayı Düzenle'}
              </h2>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"><X size={20} /></button>
            </div>
            <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit}>
              <div className="overflow-y-auto px-5 space-y-4 pb-2" style={{maxHeight:'calc(100dvh - 280px)'}}>
                <div className="space-y-1.5">
                  <label className={labelCls}>Oda Adı</label>
                  <input type="text" placeholder="Örn: Salon, Çocuk Odası" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                  {error && <p className="text-[10px] text-rose-500 font-semibold">{error}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={`${labelCls} block`}>İkon Seçimi</label>
                  <div className="grid grid-cols-7 gap-2">
                    {ROOM_ICONS.map(ico => (
                      <button key={ico.name} type="button" onClick={() => setIcon(ico.name)}
                        className={`h-10 rounded-lg flex items-center justify-center border transition-all ${
                          icon === ico.name
                            ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-400'
                            : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 hover:border-stone-400 dark:hover:border-stone-600'
                        }`} title={ico.label}>
                        <IconRenderer name={ico.name} size={18} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={`${labelCls} block`}>Oda Rengi</label>
                  <div className="grid grid-cols-7 gap-2">
                    {ROOM_COLORS.map(col => (
                      <button key={col.hex} type="button" onClick={() => setColor(col.hex)}
                        className={`h-10 rounded-lg flex items-center justify-center border transition-all relative ${
                          color === col.hex ? 'border-stone-900 dark:border-white scale-105' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col.hex }}>
                        {color === col.hex && <div className="absolute w-2 h-2 bg-white rounded-full shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 pt-3 pb-safe border-t border-stone-200 dark:border-stone-800">
                <button type="submit" className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-xs transition-colors">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {showDeleteModal && selectedRoom && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className={`fixed bottom-0 inset-x-0 z-50 ${cardCls} rounded-t-3xl w-full max-w-md mx-auto animate-slide-up pb-safe`}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" /></div>
            <div className="px-5 pb-6 pt-2 space-y-4 text-center">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-base font-black text-stone-900 dark:text-stone-50">Odayı Sil?</h2>
              <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-500 text-xs leading-relaxed space-y-1 text-left">
                <div className="font-bold flex items-center gap-1"><Info size={12} /> DİKKAT: Kalıcı Veri Kaybı!</div>
                <p><strong>{selectedRoom.name}</strong> odasını silmek, tüm bağlı cihazları ve tüketim geçmişini kalıcı olarak siler.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="h-11 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold rounded-xl text-xs">Vazgeç</button>
                <button onClick={handleConfirmDelete}
                  className="h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs">Evet, Sil!</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
