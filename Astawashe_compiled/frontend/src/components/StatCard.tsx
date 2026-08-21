import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  color: 'blue' | 'emerald' | 'amber' | 'red';
  delay?: number;
  darkMode?: boolean;
}

const colorMap = {
  blue: {
    bg: 'from-blue-50 to-sky-50',
    border: 'border-l-blue-500',
    icon: 'bg-blue-100 text-blue-600',
    trend: 'text-blue-600',
    dark: 'from-blue-900/30 to-sky-900/30',
  },
  emerald: {
    bg: 'from-emerald-50 to-green-50',
    border: 'border-l-emerald-500',
    icon: 'bg-emerald-100 text-emerald-600',
    trend: 'text-emerald-600',
    dark: 'from-emerald-900/30 to-green-900/30',
  },
  amber: {
    bg: 'from-amber-50 to-yellow-50',
    border: 'border-l-amber-500',
    icon: 'bg-amber-100 text-amber-600',
    trend: 'text-amber-600',
    dark: 'from-amber-900/30 to-yellow-900/30',
  },
  red: {
    bg: 'from-red-50 to-rose-50',
    border: 'border-l-red-500',
    icon: 'bg-red-100 text-red-600',
    trend: 'text-red-600',
    dark: 'from-red-900/30 to-rose-900/30',
  },
};

export default function StatCard({
  title, value, icon, trend, trendUp, color, delay = 0, darkMode = false
}: StatCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className={`rounded-2xl p-5 border-l-4 ${c.border} bg-gradient-to-br ${
        darkMode ? c.dark : c.bg
      } shadow-sm hover:shadow-md transition-all duration-300 cursor-default`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
            darkMode ? 'text-slate-400' : 'text-gray-500'
          }`}>{title}</p>
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring' }}
            className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
          >
            {value}
          </motion.p>
          {trend && (
            <p className={`text-xs mt-1 font-medium ${c.trend}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.icon} flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
