import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Bell, MessageSquare,
  Heart, ChevronLeft, ChevronRight, Activity,
  LogOut, Moon, Sun, X, Menu
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/register-patient', label: 'Register Patient', icon: Users },
  { path: '/patient-status', label: 'Patient Status', icon: Activity },
  { path: '/alerts', label: 'Alert System', icon: Bell },
  { path: '/chatbot', label: 'AI Assistant', icon: MessageSquare },
];

interface SidebarProps {
  darkMode: boolean;
  toggleDark: () => void;
}

export default function Sidebar({ darkMode, toggleDark }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const SidebarContent = () => (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'} transition-colors duration-300`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
            <Heart size={20} className="text-white" />
          </div>
          <div className="live-dot absolute -top-1 -right-1"></div>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <h1 className="text-lg font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent whitespace-nowrap">
                AstaWashe
              </h1>
              <p className={`text-xs whitespace-nowrap ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Smart Medication System</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-md shadow-sky-200'
                    : darkMode
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {path === '/alerts' && !collapsed && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">3</span>
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={`px-3 py-4 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'} space-y-1`}>
        <button
          onClick={toggleDark}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all ${
            darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span className="text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <NavLink to="/auth">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
            darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-gray-600 hover:bg-gray-50'
          }`}>
            <LogOut size={20} />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </div>
        </NavLink>
      </div>

      {/* Collapse button (desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`hidden md:flex absolute right-0 translate-x-1/2 top-20 w-6 h-6 rounded-full items-center justify-center shadow-md border ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-600'
        } z-10 cursor-pointer`}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center"
      >
        <Menu size={20} className="text-gray-700" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="md:hidden fixed left-0 top-0 h-full w-72 z-50 relative"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.div
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:block relative flex-shrink-0 shadow-sm"
        style={{ height: '100vh' }}
      >
        <SidebarContent />
      </motion.div>
    </>
  );
}
