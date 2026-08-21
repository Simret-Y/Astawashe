import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Pill, Clock, Globe, UserCheck, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react';

interface RegisterPatientProps { darkMode: boolean; }

const languages = [
  { code: 'am', name: 'Amharic', native: 'አማርኛ', flag: '🇪🇹' },
  { code: 'en', name: 'English', native: 'English', flag: '🌐' },
  { code: 'om', name: 'Oromiffa', native: 'Afaan Oromoo', flag: '🇪🇹' },
  { code: 'ti', name: 'Tigrigna', native: 'ትግርኛ', flag: '🇪🇹' },
  { code: 'so', name: 'Somali', native: 'Soomaali', flag: '🇸🇴' },
];

const dosages = ['250mg','500mg','750mg','1000mg','5mg','10mg','20mg','40mg'];
const frequencies = ['Once daily','Twice daily','3x daily','Every 8 hours','Every 6 hours','Weekly'];

export default function RegisterPatient({ darkMode }: RegisterPatientProps) {
  const [form, setForm] = useState({ patientName:'', phone:'', medication:'', dosage:'', frequency:'', reminderTime:'', language:'', guardianPhone:'', notes:'' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});

  const cardBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100';
  const inputBg = darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900';
  const label = `text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`;

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.patientName) e.patientName = 'Required';
    if (!form.phone) e.phone = 'Required';
    if (!form.medication) e.medication = 'Required';
    if (!form.dosage) e.dosage = 'Required';
    if (!form.language) e.language = 'Select a language';
    if (!form.reminderTime) e.reminderTime = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setForm({ patientName:'', phone:'', medication:'', dosage:'', frequency:'', reminderTime:'', language:'', guardianPhone:'', notes:'' }); }, 3000);
  };

  if (success) return (
    <div className="p-6 flex items-center justify-center min-h-[80vh]">
      <motion.div initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} className={`rounded-3xl border shadow-xl p-12 text-center max-w-md w-full ${cardBg}`}>
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', delay:0.2 }} className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle2 size={48} className="text-white" />
        </motion.div>
        <h2 className={`text-2xl font-bold mb-2 ${darkMode?'text-white':'text-gray-900'}`}>Patient Registered!</h2>
        <p className={darkMode?'text-slate-400':'text-gray-600'}>SMS reminders will start automatically.</p>
      </motion.div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className={`rounded-3xl border shadow-sm overflow-hidden ${cardBg}`}>
        <div className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-8 py-6">
          <h2 className="text-white text-2xl font-bold">Register New Patient</h2>
          <p className="text-sky-100 text-sm mt-1">Fill in patient details to set up automated medication reminders</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Patient Info */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${darkMode?'text-slate-400':'text-gray-400'}`}>Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={`${label} flex items-center gap-1.5 mb-1.5`}><User size={14} className="text-sky-500"/>Full Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.patientName} onChange={e=>setForm({...form,patientName:e.target.value})} placeholder="e.g. Abebe Girma" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all ${inputBg} ${errors.patientName?'border-red-400':''}`}/>
                {errors.patientName && <p className="text-xs text-red-500 mt-1">{errors.patientName}</p>}
              </div>
              <div>
                <label className={`${label} flex items-center gap-1.5 mb-1.5`}><Phone size={14} className="text-sky-500"/>Phone Number <span className="text-red-400">*</span></label>
                <input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+251 91 234 5678" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all ${inputBg} ${errors.phone?'border-red-400':''}`}/>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Medication */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${darkMode?'text-slate-400':'text-gray-400'}`}>Medication Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={`${label} flex items-center gap-1.5 mb-1.5`}><Pill size={14} className="text-sky-500"/>Medication <span className="text-red-400">*</span></label>
                <input type="text" value={form.medication} onChange={e=>setForm({...form,medication:e.target.value})} placeholder="e.g. Metformin" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all ${inputBg} ${errors.medication?'border-red-400':''}`}/>
                {errors.medication && <p className="text-xs text-red-500 mt-1">{errors.medication}</p>}
              </div>
              <div>
                <label className={`${label} flex items-center gap-1.5 mb-1.5`}><ChevronDown size={14} className="text-sky-500"/>Dosage <span className="text-red-400">*</span></label>
                <select value={form.dosage} onChange={e=>setForm({...form,dosage:e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all ${inputBg} ${errors.dosage?'border-red-400':''}`}>
                  <option value="">Select dosage</option>
                  {dosages.map(d=><option key={d}>{d}</option>)}
                </select>
                {errors.dosage && <p className="text-xs text-red-500 mt-1">{errors.dosage}</p>}
              </div>
              <div>
                <label className={`${label} flex items-center gap-1.5 mb-1.5`}><Clock size={14} className="text-sky-500"/>Frequency</label>
                <select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all ${inputBg}`}>
                  <option value="">Select frequency</option>
                  {frequencies.map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5">
              <label className={`${label} flex items-center gap-1.5 mb-1.5`}><Clock size={14} className="text-sky-500"/>Reminder Time <span className="text-red-400">*</span></label>
              <input type="time" value={form.reminderTime} onChange={e=>setForm({...form,reminderTime:e.target.value})} className={`w-full md:w-64 px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all ${inputBg} ${errors.reminderTime?'border-red-400':''}`}/>
              {errors.reminderTime && <p className="text-xs text-red-500 mt-1">{errors.reminderTime}</p>}
            </div>
          </div>

          {/* Language */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${darkMode?'text-slate-400':'text-gray-400'}`}>Preferred Language</h3>
            <label className={`${label} flex items-center gap-1.5 mb-3`}><Globe size={14} className="text-sky-500"/>SMS Reminder Language <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {languages.map(lang=>(
                <motion.button key={lang.code} type="button" whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  onClick={()=>setForm({...form,language:lang.code})}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.language===lang.code ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md' : darkMode ? 'border-slate-600 text-slate-300' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-semibold text-xs">{lang.name}</span>
                  <span className={`text-xs ${form.language===lang.code?'text-sky-600':darkMode?'text-slate-500':'text-gray-400'}`}>{lang.native}</span>
                </motion.button>
              ))}
            </div>
            {errors.language && <p className="text-xs text-red-500 mt-2">{errors.language}</p>}
          </div>

          {/* Guardian */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${darkMode?'text-slate-400':'text-gray-400'}`}>Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={`${label} flex items-center gap-1.5 mb-1.5`}><UserCheck size={14} className="text-sky-500"/>Guardian Phone</label>
                <input type="tel" value={form.guardianPhone} onChange={e=>setForm({...form,guardianPhone:e.target.value})} placeholder="+251 92 345 6789" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all ${inputBg}`}/>
              </div>
              <div>
                <label className={`${label} block mb-1.5`}>Additional Notes</label>
                <textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Special instructions..." className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all resize-none ${inputBg}`}/>
              </div>
            </div>
          </div>

          <motion.button type="submit" disabled={loading} whileHover={{ scale:loading?1:1.02 }} whileTap={{ scale:loading?1:0.98 }}
            className="w-full py-4 bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-sky-200 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {loading ? <><Loader2 size={22} className="animate-spin"/>Registering Patient...</> : <><UserCheck size={22}/>Register Patient</>}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
