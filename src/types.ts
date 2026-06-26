export interface Room {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: number;
}

export interface Device {
  id: string;
  roomId: string;
  name: string;
  type: string;
  smartPlugName?: string;
  averageWatt?: number;
  note?: string;
  isActive: boolean;
  createdAt: number;
  isFavorite?: boolean;
  // Klima özel alanları
  acBtu?: 9000 | 12000 | 18000 | 24000;
  acEnergyClass?: 'A+' | 'A++' | 'A+++';
  acIsInverter?: boolean;
  // Şofben özel alanları
  heaterPowerKw?: 3 | 4 | 5;
}

export interface Consumption {
  id: string;
  deviceId: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  kwh: number;
  unitPrice: number;
  totalCost: number;
  note?: string;
  createdAt: number;
}

export interface Bill {
  id: string;
  month: number; // 1-12
  year: number;
  totalKwh: number;
  totalAmount: number;
  dueDate: string;
  isPaid: boolean;
  note?: string;
  createdAt: number;
}

export interface WaterBill {
  id: string;
  month: number; // 1-12
  year: number;
  cubicMeters: number; // m³
  totalAmount: number;
  dueDate: string;
  isPaid: boolean;
  note?: string;
  createdAt: number;
}

export interface AppSettings {
  unitPrice: number;
  currency: string;
  themeMode: 'light' | 'dark';
  firstLaunchCompleted: boolean;
  monthlyBudget?: number;
  consumptionTargetKwh?: number;
  githubRepo?: string;
}

// ─── Cihaz Tipleri ───────────────────────────────────────────────────────────
export const DEVICE_TYPES = [
  { id: 'Televizyon',        label: 'Televizyon',            icon: 'Tv',           defaultWatt: 120  },
  { id: 'Buzdolabı',         label: 'Buzdolabı',             icon: 'Refrigerator', defaultWatt: 150  },
  { id: 'Çamaşır Makinesi',  label: 'Çamaşır Makinesi',      icon: 'WashingMachine', defaultWatt: 2000 },
  { id: 'Bulaşık Makinesi',  label: 'Bulaşık Makinesi',      icon: 'Waves',        defaultWatt: 1800 },
  { id: 'Klima',             label: 'Klima',                 icon: 'Wind',         defaultWatt: 900  },
  { id: 'Bilgisayar',        label: 'Masaüstü Bilgisayar',   icon: 'Cpu',          defaultWatt: 450  },
  { id: 'Laptop',            label: 'Laptop',                icon: 'Laptop',       defaultWatt: 65   },
  { id: 'Kombi',             label: 'Kombi',                 icon: 'Flame',        defaultWatt: 1200 },
  { id: 'Şofben',            label: 'Şofben (Anlık)',         icon: 'Thermometer',  defaultWatt: 4000 },
  { id: 'Fırın',             label: 'Fırın / Ocak',          icon: 'CookingPot',   defaultWatt: 2500 },
  { id: 'Çay Makinesi',      label: 'Çay Makinesi / Kettle', icon: 'Coffee',       defaultWatt: 2000 },
  { id: 'Kahve Makinesi',    label: 'Kahve Makinesi',        icon: 'Coffee',       defaultWatt: 1200 },
  { id: 'Aydınlatma',        label: 'Genel Aydınlatma',      icon: 'Lightbulb',    defaultWatt: 60   },
  { id: 'LED Ampul',         label: 'LED Ampul',             icon: 'Lightbulb',    defaultWatt: 9    },
  { id: 'Şarj Cihazı',       label: 'Şarj Cihazı',           icon: 'PlugZap',      defaultWatt: 25   },
  { id: 'Modem',             label: 'Modem / Router',        icon: 'Wifi',         defaultWatt: 10   },
  { id: 'Ses Sistemi',       label: 'Ses Sistemi',           icon: 'Volume2',      defaultWatt: 50   },
  { id: 'Akıllı Priz',       label: 'Akıllı Priz',           icon: 'ToggleRight',  defaultWatt: 10   },
  { id: 'Diğer',             label: 'Diğer',                 icon: 'Radio',        defaultWatt: 100  },
];

// Inverter klima – ortalama saatlik tüketim (kW) – kompresör ~%60 yükte
export const AC_CONSUMPTION_KW: Record<string, Record<string, number>> = {
  "9000":  { "A+": 0.45, "A++": 0.40, "A+++": 0.35 },
  "12000": { "A+": 0.65, "A++": 0.60, "A+++": 0.50 },
  "18000": { "A+": 1.00, "A++": 0.90, "A+++": 0.80 },
  "24000": { "A+": 1.40, "A++": 1.25, "A+++": 1.10 },
};

export const ROOM_ICONS = [
  { name: 'Sofa',      label: 'Salon'         },
  { name: 'ChefHat',   label: 'Mutfak'        },
  { name: 'BedDouble', label: 'Yatak Odası'   },
  { name: 'Baby',      label: 'Çocuk Odası'   },
  { name: 'Bath',      label: 'Banyo'         },
  { name: 'Briefcase', label: 'Çalışma Odası' },
  { name: 'Home',      label: 'Diğer'         },
];

export const ROOM_COLORS = [
  { name: 'Elektrik Mavisi', class: 'bg-blue-500',    textClass: 'text-blue-500',    hex: '#3b82f6' },
  { name: 'Zümrüt Yeşili',   class: 'bg-emerald-500', textClass: 'text-emerald-500', hex: '#10b981' },
  { name: 'Neon Menekşe',    class: 'bg-violet-500',  textClass: 'text-violet-500',  hex: '#8b5cf6' },
  { name: 'Sıcak Turuncu',   class: 'bg-amber-500',   textClass: 'text-amber-500',   hex: '#f59e0b' },
  { name: 'Gül Pembesi',     class: 'bg-rose-500',    textClass: 'text-rose-500',    hex: '#f43f5e' },
  { name: 'Füzyon Siyan',    class: 'bg-cyan-500',    textClass: 'text-cyan-500',    hex: '#06b6d4' },
  { name: 'Gümüş Gri',       class: 'bg-slate-500',   textClass: 'text-slate-500',   hex: '#64748b' },
];
