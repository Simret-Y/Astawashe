import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJson, postJson } from '../lib/api';
import {
  isAuthenticated,
  logout,
  getCurrentUser,
} from '../lib/auth';

interface DoseSchedule {
  id: string;
  medication: string;
  dosage: string;
  time: string;
  doseStatus: 'PENDING' | 'TAKEN' | 'MISSED' | 'NOT_TAKEN';
}

type DemoStep = 'incoming' | 'connected';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  /* =========================================================
     DASHBOARD STATE
  ========================================================= */

  const [activeTab, setActiveTab] = useState<
    'schedule' | 'medications' | 'reminders' | 'guardians' | 'habits'
  >('schedule');

  const [patientData, setPatientData] = useState<any>(null);
  const [schedules, setSchedules] = useState<DoseSchedule[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  /* =========================================================
     DEMO STATE
  ========================================================= */

  const [activeDemoModal, setActiveDemoModal] = useState<any | null>(null);

  const [demoStep, setDemoStep] =
    useState<DemoStep>('incoming');

  const [phoneTime, setPhoneTime] =
    useState(new Date());

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  /* =========================================================
     AUTH + INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    if (currentUser?.role !== 'PATIENT') {
      navigate('/auth');
      return;
    }

    loadPatientDashboard();
  }, [navigate]);

  /* =========================================================
     PHONE CLOCK
  ========================================================= */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhoneTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  /* =========================================================
     CLEANUP AUDIO
  ========================================================= */

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  const loadPatientDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getJson<any>(
        '/dashboards/patient'
      ).catch(() => null);

      if (res?.data) {
        setPatientData(res.data);

        if (res.data.today?.schedules) {
          setSchedules(
            res.data.today.schedules
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load patient dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     AUDIO
  ========================================================= */

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  const playVoiceReminder = async () => {
    try {
      stopAudio();

      const audio = new Audio(
        '/AudioAlert/alert.mp3'
      );

      audio.loop = true;
      audio.volume = 1;

      audioRef.current = audio;

      await audio.play();
    } catch (err) {
      console.warn(
        'Voice reminder autoplay was blocked:',
        err
      );
    }
  };

  /* =========================================================
     CONNECT VOICE CALL
  ========================================================= */

  const connectVoiceCall = async () => {
    setDemoStep('connected');

    /*
      The small delay makes the transition feel like
      a real phone call connecting.
    */

    window.setTimeout(() => {
      playVoiceReminder();
    }, 500);
  };

  /* =========================================================
     TRIGGER DEMO REMINDER
  ========================================================= */

  const handleTriggerDemoReminder = async () => {
    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      stopAudio();

      const res = await postJson<any>(
        '/reminders/demo/trigger',
        {
          patientId:
            patientData?.patient?.id,
        }
      );

      if (res?.data) {
        setActiveDemoModal(res.data);
        setDemoStep('incoming');
        setPhoneTime(new Date());
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to trigger demonstration.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     DEMO RESPONSE
  ========================================================= */

  const handleDemoReminderRespond = async (
    responseVal: '1' | '2'
  ) => {
    if (!activeDemoModal) return;

    stopAudio();

    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      await postJson<any>(
        '/reminders/demo/respond',
        {
          scheduleId:
            activeDemoModal.scheduleId,

          patientId:
            activeDemoModal.patientId,

          response: responseVal,
        }
      );

      const isTaken =
        responseVal === '1';

      setActionSuccess(
        isTaken
          ? `Dose confirmed as TAKEN via ${
              activeDemoModal.reminderMode
            }. Great job!`
          : `Dose recorded as NOT TAKEN via ${
              activeDemoModal.reminderMode
            }.`
      );

      setActiveDemoModal(null);
      setDemoStep('incoming');

      await loadPatientDashboard();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to record reminder response.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     DOSE ACTION
  ========================================================= */

  const handleDoseAction = async (
    scheduleId: string,
    status: 'TAKEN' | 'MISSED'
  ) => {
    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      await postJson(
        '/adherence/dose-logs',
        {
          scheduleId,
          status,
          confirmationMethod: 'PUSH',
        }
      );

      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === scheduleId
            ? {
                ...schedule,
                doseStatus: status,
              }
            : schedule
        )
      );

      setActionSuccess(
        `Dose marked as ${status.toLowerCase()}.`
      );

      await loadPatientDashboard();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update dose status.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    stopAudio();

    setActiveDemoModal(null);

    logout();

    navigate('/auth');
  };

  /* =========================================================
     DATA
  ========================================================= */

  const patient =
    patientData?.patient;

  const doctor =
    patientData?.doctor;

  const today =
    patientData?.today;

  const recentWeek =
    patientData?.recentWeek;

  const guardians =
    patientData?.guardians || [];

  const todayAdherence =
    Number(today?.adherenceRate || 0);

  const weekAdherence =
    Number(recentWeek?.adherenceRate || 0);

  const takenToday =
    schedules.filter(
      (item) =>
        item.doseStatus === 'TAKEN'
    ).length;

  const missedToday =
    schedules.filter(
      (item) =>
        item.doseStatus === 'MISSED' ||
        item.doseStatus === 'NOT_TAKEN'
    ).length;

  const pendingToday =
    schedules.filter(
      (item) =>
        item.doseStatus === 'PENDING'
    ).length;

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (loading) {
    return (
      <div className="patient-loading">
        <div className="loading-orb">
          💊
        </div>

        <h4>
          Preparing your care dashboard
        </h4>

        <p>
          Loading your medication schedule...
        </p>

        <div className="spinner-border text-primary mt-2" />
      </div>
    );
  }

  return (
    <>
      {/* =====================================================
          DASHBOARD STYLES
      ===================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .patient-app {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top right,
              rgba(37, 99, 235, .10),
              transparent 32%
            ),
            #f5f7fb;
          color: #172033;
        }

        .patient-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #f5f7fb;
          color: #172033;
        }

        .loading-orb {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 34px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #06b6d4
          );
          box-shadow:
            0 18px 45px rgba(37, 99, 235, .25);
          margin-bottom: 18px;
        }

        .patient-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 245px;
          background: #111827;
          color: white;
          z-index: 20;
          padding: 22px 16px;
          display: flex;
          flex-direction: column;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 6px 10px 28px;
        }

        .brand-logo {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #06b6d4
          );
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow:
            0 8px 22px rgba(37, 99, 235, .3);
        }

        .brand strong {
          display: block;
          font-size: 16px;
        }

        .brand small {
          color: #94a3b8;
          font-size: 10px;
        }

        .sidebar-section {
          margin-top: 10px;
          margin-bottom: 8px;
          padding: 0 12px;
          color: #64748b;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 800;
        }

        .sidebar-btn {
          width: 100%;
          border: 0;
          background: transparent;
          color: #cbd5e1;
          text-align: left;
          padding: 12px 13px;
          border-radius: 11px;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 11px;
          font-weight: 600;
          font-size: 13px;
          transition: .2s ease;
        }

        .sidebar-btn:hover {
          background: rgba(255,255,255,.07);
          color: white;
        }

        .sidebar-btn.active {
          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );
          color: white;
          box-shadow:
            0 8px 20px rgba(37,99,235,.25);
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .logout-btn {
          width: 100%;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.04);
          color: #cbd5e1;
          border-radius: 11px;
          padding: 11px;
          font-size: 13px;
          font-weight: 700;
        }

        .patient-main {
          margin-left: 245px;
          min-height: 100vh;
        }

        .topbar {
          height: 70px;
          background: rgba(255,255,255,.88);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 30px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .search-box {
          width: 340px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 14px;
          color: #94a3b8;
          font-size: 13px;
        }

        .top-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(
            135deg,
            #dbeafe,
            #cffafe
          );
          color: #2563eb;
          font-weight: 800;
        }

        .dashboard-content {
          padding: 30px;
          max-width: 1500px;
          margin: auto;
        }

        .welcome-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 25px;
        }

        .welcome-row h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 4px;
          letter-spacing: -.7px;
        }

        .welcome-row p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .demo-trigger {
          border: 0;
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            #f59e0b,
            #f97316
          );
          color: white;
          padding: 12px 18px;
          font-weight: 800;
          box-shadow:
            0 10px 25px rgba(249,115,22,.22);
          transition: .2s ease;
        }

        .demo-trigger:hover {
          transform: translateY(-2px);
        }

        .summary-card {
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 18px;
          padding: 19px;
          box-shadow:
            0 8px 28px rgba(15,23,42,.045);
          height: 100%;
        }

        .summary-icon {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 20px;
          margin-bottom: 13px;
        }

        .summary-label {
          color: #64748b;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: .5px;
        }

        .summary-value {
          font-size: 28px;
          font-weight: 850;
          margin: 2px 0;
        }

        .summary-note {
          color: #94a3b8;
          font-size: 11px;
        }

        .main-card {
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 18px;
          box-shadow:
            0 8px 28px rgba(15,23,42,.045);
        }

        .doctor-card {
          padding: 22px;
          margin-top: 22px;
          margin-bottom: 22px;
        }

        .doctor-avatar {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background: linear-gradient(
            135deg,
            #dbeafe,
            #cffafe
          );
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
        }

        .doctor-info strong {
          display: block;
          font-size: 15px;
        }

        .doctor-info span {
          color: #64748b;
          font-size: 12px;
        }

        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 22px;
        }

        .tab-btn {
          border: 1px solid #e2e8f0;
          background: white;
          color: #64748b;
          border-radius: 11px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 750;
          transition: .2s;
        }

        .tab-btn:hover {
          border-color: #bfdbfe;
          color: #2563eb;
        }

        .tab-btn.active {
          background: #2563eb;
          border-color: #2563eb;
          color: white;
          box-shadow:
            0 7px 18px rgba(37,99,235,.18);
        }

        .section-card {
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 18px;
          padding: 22px;
          box-shadow:
            0 8px 28px rgba(15,23,42,.045);
        }

        .section-title {
          font-weight: 800;
          font-size: 16px;
          margin-bottom: 3px;
        }

        .section-subtitle {
          color: #94a3b8;
          font-size: 12px;
          margin-bottom: 18px;
        }

        .dose-item {
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 10px;
          transition: .2s;
        }

        .dose-item:hover {
          transform: translateY(-1px);
          box-shadow:
            0 8px 20px rgba(15,23,42,.06);
        }

        .dose-left {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .dose-icon {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          background: #eff6ff;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 20px;
        }

        .dose-name {
          font-weight: 800;
          font-size: 14px;
        }

        .dose-meta {
          color: #94a3b8;
          font-size: 11px;
          margin-top: 3px;
        }

        .dose-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .status-pill {
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 10px;
          font-weight: 800;
        }

        .status-pending {
          background: #fff7ed;
          color: #c2410c;
        }

        .status-taken {
          background: #ecfdf5;
          color: #047857;
        }

        .status-missed {
          background: #fef2f2;
          color: #dc2626;
        }

        .progress-track {
          height: 8px;
          background: #eef2f7;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #2563eb,
            #06b6d4
          );
        }

        .alert-box {
          border-radius: 13px;
          padding: 13px 16px;
          margin-bottom: 18px;
          font-size: 13px;
        }

        .patient-table {
          width: 100%;
          border-collapse: collapse;
        }

        .patient-table td,
        .patient-table th {
          padding: 13px;
          border-bottom: 1px solid #eef2f7;
          font-size: 12px;
          text-align: left;
        }

        .patient-table th {
          color: #94a3b8;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .5px;
        }

        /* =====================================================
           DEMO OVERLAY
        ===================================================== */

        .demo-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background:
            radial-gradient(
              circle at center,
              rgba(37,99,235,.16),
              rgba(2,6,23,.90)
            );
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 25px;
          overflow-y: auto;
        }

        .demo-modal {
          width: min(1050px, 100%);
          max-height: 94vh;
          overflow: hidden;
          border-radius: 28px;
          background: #f8fafc;
          box-shadow:
            0 35px 100px rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.18);
        }

        .demo-header {
          min-height: 90px;
          padding: 20px 25px;
          background: #111827;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .demo-header h3 {
          margin: 3px 0;
          font-weight: 850;
          font-size: 20px;
        }

        .demo-header small {
          color: #94a3b8;
          font-size: 11px;
        }

        .demo-label {
          color: #34d399;
          font-size: 9px;
          letter-spacing: 1.5px;
          font-weight: 900;
        }

        .demo-close {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.13);
          background: rgba(255,255,255,.08);
          color: white;
          font-size: 25px;
          line-height: 1;
        }

        .demo-content {
          min-height: 650px;
          max-height: calc(94vh - 90px);
          overflow-y: auto;
          padding: 35px;
          display: grid;
          grid-template-columns: 1fr .8fr;
          gap: 40px;
          align-items: center;
        }

        /* =====================================================
           PHONE
        ===================================================== */

        .phone-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .phone {
          width: 310px;
          height: 610px;
          padding: 9px;
          border-radius: 45px;
          background: #0b0f19;
          box-shadow:
            0 35px 70px rgba(0,0,0,.30),
            inset 0 0 0 2px #333b4c;
        }

        .phone-frame {
          width: 100%;
          height: 100%;
          border-radius: 37px;
          overflow: hidden;
          background: #111827;
          position: relative;
        }

        .phone-notch {
          position: absolute;
          z-index: 10;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 115px;
          height: 25px;
          background: #080b12;
          border-radius: 0 0 17px 17px;
        }

        .phone-notch span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #273244;
          position: absolute;
          right: 17px;
          top: 8px;
        }

        .phone-screen {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #f8fafc;
          position: relative;
        }

        .phone-status {
          position: absolute;
          top: 8px;
          left: 16px;
          right: 16px;
          z-index: 5;
          display: flex;
          justify-content: space-between;
          color: white;
          font-size: 9px;
          font-weight: 800;
        }

        .phone-home-bar {
          position: absolute;
          z-index: 20;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 4px;
          border-radius: 999px;
          background: #fff;
        }

        /* =====================================================
           CALL SCREEN
        ===================================================== */

        .call-screen {
          height: 100%;
          padding: 65px 24px 35px;
          text-align: center;
          color: white;
          background:
            radial-gradient(
              circle at top,
              #1e40af,
              #0f172a 65%
            );
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .call-type {
          font-size: 9px;
          letter-spacing: 1.5px;
          font-weight: 900;
          color: #93c5fd;
          margin-bottom: 32px;
        }

        .call-avatar {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #38bdf8,
            #2563eb
          );
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          font-weight: 900;
          box-shadow:
            0 0 0 9px rgba(59,130,246,.13),
            0 15px 40px rgba(0,0,0,.25);
          margin-bottom: 18px;
        }

        .call-avatar.pulse {
          animation: phonePulse 1.7s infinite;
        }

        @keyframes phonePulse {
          0%,100% {
            box-shadow:
              0 0 0 8px rgba(59,130,246,.12);
          }

          50% {
            box-shadow:
              0 0 0 17px rgba(59,130,246,.03);
          }
        }

        .call-screen h4 {
          font-weight: 850;
          margin-bottom: 5px;
        }

        .call-screen > span {
          color: #94a3b8;
          font-size: 11px;
        }

        .call-medication {
          margin-top: 25px;
          padding: 13px 18px;
          width: 100%;
          border-radius: 15px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.08);
        }

        .call-medication strong {
          display: block;
          font-size: 14px;
        }

        .call-medication span {
          color: #94a3b8;
          font-size: 10px;
        }

        .call-actions {
          margin-top: auto;
          width: 100%;
          display: flex;
          justify-content: space-around;
        }

        .call-actions button {
          border: 0;
          background: transparent;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 700;
        }

        .call-icon {
          width: 55px;
          height: 55px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .call-reject .call-icon {
          background: #ef4444;
        }

        .call-answer .call-icon {
          background: #22c55e;
        }

        /* =====================================================
           CONNECTED VOICE
        ===================================================== */

        .connected {
          background:
            radial-gradient(
              circle at center,
              #172554,
              #020617 75%
            );
        }

        .connected-badge {
          color: #4ade80;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
          margin-bottom: 24px;
        }

        .voice-wave {
          height: 38px;
          display: flex;
          align-items: center;
          gap: 4px;
          margin: 20px 0;
        }

        .voice-wave i {
          width: 4px;
          border-radius: 999px;
          background: #38bdf8;
          animation: wave 1s ease-in-out infinite;
        }

        .voice-wave i:nth-child(1) {
          height: 12px;
        }

        .voice-wave i:nth-child(2) {
          height: 23px;
          animation-delay: .1s;
        }

        .voice-wave i:nth-child(3) {
          height: 32px;
          animation-delay: .2s;
        }

        .voice-wave i:nth-child(4) {
          height: 18px;
          animation-delay: .3s;
        }

        .voice-wave i:nth-child(5) {
          height: 35px;
          animation-delay: .4s;
        }

        .voice-wave i:nth-child(6) {
          height: 22px;
          animation-delay: .5s;
        }

        .voice-wave i:nth-child(7) {
          height: 30px;
          animation-delay: .6s;
        }

        .voice-wave i:nth-child(8) {
          height: 15px;
          animation-delay: .7s;
        }

        .voice-wave i:nth-child(9) {
          height: 25px;
          animation-delay: .8s;
        }

        @keyframes wave {
          50% {
            transform: scaleY(.45);
            opacity: .55;
          }
        }

        .voice-message {
          display: flex;
          gap: 8px;
          align-items: center;
          text-align: left;
          width: 100%;
          background: rgba(255,255,255,.07);
          padding: 12px;
          border-radius: 14px;
          margin-bottom: 13px;
        }

        .voice-message p {
          margin: 0;
          color: #cbd5e1;
          font-size: 10px;
          line-height: 1.5;
        }

        .speaker {
          font-size: 16px;
        }

        .voice-question {
          color: white;
          font-weight: 800;
          font-size: 11px;
          margin: 7px 0 12px;
        }

        .voice-buttons {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
        }

        .voice-buttons button {
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          color: white;
          border-radius: 13px;
          padding: 11px 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .voice-buttons button:hover {
          background: rgba(255,255,255,.12);
        }

        .voice-buttons strong {
          color: #38bdf8;
          font-size: 18px;
        }

        .voice-buttons span {
          color: #cbd5e1;
          font-size: 9px;
        }

        .call-duration {
          margin-top: auto;
          color: #4ade80;
          font-size: 9px;
        }

        /* =====================================================
           SMS / USSD SCREEN
        ===================================================== */

        .sms-screen {
          height: 100%;
          background: #f1f5f9;
          padding-top: 35px;
          display: flex;
          flex-direction: column;
        }

        .sms-top {
          height: 55px;
          background: white;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .sms-top button {
          border: 0;
          background: transparent;
          font-size: 26px;
          color: #2563eb;
        }

        .sms-top > div {
          flex: 1;
        }

        .sms-top strong {
          display: block;
          font-size: 12px;
        }

        .sms-top span {
          display: block;
          color: #94a3b8;
          font-size: 8px;
        }

        .sms-image-wrapper {
          padding: 10px 14px 6px;
          background: #f8fafc;
        }

        .sms-alert-image {
          width: 100%;
          max-height: 150px;
          object-fit: cover;
          object-position: center;
          display: block;
          border-radius: 13px;
          border: 1px solid #dbe3ee;
          box-shadow:
            0 8px 20px rgba(15,23,42,.09);
        }

        .ussd-message {
          margin: 7px 14px;
          background: white;
          border-radius: 16px;
          padding: 15px;
          box-shadow:
            0 7px 18px rgba(15,23,42,.08);
          border: 1px solid #e5e7eb;
        }

        .ussd-header {
          color: #2563eb;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
          padding-bottom: 9px;
          border-bottom: 1px solid #eef2f7;
          margin-bottom: 10px;
        }

        .ussd-message p {
          margin: 5px 0;
          color: #64748b;
          font-size: 9px;
        }

        .ussd-message > strong {
          display: block;
          color: #111827;
          font-size: 14px;
        }

        .ussd-message > span {
          display: block;
          color: #2563eb;
          font-weight: 800;
          font-size: 10px;
          margin-top: 2px;
        }

        .ussd-question {
          margin-top: 14px !important;
          color: #111827 !important;
          font-weight: 800;
        }

        .ussd-options {
          display: grid;
          gap: 7px;
          margin-top: 10px;
        }

        .ussd-options button {
          border: 1px solid #dbeafe;
          background: #eff6ff;
          color: #1e40af;
          border-radius: 10px;
          padding: 8px;
          font-size: 9px;
          font-weight: 800;
          text-align: left;
        }

        .ussd-options button:hover {
          background: #dbeafe;
        }

        .ussd-options span {
          display: inline-flex;
          width: 21px;
          height: 21px;
          border-radius: 6px;
          align-items: center;
          justify-content: center;
          background: #2563eb;
          color: white;
          margin-right: 7px;
        }

        .sms-input {
          margin-top: auto;
          padding: 9px 12px 18px;
          display: flex;
          gap: 7px;
          background: white;
          border-top: 1px solid #e2e8f0;
        }

        .sms-input span {
          flex: 1;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 9px 12px;
          color: #94a3b8;
          font-size: 8px;
        }

        .sms-input button {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 50%;
          background: #2563eb;
          color: white;
        }

        /* =====================================================
           DEMO INFO
        ===================================================== */

        .demo-info {
          padding-right: 20px;
        }

        .demo-info-label {
          font-size: 9px;
          font-weight: 900;
          color: #2563eb;
          letter-spacing: 1.5px;
        }

        .demo-info h2 {
          font-size: 27px;
          font-weight: 900;
          letter-spacing: -.7px;
          margin: 8px 0 10px;
        }

        .demo-info > p {
          color: #64748b;
          line-height: 1.7;
          font-size: 13px;
          margin-bottom: 22px;
        }

        .demo-info-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 13px;
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .demo-info-card span {
          color: #64748b;
          font-size: 11px;
        }

        .demo-info-card strong {
          font-size: 12px;
        }

        .demo-status {
          margin-top: 18px;
          border-radius: 12px;
          background: #ecfdf5;
          color: #047857;
          padding: 12px;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sms-status {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: blink 1.4s infinite;
        }

        @keyframes blink {
          50% {
            opacity: .35;
          }
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1050px) {
          .patient-sidebar {
            width: 210px;
          }

          .patient-main {
            margin-left: 210px;
          }

          .demo-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .demo-info {
            padding-right: 0;
          }
        }

        @media (max-width: 768px) {
          .patient-sidebar {
            position: relative;
            width: 100%;
            height: auto;
            min-height: 0;
          }

          .sidebar-section,
          .sidebar-bottom {
            display: none;
          }

          .patient-main {
            margin-left: 0;
          }

          .topbar {
            padding: 0 15px;
          }

          .search-box {
            display: none;
          }

          .dashboard-content {
            padding: 18px;
          }

          .welcome-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .demo-content {
            padding: 18px;
          }

          .phone {
            width: 285px;
            height: 560px;
          }

          .demo-modal {
            border-radius: 20px;
          }
        }

      `}</style>

      {/* =====================================================
          APPLICATION
      ===================================================== */}

      <div className="patient-app">

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside className="patient-sidebar">

          <div className="brand">

            <div className="brand-logo">
              💊
            </div>

            <div>
              <strong>
                AstaWashe
              </strong>

              <small>
                We care about you
              </small>
            </div>

          </div>


          <div className="sidebar-section">
            Main Menu
          </div>


          <button
            className={`sidebar-btn ${
              activeTab === 'schedule'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('schedule')
            }
          >
            <span>▦</span>
            Dashboard
          </button>


          <button
            className={`sidebar-btn ${
              activeTab === 'medications'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('medications')
            }
          >
            <span>💊</span>
            Medications
          </button>


          <button
            className={`sidebar-btn ${
              activeTab === 'reminders'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('reminders')
            }
          >
            <span>🔔</span>
            Reminders
          </button>


          <button
            className={`sidebar-btn ${
              activeTab === 'guardians'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('guardians')
            }
          >
            <span>🛡️</span>
            Care Team
          </button>


          <button
            className={`sidebar-btn ${
              activeTab === 'habits'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('habits')
            }
          >
            <span>📈</span>
            Health Progress
          </button>


          <div className="sidebar-bottom">

            <button
              className="sidebar-btn"
              onClick={() => {}}
            >
              <span>⚙️</span>
              Settings
            </button>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              ↪ Sign out
            </button>

          </div>

        </aside>


        {/* =====================================================
            MAIN
        ===================================================== */}

        <main className="patient-main">

          {/* TOP BAR */}

          <header className="topbar">

            <div className="search-box">
              🔎 &nbsp; Search your care dashboard...
            </div>

            <div className="top-profile">

              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {patient?.fullName ||
                    currentUser?.email ||
                    'Patient'}
                </div>

                <div
                  style={{
                    color: '#94a3b8',
                    fontSize: 10,
                  }}
                >
                  Patient account
                </div>
              </div>

              <div className="avatar">
                {(patient?.fullName ||
                  'P')
                  .charAt(0)
                  .toUpperCase()}
              </div>

            </div>

          </header>


          {/* CONTENT */}

          <div className="dashboard-content">

            {/* =================================================
                ALERTS
            ================================================= */}

            {error && (
              <div
                className="alert-box"
                style={{
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                }}
              >
                ⚠️ {error}

                <button
                  onClick={() =>
                    setError('')
                  }
                  style={{
                    float: 'right',
                    border: 0,
                    background: 'transparent',
                    color: 'inherit',
                  }}
                >
                  ×
                </button>
              </div>
            )}


            {actionSuccess && (
              <div
                className="alert-box"
                style={{
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                }}
              >
                ✓ {actionSuccess}

                <button
                  onClick={() =>
                    setActionSuccess('')
                  }
                  style={{
                    float: 'right',
                    border: 0,
                    background: 'transparent',
                    color: 'inherit',
                  }}
                >
                  ×
                </button>
              </div>
            )}


            {/* =================================================
                WELCOME
            ================================================= */}

            <div className="welcome-row">

              <div>

                <h1>
                  Hello,{' '}
                  {patient?.fullName
                    ?.split(' ')[0] ||
                    'there'}{' '}
                  👋
                </h1>

                <p>
                  Here's your medication and
                  care overview for today.
                </p>

              </div>


              <button
                className="demo-trigger"
                onClick={
                  handleTriggerDemoReminder
                }
                disabled={actionLoading}
              >
                {actionLoading
                  ? 'Starting...'
                  : `🧪 Test ${
                      patient?.reminderMode ||
                      'VOICE'
                    } Reminder`}
              </button>

            </div>


            {/* =================================================
                KPI CARDS
            ================================================= */}

            <div className="row g-3">

              <div className="col-md-6 col-xl-3">

                <div className="summary-card">

                  <div
                    className="summary-icon"
                    style={{
                      background: '#eff6ff',
                    }}
                  >
                    📊
                  </div>

                  <div className="summary-label">
                    Today's adherence
                  </div>

                  <div
                    className="summary-value"
                    style={{
                      color: '#2563eb',
                    }}
                  >
                    {todayAdherence}%
                  </div>

                  <div className="progress-track mt-2">

                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(
                          todayAdherence,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

              </div>


              <div className="col-md-6 col-xl-3">

                <div className="summary-card">

                  <div
                    className="summary-icon"
                    style={{
                      background: '#ecfdf5',
                    }}
                  >
                    ✓
                  </div>

                  <div className="summary-label">
                    Taken today
                  </div>

                  <div
                    className="summary-value"
                    style={{
                      color: '#059669',
                    }}
                  >
                    {takenToday}
                  </div>

                  <div className="summary-note">
                    Confirmed doses
                  </div>

                </div>

              </div>


              <div className="col-md-6 col-xl-3">

                <div className="summary-card">

                  <div
                    className="summary-icon"
                    style={{
                      background: '#fff7ed',
                    }}
                  >
                    ⏰
                  </div>

                  <div className="summary-label">
                    Remaining
                  </div>

                  <div
                    className="summary-value"
                    style={{
                      color: '#ea580c',
                    }}
                  >
                    {pendingToday}
                  </div>

                  <div className="summary-note">
                    Doses waiting for confirmation
                  </div>

                </div>

              </div>


              <div className="col-md-6 col-xl-3">

                <div className="summary-card">

                  <div
                    className="summary-icon"
                    style={{
                      background: '#f0fdfa',
                    }}
                  >
                    📈
                  </div>

                  <div className="summary-label">
                    7-day adherence
                  </div>

                  <div
                    className="summary-value"
                    style={{
                      color: '#0891b2',
                    }}
                  >
                    {weekAdherence}%
                  </div>

                  <div className="summary-note">
                    {recentWeek?.stats?.taken ||
                      0}{' '}
                    doses completed
                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                CARE TEAM CARD
            ================================================= */}

            <div className="main-card doctor-card">

              <div className="row align-items-center g-3">

                <div className="col-lg-7">

                  <div className="d-flex align-items-center gap-3">

                    <div className="doctor-avatar">
                      🩺
                    </div>

                    <div className="doctor-info">

                      <small
                        style={{
                          color: '#94a3b8',
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform:
                            'uppercase',
                        }}
                      >
                        Your Care Team
                      </small>

                      {doctor ? (
                        <>
                          <strong>
                            Dr. {doctor.name}
                          </strong>

                          <span>
                            {doctor.specialization ||
                              'General Medicine'}
                            {' • '}
                            {doctor.email}
                          </span>
                        </>
                      ) : (
                        <strong>
                          No physician assigned yet
                        </strong>
                      )}

                    </div>

                  </div>

                </div>


                <div className="col-lg-5">

                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems: 'center',
                      }}
                    >

                      <div>

                        <div
                          style={{
                            color: '#94a3b8',
                            fontSize: 9,
                            fontWeight: 800,
                          }}
                        >
                          REMINDER CHANNEL
                        </div>

                        <strong
                          style={{
                            fontSize: 13,
                          }}
                        >
                          {patient?.reminderMode ===
                          'VOICE'
                            ? '🔊 Voice reminder'
                            : '📱 USSD reminder'}
                        </strong>

                      </div>

                      <span
                        className="status-pill status-taken"
                      >
                        ACTIVE
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                TABS
            ================================================= */}

            <div className="tabs">

              <button
                className={`tab-btn ${
                  activeTab === 'schedule'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('schedule')
                }
              >
                📅 Today's Schedule
              </button>


              <button
                className={`tab-btn ${
                  activeTab === 'medications'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('medications')
                }
              >
                💊 Medications
              </button>


              <button
                className={`tab-btn ${
                  activeTab === 'reminders'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('reminders')
                }
              >
                🔔 Reminder Settings
              </button>


              <button
                className={`tab-btn ${
                  activeTab === 'guardians'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('guardians')
                }
              >
                🛡️ Caregivers (
                {guardians.length})
              </button>


              <button
                className={`tab-btn ${
                  activeTab === 'habits'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('habits')
                }
              >
                📈 Health Progress
              </button>

            </div>


            {/* =================================================
                SCHEDULE TAB
            ================================================= */}

            {activeTab === 'schedule' && (

              <div className="row g-3">

                <div className="col-lg-8">

                  <div className="section-card">

                    <div className="section-title">
                      Today's medication plan
                    </div>

                    <div className="section-subtitle">
                      Confirm each dose after taking
                      your medication.
                    </div>


                    {schedules.length === 0 ? (

                      <div
                        style={{
                          padding: 35,
                          textAlign: 'center',
                          color: '#94a3b8',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 40,
                            marginBottom: 10,
                          }}
                        >
                          💊
                        </div>

                        No medication doses
                        scheduled for today.
                      </div>

                    ) : (

                      schedules.map((item) => (

                        <div
                          key={item.id}
                          className="dose-item"
                        >

                          <div className="dose-left">

                            <div className="dose-icon">
                              💊
                            </div>

                            <div>

                              <div className="dose-name">
                                {item.medication}
                              </div>

                              <div className="dose-meta">
                                {item.dosage}
                                {' • '}
                                Scheduled at{' '}
                                <strong>
                                  {item.time}
                                </strong>
                              </div>

                            </div>

                          </div>


                          <div className="dose-actions">

                            <span
                              className={`status-pill ${
                                item.doseStatus ===
                                'TAKEN'
                                  ? 'status-taken'
                                  : item.doseStatus ===
                                    'MISSED' ||
                                    item.doseStatus ===
                                      'NOT_TAKEN'
                                  ? 'status-missed'
                                  : 'status-pending'
                              }`}
                            >
                              {item.doseStatus}
                            </span>


                            {item.doseStatus ===
                              'PENDING' && (

                              <>
                                <button
                                  className="btn btn-sm btn-success rounded-pill"
                                  onClick={() =>
                                    handleDoseAction(
                                      item.id,
                                      'TAKEN'
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                >
                                  ✓ Taken
                                </button>

                                <button
                                  className="btn btn-sm btn-outline-danger rounded-pill"
                                  onClick={() =>
                                    handleDoseAction(
                                      item.id,
                                      'MISSED'
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                >
                                  Missed
                                </button>
                              </>

                            )}

                          </div>

                        </div>

                      ))

                    )}

                  </div>

                </div>


                <div className="col-lg-4">

                  <div className="section-card">

                    <div className="section-title">
                      Weekly progress
                    </div>

                    <div className="section-subtitle">
                      Your medication adherence
                    </div>

                    <div
                      style={{
                        fontSize: 42,
                        fontWeight: 900,
                        color: '#2563eb',
                      }}
                    >
                      {weekAdherence}%
                    </div>

                    <div className="progress-track mt-2">

                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            weekAdherence,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        marginTop: 12,
                        fontSize: 11,
                        color: '#64748b',
                      }}
                    >
                      <span>
                        ✓{' '}
                        {recentWeek?.stats?.taken ||
                          0}{' '}
                        taken
                      </span>

                      <span>
                        ✕{' '}
                        {recentWeek?.stats?.missed ||
                          0}{' '}
                        missed
                      </span>
                    </div>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                MEDICATIONS
            ================================================= */}

            {activeTab === 'medications' && (

              <div className="section-card">

                <div className="section-title">
                  My prescriptions
                </div>

                <div className="section-subtitle">
                  Medications prescribed by your
                  healthcare provider.
                </div>

                {schedules.length === 0 ? (

                  <div
                    style={{
                      color: '#94a3b8',
                      padding: 25,
                    }}
                  >
                    No active medication
                    prescriptions found.
                  </div>

                ) : (

                  <div className="table-responsive">

                    <table className="patient-table">

                      <thead>
                        <tr>
                          <th>Medication</th>
                          <th>Dosage</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>

                        {schedules.map(
                          (item) => (

                            <tr
                              key={item.id}
                            >
                              <td>
                                <strong>
                                  💊{' '}
                                  {item.medication}
                                </strong>
                              </td>

                              <td>
                                {item.dosage}
                              </td>

                              <td>
                                {item.time}
                              </td>

                              <td>
                                <span
                                  className={`status-pill ${
                                    item.doseStatus ===
                                    'TAKEN'
                                      ? 'status-taken'
                                      : item.doseStatus ===
                                        'MISSED'
                                      ? 'status-missed'
                                      : 'status-pending'
                                  }`}
                                >
                                  {
                                    item.doseStatus
                                  }
                                </span>
                              </td>
                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                )}

              </div>

            )}


            {/* =================================================
                REMINDERS
            ================================================= */}

            {activeTab === 'reminders' && (

              <div className="row g-3">

                <div className="col-lg-7">

                  <div className="section-card">

                    <div className="section-title">
                      Reminder preferences
                    </div>

                    <div className="section-subtitle">
                      Your healthcare reminders
                      are delivered using your
                      preferred channel.
                    </div>

                    <div
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 15,
                        padding: 18,
                      }}
                    >

                      <div
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          alignItems: 'center',
                        }}
                      >

                        <div>

                          <strong>
                            {patient?.reminderMode ===
                            'VOICE'
                              ? '🔊 Voice reminders'
                              : '📱 USSD reminders'}
                          </strong>

                          <div
                            style={{
                              color: '#94a3b8',
                              fontSize: 11,
                              marginTop: 4,
                            }}
                          >
                            Your current
                            preferred reminder
                            channel.
                          </div>

                        </div>

                        <span className="status-pill status-taken">
                          ACTIVE
                        </span>

                      </div>

                    </div>


                    <button
                      className="demo-trigger mt-4"
                      onClick={
                        handleTriggerDemoReminder
                      }
                    >
                      🧪 Run Live Reminder
                      Demonstration
                    </button>

                  </div>

                </div>


                <div className="col-lg-5">

                  <div className="section-card">

                    <div className="section-title">
                      How reminders work
                    </div>

                    <div className="section-subtitle">
                      AstaWashe reminder workflow
                    </div>

                    <div className="mb-3">
                      <strong>
                        01. Scheduled
                      </strong>

                      <div className="small text-muted">
                        Your medication schedule
                        reaches its configured
                        time.
                      </div>
                    </div>

                    <div className="mb-3">
                      <strong>
                        02. Reminder delivered
                      </strong>

                      <div className="small text-muted">
                        AstaWashe contacts you using
                        your preferred channel.
                      </div>
                    </div>

                    <div>
                      <strong>
                        03. Confirm dose
                      </strong>

                      <div className="small text-muted">
                        Your response is recorded
                        in your adherence history.
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            )}


            {/* =================================================
                GUARDIANS
            ================================================= */}

            {activeTab === 'guardians' && (

              <div className="section-card">

                <div className="section-title">
                  Guardian & caregiver network
                </div>

                <div className="section-subtitle">
                  People connected to support
                  your medication care.
                </div>

                {guardians.length === 0 ? (

                  <div
                    style={{
                      padding: 30,
                      textAlign: 'center',
                      color: '#94a3b8',
                    }}
                  >
                    🛡️

                    <div className="mt-2">
                      No guardian caregivers
                      linked yet.
                    </div>
                  </div>

                ) : (

                  <div className="row g-3">

                    {guardians.map(
                      (guardian: any) => (

                        <div
                          className="col-md-6 col-lg-4"
                          key={guardian.id}
                        >

                          <div
                            style={{
                              border:
                                '1px solid #e5e7eb',
                              borderRadius: 15,
                              padding: 17,
                            }}
                          >

                            <div
                              style={{
                                display: 'flex',
                                alignItems:
                                  'center',
                                gap: 12,
                              }}
                            >

                              <div
                                className="avatar"
                              >
                                🛡️
                              </div>

                              <div>

                                <strong>
                                  {guardian.name}
                                </strong>

                                <div
                                  className="small text-muted"
                                >
                                  {guardian.relationship ||
                                    'Guardian'}
                                </div>

                              </div>

                            </div>

                            <div
                              className="small text-muted mt-3"
                            >
                              📞{' '}
                              {guardian.phone ||
                                'No phone provided'}
                            </div>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            )}


            {/* =================================================
                HEALTH PROGRESS
            ================================================= */}

            {activeTab === 'habits' && (

              <div className="row g-3">

                <div className="col-lg-7">

                  <div className="section-card">

                    <div className="section-title">
                      Medication adherence
                    </div>

                    <div className="section-subtitle">
                      Your recent medication
                      performance.
                    </div>

                    <div
                      style={{
                        fontSize: 48,
                        fontWeight: 900,
                        color: '#2563eb',
                      }}
                    >
                      {weekAdherence}%
                    </div>

                    <div className="progress-track">

                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            weekAdherence,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                    <div className="mt-3 text-muted small">
                      Keep following your
                      medication schedule
                      consistently.
                    </div>

                  </div>

                </div>


                <div className="col-lg-5">

                  <div className="section-card">

                    <div className="section-title">
                      Today's activity
                    </div>

                    <div className="section-subtitle">
                      Dose completion summary.
                    </div>

                    <div className="d-flex justify-content-between mb-3">
                      <span>
                        ✓ Taken
                      </span>

                      <strong className="text-success">
                        {takenToday}
                      </strong>
                    </div>

                    <div className="d-flex justify-content-between mb-3">
                      <span>
                        ⏰ Pending
                      </span>

                      <strong className="text-warning">
                        {pendingToday}
                      </strong>
                    </div>

                    <div className="d-flex justify-content-between">
                      <span>
                        ✕ Missed
                      </span>

                      <strong className="text-danger">
                        {missedToday}
                      </strong>
                    </div>

                  </div>

                </div>

              </div>

            )}

          </div>

        </main>


        {/* =====================================================
            REALISTIC MOBILE REMINDER DEMONSTRATION
        ===================================================== */}

        {activeDemoModal && (

          <div className="demo-overlay">

            <div className="demo-modal">

              {/* DEMO HEADER */}

              <div className="demo-header">

                <div>

                  <span className="demo-label">
                    ● LIVE DEMONSTRATION
                  </span>

                  <h3>
                    AstaWashe Reminder
                  </h3>

                  <small>
                    Simulated patient reminder
                    delivery
                  </small>

                </div>


                <button
                  className="demo-close"
                  onClick={() => {
                    stopAudio();
                    setActiveDemoModal(null);
                    setDemoStep('incoming');
                  }}
                >
                  ×
                </button>

              </div>


              {/* DEMO BODY */}

              <div className="demo-content">

                {/* =================================================
                    PHONE
                ================================================= */}

                <div className="phone-wrapper">

                  <div className="phone">

                    <div className="phone-frame">

                      <div className="phone-notch">
                        <span />
                      </div>


                      <div className="phone-screen">

                        {/* PHONE STATUS */}

                        <div className="phone-status">

                          <span>
                            {phoneTime.toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>

                          <span>
                            ▮▮▮ ᯤ 🔋
                          </span>

                        </div>


                        {/* =================================================
                            VOICE
                        ================================================= */}

                        {activeDemoModal.reminderMode ===
                          'VOICE' && (

                          <>

                            {/* INCOMING */}

                            {demoStep ===
                              'incoming' && (

                              <div className="call-screen">

                                <div className="call-type">
                                  INCOMING CALL
                                </div>

                                <div className="call-avatar">
                                  A
                                </div>

                                <h4>
                                  AstaWashe Care
                                </h4>

                                <span>
                                  Medication Reminder
                                </span>


                                <div className="call-medication">

                                  <strong>
                                    {
                                      activeDemoModal.medicationName
                                    }
                                  </strong>

                                  <span>
                                    {
                                      activeDemoModal.dosage
                                    }
                                    {' • '}
                                    {
                                      activeDemoModal.time
                                    }
                                  </span>

                                </div>


                                <div className="call-actions">

                                  <button
                                    className="call-reject"
                                    onClick={() =>
                                      handleDemoReminderRespond(
                                        '2'
                                      )
                                    }
                                    disabled={
                                      actionLoading
                                    }
                                  >

                                    <span className="call-icon">
                                      ✕
                                    </span>

                                    <span>
                                      Decline
                                    </span>

                                  </button>


                                  <button
                                    className="call-answer"
                                    onClick={
                                      connectVoiceCall
                                    }
                                  >

                                    <span className="call-icon">
                                      ☎
                                    </span>

                                    <span>
                                      Answer
                                    </span>

                                  </button>

                                </div>

                              </div>

                            )}


                            {/* CONNECTED */}

                            {demoStep ===
                              'connected' && (

                              <div className="call-screen connected">

                                <div className="connected-badge">
                                  ● LIVE CALL
                                </div>

                                <div className="call-avatar pulse">
                                  A
                                </div>

                                <h4>
                                  AstaWashe Care
                                </h4>

                                <span>
                                  Medication reminder
                                </span>


                                <div className="voice-wave">

                                  <i />
                                  <i />
                                  <i />
                                  <i />
                                  <i />
                                  <i />
                                  <i />
                                  <i />
                                  <i />

                                </div>


                                <div className="voice-message">

                                  <span className="speaker">
                                    🔊
                                  </span>

                                  <p>
                                    Hello. This is
                                    AstaWashe. It's
                                    time to take
                                    your medication.
                                  </p>

                                </div>


                                <div className="voice-question">
                                  Have you taken your
                                  medication?
                                </div>


                                <div className="voice-buttons">

                                  <button
                                    onClick={() =>
                                      handleDemoReminderRespond(
                                        '1'
                                      )
                                    }
                                    disabled={
                                      actionLoading
                                    }
                                  >

                                    <strong>
                                      1
                                    </strong>

                                    <span>
                                      Yes, I took it
                                    </span>

                                  </button>


                                  <button
                                    onClick={() =>
                                      handleDemoReminderRespond(
                                        '2'
                                      )
                                    }
                                    disabled={
                                      actionLoading
                                    }
                                  >

                                    <strong>
                                      2
                                    </strong>

                                    <span>
                                      Not yet
                                    </span>

                                  </button>

                                </div>


                                <div className="call-duration">
                                  🔊 Voice reminder
                                  active
                                </div>

                              </div>

                            )}

                          </>

                        )}


                        {/* =================================================
                            SMS / USSD
                        ================================================= */}

                        {activeDemoModal.reminderMode !==
                          'VOICE' && (

                          <div className="sms-screen">

                            <div className="sms-top">

                              <button
                                onClick={() => {
                                  stopAudio();
                                  setActiveDemoModal(
                                    null
                                  );
                                }}
                              >
                                ‹
                              </button>

                              <div>

                                <strong>
                                  AstaWashe
                                </strong>

                                <span>
                                  USSD Medication
                                  Service
                                </span>

                              </div>

                              <span>
                                ⋮
                              </span>

                            </div>


                            {/* ACTUAL IMAGE */}

                            <div className="sms-image-wrapper">

                              <img
                                src="../AudioAlert/SmsAlert.jpg"
                                alt="AstaWashe medication reminder"
                                className="sms-alert-image"
                                onError={(event) => {
                                  event.currentTarget.style.display =
                                    'none';
                                }}
                              />

                            </div>

                            


                            {/* USSD MESSAGE */}

                            <div className="ussd-message">

                              <div className="ussd-header">
                                ASTAWASHE REMINDER
                              </div>

                              <p>
                                Hello{' '}
                                {patient?.fullName?.split(
                                  ' '
                                )[0] ||
                                  'Patient'}
                                .
                              </p>

                              <p>
                                It's time to take:
                              </p>

                              <strong>
                                {
                                  activeDemoModal.medicationName
                                }
                              </strong>

                              <span>
                                {
                                  activeDemoModal.dosage
                                }
                              </span>

                              <p className="ussd-question">
                                Have you taken this
                                medication?
                              </p>


                              <div className="ussd-options">

                                <button
                                  onClick={() =>
                                    handleDemoReminderRespond(
                                      '1'
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                >

                                  <span>
                                    1
                                  </span>

                                  Yes - Taken

                                </button>


                                <button
                                  onClick={() =>
                                    handleDemoReminderRespond(
                                      '2'
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                >

                                  <span>
                                    2
                                  </span>

                                  No - Not Taken

                                </button>

                              </div>

                            </div>


                            <div className="sms-input">

                              <span>
                                Type your response...
                              </span>

                              <button>
                                ➤
                              </button>

                            </div>

                          </div>

                        )}

                      </div>


                      <div className="phone-home-bar" />

                    </div>

                  </div>

                </div>


                {/* =================================================
                    DEMO INFORMATION
                ================================================= */}

                <div className="demo-info">

                  <span className="demo-info-label">
                    ASTAWASHE DELIVERY SIMULATION
                  </span>

                  <h2>
                    {activeDemoModal.reminderMode ===
                    'VOICE'
                      ? 'Voice Medication Reminder'
                      : 'SMS / USSD Medication Reminder'}
                  </h2>

                  <p>
                    This demonstration shows how
                    AstaWashe communicates medication
                    reminders to a patient using their
                    preferred reminder channel.
                  </p>


                  <div className="demo-info-card">

                    <span>
                      💊 Medication
                    </span>

                    <strong>
                      {
                        activeDemoModal.medicationName
                      }
                    </strong>

                  </div>


                  <div className="demo-info-card">

                    <span>
                      📋 Dosage
                    </span>

                    <strong>
                      {
                        activeDemoModal.dosage
                      }
                    </strong>

                  </div>


                  <div className="demo-info-card">

                    <span>
                      ⏰ Scheduled
                    </span>

                    <strong>
                      {
                        activeDemoModal.time
                      }
                    </strong>

                  </div>


                  <div className="demo-info-card">

                    <span>
                      📡 Delivery
                    </span>

                    <strong>
                      {activeDemoModal.reminderMode ===
                      'VOICE'
                        ? '🔊 Voice Call'
                        : '📱 SMS / USSD'}
                    </strong>

                  </div>


                  {activeDemoModal.reminderMode ===
                    'VOICE' && (

                    <div className="demo-status">

                      <span className="status-dot" />

                      {demoStep === 'incoming'
                        ? 'Waiting for patient to answer'
                        : 'Voice reminder currently playing'}

                    </div>

                  )}


                  {activeDemoModal.reminderMode !==
                    'VOICE' && (

                    <div className="demo-status sms-status">

                      <span className="status-dot" />

                      Interactive USSD reminder
                      displayed

                    </div>

                  )}

                </div>

              </div>

            </div>

          </div>

        )}

      </div>
    </>
  );
}