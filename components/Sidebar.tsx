
import React from 'react';

type NavItem = 'dashboard' | 'accounts' | 'heirs' | 'vault' | 'ai';

interface SidebarProps {
  activeTab: NavItem;
  setActiveTab: (tab: NavItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const items: { id: NavItem; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '' },
    { id: 'accounts', label: 'Accounts', icon: '' },
    { id: 'heirs', label: 'Heirs', icon: '' },
    { id: 'vault', label: 'Vault', icon: '' },
    { id: 'ai', label: 'Legacy AI', icon: '' },
  ];

  return (
    <aside className="w-64 bg-white border-r h-full hidden md:flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
          <span className="p-2 bg-indigo-100 rounded-lg">🏛️</span>
          LegacyVault
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
            JD
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Chulsu Kim</p>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Premium Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
