import { HeartPulse, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/shared/AppHeader';
import { useAppData } from '../data/appStore';
import { CURRENT_PATIENT_ID } from '../data/mockData';

/**
 * Account chooser. Stands in for sign-in until real authentication exists
 * (see README → "Connecting the backend"); there are no passwords here.
 */
export default function RoleSelectPage() {
  const { patients, doctor } = useAppData();
  const patient = patients.find((p) => p.id === CURRENT_PATIENT_ID);
  const accounts = [
    { to: '/patient', icon: HeartPulse, name: patient?.fullName ?? 'Patient', role: 'Patient', text: "Today's medication, reminders and your care team." },
    { to: '/doctor', icon: Stethoscope, name: doctor.fullName, role: `Clinician, ${doctor.facility}`, text: 'Your patients, adherence follow-up and prescriptions.' },
  ];
  return (
    <div className="min-h-screen">
      <main id="main" className="mx-auto flex max-w-2xl flex-col px-4 py-12 sm:py-20">
        <Logo />
        <h1 className="mt-10 text-3xl font-semibold tracking-tight sm:text-4xl">Every dose, on time, in your language.</h1>
        <p className="mt-3 text-lg text-slate-600">Choose your account to continue.</p>
        <ul className="mt-8 space-y-3">
          {accounts.map((a) => (
            <li key={a.to}>
              <Link to={a.to} className="card flex items-center gap-4 p-5 transition-colors hover:border-brand-400">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <a.icon aria-hidden className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-semibold">{a.name}</span>
                  <span className="block text-sm text-slate-500">{a.role}</span>
                  <span className="mt-1 block text-slate-600">{a.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
