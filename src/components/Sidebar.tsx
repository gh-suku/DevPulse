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
import { cn } from '../lib/utils';

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
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

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
    // Close mobile menu after navigation
    setIsMobileOpen(false);
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.path === '/dashboard' && activeScreen) {
      return activeScreen === item.screen;
    }
    return location.pathname === item.path;
  };

  // Close mobile menu on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Mobile backdrop - Issue #71 */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside 
        className={cn(
          "bg-white border-r border-gray-100 transition-all duration-300 flex flex-col z-50 flex-shrink-0",
          // Desktop behavior
          "hidden lg:flex",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          // Mobile behavior - Issue #71: Overlay sidebar for mobile
          "lg:relative fixed inset-y-0 left-0",
          isMobileOpen ? "flex" : "hidden lg:flex",
          "w-64" // Always full width on mobile
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
    </>
  );
};
