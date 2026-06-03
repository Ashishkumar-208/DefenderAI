import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Dashboard from '../pages/Dashboard';
import Logs from '../pages/Logs';
import Threats from '../pages/Threats';
import Incidents from '../pages/Incidents';
import AICopilot from '../pages/AICopilot';
import Reports from '../pages/Reports';
import Notifications from '../pages/Notifications';
import SettingsView from '../pages/Settings';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Console Dashboard Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/threats" element={<Threats />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/ai-copilot" element={<AICopilot />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<SettingsView />} />
        
        {/* Default catch-all redirect to console dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
