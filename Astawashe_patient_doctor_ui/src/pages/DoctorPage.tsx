import { Bell, LayoutDashboard, MessageSquare, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { AlertsPanel, useAlerts } from '../components/doctor/AlertsPanel';
import { OverviewPanel } from '../components/doctor/OverviewPanel';
import { PatientDetailPanel, type DetailTab } from '../components/doctor/PatientDetailPanel';
import { PatientTable } from '../components/doctor/PatientTable';
import { PrescriptionForm } from '../components/doctor/PrescriptionForm';
import { AppHeader } from '../components/shared/AppHeader';
import { useToast } from '../components/shared/Toast';
import { EmptyState, TabPanel, Tabs } from '../components/shared/ui';
import { useAppData } from '../data/appStore';
import { NOW } from '../data/mockData';
import { formatDateTime } from '../data/selectors';
import { usePatientData, usePatientSummaries } from '../hooks/usePatientData';
import type { Prescription } from '../types';

type Tab = 'overview' | 'patients' | 'alerts' | 'messages';

/**
 * Clinician experience. The signed-in clinician comes from CURRENT_DOCTOR_ID until real auth exists;
 * role-based access must be enforced by the backend later.
 */
export default function DoctorPage() {
  const store = useAppData();
  const toast = useToast();
  const rows = usePatientSummaries();
  const alerts = useAlerts();
  const [tab, setTab] = useState<Tab>('overview');
  const hour = NOW.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const [openId, setOpenId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('today');
  const detail = usePatientData(openId);
  const [rxForm, setRxForm] = useState<{ open: boolean; initial: Prescription | null; patientId?: string }>({ open: false, initial: null });

  const openPatient = (id: string, t: DetailTab = 'today') => {
    setDetailTab(t);
    setOpenId(id);
  };

  const conversations = rows
    .filter((r) => r.lastMessage)
    .sort((a, b) => (b.lastMessage!.sentAt > a.lastMessage!.sentAt ? 1 : -1));
  const unreadish = conversations.filter((r) => r.lastMessage?.sender === 'PATIENT').length;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'patients' as const, label: 'Patients', icon: Users },
    { id: 'alerts' as const, label: 'Alerts', icon: Bell, count: alerts.length },
    { id: 'messages' as const, label: 'Messages', icon: MessageSquare, count: unreadish },
  ];

  return (
    <div>
      <AppHeader section="Clinician workspace" accountName={store.doctor.fullName} accountDetail={store.doctor.facility} />
      <main id="main" className="mx-auto max-w-7xl px-4 pb-24 pt-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{greeting}, {store.doctor.fullName}</h1>
            <p className="text-slate-600">
              {rows.length} patients · {alerts.length} open alerts
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setRxForm({ open: true, initial: null })}>
            <Plus aria-hidden className="h-4 w-4" /> New prescription
          </button>
        </div>

        <Tabs tabs={tabs} value={tab} onChange={setTab} label="Doctor sections" className="-mx-4 mb-6 px-4" />

        {tab === 'overview' && (
          <TabPanel id="overview">
            <OverviewPanel rows={rows} activity={store.activity} openAlerts={alerts.length} onOpenPatient={(id) => openPatient(id)} onGoToAlerts={() => setTab('alerts')} />
          </TabPanel>
        )}

        {tab === 'patients' && (
          <TabPanel id="patients">
            <PatientTable rows={rows} onOpen={(id) => openPatient(id)} />
          </TabPanel>
        )}

        {tab === 'alerts' && (
          <TabPanel id="alerts">
            <AlertsPanel
              alerts={alerts}
              onOpenPatient={openPatient}
              onReview={(a) => {
                store.reviewAlert(a.doseId);
                toast({ tone: 'success', message: `Alert for ${a.patientName} marked as reviewed.` });
              }}
            />
          </TabPanel>
        )}

        {tab === 'messages' && (
          <TabPanel id="messages">
            <div className="card">
              {conversations.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No conversations yet" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {conversations.map((r) => (
                    <li key={r.patient.id}>
                      <button type="button" onClick={() => openPatient(r.patient.id, 'messages')} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-canvas">
                        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-50 font-semibold text-navy-700">
                          {r.patient.preferredName[0]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{r.patient.fullName}</span>
                            <span className="shrink-0 text-xs text-slate-500">{formatDateTime(r.lastMessage!.sentAt)}</span>
                          </span>
                          <span className="block truncate text-sm text-slate-600">
                            {r.lastMessage!.sender === 'DOCTOR' ? 'You: ' : ''}
                            {r.lastMessage!.text}
                          </span>
                        </span>
                        {r.lastMessage!.sender === 'PATIENT' && <span className="mt-1 rounded-full bg-brand-50 px-2 text-xs font-medium text-brand-800">Awaiting reply</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500">To start a new conversation, open a patient and use the Messages tab.</p>
            </div>
          </TabPanel>
        )}
      </main>

      <PatientDetailPanel
        data={detail}
        initialTab={detailTab}
        onClose={() => setOpenId(null)}
        onAddPrescription={(patientId) => setRxForm({ open: true, initial: null, patientId })}
        onEditPrescription={(rx) => setRxForm({ open: true, initial: rx })}
        onStopPrescription={(rx) => {
          store.stopPrescription(rx.id);
          toast({ tone: 'info', message: `${rx.medicationName} stopped.` });
        }}
        onSetReminderMode={(mode) => {
          if (!detail) return;
          store.setReminderMode(detail.patient.id, mode);
          toast({ tone: 'success', message: `${detail.patient.preferredName}'s reminders set to ${mode === 'VOICE' ? 'spoken' : 'text menu'}.` });
        }}
        onConfirmByPhone={(doseId) => {
          store.setDoseStatus(doseId, 'TAKEN', 'CARE_TEAM');
          toast({ tone: 'success', message: 'Dose marked as taken, confirmed by phone.', action: { label: 'Undo', onClick: () => store.setDoseStatus(doseId, 'PENDING', 'CARE_TEAM') } });
        }}
        onSendMessage={(text) => detail && store.sendMessage(detail.patient.id, 'DOCTOR', text)}
      />

      <PrescriptionForm
        open={rxForm.open}
        patients={store.patients}
        initial={rxForm.initial}
        defaultPatientId={rxForm.patientId}
        onCancel={() => setRxForm({ open: false, initial: null })}
        onSave={(input) => {
          const saved = store.savePrescription(input);
          const p = store.patients.find((x) => x.id === saved.patientId);
          setRxForm({ open: false, initial: null });
          toast({ tone: 'success', message: `${rxForm.initial ? 'Updated' : 'Added'} ${saved.medicationName} ${saved.dosage} for ${p?.preferredName ?? 'patient'}.` });
          if (!openId) openPatient(saved.patientId, 'prescriptions');
        }}
      />
    </div>
  );
}
