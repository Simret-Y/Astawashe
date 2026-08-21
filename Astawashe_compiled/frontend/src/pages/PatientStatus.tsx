import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { patients } from '../data/mockData';

interface PatientStatusProps { darkMode: boolean; }

const statusConfig = {
  taken: { label:'Taken', color:'bg-emerald-100 text-emerald-700 border-emerald-200', dot:'bg-emerald-500', icon: CheckCircle2, cardBorder:'border-l-emerald-500' },
  missed: { label:'Missed', color:'bg-red-100 text-red-700 border-red-200', dot:'bg-red-500', icon: XCircle, cardBorder:'border-l-red-500' },
  pending: { label:'Pending', color:'bg-amber-100 text-amber-700 border-amber-200', dot:'bg-amber-500', icon: AlertCircle, cardBorder:'border-l-amber-500' },
};

const timeline = [
  { time:'08:00 AM', label:'Morning Dose Sent', status:'taken' },
  { time:'12:00 PM', label:'Afternoon Reminder', status:'pending' },
  { time:'06:00 PM', label:'Evening Dose', status:'missed' },
  { time:'09:00 PM', label:'Night Reminder', status:'taken' },
];

export default function PatientStatus({ darkMode }: PatientStatusProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'taken'|'missed'|'pending'>('all');
  const [selected, setSelected] = useState<number|null>(null);

  const cardBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100';
  const inputBg = darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900';

  const filtered = patients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.medication.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const selectedPatient = patients.find(p => p.id === selected);

  return (
    <div className="p-6 space-y-6">
      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        {(['all','taken','missed','pending'] as const).map(f => (
          <motion.button key={f} whileTap={{ scale:0.96 }} onClick={()=>setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all capitalize ${
              filter===f ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white border-transparent shadow-md' : darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f==='all' ? `All (${patients.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${patients.filter(p=>p.status===f).length})`}
          </motion.button>
        ))}
      </div>

      {/* Search */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border max-w-md ${inputBg}`}>
        <Search size={16} className="text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patients or medications..." className="bg-transparent text-sm outline-none flex-1"/>
        <Filter size={16} className="text-gray-400"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map((p, i) => {
              const cfg = statusConfig[p.status as keyof typeof statusConfig];
              const Icon = cfg.icon;
              return (
                <motion.div key={p.id} layout initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.95 }} transition={{ delay:i*0.05 }}
                  whileHover={{ y:-4, boxShadow:'0 12px 30px rgba(0,0,0,0.1)' }}
                  onClick={()=>setSelected(p.id===selected?null:p.id)}
                  className={`rounded-2xl border-l-4 ${cfg.cardBorder} border cursor-pointer transition-all ${cardBg} ${selected===p.id?'ring-2 ring-sky-400':''} p-5`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background:p.color }}>{p.avatar}</div>
                      <div>
                        <p className={`font-bold text-sm ${darkMode?'text-white':'text-gray-900'}`}>{p.name}</p>
                        <p className={`text-xs ${darkMode?'text-slate-400':'text-gray-500'}`}>{p.language}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${cfg.color}`}>
                      <Icon size={12}/> {cfg.label}
                    </span>
                  </div>
                  <div className={`text-sm ${darkMode?'text-slate-300':'text-gray-700'} mb-3`}>
                    <p className="font-medium">{p.medication}</p>
                    <p className={`text-xs mt-0.5 ${darkMode?'text-slate-400':'text-gray-500'}`}>{p.dosage} · {p.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width:0 }} animate={{ width:`${p.adherence}%` }} transition={{ duration:0.8, delay:i*0.05 }}
                        className="h-full rounded-full" style={{ background:p.adherence>=80?'#10b981':p.adherence>=60?'#f59e0b':'#ef4444' }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${darkMode?'text-slate-400':'text-gray-500'}`}>{p.adherence}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs ${darkMode?'text-slate-500':'text-gray-400'}`}>{p.lastActivity}</span>
                    <ChevronRight size={14} className={darkMode?'text-slate-500':'text-gray-400'}/>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className={`col-span-2 rounded-2xl border p-12 text-center ${cardBg}`}>
              <Search size={40} className="mx-auto text-gray-300 mb-3"/>
              <p className={`font-semibold ${darkMode?'text-slate-300':'text-gray-700'}`}>No patients found</p>
              <p className={`text-sm ${darkMode?'text-slate-500':'text-gray-400'}`}>Try a different search term</p>
            </div>
          )}
        </div>

        {/* Detail / Timeline */}
        <div className="space-y-4">
          {selectedPatient ? (
            <motion.div initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} className={`rounded-2xl border shadow-sm ${cardBg} p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg" style={{ background:selectedPatient.color }}>{selectedPatient.avatar}</div>
                <div>
                  <h3 className={`font-bold ${darkMode?'text-white':'text-gray-900'}`}>{selectedPatient.name}</h3>
                  <p className={`text-sm ${darkMode?'text-slate-400':'text-gray-500'}`}>{selectedPatient.phone}</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {[['Medication', selectedPatient.medication],['Dosage', selectedPatient.dosage],['Schedule', selectedPatient.time],['Language', selectedPatient.language],['Guardian', selectedPatient.guardian]].map(([k,v])=>(
                  <div key={k} className="flex justify-between">
                    <span className={`text-xs font-medium ${darkMode?'text-slate-400':'text-gray-500'}`}>{k}</span>
                    <span className={`text-xs font-semibold ${darkMode?'text-white':'text-gray-900'}`}>{v}</span>
                  </div>
                ))}
              </div>
              <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${darkMode?'text-slate-400':'text-gray-400'}`}>Today's Timeline</h4>
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-100"/>
                <div className="space-y-4">
                  {timeline.map((t,i)=>{
                    const cfg2 = statusConfig[t.status as keyof typeof statusConfig];
                    return (
                      <div key={i} className="flex items-center gap-3 relative pl-8">
                        <div className={`absolute left-1.5 w-4 h-4 rounded-full border-2 border-white ${cfg2.dot} z-10`}/>
                        <Clock size={12} className={darkMode?'text-slate-500':'text-gray-400'}/>
                        <span className={`text-xs ${darkMode?'text-slate-400':'text-gray-500'}`}>{t.time}</span>
                        <span className={`text-xs font-medium flex-1 ${darkMode?'text-slate-300':'text-gray-700'}`}>{t.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cfg2.color}`}>{cfg2.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className={`rounded-2xl border p-10 text-center ${cardBg}`}>
              <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search size={28} className="text-sky-400"/>
              </div>
              <p className={`font-semibold text-sm ${darkMode?'text-slate-300':'text-gray-700'}`}>Select a patient</p>
              <p className={`text-xs mt-1 ${darkMode?'text-slate-500':'text-gray-400'}`}>Click a card to view details & timeline</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
