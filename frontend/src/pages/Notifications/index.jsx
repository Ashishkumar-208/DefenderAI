import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle2, AlertTriangle, ShieldCheck, UserPlus,
  Info, Eye, Trash2, CheckCircle, Loader2
} from 'lucide-react';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications?unread_only=${unreadOnly}`);
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve SOC notifications feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [unreadOnly]);

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/read/${id}`);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, read: true } : n));
      toast.success('Alert acknowledged.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked read.');
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'threat':
        return <AlertTriangle className="w-5 h-5 text-brand-danger" />;
      case 'incident':
        return <ShieldCheck className="w-5 h-5 text-brand-warning animate-pulse" />;
      case 'user':
        return <UserPlus className="w-5 h-5 text-brand-primary" />;
      default:
        return <Info className="w-5 h-5 text-brand-success" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-primary" />
            SOC Operational Alarm feed
          </h1>
          <p className="text-xs text-gray-500 mt-1">Audit audit warnings, new ticket assignments, and user logs registrations</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 px-4 py-2 bg-gray-900 border border-gray-800 hover:border-gray-750 text-xs font-semibold text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-brand-success" />
            Acknowledge All Alarms
          </button>
        )}
      </div>

      {/* Tabs / Filter switches */}
      <div className="flex gap-2">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${!unreadOnly ? 'bg-brand-primary text-black' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}
        >
          All System Alarms
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${unreadOnly ? 'bg-brand-primary text-black' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'}`}
        >
          Unacknowledged alerts
        </button>
      </div>

      {/* Main notifications queue */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          <span className="text-xs font-mono text-gray-500">Querying alarm buffers...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-brand-cards border border-gray-800 rounded-xl p-16 text-center text-gray-500 shadow-md">
          <CheckCircle2 className="w-10 h-10 text-brand-success mx-auto mb-2 opacity-60" />
          <h4 className="font-semibold text-gray-200">Alert feeds clear</h4>
          <p className="text-xs text-gray-500 mt-1">Operational view has no matching logs warning alarms.</p>
        </div>
      ) : (
        <div className="space-y-3.5 max-w-4xl">
          {notifications.map((n) => (
            <div 
              key={n.notification_id}
              className={`
                bg-brand-cards border rounded-xl p-4.5 shadow flex items-start gap-4 transition-all duration-200
                ${n.read ? 'border-gray-850 opacity-60' : 'border-gray-800/80 border-l-2 border-l-brand-primary hover:border-gray-700'}
              `}
            >
              <div className="p-2.5 bg-gray-900 border border-gray-850 rounded-lg">
                {getNotifIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                  <h4 className={`text-sm font-semibold truncate ${n.read ? 'text-gray-400' : 'text-gray-200'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] font-mono text-gray-500 shrink-0">
                    {formatDate(n.created_at)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{n.message}</p>
                
                {!n.read && (
                  <div className="flex justify-end mt-3 border-t border-gray-800/40 pt-3">
                    <button
                      onClick={() => handleMarkRead(n.notification_id)}
                      className="px-3 py-1 rounded border border-brand-success/30 bg-brand-success/5 hover:bg-brand-success hover:text-black font-semibold text-[10px] tracking-wide transition-colors cursor-pointer"
                    >
                      Acknowledge Alert
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
