import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, CheckCircle2, AlertTriangle, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [quickNotifications, setQuickNotifications] = useState([]);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.get('/notifications?unread_only=true');
      setUnreadCount(res.data.length);
      setQuickNotifications(res.data.slice(0, 5));
    } catch (err) {
      console.error('Error fetching unread notifications:', err);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();
    // Poll notifications every 30 seconds for SOC realism
    const interval = setInterval(fetchUnreadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setQuickNotifications([]);
      setNotifDropdownOpen(false);
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'threat':
        return <AlertTriangle className="w-4 h-4 text-brand-danger" />;
      case 'incident':
        return <ShieldCheck className="w-4 h-4 text-brand-warning" />;
      case 'user':
        return <UserPlus className="w-4 h-4 text-brand-primary" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-brand-success" />;
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-brand-sidebar/85 backdrop-blur-md border-b border-gray-800/80 flex items-center justify-between px-6 z-30">
      {/* Mobile Toggle & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white md:hidden cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-sm font-semibold tracking-wider text-gray-300 select-none hidden sm:inline-block">
          SOC OPERATIONAL VIEWPORT
        </span>
      </div>

      {/* Utilities panel */}
      <div className="flex items-center gap-4">
        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="p-2 rounded-lg bg-gray-900/50 border border-gray-850 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-danger text-white rounded-full flex items-center justify-center text-[10px] font-bold border border-brand-sidebar animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Quick Notification Dropdown */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-brand-cards border border-gray-800 shadow-2xl py-2 z-50">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-800">
                <span className="text-xs font-semibold text-gray-200">System Alerts ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead} 
                    className="text-[10px] text-brand-primary hover:underline cursor-pointer"
                  >
                    Mark read all
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {quickNotifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-500">No new alerts to acknowledge</div>
                ) : (
                  quickNotifications.map((n) => (
                    <div 
                      key={n.notification_id} 
                      className="px-4 py-3 hover:bg-gray-800/40 border-b border-gray-800/40 flex items-start gap-2.5 transition-colors cursor-pointer"
                      onClick={() => {
                        navigate('/notifications');
                        setNotifDropdownOpen(false);
                      }}
                    >
                      <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium text-gray-300 truncate">{n.title}</p>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 pt-2 text-center border-t border-gray-800">
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setNotifDropdownOpen(false);
                  }}
                  className="w-full text-xs text-brand-primary font-medium hover:underline py-1 cursor-pointer"
                >
                  View Notification Center
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Context */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-900/50 border border-gray-850">
          <User className="w-4 h-4 text-brand-primary" />
          <div className="text-left leading-none">
            <span className="text-xs font-semibold text-gray-200 block leading-tight">{user?.username}</span>
            <span className="text-[9px] uppercase font-mono tracking-widest text-brand-primary block leading-none">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
