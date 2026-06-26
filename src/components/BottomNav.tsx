import React from 'react';
import { LayoutDashboard, Home, PlugZap, FileSpreadsheet, BarChart3, Settings, Droplets } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: 'dashboard', label: 'Panel',    icon: LayoutDashboard },
  { id: 'rooms',     label: 'Odalar',   icon: Home            },
  { id: 'devices',   label: 'Cihazlar', icon: PlugZap         },
  { id: 'bills',     label: 'Fatura',   icon: FileSpreadsheet },
  { id: 'water',     label: 'Su',       icon: Droplets        },
  { id: 'analytics', label: 'Analiz',   icon: BarChart3       },
  { id: 'settings',  label: 'Ayarlar',  icon: Settings        },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => (
  <nav className="sticky bottom-0 z-40 border-t border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl pb-safe">
    <div className="max-w-md mx-auto px-1 h-[3.5rem] flex items-stretch justify-between">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 relative focus:outline-none"
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-amber-500 rounded-b-full" />
            )}
            <Icon
              size={18}
              className={active
                ? 'text-amber-500'
                : 'text-stone-400 dark:text-stone-500'}
            />
            <span className={`text-[9px] font-bold leading-none ${
              active
                ? 'text-amber-500'
                : 'text-stone-400 dark:text-stone-500'
            }`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);
