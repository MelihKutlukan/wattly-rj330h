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
  <nav className="bg-slate-900/95 border-t border-slate-800/80 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.3)] sticky bottom-0 z-50 backdrop-blur-xl">
    <div className="max-w-md mx-auto px-1 h-[3.75rem] flex items-center justify-between">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 gap-0.5 relative focus:outline-none transition-all ${active ? 'scale-105' : 'scale-100'}`}
          >
            {active && (
              <span className="absolute top-1 w-8 h-5 bg-indigo-500/15 rounded-full -z-10" />
            )}
            <Icon
              size={18}
              className={`transition-all duration-200 ${active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            />
            <span className={`text-[9px] font-bold transition-all duration-200 leading-none ${active ? 'text-indigo-400' : 'text-slate-500'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  </nav>
);
