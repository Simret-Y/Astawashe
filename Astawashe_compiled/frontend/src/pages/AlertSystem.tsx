import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, MessageSquare, X, Bell, Siren, UserCheck, CheckCircle2, Clock } from 'lucide-react';

interface AlertSystemProps { darkMode: boolean; }

const alerts = [
  { id:1, patient:'Yonas Alemu', medication:'Amoxicillin 250mg', missedCount:3, phone:'+251 91 012 3456', guardian:'+251 92 123 4567', severity:'critical', time:'2 hrs ago', avatar:'YA', color:'#ef4444' },
  { id:2, patient:'Tigist Bekele', medication:'Lisinopril 10mg', missedCount:2, phone:'+251 93 456 7890', guardian:'+251 94 567 8901', severity:'high', time:'1 hr ago', avatar:'TB', color:'#f59e0b' },
  { id:3, patient:'Dawit Haile', medication:'Amlodipine 5mg', missedCount:1, phone:'+251 95 678 9012', guardian:'+251 96 789 0123', severity:'medium', time:'30 min ago', avatar:'DH', color:'#3b82f6' },
];

const severityConfig = {
  critical: { bg:'bg-red-50 border-red-200', badge:'bg-red-100 text-red-700', dot:'bg-red-500', label:'Critical', border:'border-l-red-500', darkBg:'bg-red-900/20' },
  high: { bg:'bg-amber-50 border-amber-200', badge:'bg-amber-100 text-amber-700', dot:'bg-amber-500', label:'High', border:'border-l-amber-500', darkBg:'bg-amber-900/20' },
  medium: { bg:'bg-blue-50 border-blue-200', badge:'bg-blue-100 text-blue-700', dot:'bg-blue-500', label:'Medium', border:'border-l-blue-500', darkBg:'bg-blue-900/20' },
};

export default function AlertSystem({ darkMode }: AlertSystemProps) {
  const [modalAlert, setModalAlert] = useState<typeof alerts[0]|null>(null);
  const [resolved, setResolved] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const cardBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100';

  const handleNotify = async () => {
    setSending(true);
    await new Promise(r=>setTimeout(r,1800));
    setSending(false);
    setSent(true);
    setTimeout(()=>{ setSent(false); setModalAlert(null); }, 2000);
  };

  const handleResolve = (id: number) => {
    setResolved(p=>[...p,id]);
    setModalAlert(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header banner */}
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }}
        className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-5 flex items-center gap-4 text-white shadow-lg shadow-red-200"
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Siren size={26}/></div>
        <div>
          <h2 className="text-xl font-bold">Alert System</h2>
          <p className="text-red-100 text-sm">{alerts.filter(a=>!resolved.includes(a.id)).length} active alerts require attention</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl">
          <Bell size={16}/>
          <span className="font-bold text-lg">{alerts.filter(a=>!resolved.includes(a.id)).length}</span>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Critical Alerts', value:1, color:'text-red-600', bg:'bg-red-50' },
          { label:'High Priority', value:1, color:'text-amber-600', bg:'bg-amber-50' },
          { label:'Medium', value:1, color:'text-blue-600', bg:'bg-blue-50' },
        ].map(s=>(
          <motion.div key={s.label} whileHover={{ y:-2 }} className={`rounded-2xl p-5 text-center ${darkMode?'bg-slate-800 border border-slate-700':s.bg} shadow-sm`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className={`text-xs font-semibold mt-1 ${darkMode?'text-slate-400':'text-gray-600'}`}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {alerts.map((alert,i)=>{
            const cfg = severityConfig[alert.severity as keyof typeof severityConfig];
            const isResolved = resolved.includes(alert.id);
            return (
              <motion.div key={alert.id} layout initial={{ opacity:0,x:-20 }} animate={{ opacity: isResolved?0.5:1, x:0 }} transition={{ delay:i*0.1 }}
                className={`rounded-2xl border-l-4 ${cfg.border} border p-5 transition-all ${darkMode ? `${cardBg} ${cfg.darkBg}` : cfg.bg}`}
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background:alert.color }}>{alert.avatar}</div>
                      {!isResolved && <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${cfg.dot} border-2 border-white`}/>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold ${darkMode?'text-white':'text-gray-900'}`}>{alert.patient}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>{cfg.label}</span>
                        {isResolved && <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Resolved</span>}
                      </div>
                      <p className={`text-sm ${darkMode?'text-slate-300':'text-gray-700'}`}>
                        Missed <strong className="text-red-600">{alert.medication}</strong> · {alert.missedCount}x missed
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className={darkMode?'text-slate-400':'text-gray-500'}><Phone size={11} className="inline mr-1"/>{alert.phone}</span>
                        <span className={darkMode?'text-slate-400':'text-gray-500'}><Clock size={11} className="inline mr-1"/>{alert.time}</span>
                      </div>
                    </div>
                  </div>
                  {!isResolved && (
                    <div className="flex items-center gap-2">
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={()=>setModalAlert(alert)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        <AlertTriangle size={15}/> Notify & Alert
                      </motion.button>
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={()=>handleResolve(alert.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${darkMode?'border-slate-600 text-slate-300 hover:bg-slate-700':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        Resolve
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Guardian SMS badge */}
                {!isResolved && (
                  <div className={`mt-4 flex items-center gap-3 p-3 rounded-xl ${darkMode?'bg-slate-700/50':'bg-white/60'} border ${darkMode?'border-slate-600':'border-white'}`}>
                    <MessageSquare size={15} className="text-sky-500 flex-shrink-0"/>
                    <span className={`text-xs ${darkMode?'text-slate-300':'text-gray-600'}`}>Guardian alert will be sent to: <strong>{alert.guardian}</strong></span>
                    <span className="ml-auto text-xs px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full font-semibold">SMS Ready</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Emergency Modal */}
      <AnimatePresence>
        {modalAlert && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.8,opacity:0 }} className={`relative rounded-3xl shadow-2xl max-w-md w-full p-8 ${darkMode?'bg-slate-800':'bg-white'}`}>
              <button onClick={()=>setModalAlert(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>

              {sent ? (
                <div className="text-center py-4">
                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring' }} className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-emerald-500"/>
                  </motion.div>
                  <h3 className={`text-xl font-bold ${darkMode?'text-white':'text-gray-900'}`}>Alert Sent!</h3>
                  <p className={`text-sm mt-2 ${darkMode?'text-slate-400':'text-gray-600'}`}>Guardian and Health Extension Worker notified.</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Siren size={32} className="text-red-500"/></div>
                    <h3 className={`text-xl font-bold ${darkMode?'text-white':'text-gray-900'}`}>Emergency Alert</h3>
                    <p className={`text-sm mt-1 ${darkMode?'text-slate-400':'text-gray-500'}`}>This will notify the guardian and Health Extension Worker</p>
                  </div>

                  <div className={`rounded-2xl p-4 mb-6 ${darkMode?'bg-slate-700':'bg-red-50'} space-y-2`}>
                    <div className="flex justify-between text-sm"><span className={darkMode?'text-slate-400':'text-gray-500'}>Patient</span><span className={`font-bold ${darkMode?'text-white':'text-gray-900'}`}>{modalAlert.patient}</span></div>
                    <div className="flex justify-between text-sm"><span className={darkMode?'text-slate-400':'text-gray-500'}>Medication</span><span className={`font-semibold text-red-600`}>{modalAlert.medication}</span></div>
                    <div className="flex justify-between text-sm"><span className={darkMode?'text-slate-400':'text-gray-500'}>Missed doses</span><span className="font-bold text-red-600">{modalAlert.missedCount} times</span></div>
                    <div className="flex justify-between text-sm"><span className={darkMode?'text-slate-400':'text-gray-500'}>Guardian</span><span className={`font-semibold ${darkMode?'text-white':'text-gray-900'}`}>{modalAlert.guardian}</span></div>
                  </div>

                  <div className="space-y-3">
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode?'bg-slate-700':'bg-gray-50'}`}>
                      <UserCheck size={16} className="text-emerald-500"/>
                      <span className={`text-sm ${darkMode?'text-slate-300':'text-gray-700'}`}>Notify Health Extension Worker</span>
                      <div className="ml-auto w-10 h-5 bg-emerald-500 rounded-full flex items-center justify-end pr-0.5"><div className="w-4 h-4 bg-white rounded-full"/></div>
                    </div>
                    <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode?'bg-slate-700':'bg-gray-50'}`}>
                      <MessageSquare size={16} className="text-sky-500"/>
                      <span className={`text-sm ${darkMode?'text-slate-300':'text-gray-700'}`}>Send Guardian SMS Alert</span>
                      <div className="ml-auto w-10 h-5 bg-sky-500 rounded-full flex items-center justify-end pr-0.5"><div className="w-4 h-4 bg-white rounded-full"/></div>
                    </div>
                  </div>

                  <motion.button onClick={handleNotify} disabled={sending} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {sending ? <><span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"/>Sending...</> : <><Siren size={18}/>Send Emergency Alert</>}
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
