import React from 'react';
import { LayoutDashboard, BookOpen, PlusCircle, BarChart3, Settings } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kasbon', label: 'Kasbon', icon: BookOpen },
    { id: 'tambah', label: 'Tambah', icon: PlusCircle, isCenter: true },
    { id: 'laporan', label: 'Laporan', icon: BarChart3 },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
      <div className="max-w-md mx-auto flex justify-between items-center px-4 h-16">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                id={`nav-tab-${item.id}`}
                className="relative -top-5 flex flex-col items-center justify-center w-14 h-14 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-700 transition-transform active:scale-95 focus:outline-none"
              >
                <IconComponent className="w-7 h-7" />
                <span className="sr-only">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              id={`nav-tab-${item.id}`}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium focus:outline-none transition-colors ${
                isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <IconComponent className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
