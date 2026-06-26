/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room, Device, Consumption, Bill } from '../types';

export const getDemoRooms = (): Room[] => [
  { id: 'room-1', name: 'Salon', icon: 'Sofa', color: '#3b82f6', createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
  { id: 'room-2', name: 'Mutfak', icon: 'ChefHat', color: '#10b981', createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
  { id: 'room-3', name: 'Yatak Odası', icon: 'BedDouble', color: '#8b5cf6', createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
  { id: 'room-4', name: 'Çalışma Odası', icon: 'Briefcase', color: '#06b6d4', createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 }
];

export const getDemoDevices = (): Device[] => [
  // Salon
  { id: 'device-1', roomId: 'room-1', name: 'Televizyon', type: 'Televizyon', averageWatt: 120, isActive: true, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, isFavorite: true },
  { id: 'device-2', roomId: 'room-1', name: 'Klima', type: 'Klima', averageWatt: 1500, isActive: true, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, isFavorite: true },
  { id: 'device-3', roomId: 'room-1', name: 'Akıllı Priz Salon', type: 'Akıllı Priz', averageWatt: 10, isActive: true, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
  
  // Mutfak
  { id: 'device-4', roomId: 'room-2', name: 'Buzdolabı', type: 'Buzdolabı', averageWatt: 300, isActive: true, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, isFavorite: true },
  { id: 'device-5', roomId: 'room-2', name: 'Bulaşık Makinesi', type: 'Bulaşık Makinesi', averageWatt: 1800, isActive: true, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
  
  // Çalışma Odası
  { id: 'device-6', roomId: 'room-4', name: 'Bilgisayar', type: 'Bilgisayar', averageWatt: 450, isActive: true, createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, isFavorite: true }
];

export const getDemoConsumptions = (unitPrice: number = 3.25): Consumption[] => {
  const list: Consumption[] = [];
  const now = new Date();
  
  // Create historical data for last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    
    // Salon TV: runs ~4 hours daily (0.48 kWh)
    list.push({
      id: `c-tv-${i}`,
      deviceId: 'device-1',
      roomId: 'room-1',
      date: dateStr,
      kwh: parseFloat((0.48 + Math.random() * 0.1).toFixed(2)),
      unitPrice,
      totalCost: 0, // Calculated below
      createdAt: d.getTime()
    });
    
    // Salon Klima: runs more on hot days (e.g., weekends, ~6 hours = 9 kWh, weekdays ~2 hours = 3 kWh)
    const klimaHours = (dayOfWeek === 0 || dayOfWeek === 6) ? 5 + Math.random() * 3 : 1 + Math.random() * 2;
    list.push({
      id: `c-klima-${i}`,
      deviceId: 'device-2',
      roomId: 'room-1',
      date: dateStr,
      kwh: parseFloat((klimaHours * 1.5).toFixed(2)),
      unitPrice,
      totalCost: 0,
      createdAt: d.getTime()
    });

    // Buzdolabı: runs continuously (24 hours * 0.1kW average duty cycle = 2.4 kWh daily)
    list.push({
      id: `c-ref-${i}`,
      deviceId: 'device-4',
      roomId: 'room-2',
      date: dateStr,
      kwh: parseFloat((2.4 + Math.random() * 0.4).toFixed(2)),
      unitPrice,
      totalCost: 0,
      createdAt: d.getTime()
    });

    // Bilgisayar: runs ~6 hours daily (0.45kW * 6 = 2.7 kWh)
    const pcHours = (dayOfWeek === 0 || dayOfWeek === 6) ? 8 : 5;
    list.push({
      id: `c-pc-${i}`,
      deviceId: 'device-6',
      roomId: 'room-4',
      date: dateStr,
      kwh: parseFloat((pcHours * 0.45).toFixed(2)),
      unitPrice,
      totalCost: 0,
      createdAt: d.getTime()
    });

    // Bulaşık makinesi: runs every 2 days (~1.8 kWh)
    if (i % 2 === 0) {
      list.push({
        id: `c-dish-${i}`,
        deviceId: 'device-5',
        roomId: 'room-2',
        date: dateStr,
        kwh: 1.8,
        unitPrice,
        totalCost: 0,
        createdAt: d.getTime()
      });
    }
  }

  // Calculate costs
  return list.map(c => ({
    ...c,
    totalCost: parseFloat((c.kwh * c.unitPrice).toFixed(2))
  }));
};

export const getDemoBills = (): Bill[] => {
  const year = new Date().getFullYear();
  return [
    {
      id: 'bill-1',
      month: 3,
      year,
      totalKwh: 240,
      totalAmount: 780.0,
      dueDate: `${year}-04-15`,
      isPaid: true,
      note: 'Zamanında ödendi.',
      createdAt: Date.now() - 80 * 24 * 60 * 60 * 1000
    },
    {
      id: 'bill-2',
      month: 4,
      year,
      totalKwh: 265,
      totalAmount: 861.25,
      dueDate: `${year}-05-15`,
      isPaid: true,
      note: 'Zamanında ödendi.',
      createdAt: Date.now() - 50 * 24 * 60 * 60 * 1000
    },
    {
      id: 'bill-3',
      month: 5,
      year,
      totalKwh: 290,
      totalAmount: 942.5,
      dueDate: `${year}-06-15`,
      isPaid: false,
      note: 'Lütfen ödemeyi unutmayın.',
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000
    }
  ];
};
