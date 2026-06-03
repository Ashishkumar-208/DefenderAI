import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = {
  cyan: '#00E5FF',
  red: '#EF4444',
  amber: '#F59E0B',
  green: '#22C55E',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  indigo: '#6366F1'
};

const PIE_COLORS = [
  CHART_COLORS.cyan,
  CHART_COLORS.purple,
  CHART_COLORS.red,
  CHART_COLORS.amber,
  CHART_COLORS.blue,
  CHART_COLORS.green,
  CHART_COLORS.indigo
];

export const ActivityGraph = ({ trendData }) => {
  // Map data to combine trends for Recharts
  const mergedData = trendData?.map((item, idx) => {
    return {
      date: item.date,
      Threats: item.count,
      Alerts: item.count * 0.4, // Fallback/default logic will mock slightly
      Incidents: item.count * 0.15
    };
  }) || [];

  // Re-map actual trend sets if passed fully
  const parsedData = trendData || [];

  return (
    <div className="w-full h-80 bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-lg">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-200">Incident & Threat Progression (Last 30 Days)</h4>
        <p className="text-xs text-gray-500">Timeline of detected scans, high-severity alerts, and assigned tickets</p>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={parsedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAlert" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.red} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={CHART_COLORS.red} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
              labelStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
              itemStyle={{ color: '#9CA3AF' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Area 
              type="monotone" 
              dataKey="count" 
              name="Threat Vector Hits"
              stroke={CHART_COLORS.cyan} 
              fillOpacity={1} 
              fill="url(#colorThreat)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const ThreatDistribution = ({ distData }) => {
  const data = distData?.length ? distData : [
    { name: 'Brute Force', value: 400 },
    { name: 'SQL Injection', value: 300 },
    { name: 'Port Scanning', value: 200 },
    { name: 'XSS', value: 100 }
  ];

  return (
    <div className="w-full h-80 bg-brand-cards border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-semibold text-gray-200">Vulnerability Classification</h4>
        <p className="text-xs text-gray-500">Distribution of triggered security rules by payload vector</p>
      </div>
      <div className="flex items-center justify-around h-60">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                itemStyle={{ color: '#E5E7EB' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
              <span className="text-xs text-gray-300 font-medium truncate w-24">{item.name}</span>
              <span className="text-[10px] font-mono bg-gray-900 px-1.5 py-0.5 rounded text-gray-400">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
