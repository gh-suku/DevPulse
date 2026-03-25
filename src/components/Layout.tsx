import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Bell, ChevronRight, User, MoreVertical } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
  headerActions?: React.ReactNode;
  activeScreen?: string;
  onScreenChange?: (screen: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumb,
  headerActions,
  activeScreen,
  onScreenChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">
      {/* Shared Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeScreen={activeScreen}
        onScreenChange={onScreenChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors lg:hidden"
              aria-label="Toggle Sidebar"
            >
              <MoreVertical className="w-5 h-5 rotate-90" />
            </button>
            <div className="flex items-center text-sm text-gray-400">
              <span>Home</span>
              <ChevronRight className="w-4 h-4 mx-1" />
              <span className="text-gray-900 font-medium">{breadcrumb || title || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {headerActions}
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                3
              </span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">
                  {profile?.full_name || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500">{profile?.department || 'Employee'}</p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors cursor-pointer"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-gray-50/30 min-w-0">
          <div className="max-w-7xl mx-auto">
            {(title || subtitle) && (
              <div className="mb-6 md:mb-8">
                {title && (
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-gray-600 mt-1 text-sm md:text-base">{subtitle}</p>
                )}
              </div>
            )}
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="h-12 bg-white border-t border-gray-100 flex items-center justify-between px-8 text-xs text-gray-400">
          <p>© 2026 DevPulse AI. v1.0 Prototype</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-600">
              Docs
            </a>
            <a href="#" className="hover:text-gray-600">
              Privacy
            </a>
            <a href="#" className="hover:text-gray-600">
              Terms
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};
