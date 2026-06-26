/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Room, Device, Consumption, Bill, AppSettings } from './types';
import { Onboarding } from './components/Onboarding';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { Rooms } from './components/Rooms';
import { Devices } from './components/Devices';
import { AddConsumption } from './components/AddConsumption';
import { Bills } from './components/Bills';
import { Analytics } from './components/Analytics';
import { SettingsPanel } from './components/Settings';
import { getDemoRooms, getDemoDevices, getDemoConsumptions, getDemoBills } from './data/mockData';

export default function App() {
  // 1. STATE INITIALIZATION WITH STORAGE SYNC
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('wattly_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      unitPrice: 3.25,
      currency: 'TL',
      themeMode: 'dark',
      firstLaunchCompleted: false
    };
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

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showAddConsumption, setShowAddConsumption] = useState<boolean>(false);

  // 2. STORAGE SYNCHRONIZATION EFFECT
  useEffect(() => {
    localStorage.setItem('wattly_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('wattly_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('wattly_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('wattly_consumptions', JSON.stringify(consumptions));
  }, [consumptions]);

  useEffect(() => {
    localStorage.setItem('wattly_bills', JSON.stringify(bills));
  }, [bills]);

  // Apply general class name for light/dark theme styling
  const isDark = settings.themeMode === 'dark';

  // 3. CALLBACK HANDLERS
  const handleCompleteOnboarding = (price: number, loadDemo: boolean) => {
    const updatedSettings: AppSettings = {
      ...settings,
      unitPrice: price,
      firstLaunchCompleted: true
    };
    setSettings(updatedSettings);

    if (loadDemo) {
      setRooms(getDemoRooms());
      setDevices(getDemoDevices());
      setConsumptions(getDemoConsumptions(price));
      setBills(getDemoBills());
    }
  };

  // ROOM MANAGEMENTS
  const handleAddRoom = (name: string, icon: string, color: string) => {
    const newRoom: Room = {
      id: 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name,
      icon,
      color,
      createdAt: Date.now()
    };
    setRooms([...rooms, newRoom]);
  };

  const handleEditRoom = (id: string, name: string, icon: string, color: string) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, name, icon, color } : r));
  };

  const handleDeleteRoom = (id: string) => {
    // 1. Remove Room
    setRooms(rooms.filter(r => r.id !== id));
    // 2. Cascade delete: Find all devices associated with this room
    const devicesToDelete = devices.filter(d => d.roomId === id);
    const deviceIdsToDelete = devicesToDelete.map(d => d.id);
    
    setDevices(devices.filter(d => d.roomId !== id));
    // 3. Cascade delete consumptions linked to those devices/rooms
    setConsumptions(consumptions.filter(c => c.roomId !== id && !deviceIdsToDelete.includes(c.deviceId)));
  };

  // DEVICE MANAGEMENTS
  const handleAddDevice = (
    roomId: string,
    name: string,
    type: string,
    smartPlugName?: string,
    averageWatt?: number,
    note?: string
  ) => {
    const newDevice: Device = {
      id: 'device-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      roomId,
      name,
      type,
      smartPlugName,
      averageWatt,
      note,
      isActive: true,
      createdAt: Date.now(),
      isFavorite: false
    };
    setDevices([...devices, newDevice]);
  };

  const handleEditDevice = (
    id: string,
    roomId: string,
    name: string,
    type: string,
    smartPlugName?: string,
    averageWatt?: number,
    note?: string
  ) => {
    setDevices(devices.map(d => d.id === id ? { ...d, roomId, name, type, smartPlugName, averageWatt, note } : d));
  };

  const handleDeleteDevice = (id: string) => {
    // 1. Remove Device
    setDevices(devices.filter(d => d.id !== id));
    // 2. Cascade delete consumptions associated with this device
    setConsumptions(consumptions.filter(c => c.deviceId !== id));
  };

  const handleToggleActive = (id: string) => {
    setDevices(devices.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d));
  };

  const handleToggleFavorite = (id: string) => {
    setDevices(devices.map(d => d.id === id ? { ...d, isFavorite: !d.isFavorite } : d));
  };

  // CONSUMPTION MANAGEMENTS
  const handleAddConsumption = (
    deviceId: string,
    roomId: string,
    date: string,
    kwh: number,
    unitPrice: number,
    totalCost: number,
    note?: string
  ) => {
    const newConsumption: Consumption = {
      id: 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      deviceId,
      roomId,
      date,
      kwh,
      unitPrice,
      totalCost,
      note,
      createdAt: Date.now()
    };
    setConsumptions([newConsumption, ...consumptions]);
  };

  const handleDeleteConsumption = (id: string) => {
    setConsumptions(consumptions.filter(c => c.id !== id));
  };

  // BILL MANAGEMENTS
  const handleAddBill = (
    month: number,
    year: number,
    totalKwh: number,
    totalAmount: number,
    dueDate: string,
    isPaid: boolean,
    note?: string
  ) => {
    const newBill: Bill = {
      id: 'bill-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      month,
      year,
      totalKwh,
      totalAmount,
      dueDate,
      isPaid,
      note,
      createdAt: Date.now()
    };
    setBills([newBill, ...bills]);
  };

  const handleEditBill = (
    id: string,
    month: number,
    year: number,
    totalKwh: number,
    totalAmount: number,
    dueDate: string,
    isPaid: boolean,
    note?: string
  ) => {
    setBills(bills.map(b => b.id === id ? { ...b, month, year, totalKwh, totalAmount, dueDate, isPaid, note } : b));
  };

  const handleDeleteBill = (id: string) => {
    setBills(bills.filter(b => b.id !== id));
  };

  const handleTogglePaid = (id: string) => {
    setBills(bills.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b));
  };

  // DATA MANAGEMENT ACTIONS
  const handleResetData = () => {
    localStorage.removeItem('wattly_rooms');
    localStorage.removeItem('wattly_devices');
    localStorage.removeItem('wattly_consumptions');
    localStorage.removeItem('wattly_bills');
    
    setRooms([]);
    setDevices([]);
    setConsumptions([]);
    setBills([]);
    setActiveTab('dashboard');
  };

  const handleLoadDemoData = () => {
    setRooms(getDemoRooms());
    setDevices(getDemoDevices());
    setConsumptions(getDemoConsumptions(settings.unitPrice));
    setBills(getDemoBills());
    triggerLocalStatusRefresh();
  };

  const handleImportData = (data: {
    rooms: Room[];
    devices: Device[];
    consumptions: Consumption[];
    bills: Bill[];
    settings: AppSettings;
  }) => {
    setRooms(data.rooms);
    setDevices(data.devices);
    setConsumptions(data.consumptions);
    setBills(data.bills);
    setSettings(data.settings);
  };

  const triggerLocalStatusRefresh = () => {
    setActiveTab('dashboard');
  };

  // 4. RENDERING SHELL
  if (!settings.firstLaunchCompleted) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div 
      id="app-root" 
      className={`min-h-screen flex flex-col transition-colors duration-300 font-sans ${
        isDark ? 'bg-slate-950 text-white' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Outer gradient decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.04),transparent_50%)] pointer-events-none" />

      {/* Main Smartphone Shell View Wrapper */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col relative px-4 pt-6 pb-2">
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
              {activeTab === 'analytics' && (
                <Analytics
                  rooms={rooms}
                  devices={devices}
                  consumptions={consumptions}
                  currency={settings.currency}
                  unitPrice={settings.unitPrice}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsPanel
                  settings={settings}
                  rooms={rooms}
                  devices={devices}
                  consumptions={consumptions}
                  bills={bills}
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

      {/* Persistent Bottom Bar (always present unless active screen is Add Consumption) */}
      {!showAddConsumption && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}
