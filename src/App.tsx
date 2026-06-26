/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Room, Device, Consumption, Bill, AppSettings, WaterBill } from './types';
import { Onboarding } from './components/Onboarding';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { Rooms } from './components/Rooms';
import { Devices } from './components/Devices';
import { AddConsumption } from './components/AddConsumption';
import { Bills } from './components/Bills';
import { WaterTracker } from './components/WaterTracker';
import { Analytics } from './components/Analytics';
import { SettingsPanel } from './components/Settings';
import { getDemoRooms, getDemoDevices, getDemoConsumptions, getDemoBills } from './data/mockData';

export default function App() {
  // ── 1. STATE ──────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('wattly_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return { unitPrice: 3.25, currency: 'TL', themeMode: 'dark', firstLaunchCompleted: false };
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('wattly_rooms');
    return saved ? JSON.parse(saved) : [];
  });

  const [devices, setDevices] = useState<Device[]>(() => {
    const saved = localStorage.getItem('wattly_devices');
    return saved ? JSON.parse(saved) : [];
  });

  const [consumptions, setConsumptions] = useState<Consumption[]>(() => {
    const saved = localStorage.getItem('wattly_consumptions');
    return saved ? JSON.parse(saved) : [];
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('wattly_bills');
    return saved ? JSON.parse(saved) : [];
  });

  const [waterBills, setWaterBills] = useState<WaterBill[]>(() => {
    const saved = localStorage.getItem('wattly_water_bills');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showAddConsumption, setShowAddConsumption] = useState<boolean>(false);

  // ── 2. STORAGE SYNC ───────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('wattly_settings',    JSON.stringify(settings));    }, [settings]);
  useEffect(() => { localStorage.setItem('wattly_rooms',       JSON.stringify(rooms));       }, [rooms]);
  useEffect(() => { localStorage.setItem('wattly_devices',     JSON.stringify(devices));     }, [devices]);
  useEffect(() => { localStorage.setItem('wattly_consumptions',JSON.stringify(consumptions));}, [consumptions]);
  useEffect(() => { localStorage.setItem('wattly_bills',       JSON.stringify(bills));       }, [bills]);
  useEffect(() => { localStorage.setItem('wattly_water_bills', JSON.stringify(waterBills));  }, [waterBills]);

  const isDark = settings.themeMode === 'dark';

  // dark class'ı html elementine yansıt (tema geçişi)
  useEffect(() => {
    document.documentElement.dataset.theme = settings.themeMode;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark, settings.themeMode]);

  // ── 3. HANDLERS ───────────────────────────────────────────────────────────

  // Onboarding
  const handleCompleteOnboarding = (price: number, loadDemo: boolean) => {
    const updatedSettings: AppSettings = { ...settings, unitPrice: price, firstLaunchCompleted: true };
    setSettings(updatedSettings);
    if (loadDemo) {
      setRooms(getDemoRooms());
      setDevices(getDemoDevices());
      setConsumptions(getDemoConsumptions(price));
      setBills(getDemoBills());
    }
  };

  // Rooms
  const handleAddRoom = (name: string, icon: string, color: string) => {
    setRooms([...rooms, { id: 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2,7), name, icon, color, createdAt: Date.now() }]);
  };
  const handleEditRoom = (id: string, name: string, icon: string, color: string) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, name, icon, color } : r));
  };
  const handleDeleteRoom = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id));
    const deviceIdsToDelete = devices.filter(d => d.roomId === id).map(d => d.id);
    setDevices(devices.filter(d => d.roomId !== id));
    setConsumptions(consumptions.filter(c => c.roomId !== id && !deviceIdsToDelete.includes(c.deviceId)));
  };

  // Devices — extended with AC and heater params
  const handleAddDevice = (
    roomId: string, name: string, type: string, smartPlugName?: string, averageWatt?: number, note?: string,
    acBtu?: 9000|12000|18000|24000, acEnergyClass?: 'A+'|'A++'|'A+++', acIsInverter?: boolean, heaterPowerKw?: 3|4|5
  ) => {
    const newDevice: Device = {
      id: 'device-' + Date.now() + '-' + Math.random().toString(36).substring(2,7),
      roomId, name, type, smartPlugName, averageWatt, note,
      isActive: true, isFavorite: false, createdAt: Date.now(),
      acBtu, acEnergyClass, acIsInverter, heaterPowerKw
    };
    setDevices([...devices, newDevice]);
  };
  const handleEditDevice = (
    id: string, roomId: string, name: string, type: string, smartPlugName?: string, averageWatt?: number, note?: string,
    acBtu?: 9000|12000|18000|24000, acEnergyClass?: 'A+'|'A++'|'A+++', acIsInverter?: boolean, heaterPowerKw?: 3|4|5
  ) => {
    setDevices(devices.map(d => d.id === id ? { ...d, roomId, name, type, smartPlugName, averageWatt, note, acBtu, acEnergyClass, acIsInverter, heaterPowerKw } : d));
  };
  const handleDeleteDevice = (id: string) => {
    setDevices(devices.filter(d => d.id !== id));
    setConsumptions(consumptions.filter(c => c.deviceId !== id));
  };
  const handleToggleActive   = (id: string) => setDevices(devices.map(d => d.id === id ? { ...d, isActive:   !d.isActive }   : d));
  const handleToggleFavorite = (id: string) => setDevices(devices.map(d => d.id === id ? { ...d, isFavorite: !d.isFavorite } : d));

  // Consumptions
  const handleAddConsumption = (deviceId: string, roomId: string, date: string, kwh: number, unitPrice: number, totalCost: number, note?: string) => {
    setConsumptions([{
      id: 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2,7),
      deviceId, roomId, date, kwh, unitPrice, totalCost, note, createdAt: Date.now()
    }, ...consumptions]);
  };
  const handleDeleteConsumption = (id: string) => setConsumptions(consumptions.filter(c => c.id !== id));
  const handleEditConsumption = (id: string, date: string, kwh: number, unitPrice: number, totalCost: number, note?: string) => {
    setConsumptions(consumptions.map(c => c.id === id ? { ...c, date, kwh, unitPrice, totalCost, note } : c));
  };

  // Bills
  const handleAddBill = (month: number, year: number, totalKwh: number, totalAmount: number, dueDate: string, isPaid: boolean, note?: string) => {
    setBills([{ id: 'bill-' + Date.now() + '-' + Math.random().toString(36).substring(2,7), month, year, totalKwh, totalAmount, dueDate, isPaid, note, createdAt: Date.now() }, ...bills]);
  };
  const handleEditBill = (id: string, month: number, year: number, totalKwh: number, totalAmount: number, dueDate: string, isPaid: boolean, note?: string) => {
    setBills(bills.map(b => b.id === id ? { ...b, month, year, totalKwh, totalAmount, dueDate, isPaid, note } : b));
  };
  const handleDeleteBill = (id: string) => setBills(bills.filter(b => b.id !== id));
  const handleTogglePaid = (id: string)  => setBills(bills.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b));

  // Water Bills
  const handleAddWaterBill = (month: number, year: number, cubicMeters: number, totalAmount: number, dueDate: string, isPaid: boolean, note?: string) => {
    setWaterBills([{
      id: 'wb-' + Date.now() + '-' + Math.random().toString(36).substring(2,7),
      month, year, cubicMeters, totalAmount, dueDate, isPaid, note, createdAt: Date.now()
    }, ...waterBills]);
  };
  const handleEditWaterBill = (id: string, month: number, year: number, cubicMeters: number, totalAmount: number, dueDate: string, isPaid: boolean, note?: string) => {
    setWaterBills(waterBills.map(w => w.id === id ? { ...w, month, year, cubicMeters, totalAmount, dueDate, isPaid, note } : w));
  };
  const handleDeleteWaterBill = (id: string) => setWaterBills(waterBills.filter(w => w.id !== id));
  const handleToggleWaterPaid = (id: string) => setWaterBills(waterBills.map(w => w.id === id ? { ...w, isPaid: !w.isPaid } : w));

  // Data management
  const handleResetData = () => {
    ['wattly_rooms','wattly_devices','wattly_consumptions','wattly_bills','wattly_water_bills'].forEach(k => localStorage.removeItem(k));
    setRooms([]); setDevices([]); setConsumptions([]); setBills([]); setWaterBills([]);
    setActiveTab('dashboard');
  };

  const handleLoadDemoData = () => {
    setRooms(getDemoRooms());
    setDevices(getDemoDevices());
    setConsumptions(getDemoConsumptions(settings.unitPrice));
    setBills(getDemoBills());
    setActiveTab('dashboard');
  };

  const handleImportData = (data: {
    rooms: Room[]; devices: Device[]; consumptions: Consumption[];
    bills: Bill[]; waterBills?: WaterBill[]; settings: AppSettings;
  }) => {
    setRooms(data.rooms);
    setDevices(data.devices);
    setConsumptions(data.consumptions);
    setBills(data.bills);
    if (data.waterBills) setWaterBills(data.waterBills);
    setSettings(data.settings);
  };

  // ── 4. RENDER ─────────────────────────────────────────────────────────────
  if (!settings.firstLaunchCompleted) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div
      id="app-root"
      className="min-h-dvh flex flex-col font-sans bg-[#faf7f4] text-stone-900 dark:bg-stone-950 dark:text-stone-50"
    >
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col relative px-4 pb-2 pt-safe" style={{ paddingTop: `max(1.25rem, env(safe-area-inset-top, 0px))` }}>
        <div className="flex-1">
          {showAddConsumption ? (
            <AddConsumption
              rooms={rooms}
              devices={devices}
              defaultUnitPrice={settings.unitPrice}
              currency={settings.currency}
              onAddConsumption={handleAddConsumption}
              onClose={() => setShowAddConsumption(false)}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  rooms={rooms}
                  devices={devices}
                  consumptions={consumptions}
                  bills={bills}
                  settings={settings}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenAddConsumption={() => setShowAddConsumption(true)}
                />
              )}
              {activeTab === 'rooms' && (
                <Rooms
                  rooms={rooms}
                  devices={devices}
                  consumptions={consumptions}
                  currency={settings.currency}
                  onAddRoom={handleAddRoom}
                  onEditRoom={handleEditRoom}
                  onDeleteRoom={handleDeleteRoom}
                />
              )}
              {activeTab === 'devices' && (
                <Devices
                  rooms={rooms}
                  devices={devices}
                  consumptions={consumptions}
                  currency={settings.currency}
                  onAddDevice={handleAddDevice}
                  onEditDevice={handleEditDevice}
                  onDeleteDevice={handleDeleteDevice}
                  onToggleActive={handleToggleActive}
                  onToggleFavorite={handleToggleFavorite}
                  onDeleteConsumption={handleDeleteConsumption}
                  onEditConsumption={handleEditConsumption}
                  defaultUnitPrice={settings.unitPrice}
                />
              )}
              {activeTab === 'bills' && (
                <Bills
                  bills={bills}
                  currency={settings.currency}
                  onAddBill={handleAddBill}
                  onEditBill={handleEditBill}
                  onDeleteBill={handleDeleteBill}
                  onTogglePaid={handleTogglePaid}
                />
              )}
              {activeTab === 'water' && (
                <WaterTracker
                  waterBills={waterBills}
                  currency={settings.currency}
                  onAddWaterBill={handleAddWaterBill}
                  onEditWaterBill={handleEditWaterBill}
                  onDeleteWaterBill={handleDeleteWaterBill}
                  onToggleWaterPaid={handleToggleWaterPaid}
                />
              )}
              {activeTab === 'analytics' && (
                <Analytics
                  rooms={rooms}
                  devices={devices}
                  consumptions={consumptions}
                  currency={settings.currency}
                  unitPrice={settings.unitPrice}
                  co2Factor={settings.co2Factor ?? 0.47}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsPanel
                  settings={settings}
                  rooms={rooms}
                  devices={devices}
                  consumptions={consumptions}
                  bills={bills}
                  waterBills={waterBills}
                  onUpdateSettings={(vals) => setSettings({ ...settings, ...vals })}
                  onResetData={handleResetData}
                  onLoadDemoData={handleLoadDemoData}
                  onImportData={handleImportData}
                />
              )}
            </>
          )}
        </div>
      </div>

      {!showAddConsumption && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}
