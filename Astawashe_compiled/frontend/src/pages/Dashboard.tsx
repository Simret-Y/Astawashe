import { motion } from 'framer-motion';
import { Users, Pill, AlertTriangle, Siren, Activity, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import StatCard from '../components/StatCard';
import { patients, adherenceData, activityFeed, stats } from '../data/mockData';

interface DashboardProps {
  darkMode: boolean;
}

const statusColors: Record<string, string> = {
  taken: 'bg-emerald-100 text-emerald-700',
  missed: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
};

const feedColors: Record<string, string> = {
  taken: 'bg-emerald-500',
  missed: 'bg-red-500',
  alert: 'bg-red-600',
  reminder: 'bg-sky-500',
};

export default function Dashboard({ darkMode }: DashboardProps) {
  const cardBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={<Users size={22} />}
          trend="12% this month"
          trendUp
          color="blue"
          delay={0}
          darkMode={darkMode}
        />
        <StatCard
          title="Active Medications"
          value={stats.activeMedications}
          icon={<Pill size={22} />}
          trend="8 new today"
          trendUp
          color="emerald"
          delay={0.1}
          darkMode={darkMode}
        />
        <StatCard
          title="Missed Doses"
          value={stats.missedDoses}
          icon={<AlertTriangle size={22} />}
          trend="3 more than yesterday"
          trendUp={false}
          color="amber"
          delay={0.2}
          darkMode={darkMode}
        />
        <StatCard
          title="Emergency Alerts"
          value={stats.emergencyAlerts}
          icon={<Siren size={22} />}
          trend="Requires attention"
          trendUp={false}
          color="red"
          delay={0.3}
          darkMode={darkMode}
        />
      </div>

      {/* Main content: Chart + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adherence Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`lg:col-span-2 rounded-2xl border p-6 shadow-sm ${cardBg}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-base font-bold ${textPrimary}`}>Medication Adherence</h3>
              <p className={`text-sm ${textSecondary}`}>7-day overview</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
              <TrendingUp size={14} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">87% avg</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={adherenceData}>
              <defs>
                <linearGradient id="takenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="missedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} />
              <XAxis dataKey="day" tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: darkMode ? '#1e293b' : '#fff',
                  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  color: darkMode ? '#e2e8f0' : '#1e293b',
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="taken" stroke="#10b981" fill="url(#takenGrad)" strokeWidth={2.5} name="Taken %" />
              <Area type="monotone" dataKey="missed" stroke="#ef4444" fill="url(#missedGrad)" strokeWidth={2.5} name="Missed %" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="live-dot"></div>
            <h3 className={`text-base font-bold ${textPrimary}`}>Live Activity</h3>
          </div>
          <div className="space-y-4">
            {activityFeed.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.07 }}
                className="flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-full ${feedColors[item.type]} flex items-center justify-center text-sm flex-shrink-0`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${textPrimary}`}>{item.patient}</p>
                  <p className={`text-xs truncate ${textSecondary}`}>{item.action}</p>
                  <p className="text-xs text-sky-500 mt-0.5">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Patient Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`rounded-2xl border shadow-sm overflow-hidden ${cardBg}`}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-sky-500" />
            <h3 className={`text-base font-bold ${textPrimary}`}>Recent Patient Activity</h3>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
            {patients.length} patients
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                {['Patient', 'Medication', 'Schedule', 'Status', 'Adherence', 'Last Activity'].map(h => (
                  <th key={h} className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  whileHover={{ backgroundColor: darkMode ? 'rgba(51,65,85,0.5)' : 'rgba(248,250,252,1)' }}
                  className={`transition-colors ${darkMode ? '' : ''}`}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: p.color }}
                      >
                        {p.avatar}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${textPrimary}`}>{p.name}</p>
                        <p className={`text-xs ${textSecondary}`}>{p.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className={`text-sm font-medium ${textPrimary}`}>{p.medication}</p>
                    <p className={`text-xs ${textSecondary}`}>{p.dosage}</p>
                  </td>
                  <td className={`px-6 py-3.5 text-sm ${textSecondary}`}>{p.time}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-20">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${p.adherence}%`,
                            background: p.adherence >= 80 ? '#10b981' : p.adherence >= 60 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${textSecondary}`}>{p.adherence}%</span>
                    </div>
                  </td>
                  <td className={`px-6 py-3.5 text-xs ${textSecondary}`}>{p.lastActivity}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
