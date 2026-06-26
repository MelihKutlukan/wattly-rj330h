/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Room {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // hex or tailwind class
  createdAt: number;
}

export interface Device {
  id: string;
  roomId: string;
  name: string;
  type: string; // e.g. Televizyon, Klima, Buzdolabı
  smartPlugName?: string;
  averageWatt?: number; // optional
  note?: string;
  isActive: boolean;
  createdAt: number;
  isFavorite?: boolean;
}

export interface Consumption {
  id: string;
  deviceId: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  kwh: number;
  unitPrice: number;
  totalCost: number; // kwh * unitPrice
  note?: string;
  createdAt: number;
}

export interface Bill {
  id: string;
  month: number; // 1-12
  year: number;
  totalKwh: number;
  totalAmount: number;
  dueDate: string; // YYYY-MM-DD
  isPaid: boolean;
  note?: string;
  createdAt: number;
}

export interface AppSettings {
  unitPrice: number; // Default 3.25 TL
  currency: string; // Default "TL"
  themeMode: 'light' | 'dark';
  firstLaunchCompleted: boolean;
  monthlyBudget?: number; // budget target
  consumptionTargetKwh?: number; // target kwh
}

export const DEVICE_TYPES = [
  { id: 'Televizyon', label: 'Televizyon', icon: 'Tv' },
  { id: 'Buzdolabı', label: 'Buzdolabı', icon: 'Refrigerator' },
  { id: 'Çamaşır Makinesi', label: 'Çamaşır Makinesi', icon: 'WashingMachine' },
  { id: 'Bulaşık Makinesi', label: 'Bulaşık Makinesi', icon: 'Waves' },
  { id: 'Klima', label: 'Klima', icon: 'Wind' },
  { id: 'Bilgisayar', label: 'Bilgisayar', icon: 'Cpu' },
  { id: 'Kombi', label: 'Kombi', icon: 'Flame' },
  { id: 'Fırın', label: 'Fırın', icon: 'CookingPot' },
  { id: 'Aydınlatma', label: 'Aydınlatma', icon: 'Lightbulb' },
  { id: 'Şarj Cihazı', label: 'Şarj Cihazı', icon: 'PlugZap' },
  { id: 'Akıllı Priz', label: 'Akıllı Priz', icon: 'ToggleRight' },
  { id: 'Diğer', label: 'Diğer', icon: 'Radio' }
];

export const ROOM_ICONS = [
  { name: 'Sofa', label: 'Salon' },
  { name: 'ChefHat', label: 'Mutfak' },
  { name: 'BedDouble', label: 'Yatak Odası' },
  { name: 'Baby', label: 'Çocuk Odası' },
  { name: 'Bath', label: 'Banyo' },
  { name: 'Briefcase', label: 'Çalışma Odası' },
  { name: 'Home', label: 'Diğer' }
];

export const ROOM_COLORS = [
  { name: 'Elektrik Mavisi', class: 'bg-blue-500', textClass: 'text-blue-500', hex: '#3b82f6' },
  { name: 'Zümrüt Yeşili', class: 'bg-emerald-500', textClass: 'text-emerald-500', hex: '#10b981' },
  { name: 'Neon Menekşe', class: 'bg-violet-500', textClass: 'text-violet-500', hex: '#8b5cf6' },
  { name: 'Sıcak Turuncu', class: 'bg-amber-500', textClass: 'text-amber-500', hex: '#f59e0b' },
  { name: 'Gül Pembesi', class: 'bg-rose-500', textClass: 'text-rose-500', hex: '#f43f5e' },
  { name: 'Füzyon Siyan', class: 'bg-cyan-500', textClass: 'text-cyan-500', hex: '#06b6d4' },
  { name: 'Gümüş Gri', class: 'bg-slate-500', textClass: 'text-slate-500', hex: '#64748b' }
];
