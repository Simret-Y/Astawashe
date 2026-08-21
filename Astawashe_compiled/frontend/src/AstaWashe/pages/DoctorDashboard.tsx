import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJson, postJson, patchJson } from '../lib/api';
import { isAuthenticated, logout, getCurrentUser } from '../lib/auth';

interface PendingPatient {
  id: string;
  fullName: string;
  dob?: string;
  gender?: string;
  user?: {
    email?: string;
    phone?: string;
  };
  hospital?: {
    name: string;
  };
  createdAt: string;
}

interface Patient {
  id: string;
  fullName: string;
  nickname?: string;
  dob?: string;
  gender?: string;
  reminderMode?: 'VOICE' | 'USSD';
  medicationCount?: number;
  adherenceToday?: number;
  guardianName?: string;
  guardianPhone?: string;
  hospital?: {
    name?: string;
  };
  user?: {
    email?: string;
    phone?: string;
  };
}

interface MedicationForm {
  patientId: string;
  name: string;
  dosage: string;
  form: string;
  instructions: string;
  timesString: string;
}

type Tab = 'overview' | 'patients' | 'requests' | 'medications';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [docData, setDocData] = useState<any>(null);
  const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [patientFilter, setPatientFilter] = useState<
    'ALL' | 'GOOD' | 'WARNING' | 'HIGH_RISK'
  >('ALL');

  const [selectedPendingPatient, setSelectedPendingPatient] =
    useState<PendingPatient | null>(null);

  const [patientNickname, setPatientNickname] = useState('');

  const [selectedPatientDetail, setSelectedPatientDetail] =
    useState<Patient | null>(null);

  const [showAddMedication, setShowAddMedication] = useState(false);

  const [scheduleType, setScheduleType] = useState<
    'INTERVAL' | 'EXPLICIT'
  >('INTERVAL');

  const [intervalHours, setIntervalHours] = useState(8);
  const [startTime, setStartTime] = useState('06:00');

  const [medForm, setMedForm] = useState<MedicationForm>({
    patientId: '',
    name: '',
    dosage: '500mg',
    form: 'Tablet',
    instructions: 'Take with water after meals',
    timesString: '06:00, 14:00, 22:00',
  });

  /* =========================================================
     AUTHENTICATION
  ========================================================= */

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    if (currentUser?.role !== 'DOCTOR') {
      navigate('/auth');
      return;
    }

    loadDoctorDashboard();
  }, [navigate]);

  /* =========================================================
     DATA
  ========================================================= */

  const loadDoctorDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const [dashRes, pendingRes] = await Promise.all([
        getJson<any>('/dashboards/doctor').catch(() => null),
        getJson<any>('/approvals/doctor/patients/pending').catch(() => null),
      ]);

      if (dashRes?.data) {
        setDocData(dashRes.data);
      }

      const pending =
        Array.isArray(pendingRes?.data)
          ? pendingRes.data
          : Array.isArray(dashRes?.data?.pendingPatientsList)
            ? dashRes.data.pendingPatientsList
            : [];

      setPendingPatients(pending);
    } catch (err) {
      setError((err as Error).message || 'Unable to load doctor dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const doctor = docData?.doctor;

  const stats = docData?.stats || {};

  const patients: Patient[] = Array.isArray(docData?.patients)
    ? docData.patients
    : [];

  const riskPatients: Patient[] = Array.isArray(docData?.riskPatients)
    ? docData.riskPatients
    : [];

  const averageAdherence = Number(
    docData?.averageAdherence ??
      stats?.averageAdherence ??
      85
  );

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const name = patient.fullName?.toLowerCase() || '';
      const nickname = patient.nickname?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        nickname.includes(query);

      const adherence = Number(patient.adherenceToday ?? 0);

      let matchesFilter = true;

      if (patientFilter === 'GOOD') {
        matchesFilter = adherence >= 80;
      }

      if (patientFilter === 'WARNING') {
        matchesFilter = adherence >= 60 && adherence < 80;
      }

      if (patientFilter === 'HIGH_RISK') {
        matchesFilter = adherence < 60;
      }

      return matchesSearch && matchesFilter;
    });
  }, [patients, searchQuery, patientFilter]);

  const highRiskCount = riskPatients.length;

  const goodAdherenceCount = patients.filter(
    (p) => Number(p.adherenceToday ?? 0) >= 80
  ).length;

  const warningAdherenceCount = patients.filter(
    (p) => {
      const value = Number(p.adherenceToday ?? 0);
      return value >= 60 && value < 80;
    }
  ).length;

  /* =========================================================
     ACTIONS
  ========================================================= */

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleRefresh = async () => {
    await loadDoctorDashboard(true);
  };

  const handleTogglePatientReminderMode = async (
    patientId: string,
    targetMode?: string
  ) => {
    const newMode =
      targetMode === 'VOICE' || targetMode === 'USSD'
        ? targetMode
        : 'VOICE';

    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      await patchJson(`/patients/${patientId}/reminder-mode`, {
        reminderMode: newMode,
      });

      setDocData((prev: any) => {
        if (!prev) return prev;

        return {
          ...prev,
          patients: (prev.patients || []).map((patient: Patient) =>
            patient.id === patientId
              ? {
                  ...patient,
                  reminderMode: newMode,
                }
              : patient
          ),
        };
      });

      if (selectedPatientDetail?.id === patientId) {
        setSelectedPatientDetail({
          ...selectedPatientDetail,
          reminderMode: newMode as 'VOICE' | 'USSD',
        });
      }

      setActionSuccess(
        `Reminder preference updated to ${newMode}.`
      );
    } catch (err) {
      setError(
        (err as Error).message ||
          'Unable to update reminder preference.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePatientSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!selectedPendingPatient || !patientNickname.trim()) {
      setError(
        'A privacy nickname is required before approving the patient.'
      );
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      await postJson(
        `/approvals/doctor/patients/${selectedPendingPatient.id}/approve`,
        {
          action: 'APPROVE',
          reason: 'Approved by doctor',
          nickname: patientNickname.trim(),
        }
      );

      setActionSuccess(
        `${selectedPendingPatient.fullName} has been approved successfully.`
      );

      setSelectedPendingPatient(null);
      setPatientNickname('');

      await loadDoctorDashboard(true);
    } catch (err) {
      setError(
        (err as Error).message ||
          'Unable to approve patient.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPatient = async (patientId: string) => {
    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      await postJson(
        `/approvals/doctor/patients/${patientId}/approve`,
        {
          action: 'REJECT',
          reason: 'Rejected by doctor',
        }
      );

      setActionSuccess('Patient request rejected.');

      await loadDoctorDashboard(true);
    } catch (err) {
      setError(
        (err as Error).message ||
          'Unable to reject patient request.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     MEDICATION
  ========================================================= */

  const calculateIntervalTimes = (
    start: string,
    interval: number
  ) => {
    const times: string[] = [];

    const [hourString, minuteString] = start.split(':');

    const startHour = Number(hourString || 6);
    const startMinute = minuteString || '00';

    const count = Math.floor(24 / interval);

    for (let i = 0; i < count; i++) {
      const hour = (startHour + i * interval) % 24;

      times.push(
        `${String(hour).padStart(2, '0')}:${startMinute}`
      );
    }

    return times.join(', ');
  };

  const handleCreateMedication = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !medForm.patientId ||
      !medForm.name.trim()
    ) {
      setError(
        'Please select a patient and enter a medication name.'
      );
      return;
    }

    const timesToUse =
      scheduleType === 'INTERVAL'
        ? calculateIntervalTimes(
            startTime,
            intervalHours
          )
        : medForm.timesString;

    const timesArray = timesToUse
      .split(',')
      .map((time) => time.trim())
      .filter(Boolean);

    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      const medRes = await postJson<any>('/medications', {
        patientId: medForm.patientId,
        name: medForm.name.trim(),
        dosage: medForm.dosage.trim(),
        form: medForm.form,
        instructions: medForm.instructions,
      });

      const medicationId =
        medRes?.id ||
        medRes?.data?.id;

      if (medicationId && timesArray.length) {
        for (const time of timesArray) {
          await postJson(
            `/medications/${medForm.patientId}/schedules`,
            {
              medicationId,
              dosage: medForm.dosage.trim(),
              time,
              frequency:
                scheduleType === 'INTERVAL'
                  ? 'CUSTOM'
                  : 'DAILY',
              customInterval:
                scheduleType === 'INTERVAL'
                  ? intervalHours
                  : undefined,
              startDate:
                new Date().toISOString(),
            }
          );
        }
      }

      setActionSuccess(
        `${medForm.name} was prescribed successfully.`
      );

      setShowAddMedication(false);

      setMedForm({
        patientId: '',
        name: '',
        dosage: '500mg',
        form: 'Tablet',
        instructions:
          'Take with water after meals',
        timesString:
          '06:00, 14:00, 22:00',
      });

      await loadDoctorDashboard(true);
    } catch (err) {
      setError(
        (err as Error).message ||
          'Unable to create prescription.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     UI HELPERS
  ========================================================= */

  const getAdherenceClass = (value: number) => {
    if (value < 60) return 'danger';
    if (value < 80) return 'warning';
    return 'success';
  };

  const getPatientStatus = (value: number) => {
    if (value < 60) {
      return {
        label: 'Needs attention',
        className: 'danger',
      };
    }

    if (value < 80) {
      return {
        label: 'Monitor',
        className: 'warning',
      };
    }

    return {
      label: 'Stable',
      className: 'success',
    };
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="doctor-loading">
        <div className="loading-card">
          <div className="loading-logo">
            <i className="fa fa-heartbeat" />
          </div>

          <div className="spinner-border text-primary" />

          <h5>Loading Clinical Workspace</h5>

          <p>
            Preparing your patient monitoring dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="doctor-app">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`doctor-sidebar ${
          sidebarOpen ? 'open' : 'closed'
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <i className="fa fa-heartbeat" />
          </div>

          {sidebarOpen && (
            <div>
              <div className="brand-title">
                AstaWashe
              </div>
              <div className="brand-subtitle">
                Clinical Care
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-section">
          {sidebarOpen && (
            <div className="sidebar-label">
              WORKSPACE
            </div>
          )}

          <button
            className={`sidebar-item ${
              activeTab === 'overview'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('overview')
            }
            title="Overview"
          >
            <i className="fa fa-th-large" />
            {sidebarOpen && <span>Overview</span>}
          </button>

          <button
            className={`sidebar-item ${
              activeTab === 'patients'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('patients')
            }
            title="Patients"
          >
            <i className="fa fa-users" />
            {sidebarOpen && (
              <>
                <span>My Patients</span>
                <span className="sidebar-count">
                  {patients.length}
                </span>
              </>
            )}
          </button>

          <button
            className={`sidebar-item ${
              activeTab === 'requests'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('requests')
            }
            title="Patient Requests"
          >
            <i className="fa fa-user-plus" />

            {sidebarOpen && (
              <>
                <span>Patient Requests</span>

                {pendingPatients.length > 0 && (
                  <span className="sidebar-alert-count">
                    {pendingPatients.length}
                  </span>
                )}
              </>
            )}
          </button>

          <button
            className={`sidebar-item ${
              activeTab === 'medications'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('medications')
            }
            title="Prescriptions"
          >
            <i className="fa fa-prescription-bottle-alt" />

            {sidebarOpen && (
              <span>Prescriptions</span>
            )}
          </button>
        </div>

        <div className="sidebar-section">
          {sidebarOpen && (
            <div className="sidebar-label">
              CLINICAL
            </div>
          )}

          <button
            className="sidebar-item"
            onClick={() =>
              setActiveTab('patients')
            }
          >
            <i className="fa fa-chart-line" />

            {sidebarOpen && (
              <span>Adherence Monitoring</span>
            )}
          </button>

          <button
            className="sidebar-item"
            onClick={() =>
              setActiveTab('patients')
            }
          >
            <i className="fa fa-exclamation-triangle" />

            {sidebarOpen && (
              <>
                <span>Risk Patients</span>

                {highRiskCount > 0 && (
                  <span className="sidebar-alert-count">
                    {highRiskCount}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        <div className="sidebar-bottom">
          {sidebarOpen && (
            <div className="doctor-profile-mini">
              <div className="doctor-avatar">
                {(
                  doctor?.name ||
                  'Doctor'
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="doctor-profile-info">
                <strong>
                  {doctor?.name ||
                    'Medical Doctor'}
                </strong>

                <small>
                  {doctor?.specialization ||
                    'Healthcare Professional'}
                </small>
              </div>
            </div>
          )}

          <button
            className="sidebar-item logout-item"
            onClick={handleLogout}
          >
            <i className="fa fa-sign-out-alt" />

            {sidebarOpen && (
              <span>Sign out</span>
            )}
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main
        className={`doctor-main ${
          sidebarOpen ? '' : 'sidebar-collapsed'
        }`}
      >

        {/* TOPBAR */}

        <header className="doctor-topbar">

          <div className="topbar-left">
            <button
              className="menu-toggle"
              onClick={() =>
                setSidebarOpen(!sidebarOpen)
              }
            >
              <i className="fa fa-bars" />
            </button>

            <div className="breadcrumb">
              <span>AstaWashe</span>
              <i className="fa fa-chevron-right" />
              <strong>
                {activeTab === 'overview'
                  ? 'Dashboard'
                  : activeTab === 'patients'
                    ? 'Patients'
                    : activeTab === 'requests'
                      ? 'Patient Requests'
                      : 'Prescriptions'}
              </strong>
            </div>
          </div>

          <div className="topbar-right">

            <button
              className="topbar-icon"
              title="Refresh dashboard"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <i
                className={`fa fa-sync-alt ${
                  refreshing
                    ? 'fa-spin'
                    : ''
                }`}
              />
            </button>

            <div className="topbar-divider" />

            <div className="topbar-doctor">
              <div className="topbar-avatar">
                {(
                  doctor?.name ||
                  'D'
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="topbar-doctor-info">
                <strong>
                  {doctor?.name ||
                    'Doctor'}
                </strong>

                <small>
                  {doctor?.specialization ||
                    'Medical Staff'}
                </small>
              </div>

              <i className="fa fa-chevron-down topbar-chevron" />
            </div>
          </div>
        </header>

        <div className="doctor-content">

          {/* =================================================
              ALERTS
          ================================================= */}

          {error && (
            <div className="system-alert danger-alert">
              <div className="alert-icon">
                <i className="fa fa-exclamation-circle" />
              </div>

              <div>
                <strong>
                  Something went wrong
                </strong>

                <p>{error}</p>
              </div>

              <button
                onClick={() => setError('')}
              >
                <i className="fa fa-times" />
              </button>
            </div>
          )}

          {actionSuccess && (
            <div className="system-alert success-alert">
              <div className="alert-icon">
                <i className="fa fa-check-circle" />
              </div>

              <div>
                <strong>
                  Action completed
                </strong>

                <p>{actionSuccess}</p>
              </div>

              <button
                onClick={() =>
                  setActionSuccess('')
                }
              >
                <i className="fa fa-times" />
              </button>
            </div>
          )}

          {/* =================================================
              OVERVIEW
          ================================================= */}

          {activeTab === 'overview' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    CLINICAL WORKSPACE
                  </div>

                  <h1>
                    Good day,{' '}
                    {doctor?.name
                      ? doctor.name
                          .split(' ')
                          .slice(-1)[0]
                      : 'Doctor'}
                    .
                  </h1>

                  <p>
                    Monitor your patients,
                    review adherence, and
                    manage treatment plans.
                  </p>
                </div>

                <button
                  className="primary-action"
                  onClick={() => {
                    setActiveTab('medications');
                    setShowAddMedication(true);
                  }}
                >
                  <i className="fa fa-plus" />
                  New Prescription
                </button>
              </div>

              {/* KPI CARDS */}

              <div className="stats-grid">

                <div className="stat-card">
                  <div className="stat-card-top">
                    <div>
                      <span className="stat-label">
                        ACTIVE PATIENTS
                      </span>

                      <strong className="stat-value">
                        {stats?.activePatients ??
                          patients.length ??
                          0}
                      </strong>
                    </div>

                    <div className="stat-icon blue">
                      <i className="fa fa-users" />
                    </div>
                  </div>

                  <div className="stat-footer">
                    <span className="stat-positive">
                      <i className="fa fa-arrow-up" />
                      Active care
                    </span>

                    <span>
                      Current roster
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <div>
                      <span className="stat-label">
                        PENDING REQUESTS
                      </span>

                      <strong className="stat-value">
                        {pendingPatients.length}
                      </strong>
                    </div>

                    <div className="stat-icon orange">
                      <i className="fa fa-user-clock" />
                    </div>
                  </div>

                  <div className="stat-footer">
                    <span className="stat-warning">
                      {pendingPatients.length > 0
                        ? 'Requires review'
                        : 'All caught up'}
                    </span>

                    <span>
                      Patient connections
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <div>
                      <span className="stat-label">
                        HIGH-RISK PATIENTS
                      </span>

                      <strong className="stat-value">
                        {highRiskCount}
                      </strong>
                    </div>

                    <div className="stat-icon red">
                      <i className="fa fa-heartbeat" />
                    </div>
                  </div>

                  <div className="stat-footer">
                    <span className="stat-danger">
                      {highRiskCount > 0
                        ? 'Attention needed'
                        : 'No critical alerts'}
                    </span>

                    <span>
                      Adherence risk
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <div>
                      <span className="stat-label">
                        AVG. ADHERENCE
                      </span>

                      <strong className="stat-value">
                        {averageAdherence.toFixed(1)}%
                      </strong>
                    </div>

                    <div className="stat-icon green">
                      <i className="fa fa-chart-line" />
                    </div>
                  </div>

                  <div className="stat-footer">
                    <span className="stat-positive">
                      <i className="fa fa-check" />
                      Monitoring
                    </span>

                    <span>
                      Overall patient adherence
                    </span>
                  </div>
                </div>
              </div>

              {/* MAIN GRID */}

              <div className="dashboard-grid">

                {/* ADHERENCE */}

                <section className="panel adherence-panel">
                  <div className="panel-header">
                    <div>
                      <h2>
                        Patient adherence
                      </h2>

                      <p>
                        Today's medication
                        adherence across your
                        active patients.
                      </p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() =>
                        setActiveTab('patients')
                      }
                    >
                      View patients
                      <i className="fa fa-arrow-right" />
                    </button>
                  </div>

                  <div className="adherence-summary">

                    <div className="donut-container">
                      <div
                        className="adherence-donut"
                        style={{
                          background: `conic-gradient(
                            #2563eb ${
                              averageAdherence * 3.6
                            }deg,
                            #e9eef5 ${
                              averageAdherence *
                              3.6
                            }deg
                          )`,
                        }}
                      >
                        <div className="donut-inner">
                          <strong>
                            {averageAdherence.toFixed(
                              0
                            )}%
                          </strong>
                          <span>
                            adherence
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="adherence-breakdown">

                      <div className="breakdown-item">
                        <span className="breakdown-dot green-dot" />
                        <div>
                          <strong>
                            {goodAdherenceCount}
                          </strong>
                          <span>
                            Good adherence
                          </span>
                        </div>
                      </div>

                      <div className="breakdown-item">
                        <span className="breakdown-dot orange-dot" />
                        <div>
                          <strong>
                            {warningAdherenceCount}
                          </strong>
                          <span>
                            Needs monitoring
                          </span>
                        </div>
                      </div>

                      <div className="breakdown-item">
                        <span className="breakdown-dot red-dot" />
                        <div>
                          <strong>
                            {highRiskCount}
                          </strong>
                          <span>
                            High risk
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="mini-bars">

                    {patients
                      .slice(0, 6)
                      .map((patient) => {
                        const adherence =
                          Number(
                            patient.adherenceToday ??
                              0
                          );

                        const status =
                          getAdherenceClass(
                            adherence
                          );

                        return (
                          <div
                            className="mini-bar-row"
                            key={patient.id}
                          >
                            <div className="mini-bar-name">
                              {patient.nickname ||
                                patient.fullName}
                            </div>

                            <div className="mini-bar-track">
                              <div
                                className={`mini-bar-fill ${status}`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      adherence
                                    )
                                  )}%`,
                                }}
                              />
                            </div>

                            <strong>
                              {adherence}%
                            </strong>
                          </div>
                        );
                      })}

                    {patients.length === 0 && (
                      <div className="empty-state-small">
                        <i className="fa fa-users" />
                        <span>
                          No active patients yet.
                        </span>
                      </div>
                    )}
                  </div>
                </section>

                {/* RISK ALERTS */}

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>
                        Clinical attention
                      </h2>

                      <p>
                        Patients requiring
                        follow-up.
                      </p>
                    </div>

                    <span className="panel-badge danger">
                      {highRiskCount}
                    </span>
                  </div>

                  <div className="risk-list">

                    {riskPatients
                      .slice(0, 5)
                      .map((patient) => {
                        const adherence =
                          Number(
                            patient.adherenceToday ??
                              0
                          );

                        return (
                          <div
                            className="risk-item"
                            key={patient.id}
                            onClick={() =>
                              setSelectedPatientDetail(
                                patient
                              )
                            }
                          >
                            <div className="risk-avatar">
                              {(
                                patient.nickname ||
                                patient.fullName ||
                                'P'
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="risk-info">
                              <strong>
                                {patient.nickname ||
                                  patient.fullName}
                              </strong>

                              <span>
                                Low medication
                                adherence
                              </span>
                            </div>

                            <div className="risk-value">
                              {adherence}%
                            </div>
                          </div>
                        );
                      })}

                    {riskPatients.length === 0 && (
                      <div className="empty-state">
                        <div className="empty-icon success">
                          <i className="fa fa-check" />
                        </div>

                        <strong>
                          No high-risk patients
                        </strong>

                        <p>
                          Your current patient
                          roster has no critical
                          adherence alerts.
                        </p>
                      </div>
                    )}

                  </div>
                </section>
              </div>

              {/* RECENT PATIENTS */}

              <section className="panel recent-panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      Patient roster
                    </h2>

                    <p>
                      Recently monitored
                      patients in your care.
                    </p>
                  </div>

                  <button
                    className="secondary-action"
                    onClick={() =>
                      setActiveTab('patients')
                    }
                  >
                    View all patients
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="clinical-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Reminder mode</th>
                        <th>Medications</th>
                        <th>Adherence</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>

                    <tbody>
                      {patients
                        .slice(0, 7)
                        .map((patient) => {
                          const adherence =
                            Number(
                              patient.adherenceToday ??
                                0
                            );

                          const status =
                            getPatientStatus(
                              adherence
                            );

                          return (
                            <tr
                              key={patient.id}
                              onClick={() =>
                                setSelectedPatientDetail(
                                  patient
                                )
                              }
                            >
                              <td>
                                <div className="table-person">
                                  <div className="table-avatar">
                                    {(
                                      patient.nickname ||
                                      patient.fullName ||
                                      'P'
                                    )
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                  <div>
                                    <strong>
                                      {patient.nickname ||
                                        patient.fullName}
                                    </strong>

                                    <span>
                                      {patient.fullName}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <span className="mode-badge">
                                  <i
                                    className={
                                      patient.reminderMode ===
                                      'USSD'
                                        ? 'fa fa-mobile-alt'
                                        : 'fa fa-volume-up'
                                    }
                                  />

                                  {patient.reminderMode ||
                                    'VOICE'}
                                </span>
                              </td>

                              <td>
                                <strong>
                                  {patient.medicationCount ??
                                    0}
                                </strong>
                              </td>

                              <td>
                                <div className="table-adherence">
                                  <div className="table-progress">
                                    <div
                                      className={`progress-fill ${status.className}`}
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Math.max(
                                            0,
                                            adherence
                                          )
                                        )}%`,
                                      }}
                                    />
                                  </div>

                                  <strong>
                                    {adherence}%
                                  </strong>
                                </div>
                              </td>

                              <td>
                                <span
                                  className={`status-badge ${status.className}`}
                                >
                                  {status.label}
                                </span>
                              </td>

                              <td>
                                <i className="fa fa-chevron-right table-arrow" />
                              </td>
                            </tr>
                          );
                        })}

                      {patients.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="table-empty"
                          >
                            No patients connected
                            yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* =================================================
              PATIENTS
          ================================================= */}

          {activeTab === 'patients' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    PATIENT MANAGEMENT
                  </div>

                  <h1>
                    My patients
                  </h1>

                  <p>
                    Monitor adherence,
                    reminder preferences,
                    medications, and
                    clinical risk.
                  </p>
                </div>

                <div className="heading-stat">
                  <strong>
                    {patients.length}
                  </strong>

                  <span>
                    Active patients
                  </span>
                </div>
              </div>

              <section className="panel">

                <div className="patient-toolbar">

                  <div className="search-box">
                    <i className="fa fa-search" />

                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchQuery}
                      onChange={(e) =>
                        setSearchQuery(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="filter-group">

                    <button
                      className={
                        patientFilter === 'ALL'
                          ? 'filter-btn active'
                          : 'filter-btn'
                      }
                      onClick={() =>
                        setPatientFilter('ALL')
                      }
                    >
                      All
                    </button>

                    <button
                      className={
                        patientFilter === 'GOOD'
                          ? 'filter-btn active'
                          : 'filter-btn'
                      }
                      onClick={() =>
                        setPatientFilter('GOOD')
                      }
                    >
                      Stable
                    </button>

                    <button
                      className={
                        patientFilter === 'WARNING'
                          ? 'filter-btn active'
                          : 'filter-btn'
                      }
                      onClick={() =>
                        setPatientFilter(
                          'WARNING'
                        )
                      }
                    >
                      Monitor
                    </button>

                    <button
                      className={
                        patientFilter ===
                        'HIGH_RISK'
                          ? 'filter-btn active danger-filter'
                          : 'filter-btn'
                      }
                      onClick={() =>
                        setPatientFilter(
                          'HIGH_RISK'
                        )
                      }
                    >
                      High risk
                    </button>

                  </div>
                </div>

                <div className="patient-grid">

                  {filteredPatients.map(
                    (patient) => {
                      const adherence =
                        Number(
                          patient.adherenceToday ??
                            0
                        );

                      const status =
                        getPatientStatus(
                          adherence
                        );

                      return (
                        <div
                          className="patient-card"
                          key={patient.id}
                          onClick={() =>
                            setSelectedPatientDetail(
                              patient
                            )
                          }
                        >

                          <div className="patient-card-header">
                            <div className="patient-large-avatar">
                              {(
                                patient.nickname ||
                                patient.fullName ||
                                'P'
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <span
                              className={`status-badge ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>

                          <h3>
                            {patient.nickname ||
                              patient.fullName}
                          </h3>

                          <p className="patient-real-name">
                            {patient.fullName}
                          </p>

                          <div className="patient-metrics">

                            <div>
                              <span>
                                Adherence
                              </span>

                              <strong>
                                {adherence}%
                              </strong>
                            </div>

                            <div>
                              <span>
                                Medications
                              </span>

                              <strong>
                                {patient.medicationCount ??
                                  0}
                              </strong>
                            </div>

                          </div>

                          <div className="patient-progress">
                            <div
                              className={`progress-fill ${status.className}`}
                              style={{
                                width: `${adherence}%`,
                              }}
                            />
                          </div>

                          <div className="patient-card-footer">
                            <span>
                              <i
                                className={
                                  patient.reminderMode ===
                                  'USSD'
                                    ? 'fa fa-mobile-alt'
                                    : 'fa fa-volume-up'
                                }
                              />

                              {patient.reminderMode ||
                                'VOICE'}
                            </span>

                            <span>
                              View profile
                              <i className="fa fa-arrow-right" />
                            </span>
                          </div>

                        </div>
                      );
                    }
                  )}

                  {filteredPatients.length === 0 && (
                    <div className="full-empty">
                      <div className="empty-icon">
                        <i className="fa fa-search" />
                      </div>

                      <h3>
                        No patients found
                      </h3>

                      <p>
                        Try changing your search
                        or filter.
                      </p>
                    </div>
                  )}

                </div>
              </section>
            </>
          )}

          {/* =================================================
              REQUESTS
          ================================================= */}

          {activeTab === 'requests' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    PATIENT CONNECTIONS
                  </div>

                  <h1>
                    Patient requests
                  </h1>

                  <p>
                    Review and approve patients
                    requesting to connect with
                    your clinical workspace.
                  </p>
                </div>

                <div className="heading-stat orange-heading">
                  <strong>
                    {pendingPatients.length}
                  </strong>

                  <span>
                    Awaiting review
                  </span>
                </div>
              </div>

              <section className="panel">

                <div className="panel-header">
                  <div>
                    <h2>
                      Pending connection
                      requests
                    </h2>

                    <p>
                      Verify patient details
                      before establishing the
                      clinical relationship.
                    </p>
                  </div>

                  <button
                    className="secondary-action"
                    onClick={() =>
                      loadDoctorDashboard(true)
                    }
                  >
                    <i className="fa fa-sync-alt" />
                    Refresh
                  </button>
                </div>

                {pendingPatients.length ===
                0 ? (
                  <div className="empty-state large-empty">
                    <div className="empty-icon success">
                      <i className="fa fa-check" />
                    </div>

                    <strong>
                      No pending requests
                    </strong>

                    <p>
                      There are currently no
                      patients waiting for your
                      approval.
                    </p>
                  </div>
                ) : (
                  <div className="request-list">

                    {pendingPatients.map(
                      (patient) => (
                        <div
                          className="request-card"
                          key={patient.id}
                        >
                          <div className="request-person">
                            <div className="request-avatar">
                              {patient.fullName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <h3>
                                {patient.fullName}
                              </h3>

                              <p>
                                Request submitted{' '}
                                {new Date(
                                  patient.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="request-details">
                            <div>
                              <span>
                                Contact
                              </span>

                              <strong>
                                {patient.user?.email ||
                                  patient.user?.phone ||
                                  'Not provided'}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Date of birth
                              </span>

                              <strong>
                                {patient.dob
                                  ? new Date(
                                      patient.dob
                                    ).toLocaleDateString()
                                  : 'Not provided'}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Hospital
                              </span>

                              <strong>
                                {patient.hospital
                                  ?.name ||
                                  'Not assigned'}
                              </strong>
                            </div>
                          </div>

                          <div className="request-actions">
                            <button
                              className="approve-btn"
                              onClick={() => {
                                setSelectedPendingPatient(
                                  patient
                                );

                                setPatientNickname(
                                  `P-${Math.floor(
                                    1000 +
                                      Math.random() *
                                        9000
                                  )}`
                                );
                              }}
                              disabled={
                                actionLoading
                              }
                            >
                              <i className="fa fa-check" />
                              Approve
                            </button>

                            <button
                              className="reject-btn"
                              onClick={() =>
                                handleRejectPatient(
                                  patient.id
                                )
                              }
                              disabled={
                                actionLoading
                              }
                            >
                              <i className="fa fa-times" />
                              Reject
                            </button>
                          </div>
                        </div>
                      )
                    )}

                  </div>
                )}
              </section>
            </>
          )}

          {/* =================================================
              MEDICATIONS
          ================================================= */}

          {activeTab === 'medications' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    TREATMENT MANAGEMENT
                  </div>

                  <h1>
                    Prescriptions
                  </h1>

                  <p>
                    Create medication plans and
                    configure reminder schedules
                    for your patients.
                  </p>
                </div>

                <button
                  className="primary-action"
                  onClick={() =>
                    setShowAddMedication(
                      !showAddMedication
                    )
                  }
                >
                  <i className="fa fa-plus" />

                  {showAddMedication
                    ? 'Close prescription'
                    : 'New prescription'}
                </button>
              </div>

              {showAddMedication && (
                <section className="panel prescription-panel">

                  <div className="panel-header">
                    <div>
                      <h2>
                        New medication
                      </h2>

                      <p>
                        Create a prescription and
                        activate its reminder
                        schedule.
                      </p>
                    </div>

                    <div className="prescription-icon">
                      <i className="fa fa-prescription-bottle-alt" />
                    </div>
                  </div>

                  <form
                    onSubmit={
                      handleCreateMedication
                    }
                  >
                    <div className="form-grid">

                      <div className="form-field full">
                        <label>
                          Patient
                          <span>*</span>
                        </label>

                        <select
                          value={
                            medForm.patientId
                          }
                          onChange={(e) =>
                            setMedForm({
                              ...medForm,
                              patientId:
                                e.target.value,
                            })
                          }
                          required
                        >
                          <option value="">
                            Select an active
                            patient
                          </option>

                          {patients.map(
                            (patient) => (
                              <option
                                key={patient.id}
                                value={
                                  patient.id
                                }
                              >
                                {patient.nickname ||
                                  patient.fullName}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="form-field">
                        <label>
                          Medication name
                          <span>*</span>
                        </label>

                        <input
                          type="text"
                          placeholder="e.g. Metformin"
                          value={
                            medForm.name
                          }
                          onChange={(e) =>
                            setMedForm({
                              ...medForm,
                              name:
                                e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="form-field">
                        <label>
                          Dosage
                        </label>

                        <input
                          type="text"
                          placeholder="e.g. 500mg"
                          value={
                            medForm.dosage
                          }
                          onChange={(e) =>
                            setMedForm({
                              ...medForm,
                              dosage:
                                e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>
                          Form
                        </label>

                        <select
                          value={
                            medForm.form
                          }
                          onChange={(e) =>
                            setMedForm({
                              ...medForm,
                              form:
                                e.target.value,
                            })
                          }
                        >
                          <option>
                            Tablet
                          </option>
                          <option>
                            Capsule
                          </option>
                          <option>
                            Syrup
                          </option>
                          <option>
                            Injection
                          </option>
                          <option>
                            Inhaler
                          </option>
                          <option>
                            Drops
                          </option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label>
                          Schedule type
                        </label>

                        <select
                          value={
                            scheduleType
                          }
                          onChange={(e) =>
                            setScheduleType(
                              e.target.value as
                                | 'INTERVAL'
                                | 'EXPLICIT'
                            )
                          }
                        >
                          <option value="INTERVAL">
                            Every N hours
                          </option>

                          <option value="EXPLICIT">
                            Custom daily times
                          </option>
                        </select>
                      </div>

                      {scheduleType ===
                      'INTERVAL' ? (
                        <>
                          <div className="form-field">
                            <label>
                              Interval
                            </label>

                            <select
                              value={
                                intervalHours
                              }
                              onChange={(e) =>
                                setIntervalHours(
                                  Number(
                                    e.target.value
                                  )
                                )
                              }
                            >
                              <option value={4}>
                                Every 4 hours
                              </option>

                              <option value={6}>
                                Every 6 hours
                              </option>

                              <option value={8}>
                                Every 8 hours
                              </option>

                              <option value={12}>
                                Every 12 hours
                              </option>
                            </select>
                          </div>

                          <div className="form-field">
                            <label>
                              Start time
                            </label>

                            <input
                              type="time"
                              value={
                                startTime
                              }
                              onChange={(e) =>
                                setStartTime(
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="schedule-preview full">
                            <div className="schedule-preview-icon">
                              <i className="fa fa-clock" />
                            </div>

                            <div>
                              <span>
                                Calculated
                                schedule
                              </span>

                              <strong>
                                {calculateIntervalTimes(
                                  startTime,
                                  intervalHours
                                )}
                              </strong>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="form-field full">
                          <label>
                            Daily times
                          </label>

                          <input
                            type="text"
                            placeholder="06:00, 14:00, 22:00"
                            value={
                              medForm.timesString
                            }
                            onChange={(e) =>
                              setMedForm({
                                ...medForm,
                                timesString:
                                  e.target.value,
                              })
                            }
                          />
                        </div>
                      )}

                      <div className="form-field full">
                        <label>
                          Instructions
                        </label>

                        <textarea
                          rows={3}
                          placeholder="e.g. Take with water after meals"
                          value={
                            medForm.instructions
                          }
                          onChange={(e) =>
                            setMedForm({
                              ...medForm,
                              instructions:
                                e.target.value,
                            })
                          }
                        />
                      </div>

                    </div>

                    <div className="form-footer">
                      <button
                        type="button"
                        className="secondary-action"
                        onClick={() =>
                          setShowAddMedication(
                            false
                          )
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="primary-action"
                        disabled={
                          actionLoading
                        }
                      >
                        {actionLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="fa fa-check" />
                            Save prescription
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {!showAddMedication && (
                <div className="medication-info-grid">

                  <div className="med-info-card">
                    <div className="med-info-icon blue">
                      <i className="fa fa-pills" />
                    </div>

                    <div>
                      <strong>
                        Medication plans
                      </strong>

                      <p>
                        Create structured
                        medication schedules for
                        each active patient.
                      </p>
                    </div>
                  </div>

                  <div className="med-info-card">
                    <div className="med-info-icon green">
                      <i className="fa fa-volume-up" />
                    </div>

                    <div>
                      <strong>
                        Voice reminders
                      </strong>

                      <p>
                        Patients can receive
                        medication reminders by
                        voice.
                      </p>
                    </div>
                  </div>

                  <div className="med-info-card">
                    <div className="med-info-icon orange">
                      <i className="fa fa-mobile-alt" />
                    </div>

                    <div>
                      <strong>
                        USSD reminders
                      </strong>

                      <p>
                        Support patients using
                        USSD-based reminder
                        delivery.
                      </p>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* =====================================================
          PATIENT DETAIL MODAL
      ===================================================== */}

      {selectedPatientDetail && (
        <div
          className="clinical-modal-backdrop"
          onClick={() =>
            setSelectedPatientDetail(null)
          }
        >
          <div
            className="clinical-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-clinical-header">

              <div className="modal-person">
                <div className="modal-avatar">
                  {(
                    selectedPatientDetail.nickname ||
                    selectedPatientDetail.fullName ||
                    'P'
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <span>
                    PATIENT PROFILE
                  </span>

                  <h2>
                    {selectedPatientDetail.nickname ||
                      selectedPatientDetail.fullName}
                  </h2>

                  <p>
                    {selectedPatientDetail.fullName}
                  </p>
                </div>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedPatientDetail(null)
                }
              >
                <i className="fa fa-times" />
              </button>

            </div>

            <div className="modal-body">

              <div className="clinical-metric-grid">

                <div className="clinical-metric">
                  <span>
                    TODAY'S ADHERENCE
                  </span>

                  <strong
                    className={
                      Number(
                        selectedPatientDetail.adherenceToday ??
                          0
                      ) < 60
                        ? 'danger-text'
                        : 'success-text'
                    }
                  >
                    {selectedPatientDetail.adherenceToday ??
                      0}
                    %
                  </strong>
                </div>

                <div className="clinical-metric">
                  <span>
                    ACTIVE MEDICATIONS
                  </span>

                  <strong>
                    {selectedPatientDetail.medicationCount ??
                      0}
                  </strong>
                </div>

                <div className="clinical-metric">
                  <span>
                    REMINDER MODE
                  </span>

                  <strong>
                    {selectedPatientDetail.reminderMode ||
                      'VOICE'}
                  </strong>
                </div>

              </div>

              <div className="modal-section">

                <div className="modal-section-heading">
                  <h3>
                    Reminder preference
                  </h3>

                  <span>
                    Choose the patient's
                    preferred channel.
                  </span>
                </div>

                <div className="reminder-selector">

                  <button
                    className={
                      selectedPatientDetail.reminderMode !==
                      'USSD'
                        ? 'reminder-option active'
                        : 'reminder-option'
                    }
                    onClick={() =>
                      handleTogglePatientReminderMode(
                        selectedPatientDetail.id,
                        'VOICE'
                      )
                    }
                    disabled={actionLoading}
                  >
                    <div className="reminder-option-icon">
                      <i className="fa fa-volume-up" />
                    </div>

                    <div>
                      <strong>
                        Voice reminders
                      </strong>

                      <span>
                        Automated voice
                        medication reminders
                      </span>
                    </div>

                    {selectedPatientDetail.reminderMode !==
                      'USSD' && (
                      <i className="fa fa-check-circle selected-check" />
                    )}
                  </button>

                  <button
                    className={
                      selectedPatientDetail.reminderMode ===
                      'USSD'
                        ? 'reminder-option active'
                        : 'reminder-option'
                    }
                    onClick={() =>
                      handleTogglePatientReminderMode(
                        selectedPatientDetail.id,
                        'USSD'
                      )
                    }
                    disabled={actionLoading}
                  >
                    <div className="reminder-option-icon">
                      <i className="fa fa-mobile-alt" />
                    </div>

                    <div>
                      <strong>
                        USSD reminders
                      </strong>

                      <span>
                        Mobile USSD medication
                        reminders
                      </span>
                    </div>

                    {selectedPatientDetail.reminderMode ===
                      'USSD' && (
                      <i className="fa fa-check-circle selected-check" />
                    )}
                  </button>

                </div>
              </div>

              <div className="modal-section">

                <div className="modal-section-heading">
                  <h3>
                    Care information
                  </h3>
                </div>

                <div className="care-info-grid">

                  <div>
                    <span>
                      Guardian
                    </span>

                    <strong>
                      {selectedPatientDetail.guardianName ||
                        'No guardian linked'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Guardian contact
                    </span>

                    <strong>
                      {selectedPatientDetail.guardianPhone ||
                        'Not available'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Patient contact
                    </span>

                    <strong>
                      {selectedPatientDetail.user
                        ?.email ||
                        selectedPatientDetail.user
                          ?.phone ||
                        'Not available'}
                    </strong>
                  </div>

                </div>
              </div>

            </div>

            <div className="modal-footer-clinical">
              <button
                className="secondary-action"
                onClick={() =>
                  setSelectedPatientDetail(null)
                }
              >
                Close
              </button>

              <button
                className="primary-action"
                onClick={() => {
                  setSelectedPatientDetail(null);
                  setActiveTab('medications');
                  setShowAddMedication(true);

                  setMedForm((previous) => ({
                    ...previous,
                    patientId:
                      selectedPatientDetail.id,
                  }));
                }}
              >
                <i className="fa fa-prescription-bottle-alt" />
                Prescribe medication
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          APPROVAL MODAL
      ===================================================== */}

      {selectedPendingPatient && (
        <div
          className="clinical-modal-backdrop"
          onClick={() =>
            setSelectedPendingPatient(null)
          }
        >
          <div
            className="clinical-modal small-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-clinical-header compact">

              <div className="modal-person">
                <div className="modal-avatar orange">
                  <i className="fa fa-user-plus" />
                </div>

                <div>
                  <span>
                    PATIENT CONNECTION
                  </span>

                  <h2>
                    Approve patient
                  </h2>
                </div>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedPendingPatient(null)
                }
              >
                <i className="fa fa-times" />
              </button>

            </div>

            <form
              onSubmit={
                handleApprovePatientSubmit
              }
            >
              <div className="modal-body">

                <div className="approval-summary">

                  <div className="request-avatar">
                    {selectedPendingPatient.fullName
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {
                        selectedPendingPatient.fullName
                      }
                    </strong>

                    <span>
                      {
                        selectedPendingPatient.user
                          ?.email ||
                        selectedPendingPatient.user
                          ?.phone ||
                        'Contact not provided'
                      }
                    </span>
                  </div>

                </div>

                <div className="privacy-notice">
                  <i className="fa fa-shield-alt" />

                  <div>
                    <strong>
                      Privacy protection
                    </strong>

                    <p>
                      Assign a privacy nickname
                      that can be used within
                      adherence monitoring and
                      internal clinical records.
                    </p>
                  </div>
                </div>

                <div className="form-field">
                  <label>
                    Patient privacy nickname
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    value={
                      patientNickname
                    }
                    onChange={(e) =>
                      setPatientNickname(
                        e.target.value
                      )
                    }
                    placeholder="e.g. P-1024"
                    required
                  />
                </div>

              </div>

              <div className="modal-footer-clinical">

                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => {
                    setSelectedPendingPatient(
                      null
                    );
                    setPatientNickname('');
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="approve-btn large"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-check" />
                      Confirm approval
                    </>
                  )}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          PAGE STYLES
      ===================================================== */}

      <style>{`
        :root {
          --doctor-primary: #2563eb;
          --doctor-primary-dark: #1d4ed8;
          --doctor-primary-soft: #eff6ff;
          --doctor-sidebar: #172033;
          --doctor-sidebar-hover: #202d46;
          --doctor-bg: #f5f7fb;
          --doctor-border: #e5eaf1;
          --doctor-text: #172033;
          --doctor-muted: #718096;
          --doctor-green: #10b981;
          --doctor-orange: #f59e0b;
          --doctor-red: #ef4444;
        }

        * {
          box-sizing: border-box;
        }

        .doctor-app {
          min-height: 100vh;
          background: var(--doctor-bg);
          color: var(--doctor-text);
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        /* SIDEBAR */

        .doctor-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 250px;
          background: var(--doctor-sidebar);
          color: #fff;
          z-index: 1000;
          transition: width .25s ease;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .doctor-sidebar.closed {
          width: 76px;
        }

        .sidebar-brand {
          height: 72px;
          padding: 0 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,.07);
          flex-shrink: 0;
        }

        .brand-mark {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: var(--doctor-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
          box-shadow: 0 5px 15px rgba(37,99,235,.25);
        }

        .brand-title {
          font-size: 16px;
          font-weight: 750;
          letter-spacing: -.2px;
        }

        .brand-subtitle {
          color: #8d9ab0;
          font-size: 10px;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .sidebar-section {
          padding: 24px 12px 0;
        }

        .sidebar-label {
          font-size: 10px;
          font-weight: 700;
          color: #6e7c94;
          letter-spacing: 1.1px;
          padding: 0 12px 9px;
        }

        .sidebar-item {
          width: 100%;
          height: 44px;
          border: 0;
          background: transparent;
          color: #9ba8bb;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 0 13px;
          border-radius: 7px;
          margin-bottom: 4px;
          text-align: left;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all .18s ease;
          white-space: nowrap;
        }

        .sidebar-item i {
          width: 18px;
          text-align: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .sidebar-item:hover {
          background: var(--doctor-sidebar-hover);
          color: #fff;
        }

        .sidebar-item.active {
          background: #24406e;
          color: #fff;
          box-shadow: inset 3px 0 0 var(--doctor-primary);
        }

        .sidebar-count {
          margin-left: auto;
          font-size: 11px;
          background: rgba(255,255,255,.08);
          padding: 2px 7px;
          border-radius: 20px;
          color: #bac5d5;
        }

        .sidebar-alert-count {
          margin-left: auto;
          background: #ef4444;
          color: #fff;
          min-width: 19px;
          height: 19px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        }

        .sidebar-bottom {
          margin-top: auto;
          padding: 14px 12px 18px;
          border-top: 1px solid rgba(255,255,255,.07);
        }

        .doctor-profile-mini {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px 14px;
        }

        .doctor-avatar,
        .topbar-avatar {
          border-radius: 50%;
          background: #dbeafe;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 750;
          flex-shrink: 0;
        }

        .doctor-avatar {
          width: 35px;
          height: 35px;
          font-size: 13px;
        }

        .doctor-profile-info {
          min-width: 0;
        }

        .doctor-profile-info strong {
          display: block;
          color: #fff;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 145px;
        }

        .doctor-profile-info small {
          display: block;
          color: #7e8ba0;
          font-size: 10px;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 145px;
        }

        .logout-item {
          color: #9ba8bb;
        }

        .logout-item:hover {
          color: #fca5a5;
          background: rgba(239,68,68,.08);
        }

        /* MAIN */

        .doctor-main {
          margin-left: 250px;
          min-height: 100vh;
          transition: margin-left .25s ease;
        }

        .doctor-main.sidebar-collapsed {
          margin-left: 76px;
        }

        .doctor-topbar {
          height: 72px;
          background: #fff;
          border-bottom: 1px solid var(--doctor-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 30px;
          position: sticky;
          top: 0;
          z-index: 900;
        }

        .topbar-left,
        .topbar-right {
          display: flex;
          align-items: center;
        }

        .menu-toggle {
          width: 36px;
          height: 36px;
          border: 0;
          background: transparent;
          color: #65748b;
          border-radius: 7px;
          cursor: pointer;
          margin-right: 18px;
        }

        .menu-toggle:hover {
          background: #f1f4f8;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #9aa6b8;
          font-size: 12px;
        }

        .breadcrumb i {
          font-size: 8px;
        }

        .breadcrumb strong {
          color: #263449;
          font-weight: 650;
        }

        .topbar-icon {
          width: 36px;
          height: 36px;
          border: 0;
          background: transparent;
          color: #738197;
          border-radius: 7px;
          cursor: pointer;
        }

        .topbar-icon:hover {
          background: #f2f5f9;
          color: var(--doctor-primary);
        }

        .topbar-divider {
          height: 28px;
          width: 1px;
          background: var(--doctor-border);
          margin: 0 18px;
        }

        .topbar-doctor {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .topbar-avatar {
          width: 35px;
          height: 35px;
          font-size: 12px;
        }

        .topbar-doctor-info strong {
          display: block;
          font-size: 12px;
          color: #263449;
        }

        .topbar-doctor-info small {
          display: block;
          color: #8b98aa;
          font-size: 10px;
          margin-top: 2px;
        }

        .topbar-chevron {
          color: #9aa5b5;
          font-size: 9px;
          margin-left: 3px;
        }

        .doctor-content {
          padding: 30px;
          max-width: 1600px;
          margin: 0 auto;
        }

        /* ALERTS */

        .system-alert {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px 16px;
          border-radius: 9px;
          margin-bottom: 22px;
          border: 1px solid;
        }

        .system-alert .alert-icon {
          width: 32px;
          height: 32px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .system-alert strong {
          display: block;
          font-size: 12px;
        }

        .system-alert p {
          margin: 2px 0 0;
          font-size: 11px;
        }

        .system-alert button {
          margin-left: auto;
          border: 0;
          background: transparent;
          opacity: .55;
          cursor: pointer;
        }

        .danger-alert {
          background: #fff7f7;
          border-color: #fecaca;
          color: #991b1b;
        }

        .danger-alert .alert-icon {
          background: #fee2e2;
        }

        .success-alert {
          background: #f0fdf8;
          border-color: #bbf7d0;
          color: #166534;
        }

        .success-alert .alert-icon {
          background: #dcfce7;
        }

        /* HEADINGS */

        .page-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 27px;
        }

        .eyebrow {
          color: var(--doctor-primary);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          margin-bottom: 6px;
        }

        .page-heading h1 {
          margin: 0;
          font-size: 26px;
          line-height: 1.2;
          letter-spacing: -.6px;
          font-weight: 750;
          color: #182337;
        }

        .page-heading p {
          margin: 7px 0 0;
          color: #77859a;
          font-size: 12px;
        }

        .primary-action,
        .secondary-action,
        .approve-btn,
        .reject-btn {
          border: 0;
          border-radius: 7px;
          min-height: 38px;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: all .18s ease;
          white-space: nowrap;
        }

        .primary-action {
          background: var(--doctor-primary);
          color: #fff;
          box-shadow: 0 3px 10px rgba(37,99,235,.18);
        }

        .primary-action:hover {
          background: var(--doctor-primary-dark);
          transform: translateY(-1px);
        }

        .primary-action:disabled {
          opacity: .65;
          cursor: not-allowed;
          transform: none;
        }

        .secondary-action {
          background: #fff;
          color: #536277;
          border: 1px solid var(--doctor-border);
        }

        .secondary-action:hover {
          border-color: #cbd5e1;
          background: #f9fafb;
          color: #263449;
        }

        .heading-stat {
          min-width: 130px;
          background: #fff;
          border: 1px solid var(--doctor-border);
          padding: 11px 17px;
          border-radius: 8px;
          text-align: right;
        }

        .heading-stat strong {
          display: block;
          font-size: 20px;
          color: var(--doctor-primary);
        }

        .heading-stat span {
          font-size: 10px;
          color: #8995a7;
        }

        .orange-heading strong {
          color: var(--doctor-orange);
        }

        /* STATS */

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 18px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid var(--doctor-border);
          border-radius: 9px;
          padding: 19px;
          min-height: 132px;
          box-shadow: 0 1px 2px rgba(15,23,42,.02);
        }

        .stat-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .stat-label {
          display: block;
          color: #8592a5;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .7px;
          margin-bottom: 8px;
        }

        .stat-value {
          display: block;
          color: #1c2738;
          font-size: 26px;
          line-height: 1;
          letter-spacing: -.7px;
        }

        .stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .stat-icon.blue {
          color: #2563eb;
          background: #eff6ff;
        }

        .stat-icon.green {
          color: #059669;
          background: #ecfdf5;
        }

        .stat-icon.orange {
          color: #d97706;
          background: #fffbeb;
        }

        .stat-icon.red {
          color: #dc2626;
          background: #fef2f2;
        }

        .stat-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          font-size: 9px;
          color: #9aa6b6;
        }

        .stat-positive {
          color: #059669;
          font-weight: 650;
        }

        .stat-warning {
          color: #d97706;
          font-weight: 650;
        }

        .stat-danger {
          color: #dc2626;
          font-weight: 650;
        }

        /* PANELS */

        .panel {
          background: #fff;
          border: 1px solid var(--doctor-border);
          border-radius: 9px;
          box-shadow: 0 1px 2px rgba(15,23,42,.02);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          padding: 20px 21px;
          border-bottom: 1px solid #eef1f5;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 720;
          color: #263449;
        }

        .panel-header p {
          margin: 4px 0 0;
          font-size: 10px;
          color: #8996a8;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.65fr 1fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .text-button {
          background: transparent;
          border: 0;
          color: var(--doctor-primary);
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .text-button:hover {
          color: var(--doctor-primary-dark);
        }

        .panel-badge {
          min-width: 27px;
          height: 27px;
          padding: 0 7px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        }

        .panel-badge.danger {
          color: #dc2626;
          background: #fef2f2;
        }

        /* ADHERENCE */

        .adherence-summary {
          display: flex;
          align-items: center;
          padding: 24px 25px 16px;
          gap: 35px;
        }

        .donut-container {
          width: 125px;
          height: 125px;
          flex-shrink: 0;
        }

        .adherence-donut {
          width: 125px;
          height: 125px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .donut-inner {
          width: 91px;
          height: 91px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .donut-inner strong {
          font-size: 23px;
          color: #253149;
        }

        .donut-inner span {
          color: #9aa5b4;
          font-size: 9px;
          margin-top: 2px;
        }

        .adherence-breakdown {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .breakdown-item {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .breakdown-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .green-dot {
          background: #10b981;
        }

        .orange-dot {
          background: #f59e0b;
        }

        .red-dot {
          background: #ef4444;
        }

        .breakdown-item strong {
          display: inline-block;
          font-size: 13px;
          width: 25px;
        }

        .breakdown-item span:not(.breakdown-dot) {
          color: #7f8ca0;
          font-size: 10px;
        }

        .mini-bars {
          border-top: 1px solid #eef1f5;
          padding: 15px 22px 18px;
        }

        .mini-bar-row {
          display: grid;
          grid-template-columns: 105px 1fr 38px;
          align-items: center;
          gap: 12px;
          margin: 9px 0;
        }

        .mini-bar-name {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-size: 10px;
          color: #566478;
        }

        .mini-bar-track,
        .table-progress,
        .patient-progress {
          height: 5px;
          background: #edf1f5;
          border-radius: 20px;
          overflow: hidden;
        }

        .mini-bar-fill,
        .progress-fill {
          height: 100%;
          border-radius: inherit;
          transition: width .3s ease;
        }

        .mini-bar-fill.success,
        .progress-fill.success {
          background: #10b981;
        }

        .mini-bar-fill.warning,
        .progress-fill.warning {
          background: #f59e0b;
        }

        .mini-bar-fill.danger,
        .progress-fill.danger {
          background: #ef4444;
        }

        .mini-bar-row strong {
          font-size: 10px;
          text-align: right;
          color: #3d4a5f;
        }

        /* RISK */

        .risk-list {
          padding: 7px 21px 15px;
        }

        .risk-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 0;
          border-bottom: 1px solid #f0f2f5;
          cursor: pointer;
        }

        .risk-item:last-child {
          border-bottom: 0;
        }

        .risk-avatar {
          width: 33px;
          height: 33px;
          border-radius: 8px;
          background: #fff1f2;
          color: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .risk-info {
          flex: 1;
          min-width: 0;
        }

        .risk-info strong {
          display: block;
          font-size: 11px;
          color: #344055;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .risk-info span {
          display: block;
          color: #9aa5b4;
          font-size: 9px;
          margin-top: 3px;
        }

        .risk-value {
          color: #dc2626;
          font-size: 12px;
          font-weight: 750;
        }

        /* TABLE */

        .recent-panel {
          overflow: hidden;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .clinical-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        .clinical-table th {
          padding: 12px 21px;
          text-align: left;
          color: #97a3b4;
          font-size: 9px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: .5px;
          background: #fafbfc;
          border-bottom: 1px solid #eef1f5;
        }

        .clinical-table td {
          padding: 13px 21px;
          border-bottom: 1px solid #f0f2f5;
          color: #536175;
          white-space: nowrap;
        }

        .clinical-table tbody tr {
          cursor: pointer;
          transition: background .15s ease;
        }

        .clinical-table tbody tr:hover {
          background: #fafcff;
        }

        .clinical-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .table-person {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .table-avatar {
          width: 31px;
          height: 31px;
          border-radius: 7px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
        }

        .table-person strong {
          display: block;
          color: #344055;
          font-size: 11px;
        }

        .table-person span {
          display: block;
          color: #a0aaba;
          font-size: 9px;
          margin-top: 2px;
        }

        .mode-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f5f7fa;
          padding: 5px 8px;
          border-radius: 5px;
          color: #64748b;
          font-size: 9px;
          font-weight: 700;
        }

        .mode-badge i {
          color: var(--doctor-primary);
        }

        .table-adherence {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .table-progress {
          width: 70px;
        }

        .table-adherence strong {
          font-size: 10px;
          color: #455269;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 5px;
          font-size: 8px;
          font-weight: 750;
        }

        .status-badge.success {
          background: #ecfdf5;
          color: #059669;
        }

        .status-badge.warning {
          background: #fffbeb;
          color: #d97706;
        }

        .status-badge.danger {
          background: #fef2f2;
          color: #dc2626;
        }

        .table-arrow {
          color: #c4ccd7;
          font-size: 9px;
        }

        .table-empty {
          text-align: center !important;
          padding: 45px !important;
          color: #9aa6b6 !important;
        }

        /* PATIENTS */

        .patient-toolbar {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #eef1f5;
        }

        .search-box {
          width: 320px;
          height: 37px;
          border: 1px solid #e0e6ee;
          border-radius: 7px;
          background: #fff;
          display: flex;
          align-items: center;
          padding: 0 12px;
          gap: 8px;
        }

        .search-box i {
          color: #9ba7b8;
          font-size: 11px;
        }

        .search-box input {
          border: 0;
          outline: 0;
          width: 100%;
          font-size: 11px;
          color: #344055;
        }

        .search-box input::placeholder {
          color: #a3adbb;
        }

        .filter-group {
          display: flex;
          gap: 5px;
        }

        .filter-btn {
          height: 35px;
          border: 1px solid #e3e8ef;
          background: #fff;
          color: #738197;
          border-radius: 6px;
          padding: 0 12px;
          font-size: 10px;
          cursor: pointer;
        }

        .filter-btn.active {
          background: #eff6ff;
          color: #2563eb;
          border-color: #bfdbfe;
          font-weight: 700;
        }

        .filter-btn.danger-filter.active {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .patient-grid {
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .patient-card {
          border: 1px solid #e5eaf1;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all .18s ease;
        }

        .patient-card:hover {
          border-color: #bfd3f7;
          box-shadow: 0 8px 22px rgba(15,23,42,.06);
          transform: translateY(-2px);
        }

        .patient-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .patient-large-avatar {
          width: 42px;
          height: 42px;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
        }

        .patient-card h3 {
          font-size: 13px;
          margin: 15px 0 3px;
          color: #28354a;
        }

        .patient-real-name {
          font-size: 9px;
          color: #9aa6b6;
          margin: 0 0 15px;
        }

        .patient-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-top: 1px solid #f0f2f5;
          border-bottom: 1px solid #f0f2f5;
          padding: 12px 0;
          margin-bottom: 12px;
        }

        .patient-metrics div + div {
          border-left: 1px solid #edf0f4;
          padding-left: 15px;
        }

        .patient-metrics span {
          display: block;
          color: #9aa6b6;
          font-size: 9px;
        }

        .patient-metrics strong {
          display: block;
          color: #344055;
          font-size: 14px;
          margin-top: 3px;
        }

        .patient-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 11px;
          color: #8793a5;
          font-size: 9px;
        }

        .patient-card-footer span {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .patient-card-footer span:last-child {
          color: #2563eb;
          font-weight: 650;
        }

        .patient-card-footer span:last-child i {
          margin-left: 3px;
        }

        /* REQUESTS */

        .request-list {
          padding: 18px;
        }

        .request-card {
          display: grid;
          grid-template-columns: 1.2fr 1.7fr auto;
          gap: 25px;
          align-items: center;
          padding: 17px;
          border: 1px solid #e7ebf1;
          border-radius: 8px;
          margin-bottom: 10px;
          transition: background .15s ease;
        }

        .request-card:hover {
          background: #fbfcfe;
        }

        .request-person {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .request-avatar {
          width: 39px;
          height: 39px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 12px;
          flex-shrink: 0;
        }

        .request-person h3 {
          margin: 0;
          font-size: 12px;
          color: #334055;
        }

        .request-person p {
          margin: 4px 0 0;
          color: #99a4b4;
          font-size: 9px;
        }

        .request-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .request-details span,
        .request-details strong {
          display: block;
        }

        .request-details span {
          font-size: 8px;
          color: #a0aaba;
          text-transform: uppercase;
          letter-spacing: .4px;
          margin-bottom: 4px;
        }

        .request-details strong {
          font-size: 9px;
          color: #536175;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .request-actions {
          display: flex;
          gap: 6px;
        }

        .approve-btn {
          background: #059669;
          color: #fff;
        }

        .approve-btn:hover {
          background: #047857;
        }

        .approve-btn.large {
          min-width: 150px;
        }

        .reject-btn {
          background: #fff;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .reject-btn:hover {
          background: #fef2f2;
        }

        .approve-btn:disabled,
        .reject-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        /* PRESCRIPTION */

        .prescription-panel {
          overflow: hidden;
        }

        .prescription-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-grid {
          padding: 22px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .form-field.full {
          grid-column: 1 / -1;
        }

        .form-field label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #536175;
          margin-bottom: 6px;
        }

        .form-field label span {
          color: #ef4444;
          margin-left: 3px;
        }

        .form-field input,
        .form-field select,
        .form-field textarea {
          width: 100%;
          border: 1px solid #dfe5ed;
          border-radius: 7px;
          background: #fff;
          padding: 9px 11px;
          color: #344055;
          font-size: 11px;
          outline: 0;
          transition: border-color .15s ease, box-shadow .15s ease;
        }

        .form-field textarea {
          resize: vertical;
        }

        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus {
          border-color: #93b4ef;
          box-shadow: 0 0 0 3px rgba(37,99,235,.08);
        }

        .schedule-preview {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 11px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          padding: 11px 13px;
          border-radius: 7px;
        }

        .schedule-preview-icon {
          width: 30px;
          height: 30px;
          border-radius: 7px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .schedule-preview span,
        .schedule-preview strong {
          display: block;
        }

        .schedule-preview span {
          font-size: 9px;
          color: #8c98aa;
        }

        .schedule-preview strong {
          font-size: 11px;
          color: #455269;
          margin-top: 2px;
        }

        .form-footer {
          border-top: 1px solid #eef1f5;
          padding: 15px 22px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .medication-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .med-info-card {
          background: #fff;
          border: 1px solid var(--doctor-border);
          border-radius: 9px;
          padding: 20px;
          display: flex;
          gap: 13px;
        }

        .med-info-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .med-info-icon.blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .med-info-icon.green {
          background: #ecfdf5;
          color: #059669;
        }

        .med-info-icon.orange {
          background: #fffbeb;
          color: #d97706;
        }

        .med-info-card strong {
          display: block;
          font-size: 12px;
          color: #334055;
        }

        .med-info-card p {
          font-size: 10px;
          line-height: 1.5;
          color: #8b97a9;
          margin: 5px 0 0;
        }

        /* MODALS */

        .clinical-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(15,23,42,.56);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(3px);
        }

        .clinical-modal {
          width: min(760px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          border-radius: 11px;
          box-shadow: 0 25px 70px rgba(15,23,42,.22);
        }

        .small-modal {
          width: min(540px, 100%);
        }

        .modal-clinical-header {
          padding: 20px 23px;
          background: #172033;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .modal-clinical-header.compact {
          padding: 18px 21px;
        }

        .modal-person {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-avatar {
          width: 45px;
          height: 45px;
          border-radius: 9px;
          background: #24406e;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .modal-avatar.orange {
          background: rgba(245,158,11,.16);
          color: #fbbf24;
        }

        .modal-person span {
          display: block;
          font-size: 8px;
          color: #8d9ab0;
          letter-spacing: 1px;
          font-weight: 700;
        }

        .modal-person h2 {
          margin: 3px 0 0;
          font-size: 17px;
        }

        .modal-person p {
          margin: 3px 0 0;
          color: #9aa7ba;
          font-size: 9px;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border: 0;
          background: rgba(255,255,255,.07);
          color: #c7d0dd;
          border-radius: 6px;
          cursor: pointer;
        }

        .modal-close:hover {
          background: rgba(255,255,255,.12);
          color: #fff;
        }

        .modal-body {
          padding: 22px;
        }

        .clinical-metric-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 23px;
        }

        .clinical-metric {
          background: #f8fafc;
          border: 1px solid #edf0f4;
          border-radius: 7px;
          padding: 13px;
        }

        .clinical-metric span {
          display: block;
          color: #9aa5b5;
          font-size: 8px;
          font-weight: 750;
          letter-spacing: .4px;
        }

        .clinical-metric strong {
          display: block;
          font-size: 18px;
          color: #344055;
          margin-top: 5px;
        }

        .success-text {
          color: #059669 !important;
        }

        .danger-text {
          color: #dc2626 !important;
        }

        .modal-section {
          border-top: 1px solid #eef1f5;
          padding-top: 19px;
          margin-top: 19px;
        }

        .modal-section-heading {
          margin-bottom: 12px;
        }

        .modal-section-heading h3 {
          margin: 0;
          font-size: 12px;
          color: #344055;
        }

        .modal-section-heading span {
          font-size: 9px;
          color: #98a3b3;
        }

        .reminder-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .reminder-option {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          padding: 12px;
          border: 1px solid #e3e8ef;
          border-radius: 7px;
          background: #fff;
          cursor: pointer;
        }

        .reminder-option:hover {
          border-color: #bfd3f7;
        }

        .reminder-option.active {
          border-color: #93b4ef;
          background: #f8fbff;
        }

        .reminder-option-icon {
          width: 33px;
          height: 33px;
          border-radius: 7px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .reminder-option strong,
        .reminder-option span {
          display: block;
        }

        .reminder-option strong {
          color: #3a475b;
          font-size: 10px;
        }

        .reminder-option span {
          color: #99a5b5;
          font-size: 8px;
          margin-top: 2px;
        }

        .selected-check {
          margin-left: auto;
          color: #2563eb;
          font-size: 14px;
        }

        .care-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .care-info-grid div {
          padding: 12px;
          border: 1px solid #edf0f4;
          border-radius: 7px;
        }

        .care-info-grid span,
        .care-info-grid strong {
          display: block;
        }

        .care-info-grid span {
          color: #9aa5b5;
          font-size: 8px;
        }

        .care-info-grid strong {
          color: #526075;
          font-size: 9px;
          margin-top: 4px;
          word-break: break-word;
        }

        .modal-footer-clinical {
          border-top: 1px solid #eef1f5;
          padding: 14px 22px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .approval-summary {
          display: flex;
          align-items: center;
          gap: 11px;
          background: #f8fafc;
          padding: 12px;
          border-radius: 7px;
          margin-bottom: 15px;
        }

        .approval-summary strong,
        .approval-summary span {
          display: block;
        }

        .approval-summary strong {
          font-size: 11px;
          color: #354157;
        }

        .approval-summary span {
          font-size: 9px;
          color: #95a0b0;
          margin-top: 3px;
        }

        .privacy-notice {
          display: flex;
          gap: 10px;
          padding: 12px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 7px;
          margin-bottom: 17px;
          color: #1e40af;
        }

        .privacy-notice > i {
          margin-top: 2px;
        }

        .privacy-notice strong {
          font-size: 10px;
        }

        .privacy-notice p {
          font-size: 9px;
          line-height: 1.5;
          margin: 4px 0 0;
          color: #5270ad;
        }

        /* EMPTY STATES */

        .empty-state {
          padding: 38px 20px;
          text-align: center;
          color: #8491a3;
        }

        .large-empty {
          padding: 70px 20px;
        }

        .empty-icon {
          width: 40px;
          height: 40px;
          border-radius: 9px;
          background: #f3f5f8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          color: #9ba7b7;
        }

        .empty-icon.success {
          background: #ecfdf5;
          color: #059669;
        }

        .empty-state strong {
          display: block;
          color: #536175;
          font-size: 11px;
        }

        .empty-state p {
          font-size: 9px;
          margin: 4px 0 0;
        }

        .empty-state-small {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #a1adbc;
          font-size: 10px;
          padding: 20px;
        }

        .full-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #94a0b0;
        }

        .full-empty h3 {
          color: #556276;
          font-size: 13px;
          margin: 8px 0 3px;
        }

        .full-empty p {
          font-size: 10px;
          margin: 0;
        }

        /* LOADING */

        .doctor-loading {
          min-height: 100vh;
          background: #f5f7fb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-card {
          text-align: center;
          background: #fff;
          border: 1px solid #e5eaf1;
          border-radius: 10px;
          padding: 35px 50px;
          box-shadow: 0 10px 35px rgba(15,23,42,.05);
        }

        .loading-logo {
          width: 45px;
          height: 45px;
          border-radius: 10px;
          margin: 0 auto 18px;
          background: #2563eb;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .loading-card h5 {
          font-size: 14px;
          margin: 15px 0 4px;
          color: #344055;
        }

        .loading-card p {
          margin: 0;
          color: #9aa6b6;
          font-size: 10px;
        }

        /* RESPONSIVE */

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .patient-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .medication-info-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .doctor-sidebar {
            width: 76px;
          }

          .doctor-sidebar.open {
            width: 250px;
          }

          .doctor-main {
            margin-left: 76px;
          }

          .doctor-content {
            padding: 22px;
          }

          .request-card {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .request-actions {
            justify-content: flex-start;
          }
        }

        @media (max-width: 700px) {
          .doctor-topbar {
            padding: 0 15px;
          }

          .breadcrumb {
            display: none;
          }

          .topbar-doctor-info,
          .topbar-chevron,
          .topbar-divider {
            display: none;
          }

          .doctor-content {
            padding: 17px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .page-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .page-heading h1 {
            font-size: 22px;
          }

          .patient-toolbar {
            flex-direction: column;
          }

          .search-box {
            width: 100%;
          }

          .filter-group {
            overflow-x: auto;
          }

          .patient-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-field.full,
          .schedule-preview {
            grid-column: auto;
          }

          .clinical-metric-grid,
          .care-info-grid,
          .reminder-selector {
            grid-template-columns: 1fr;
          }

          .adherence-summary {
            flex-direction: column;
            align-items: flex-start;
          }

          .mini-bar-row {
            grid-template-columns: 85px 1fr 30px;
          }

          .doctor-sidebar.open {
            width: 250px;
          }

          .doctor-sidebar.open + .doctor-main {
            margin-left: 76px;
          }

          .request-details {
            grid-template-columns: 1fr;
          }

          .table-wrapper {
            margin: 0 -1px;
          }

          .clinical-table {
            min-width: 700px;
          }
        }
      `}</style>
    </div>
  );
}