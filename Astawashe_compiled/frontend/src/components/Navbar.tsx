import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Search, ChevronDown } from 'lucide-react';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Welcome back, Dr. Lemlem 👋' },
  '/register-patient': { title: 'Register Patient', subtitle: 'Add a new patient to the system' },
  '/patient-status': { title: 'Patient Status', subtitle: 'Monitor medication adherence' },
  '/alerts': { title: 'Alert System', subtitle: 'Emergency notifications & alerts' },
  '/chatbot': { title: 'AI Assistant', subtitle: 'Multilingual healthcare AI' },
  '/landing': { title: 'AstaWashe', subtitle: 'Smart Medication Reminder System' },
};

interface NavbarProps {
  darkMode: boolean;
}

export default function Navbar({ darkMode }: NavbarProps) {
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: 'AstaWashe', subtitle: '' };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`flex items-center justify-between px-6 py-4 border-b ${
        darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-gray-100'
      } backdrop-blur-md sticky top-0 z-30`}
    >
      <div className="ml-10 md:ml-0">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{page.title}</h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border ${
          darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}>
          <Search size={16} />
          <input
            placeholder="Search patients..."
            className="bg-transparent text-sm outline-none w-48 placeholder-gray-400"
          />
        </div>

        {/* Notification bell */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 bg-red-50 rounded-xl text-red-500 hover:bg-red-100 transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </motion.button>

        {/* Profile */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer border ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            LH
          </div>
          <div className="hidden md:block">
            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Dr. Lemlem</p>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Health Worker</p>
          </div>
          <ChevronDown size={14} className={darkMode ? 'text-slate-400' : 'text-gray-500'} />
        </motion.div>
      </div>
    </motion.header>
  );
}
