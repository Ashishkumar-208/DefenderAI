import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileCode, 
  ShieldAlert, 
  AlertTriangle, 
  Cpu, 
  FileBarChart, 
  Bell, 
  Settings, 
  LogOut,
  Terminal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Logs', path: '/logs', icon: FileCode },
    { name: 'Threats', path: '/threats', icon: ShieldAlert },
    { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
    { name: 'AI Copilot', path: '/ai-copilot', icon: Cpu },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-brand-sidebar border-r border-gray-800/80 text-gray-400
        transition-transform duration-300 md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="flex items-center gap-2 h-16 px-6 border-b border-gray-800/80">
          <Terminal className="w-6 h-6 text-brand-primary animate-pulse" />
          <span className="text-xl font-bold tracking-wider text-white">
            DEFENDER<span className="text-brand-primary">AI</span>
          </span>
        </div>

        {/* User Card */}
        <div className="px-6 py-4 border-b border-gray-800/50 bg-gray-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center font-bold text-brand-primary">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-gray-200 truncate">{user?.username}</h4>
              <span className="text-xs uppercase tracking-wider text-brand-primary font-mono">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => window.innerWidth < 768 && toggleSidebar()}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium tracking-wide transition-all duration-200 group
                  ${isActive 
                    ? 'bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary shadow-[inset_4px_0_12px_rgba(0,229,255,0.05)]' 
                    : 'hover:bg-gray-800/50 hover:text-gray-200'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-brand-primary' : 'text-gray-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800/80">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg text-gray-500 hover:bg-brand-danger/10 hover:text-brand-danger transition-colors duration-200 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
