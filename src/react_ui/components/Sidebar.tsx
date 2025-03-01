import React from 'react';
import { Menu } from 'lucide-react';
import { navigationItems } from '../uiTypes';

interface SidebarProps {
  onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const [showSidebar, setShowSidebar] = React.useState(false);

  return (
    <div className={`${showSidebar ? 'w-48' : 'w-14'} bg-slate-900 text-white transition-all shadow-lg shadow-black/25`}>
      <button 
        className="w-full p-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 flex items-center justify-center relative
                border-[3px] border-white/50"
        onClick={() => setShowSidebar(!showSidebar)}
      >
        <Menu size={20} />
      </button>
      
      <nav className="flex flex-col">
        {navigationItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className="p-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 flex items-center gap-3 relative
                border-[3px] border-white/50"
          >
            <item.icon size={20} />
            {showSidebar && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
