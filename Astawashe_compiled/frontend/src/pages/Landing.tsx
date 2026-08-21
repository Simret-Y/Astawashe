import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Bell, Users, MessageSquare, ArrowRight, Star, Phone, Globe, Shield, Zap } from 'lucide-react';

const features = [
  { icon: Bell, title: 'Smart Reminders', desc: 'Automated SMS in 5 Ethiopian languages — Amharic, Oromiffa, Tigrigna, Somali & English.', color: 'from-sky-400 to-blue-500' },
  { icon: Users, title: 'Patient Tracking', desc: 'Monitor adherence rates, missed doses, and patient health outcomes in real-time.', color: 'from-emerald-400 to-teal-500' },
  { icon: Shield, title: 'Emergency Alerts', desc: 'Instant notifications to guardians and Health Extension Workers when doses are missed.', color: 'from-red-400 to-rose-500' },
  { icon: MessageSquare, title: 'AI Assistant', desc: 'Multilingual AI chatbot helps healthcare workers manage patients efficiently.', color: 'from-violet-400 to-purple-500' },
  { icon: Globe, title: 'Multilingual', desc: 'Break language barriers. Every patient gets reminders in their native language.', color: 'from-amber-400 to-orange-500' },
  { icon: Zap, title: 'Real-time Dashboard', desc: 'Live medication adherence data, charts, and analytics at your fingertips.', color: 'from-cyan-400 to-sky-500' },
];

const steps = [
  { step: '01', title: 'Register Patient', desc: 'Add patient details, medication schedule, and preferred language in under 60 seconds.', icon: Users },
  { step: '02', title: 'Automated Reminders', desc: 'AstaWashe sends timely SMS reminders in the patient\'s language.', icon: Bell },
  { step: '03', title: 'Track & Alert', desc: 'Monitor doses taken. If missed, instantly alert guardians and health workers.', icon: Shield },
];

const testimonials = [
  { name: 'Dr. Lemlem Haile', role: 'Health Extension Worker, Addis Ababa', quote: 'AstaWashe reduced missed doses by 40% in our kebele. The Amharic reminders make it accessible to all.', rating: 5, avatar: 'LH', color: '#0ea5e9' },
  { name: 'Abebe Girma', role: 'Patient, Gondar', quote: 'I never forget my medication now. The SMS in Amharic is easy to understand for me and my family.', rating: 5, avatar: 'AG', color: '#10b981' },
  { name: 'Dr. Fatuma Ibrahim', role: 'Clinic Director, Dire Dawa', quote: 'The dashboard gives us real-time visibility. We can now prioritize patients who need urgent follow-up.', rating: 5, avatar: 'FI', color: '#8b5cf6' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-emerald-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
              <Heart size={20} className="text-white"/>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">AstaWashe</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features','How It Works','Testimonials'].map(item=>(
              <a key={item} href={`#${item.toLowerCase().replace(/ /g,'-')}`} className="text-sm font-medium text-gray-600 hover:text-sky-600 transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-semibold text-gray-600 hover:text-sky-600 transition-colors">Login</Link>
            <Link to="/auth">
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-emerald-500 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
              >Get Started →</motion.button>
            </Link>
          </div>
        </div>
      </nav>


      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl -z-10"/>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl -z-10"/>

        <motion.div initial={{ opacity:0,y:30 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7 }}>
          <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 px-4 py-2 rounded-full text-sky-700 text-sm font-semibold mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
            🇪🇹 Designed for Ethiopia · Healthcare Innovation 2025
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
            Never Miss a<br/>
            <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">Dose Again.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            AstaWashe connects patients, guardians, doctors, and Health Extension Workers through 
            <strong className="text-sky-600"> smart medication reminders</strong> in 5 Ethiopian languages.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/">
              <motion.button whileHover={{ scale:1.05, y:-2 }} whileTap={{ scale:0.95 }}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-emerald-500 text-white text-lg font-bold rounded-2xl shadow-xl shadow-sky-200 hover:shadow-2xl hover:shadow-sky-300 transition-all"
              ><Zap size={20}/>View Dashboard <ArrowRight size={18}/></motion.button>
            </Link>
            <Link to="/auth">
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                className="flex items-center gap-2 px-8 py-4 bg-white text-gray-800 text-lg font-bold rounded-2xl shadow-md hover:shadow-lg border border-gray-200 transition-all"
              ><Phone size={18}/>Get Started Free</motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Hero stats */}
        <motion.div initial={{ opacity:0,y:40 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.4 }} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { val:'248+', label:'Patients Registered', color:'text-sky-600' },
            { val:'87%', label:'Medication Adherence', color:'text-emerald-600' },
            { val:'5', label:'Ethiopian Languages', color:'text-violet-600' },
            { val:'24/7', label:'Real-time Monitoring', color:'text-amber-600' },
          ].map(s=>(
            <div key={s.label} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Everything You Need to Save Lives</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">A complete platform for medication adherence in Ethiopia's healthcare system.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f,i)=>{
              const Icon = f.icon;
              return (
                <motion.div key={f.title} initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.08 }}
                  whileHover={{ y:-6, boxShadow:'0 20px 40px rgba(0,0,0,0.1)' }}
                  className="rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-default bg-white"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                    <Icon size={22} className="text-white"/>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-sky-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">How AstaWashe Works</h2>
            <p className="text-gray-600 text-lg">Simple. Effective. Life-saving.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s,i)=>{
              const Icon = s.icon;
              return (
                <motion.div key={s.step} initial={{ opacity:0,x:-20 }} whileInView={{ opacity:1,x:0 }} viewport={{ once:true }} transition={{ delay:i*0.15 }}
                  className="relative text-center"
                >
                  {i < steps.length-1 && <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-sky-300 to-emerald-300 -translate-x-8 z-0"/>}
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-sky-200">
                      <Icon size={32} className="text-white"/>
                    </div>
                    <div className="text-5xl font-black text-gray-100 absolute -top-4 left-1/2 -translate-x-1/2 -z-10">{s.step}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Trusted by Healthcare Heroes</h2>
            <p className="text-gray-600 text-lg">From Addis Ababa to Dire Dawa, AstaWashe is making a difference.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t,i)=>(
              <motion.div key={t.name} initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                whileHover={{ y:-4 }} className="rounded-2xl border border-gray-100 p-6 shadow-md hover:shadow-xl transition-all duration-300 bg-white"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length:t.rating }).map((_,i)=><Star key={i} size={16} className="text-amber-400 fill-amber-400"/>)}
                </div>
                <p className="text-gray-700 leading-relaxed italic mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background:t.color }}>{t.avatar}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-sky-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }}>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to Save Lives?</h2>
            <p className="text-sky-100 text-xl mb-10">Join AstaWashe today and transform medication adherence in Ethiopia.</p>
            <Link to="/">
              <motion.button whileHover={{ scale:1.05,y:-2 }} whileTap={{ scale:0.95 }}
                className="px-10 py-5 bg-white text-sky-600 font-black text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all flex items-center gap-3 mx-auto"
              ><Zap size={24}/>Launch Dashboard <ArrowRight size={20}/></motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-lg flex items-center justify-center"><Heart size={16} className="text-white"/></div>
            <span className="font-bold text-white">AstaWashe</span>
            <span className="text-gray-600">·</span>
            <span className="text-sm">Smart Medication Reminder System</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>🇪🇹</span>
            <span>Made with</span>
            <Heart size={14} className="text-red-400 fill-red-400"/>
            <span>for Ethiopia</span>
          </div>
          <p className="text-sm">© 2025 AstaWashe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
