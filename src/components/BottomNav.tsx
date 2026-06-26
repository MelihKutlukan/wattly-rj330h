/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, Home, PlugZap, FileSpreadsheet, BarChart3, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Ana Panel', icon: LayoutDashboard },
    { id: 'rooms', label: 'Odalar', icon: Home },
    { id: 'devices', label: 'Cihazlar', icon: PlugZap },
    { id: 'bills', label: 'Faturalar', icon: FileSpreadsheet },
    { id: 'analytics', label: 'Analiz', icon: BarChart3 },
    { id: 'settings', label: 'Ayarlar', icon: Settings }
  ];

  return (
    <div id="bottom-nav" className="bg-slate-900 border-t border-slate-800 pb-safe shadow-2xl sticky bottom-0 z-50">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-all relative focus:outline-none"
            >
              {/* Highlight background or indicator */}
              {isActive && (
                <span className="absolute top-1.5 w-10 h-6 bg-blue-500/15 rounded-full -z-10 animate-fade-in" />
              )}
              
              <Icon
                size={20}
                className={`transition-all duration-300 ${
                  isActive ? 'text-blue-500 scale-110' : 'text-slate-400 hover:text-slate-200'
                }`}
              />
              <span
                className={`text-[10px] mt-1 transition-all duration-300 ${
                  isActive ? 'text-blue-500 font-bold scale-105' : 'text-slate-400 font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
