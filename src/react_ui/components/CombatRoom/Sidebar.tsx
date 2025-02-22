import React from 'react';
import { Menu } from 'lucide-react';
import { NavItem, navigationItems } from '../../types/uiTypes';

interface SidebarProps {
    onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
    const [showSidebar, setShowSidebar] = React.useState(false);

    return (
        <div className={`${showSidebar ? 'w-48' : 'w-14'} bg-slate-900 text-white transition-all`}>
            <button 
                className="w-full p-4 hover:bg-slate-700 flex items-center justify-center"
                onClick={() => setShowSidebar(!showSidebar)}
            >
                <Menu size={20} />
            </button>
            
            <nav className="flex flex-col">
                {navigationItems.map((item) => (
                    <button
                        key={item.view}
                        onClick={() => onNavigate(item.view)}
                        className="p-4 hover:bg-slate-700 flex items-center gap-3"
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
