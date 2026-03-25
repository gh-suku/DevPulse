import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Target, 
  BarChart3, 
  Settings, 
  Star,
  User,
  Users
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeScreen?: string;
  onScreenChange?: (screen: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  onToggleCollapse,
  activeScreen,
  onScreenChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', screen: 'dashboard' },
    { id: 'tracker', label: 'Daily Tracker', icon: Target, path: '/dashboard', screen: 'tracker' },
    { id: 'insights', label: 'Insights', icon: BarChart3, path: '/dashboard', screen: 'insights' },
    { id: 'community', label: 'Community', icon: Users, path: '/community' },
    { id: 'leaderboard', label: 'Leaderboard', icon: User, path: '/leaderboard' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/profile' },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.path === '/dashboard' && onScreenChange && item.screen) {
      // For dashboard screens, change the active screen
      onScreenChange(item.screen);
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
      }
    } else {
      // For other pages, navigate normally
      navigate(item.path);
    }
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.path === '/dashboard' && activeScreen) {
      return activeScreen === item.screen;
    }
    return location.pathname === item.path;
  };

  return (
    <aside 
      className={cn(
        "bg-white border-r border-gray-100 transition-all duration-300 flex flex-col z-20 flex-shrink-0",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <button 
        onClick={onToggleCollapse}
        className="p-6 flex items-center gap-3 w-full hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">D</div>
        {!isCollapsed && <span className="font-bold text-xl tracking-tight">DevPulse AI</span>}
      </button>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
              isActive(item)
                ? "bg-emerald-50 text-emerald-600" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive(item) ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600")} />
            {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
};
