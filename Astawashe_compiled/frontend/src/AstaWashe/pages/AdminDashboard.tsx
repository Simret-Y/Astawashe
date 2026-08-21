import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJson, postJson } from '../lib/api';
import { isAuthenticated, logout, getCurrentUser } from '../lib/auth';

interface SystemOverview {
  overview: {
    totalUsers: number;
    activeHospitals: number;
    activeDoctors: number;
    totalPatients: number;
    activePatients: number;
  };
  pending: {
    hospitals: number;
    doctors: number;
    patients: number;
  };
  revenue: {
    total: number;
  };
}

interface PendingHospital {
  id: string;
  name: string;
  organizationType?: string;
  licenseNumber?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  status: string;
  createdAt: string;
}

interface PendingDoctor {
  id: string;
  name: string;
  specialization?: string;
  status: string;
  user?: {
    email?: string;
    phone?: string;
  };
  hospital?: {
    name: string;
  };
  createdAt: string;
}

interface PendingPatient {
  id: string;
  fullName: string;
  status: string;
  user?: {
    email?: string;
    phone?: string;
  };
  hospital?: {
    name: string;
  };
  assignedDoctor?: {
    name: string;
  };
  createdAt: string;
}

type Tab = 'overview' | 'approvals' | 'hospitals';

function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const icons: Record<string, ReactNode> = {
    grid: (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),

    users: (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),

    hospital: (
      <svg {...common}>
        <path d="M3 21h18" />
        <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
        <path d="M9 7h6" />
        <path d="M12 4v6" />
        <path d="M8 13h2" />
        <path d="M14 13h2" />
        <path d="M8 17h2" />
        <path d="M14 17h2" />
      </svg>
    ),

    doctor: (
      <svg {...common}>
        <circle cx="12" cy="7" r="4" />
        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        <path d="M9 15h6" />
      </svg>
    ),

    patient: (
      <svg {...common}>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </svg>
    ),

    clock: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),

    check: (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    ),

    x: (
      <svg {...common}>
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    ),

    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    ),

    bell: (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    ),

    settings: (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7v-2h.84A1.7 1.7 0 0 0 9.4 11a1.7 1.7 0 0 0-.34-1.88L9 9.06l1.42-1.42.06.06A1.7 1.7 0 0 0 12.36 8.04 1.7 1.7 0 0 0 13.39 6.5V6h2v.5a1.7 1.7 0 0 0 1.03 1.54 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.42 1.42-.06.06A1.7 1.7 0 0 0 19.4 11a1.7 1.7 0 0 0 1.56 1.03H21v2h-.04A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    ),

    logout: (
      <svg {...common}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
    ),

    menu: (
      <svg {...common}>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),

    refresh: (
      <svg {...common}>
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
      </svg>
    ),

    plus: (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),

    building: (
      <svg {...common}>
        <path d="M4 21V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v17" />
        <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
        <path d="M10 21v-3h4v3" />
      </svg>
    ),

    activity: (
      <svg {...common}>
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </svg>
    ),

    shield: (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),

    arrow: (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    ),

    more: (
      <svg {...common}>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </svg>
    ),
  };

  return <span style={{ display: 'inline-flex' }}>{icons[name] || icons.grid}</span>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [stats, setStats] = useState<SystemOverview | null>(null);
  const [pendingHospitals, setPendingHospitals] = useState<PendingHospital[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>([]);
  const [allHospitals, setAllHospitals] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [showAddHospital, setShowAddHospital] = useState(false);

  const [newHospital, setNewHospital] = useState({
    name: '',
    organizationType: 'General Hospital',
    licenseNumber: '',
    registrationNumber: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    description: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    if (
      currentUser?.role !== 'SYSTEM_ADMIN' &&
      currentUser?.role !== ('ADMIN' as any)
    ) {
      navigate('/auth');
      return;
    }

    loadAdminData();
  }, [navigate]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        statsRes,
        pendHospRes,
        pendDocRes,
        pendPatRes,
        hospitalsRes,
      ] = await Promise.all([
        getJson<any>('/dashboards/admin').catch(() => null),
        getJson<any>('/approvals/admin/hospitals/pending').catch(() => null),
        getJson<any>('/approvals/admin/doctors/pending').catch(() => null),
        getJson<any>('/approvals/admin/patients/pending').catch(() => null),
        getJson<any>('/hospitals').catch(() => null),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (pendHospRes?.data) setPendingHospitals(pendHospRes.data);
      if (pendDocRes?.data) setPendingDoctors(pendDocRes.data);
      if (pendPatRes?.data) setPendingPatients(pendPatRes.data);

      const rawHospitals = hospitalsRes?.data || hospitalsRes || [];
      const list = Array.isArray(rawHospitals) ? rawHospitals : [];

      setAllHospitals(list);

      if (
        (!pendHospRes?.data || pendHospRes.data.length === 0) &&
        list.length > 0
      ) {
        const pendingFromList = list.filter(
          (h: any) => h.status === 'PENDING'
        );

        if (pendingFromList.length > 0) {
          setPendingHospitals(pendingFromList);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveHospital = async (
    hospitalId: string,
    action: 'APPROVE' | 'REJECT'
  ) => {
    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      await postJson(`/approvals/admin/hospitals/${hospitalId}/approve`, {
        action,
        reason: `System Admin ${action.toLowerCase()}d`,
      });

      setActionSuccess(
        `Hospital ${action.toLowerCase()}d successfully.`
      );

      await loadAdminData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveDoctor = async (
    doctorId: string,
    action: 'APPROVE' | 'REJECT'
  ) => {
    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      await postJson(`/approvals/admin/doctors/${doctorId}/approve`, {
        action,
        reason: `System Admin ${action.toLowerCase()}d`,
      });

      setActionSuccess(
        `Doctor ${action.toLowerCase()}d successfully.`
      );

      await loadAdminData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovePatient = async (
    patientId: string,
    action: 'APPROVE' | 'REJECT'
  ) => {
    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      await postJson(`/approvals/admin/patients/${patientId}/approve`, {
        action,
        reason: `System Admin ${action.toLowerCase()}d`,
      });

      setActionSuccess(
        `Patient ${action.toLowerCase()}d successfully.`
      );

      await loadAdminData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newHospital.name.trim()) return;

    try {
      setActionLoading(true);
      setError('');

      await postJson('/hospitals', newHospital);

      setActionSuccess('New hospital created successfully.');

      setShowAddHospital(false);

      setNewHospital({
        name: '',
        organizationType: 'General Hospital',
        licenseNumber: '',
        registrationNumber: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        description: '',
      });

      await loadAdminData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const filteredHospitals = useMemo(() => {
    return allHospitals.filter((h) => {
      const search = searchQuery.toLowerCase();

      const matchesSearch =
        h.name?.toLowerCase().includes(search) ||
        h.city?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === 'ALL' || h.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allHospitals, searchQuery, statusFilter]);

  const totalPending =
    pendingHospitals.length +
    pendingDoctors.length +
    pendingPatients.length;

  const totalActive =
    (stats?.overview?.activeHospitals || 0) +
    (stats?.overview?.activeDoctors || 0) +
    (stats?.overview?.activePatients || 0);

  const statCards = [
    {
      label: 'Registered Users',
      value: stats?.overview?.totalUsers || 0,
      description: 'Total accounts on AstaWashe',
      icon: 'users',
      className: 'blue',
    },
    {
      label: 'Approved Hospitals',
      value: stats?.overview?.activeHospitals || 0,
      description: 'Verified healthcare facilities',
      icon: 'hospital',
      className: 'green',
    },
    {
      label: 'Active Doctors',
      value: stats?.overview?.activeDoctors || 0,
      description: 'Healthcare professionals',
      icon: 'doctor',
      className: 'purple',
    },
    {
      label: 'Active Patients',
      value: stats?.overview?.activePatients || 0,
      description: 'Patients linked to care',
      icon: 'patient',
      className: 'orange',
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f5f7fb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: 40, height: 40 }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>

          <p className="mt-3 text-muted mb-0">
            Loading AstaWashe administration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        color: '#263246',
      }}
    >
      {/* ================= SIDEBAR ================= */}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: sidebarOpen ? 245 : 72,
          background: '#182235',
          color: '#fff',
          zIndex: 1050,
          transition: 'width .25s ease',
          overflow: 'hidden',
          boxShadow: '3px 0 15px rgba(20,30,50,.08)',
        }}
      >
        {/* Brand */}

        <div
          style={{
            height: 68,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            borderBottom: '1px solid rgba(255,255,255,.07)',
            gap: 11,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: '#356fe5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="shield" size={19} />
          </div>

          {sidebarOpen && (
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 17,
                  letterSpacing: '-.2px',
                }}
              >
                AstaWashe
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: '#8f9bb0',
                  marginTop: -1,
                  textTransform: 'uppercase',
                  letterSpacing: '.7px',
                }}
              >
                Administration
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}

        <div style={{ padding: '22px 12px' }}>
          {sidebarOpen && (
            <div
              style={{
                color: '#68768e',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                padding: '0 12px 9px',
              }}
            >
              Main Menu
            </div>
          )}

          <button
            onClick={() => setActiveTab('overview')}
            className="border-0 w-100 text-start"
            style={{
              height: 43,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '0 13px',
              color: activeTab === 'overview' ? '#fff' : '#9da9bc',
              background:
                activeTab === 'overview'
                  ? 'rgba(61,111,229,.28)'
                  : 'transparent',
              fontWeight: activeTab === 'overview' ? 600 : 400,
              marginBottom: 4,
            }}
          >
            <Icon name="grid" size={18} />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className="border-0 w-100 text-start"
            style={{
              height: 43,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '0 13px',
              color: activeTab === 'approvals' ? '#fff' : '#9da9bc',
              background:
                activeTab === 'approvals'
                  ? 'rgba(61,111,229,.28)'
                  : 'transparent',
              marginBottom: 4,
              position: 'relative',
            }}
          >
            <Icon name="clock" size={18} />

            {sidebarOpen && <span>Approvals</span>}

            {totalPending > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  background: '#e64f61',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {totalPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('hospitals')}
            className="border-0 w-100 text-start"
            style={{
              height: 43,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '0 13px',
              color: activeTab === 'hospitals' ? '#fff' : '#9da9bc',
              background:
                activeTab === 'hospitals'
                  ? 'rgba(61,111,229,.28)'
                  : 'transparent',
              marginBottom: 4,
            }}
          >
            <Icon name="hospital" size={18} />

            {sidebarOpen && (
              <>
                <span>Hospitals</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    color: '#758299',
                  }}
                >
                  {allHospitals.length}
                </span>
              </>
            )}
          </button>

          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,.06)',
              margin: '18px 7px',
            }}
          />

          {sidebarOpen && (
            <div
              style={{
                color: '#68768e',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                padding: '0 12px 9px',
              }}
            >
              System
            </div>
          )}

          <button
            className="border-0 w-100 text-start"
            style={{
              height: 43,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '0 13px',
              color: '#9da9bc',
              background: 'transparent',
              marginBottom: 4,
            }}
          >
            <Icon name="activity" size={18} />
            {sidebarOpen && <span>System Activity</span>}
          </button>

          <button
            className="border-0 w-100 text-start"
            style={{
              height: 43,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '0 13px',
              color: '#9da9bc',
              background: 'transparent',
              marginBottom: 4,
            }}
          >
            <Icon name="settings" size={18} />
            {sidebarOpen && <span>System Settings</span>}
          </button>
        </div>

        {/* Sidebar footer */}

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: '1px solid rgba(255,255,255,.07)',
            padding: '14px',
          }}
        >
          <button
            onClick={handleLogout}
            className="border-0 w-100"
            style={{
              height: 40,
              background: 'transparent',
              color: '#9da9bc',
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '0 10px',
              borderRadius: 7,
            }}
          >
            <Icon name="logout" size={17} />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <main
        style={{
          marginLeft: sidebarOpen ? 245 : 72,
          transition: 'margin-left .25s ease',
          minHeight: '100vh',
        }}
      >
        {/* TOP BAR */}

        <header
          style={{
            height: 68,
            background: '#fff',
            borderBottom: '1px solid #e8ebf1',
            display: 'flex',
            alignItems: 'center',
            padding: '0 28px',
            gap: 22,
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn border-0 p-0 text-secondary"
          >
            <Icon name="menu" size={21} />
          </button>

          {/* Search */}

          <div
            style={{
              width: 330,
              height: 37,
              border: '1px solid #e3e7ee',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              color: '#9aa4b5',
            }}
          >
            <Icon name="search" size={17} />

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospitals..."
              style={{
                border: 0,
                outline: 0,
                width: '100%',
                marginLeft: 9,
                fontSize: 13,
                color: '#374151',
              }}
            />
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
            <button
              className="btn border-0 p-0 text-secondary position-relative"
              onClick={() => setActiveTab('approvals')}
            >
              <Icon name="bell" size={19} />

              {totalPending > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -4,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#e54f61',
                    border: '1px solid #fff',
                  }}
                />
              )}
            </button>

            <div
              style={{
                width: 1,
                height: 25,
                background: '#e7eaf0',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 35,
                  height: 35,
                  borderRadius: '50%',
                  background: '#e8eefc',
                  color: '#356fe5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                SA
              </div>

              <div className="d-none d-md-block">
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#293449',
                  }}
                >
                  System Administrator
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: '#8a95a7',
                  }}
                >
                  {currentUser?.email || 'astawashe@insa.edu.et'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <div style={{ padding: '28px 30px' }}>
          {/* Alerts */}

          {error && (
            <div className="alert alert-danger d-flex align-items-center rounded-3 mb-4">
              <Icon name="x" size={18} />
              <span className="ms-2">{error}</span>

              <button
                className="btn-close ms-auto"
                onClick={() => setError('')}
              />
            </div>
          )}

          {actionSuccess && (
            <div className="alert alert-success d-flex align-items-center rounded-3 mb-4">
              <Icon name="check" size={18} />
              <span className="ms-2">{actionSuccess}</span>

              <button
                className="btn-close ms-auto"
                onClick={() => setActionSuccess('')}
              />
            </div>
          )}

          {/* PAGE HEADER */}

          <div
            className="d-flex flex-wrap align-items-center justify-content-between gap-3"
            style={{ marginBottom: 25 }}
          >
            <div>
              <h2
                style={{
                  fontSize: 25,
                  fontWeight: 700,
                  marginBottom: 5,
                  color: '#263246',
                  letterSpacing: '-.5px',
                }}
              >
                System Overview
              </h2>

              <p
                style={{
                  margin: 0,
                  color: '#8b95a7',
                  fontSize: 13,
                }}
              >
                Monitor AstaWashe healthcare operations and registration activity.
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-light border"
                onClick={loadAdminData}
                style={{
                  height: 38,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Icon name="refresh" size={15} />
                <span className="ms-2">Refresh</span>
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab('hospitals');
                  setShowAddHospital(true);
                }}
                style={{
                  height: 38,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Icon name="plus" size={15} />
                <span className="ms-2">Add Hospital</span>
              </button>
            </div>
          </div>

          {/* ================= OVERVIEW ================= */}

          {activeTab === 'overview' && (
            <>
              {/* KPI CARDS */}

              <div className="row g-3 mb-4">
                {statCards.map((card) => (
                  <div
                    className="col-12 col-sm-6 col-xl-3"
                    key={card.label}
                  >
                    <div
                      style={{
                        background: '#fff',
                        border: '1px solid #e8ebf1',
                        borderRadius: 9,
                        padding: '20px',
                        minHeight: 145,
                        boxShadow: '0 2px 5px rgba(25,40,70,.025)',
                      }}
                    >
                      <div
                        className="d-flex justify-content-between align-items-start"
                      >
                        <div>
                          <div
                            style={{
                              color: '#8a94a6',
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '.45px',
                            }}
                          >
                            {card.label}
                          </div>

                          <div
                            style={{
                              fontSize: 30,
                              lineHeight: 1.2,
                              fontWeight: 700,
                              marginTop: 10,
                              color: '#273348',
                            }}
                          >
                            {card.value.toLocaleString()}
                          </div>
                        </div>

                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background:
                              card.className === 'blue'
                                ? '#edf3ff'
                                : card.className === 'green'
                                ? '#eaf8f1'
                                : card.className === 'purple'
                                ? '#f2efff'
                                : '#fff3e9',
                            color:
                              card.className === 'blue'
                                ? '#4777dd'
                                : card.className === 'green'
                                ? '#2caa72'
                                : card.className === 'purple'
                                ? '#8067d8'
                                : '#ed8a45',
                          }}
                        >
                          <Icon name={card.icon} size={21} />
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 14,
                          fontSize: 11,
                          color: '#9aa3b2',
                        }}
                      >
                        {card.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* MAIN GRID */}

              <div className="row g-3">
                {/* Pending requests */}

                <div className="col-xl-8">
                  <div
                    style={{
                      background: '#fff',
                      border: '1px solid #e8ebf1',
                      borderRadius: 9,
                      height: '100%',
                    }}
                  >
                    <div
                      className="d-flex justify-content-between align-items-center"
                      style={{
                        padding: '18px 20px',
                        borderBottom: '1px solid #edf0f4',
                      }}
                    >
                      <div>
                        <h5
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            margin: 0,
                          }}
                        >
                          Registration Requests
                        </h5>

                        <div
                          style={{
                            color: '#9aa3b2',
                            fontSize: 11,
                            marginTop: 4,
                          }}
                        >
                          Applications requiring administrative review
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab('approvals')}
                        className="btn btn-sm btn-light border"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        View all
                        <span className="ms-1">
                          <Icon name="arrow" size={13} />
                        </span>
                      </button>
                    </div>

                    <div style={{ padding: 10 }}>
                      {[
                        {
                          title: 'Hospital registrations',
                          count: pendingHospitals.length,
                          icon: 'hospital',
                          description:
                            'Healthcare facilities awaiting verification',
                        },
                        {
                          title: 'Doctor registrations',
                          count: pendingDoctors.length,
                          icon: 'doctor',
                          description:
                            'Doctors waiting for account approval',
                        },
                        {
                          title: 'Patient registrations',
                          count: pendingPatients.length,
                          icon: 'patient',
                          description:
                            'Patients waiting for care assignment',
                        },
                      ].map((item) => (
                        <button
                          key={item.title}
                          onClick={() => setActiveTab('approvals')}
                          className="w-100 border-0 text-start"
                          style={{
                            background: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '14px 12px',
                            borderRadius: 7,
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 8,
                              background: '#f0f4fb',
                              color: '#5274a8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon name={item.icon} size={19} />
                          </div>

                          <div className="ms-3">
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 650,
                                color: '#354052',
                              }}
                            >
                              {item.title}
                            </div>

                            <div
                              style={{
                                fontSize: 11,
                                color: '#9aa3b2',
                                marginTop: 2,
                              }}
                            >
                              {item.description}
                            </div>
                          </div>

                          <div
                            style={{
                              marginLeft: 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                            }}
                          >
                            <span
                              style={{
                                minWidth: 30,
                                height: 27,
                                padding: '0 8px',
                                borderRadius: 6,
                                background:
                                  item.count > 0
                                    ? '#fff1df'
                                    : '#f2f4f7',
                                color:
                                  item.count > 0
                                    ? '#d98222'
                                    : '#8d97a6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {item.count}
                            </span>

                            <Icon
                              name="arrow"
                              size={15}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* System health */}

                <div className="col-xl-4">
                  <div
                    style={{
                      background: '#fff',
                      border: '1px solid #e8ebf1',
                      borderRadius: 9,
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        padding: '18px 20px',
                        borderBottom: '1px solid #edf0f4',
                      }}
                    >
                      <h5
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        System Snapshot
                      </h5>

                      <div
                        style={{
                          color: '#9aa3b2',
                          fontSize: 11,
                          marginTop: 4,
                        }}
                      >
                        Current platform activity
                      </div>
                    </div>

                    <div style={{ padding: '18px 20px' }}>
                      <div className="d-flex justify-content-between mb-2">
                        <span
                          style={{
                            fontSize: 12,
                            color: '#697386',
                          }}
                        >
                          Active care network
                        </span>

                        <strong style={{ fontSize: 12 }}>
                          {totalActive}
                        </strong>
                      </div>

                      <div
                        style={{
                          height: 7,
                          background: '#edf0f4',
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width:
                              stats?.overview?.totalUsers
                                ? `${Math.min(
                                    100,
                                    (totalActive /
                                      stats.overview.totalUsers) *
                                      100
                                  )}%`
                                : '0%',
                            height: '100%',
                            background: '#4d79dc',
                            borderRadius: 10,
                          }}
                        />
                      </div>

                      <div className="mt-4">
                        <div
                          className="d-flex justify-content-between align-items-center py-3"
                          style={{
                            borderBottom: '1px solid #f0f2f5',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: '#697386',
                            }}
                          >
                            Hospitals
                          </span>

                          <strong style={{ fontSize: 13 }}>
                            {stats?.overview?.activeHospitals || 0}
                          </strong>
                        </div>

                        <div
                          className="d-flex justify-content-between align-items-center py-3"
                          style={{
                            borderBottom: '1px solid #f0f2f5',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: '#697386',
                            }}
                          >
                            Doctors
                          </span>

                          <strong style={{ fontSize: 13 }}>
                            {stats?.overview?.activeDoctors || 0}
                          </strong>
                        </div>

                        <div
                          className="d-flex justify-content-between align-items-center py-3"
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: '#697386',
                            }}
                          >
                            Patients
                          </span>

                          <strong style={{ fontSize: 13 }}>
                            {stats?.overview?.activePatients || 0}
                          </strong>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          padding: 12,
                          borderRadius: 7,
                          background: '#f1faf6',
                          color: '#31956a',
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Icon name="check" size={15} />
                        Platform services are operational
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hospitals */}

                <div className="col-xl-8">
                  <div
                    style={{
                      background: '#fff',
                      border: '1px solid #e8ebf1',
                      borderRadius: 9,
                    }}
                  >
                    <div
                      className="d-flex justify-content-between align-items-center"
                      style={{
                        padding: '18px 20px',
                        borderBottom: '1px solid #edf0f4',
                      }}
                    >
                      <div>
                        <h5
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            margin: 0,
                          }}
                        >
                          Healthcare Network
                        </h5>

                        <div
                          style={{
                            fontSize: 11,
                            color: '#9aa3b2',
                            marginTop: 4,
                          }}
                        >
                          Recently registered healthcare facilities
                        </div>
                      </div>

                      <button
                        className="btn btn-sm btn-light border"
                        style={{ fontSize: 11 }}
                        onClick={() => setActiveTab('hospitals')}
                      >
                        Manage
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table
                        className="table align-middle mb-0"
                        style={{ fontSize: 12 }}
                      >
                        <thead>
                          <tr
                            style={{
                              background: '#fafbfc',
                              color: '#929baa',
                              fontSize: 10,
                              textTransform: 'uppercase',
                            }}
                          >
                            <th className="border-0 px-4 py-3">
                              Healthcare Facility
                            </th>
                            <th className="border-0">
                              Location
                            </th>
                            <th className="border-0">
                              Doctors
                            </th>
                            <th className="border-0">
                              Status
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {allHospitals.slice(0, 5).map((hospital) => (
                            <tr key={hospital.id}>
                              <td className="px-4">
                                <div className="d-flex align-items-center gap-2">
                                  <div
                                    style={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: 6,
                                      background: '#edf3ff',
                                      color: '#4777dd',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Icon name="building" size={15} />
                                  </div>

                                  <strong
                                    style={{
                                      color: '#3b4658',
                                      fontSize: 12,
                                    }}
                                  >
                                    {hospital.name}
                                  </strong>
                                </div>
                              </td>

                              <td
                                style={{
                                  color: '#7f8999',
                                }}
                              >
                                {hospital.city ||
                                  hospital.address ||
                                  'Not specified'}
                              </td>

                              <td>
                                {hospital._count?.doctors ?? 0}
                              </td>

                              <td>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '4px 8px',
                                    borderRadius: 20,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background:
                                      hospital.status === 'APPROVED'
                                        ? '#eaf8f1'
                                        : hospital.status === 'PENDING'
                                        ? '#fff4e5'
                                        : '#ffeded',
                                    color:
                                      hospital.status === 'APPROVED'
                                        ? '#299466'
                                        : hospital.status === 'PENDING'
                                        ? '#d88a26'
                                        : '#d04e5d',
                                  }}
                                >
                                  {hospital.status}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {allHospitals.length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="text-center text-muted py-4"
                              >
                                No healthcare facilities registered yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}

                <div className="col-xl-4">
                  <div
                    style={{
                      background: '#fff',
                      border: '1px solid #e8ebf1',
                      borderRadius: 9,
                    }}
                  >
                    <div
                      style={{
                        padding: '18px 20px',
                        borderBottom: '1px solid #edf0f4',
                      }}
                    >
                      <h5
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        Administrative Actions
                      </h5>

                      <div
                        style={{
                          fontSize: 11,
                          color: '#9aa3b2',
                          marginTop: 4,
                        }}
                      >
                        Common system management tasks
                      </div>
                    </div>

                    <div style={{ padding: 12 }}>
                      <button
                        className="w-100 border-0 text-start"
                        onClick={() => setActiveTab('approvals')}
                        style={{
                          background: '#f8f9fb',
                          borderRadius: 7,
                          padding: 13,
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 7,
                            background: '#fff1df',
                            color: '#d98726',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name="clock" size={17} />
                        </div>

                        <div className="ms-3">
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Review approvals
                          </div>

                          <div
                            style={{
                              fontSize: 10,
                              color: '#929baa',
                            }}
                          >
                            {totalPending} request
                            {totalPending !== 1 ? 's' : ''} pending
                          </div>
                        </div>
                      </button>

                      <button
                        className="w-100 border-0 text-start"
                        onClick={() => {
                          setActiveTab('hospitals');
                          setShowAddHospital(true);
                        }}
                        style={{
                          background: '#f8f9fb',
                          borderRadius: 7,
                          padding: 13,
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 7,
                            background: '#edf3ff',
                            color: '#4777dd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name="plus" size={17} />
                        </div>

                        <div className="ms-3">
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Register hospital
                          </div>

                          <div
                            style={{
                              fontSize: 10,
                              color: '#929baa',
                            }}
                          >
                            Add a verified facility
                          </div>
                        </div>
                      </button>

                      <button
                        className="w-100 border-0 text-start"
                        onClick={() => setActiveTab('hospitals')}
                        style={{
                          background: '#f8f9fb',
                          borderRadius: 7,
                          padding: 13,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 7,
                            background: '#eaf8f1',
                            color: '#299466',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name="hospital" size={17} />
                        </div>

                        <div className="ms-3">
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Manage hospitals
                          </div>

                          <div
                            style={{
                              fontSize: 10,
                              color: '#929baa',
                            }}
                          >
                            {allHospitals.length} facilities
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= APPROVALS ================= */}

          {activeTab === 'approvals' && (
            <div className="row g-3">
              {/* Hospitals */}

              <div className="col-12">
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e8ebf1',
                    borderRadius: 9,
                  }}
                >
                  <div
                    className="d-flex justify-content-between align-items-center"
                    style={{
                      padding: '18px 20px',
                      borderBottom: '1px solid #edf0f4',
                    }}
                  >
                    <div>
                      <h5
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        Hospital Registration Requests
                      </h5>

                      <span
                        style={{
                          color: '#929baa',
                          fontSize: 11,
                        }}
                      >
                        Verify healthcare facilities before activation
                      </span>
                    </div>

                    <button
                      className="btn btn-sm btn-light border"
                      onClick={loadAdminData}
                    >
                      <Icon name="refresh" size={14} />
                      <span className="ms-1">Refresh</span>
                    </button>
                  </div>

                  {pendingHospitals.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <Icon name="check" size={28} />
                      <div className="mt-2">
                        No pending hospital registrations.
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr
                            style={{
                              background: '#fafbfc',
                              fontSize: 10,
                              color: '#929baa',
                              textTransform: 'uppercase',
                            }}
                          >
                            <th className="px-4">Hospital</th>
                            <th>Location</th>
                            <th>Email</th>
                            <th>License</th>
                            <th>Submitted</th>
                            <th>Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {pendingHospitals.map((hospital) => (
                            <tr key={hospital.id}>
                              <td className="px-4">
                                <strong>{hospital.name}</strong>
                              </td>

                              <td>
                                {hospital.city ||
                                  hospital.address ||
                                  'N/A'}
                              </td>

                              <td>{hospital.email || 'N/A'}</td>

                              <td>
                                {hospital.licenseNumber || 'N/A'}
                              </td>

                              <td>
                                {new Date(
                                  hospital.createdAt
                                ).toLocaleDateString()}
                              </td>

                              <td>
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() =>
                                      handleApproveHospital(
                                        hospital.id,
                                        'APPROVE'
                                      )
                                    }
                                    disabled={actionLoading}
                                  >
                                    <Icon name="check" size={14} />
                                    <span className="ms-1">
                                      Approve
                                    </span>
                                  </button>

                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() =>
                                      handleApproveHospital(
                                        hospital.id,
                                        'REJECT'
                                      )
                                    }
                                    disabled={actionLoading}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctors */}

              <div className="col-12">
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e8ebf1',
                    borderRadius: 9,
                  }}
                >
                  <div
                    style={{
                      padding: '18px 20px',
                      borderBottom: '1px solid #edf0f4',
                    }}
                  >
                    <h5
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      Doctor Registration Requests
                    </h5>

                    <span
                      style={{
                        color: '#929baa',
                        fontSize: 11,
                      }}
                    >
                      Verify doctors and their hospital association
                    </span>
                  </div>

                  {pendingDoctors.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      No pending doctor registrations.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr
                            style={{
                              background: '#fafbfc',
                              fontSize: 10,
                              color: '#929baa',
                              textTransform: 'uppercase',
                            }}
                          >
                            <th className="px-4">Doctor</th>
                            <th>Specialization</th>
                            <th>Hospital</th>
                            <th>Email</th>
                            <th>Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {pendingDoctors.map((doctor) => (
                            <tr key={doctor.id}>
                              <td className="px-4">
                                <strong>{doctor.name}</strong>
                              </td>

                              <td>
                                {doctor.specialization ||
                                  'General Medicine'}
                              </td>

                              <td>
                                {doctor.hospital?.name || 'N/A'}
                              </td>

                              <td>
                                {doctor.user?.email || 'N/A'}
                              </td>

                              <td>
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() =>
                                      handleApproveDoctor(
                                        doctor.id,
                                        'APPROVE'
                                      )
                                    }
                                    disabled={actionLoading}
                                  >
                                    Approve
                                  </button>

                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() =>
                                      handleApproveDoctor(
                                        doctor.id,
                                        'REJECT'
                                      )
                                    }
                                    disabled={actionLoading}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Patients */}

              <div className="col-12">
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e8ebf1',
                    borderRadius: 9,
                  }}
                >
                  <div
                    style={{
                      padding: '18px 20px',
                      borderBottom: '1px solid #edf0f4',
                    }}
                  >
                    <h5
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      Patient Registration Requests
                    </h5>

                    <span
                      style={{
                        color: '#929baa',
                        fontSize: 11,
                      }}
                    >
                      Review patient onboarding and care assignment
                    </span>
                  </div>

                  {pendingPatients.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      No pending patient registrations.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr
                            style={{
                              background: '#fafbfc',
                              fontSize: 10,
                              color: '#929baa',
                              textTransform: 'uppercase',
                            }}
                          >
                            <th className="px-4">Patient</th>
                            <th>Hospital</th>
                            <th>Assigned Doctor</th>
                            <th>Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                          {pendingPatients.map((patient) => (
                            <tr key={patient.id}>
                              <td className="px-4">
                                <strong>{patient.fullName}</strong>
                              </td>

                              <td>
                                {patient.hospital?.name || 'N/A'}
                              </td>

                              <td>
                                {patient.assignedDoctor?.name ||
                                  'Not assigned'}
                              </td>

                              <td>
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() =>
                                      handleApprovePatient(
                                        patient.id,
                                        'APPROVE'
                                      )
                                    }
                                    disabled={actionLoading}
                                  >
                                    Approve
                                  </button>

                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() =>
                                      handleApprovePatient(
                                        patient.id,
                                        'REJECT'
                                      )
                                    }
                                    disabled={actionLoading}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= HOSPITAL MANAGEMENT ================= */}

          {activeTab === 'hospitals' && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #e8ebf1',
                borderRadius: 9,
              }}
            >
              <div
                className="d-flex flex-wrap justify-content-between align-items-center gap-3"
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid #edf0f4',
                }}
              >
                <div>
                  <h5
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    Hospital Directory
                  </h5>

                  <span
                    style={{
                      color: '#929baa',
                      fontSize: 11,
                    }}
                  >
                    Manage registered healthcare facilities
                  </span>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddHospital(!showAddHospital)}
                >
                  <Icon name="plus" size={14} />
                  <span className="ms-1">
                    {showAddHospital
                      ? 'Cancel'
                      : 'Add Hospital'}
                  </span>
                </button>
              </div>

              {showAddHospital && (
                <form
                  onSubmit={handleCreateHospital}
                  style={{
                    padding: 20,
                    background: '#fafbfc',
                    borderBottom: '1px solid #edf0f4',
                  }}
                >
                  <h6
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    Register Healthcare Facility
                  </h6>

                  <div className="row g-3 mt-1">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        Hospital Name *
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        value={newHospital.name}
                        onChange={(e) =>
                          setNewHospital({
                            ...newHospital,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        Organization Type
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        value={newHospital.organizationType}
                        onChange={(e) =>
                          setNewHospital({
                            ...newHospital,
                            organizationType: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        License Number
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        value={newHospital.licenseNumber}
                        onChange={(e) =>
                          setNewHospital({
                            ...newHospital,
                            licenseNumber: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        City / Location
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        value={newHospital.city}
                        onChange={(e) =>
                          setNewHospital({
                            ...newHospital,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success mt-3"
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? 'Saving...'
                      : 'Save Hospital'}
                  </button>
                </form>
              )}

              {/* Filters */}

              <div style={{ padding: 20 }}>
                <div className="row g-3 mb-3">
                  <div className="col-md-8">
                    <div
                      style={{
                        border: '1px solid #e3e7ee',
                        borderRadius: 7,
                        height: 39,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                      }}
                    >
                      <Icon name="search" size={16} />

                      <input
                        type="text"
                        placeholder="Search hospital by name or city..."
                        value={searchQuery}
                        onChange={(e) =>
                          setSearchQuery(e.target.value)
                        }
                        style={{
                          border: 0,
                          outline: 0,
                          width: '100%',
                          marginLeft: 8,
                          fontSize: 12,
                        }}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value)
                      }
                      style={{ fontSize: 12 }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="APPROVED">Approved</option>
                      <option value="PENDING">Pending</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Hospital grid */}

                <div className="row g-3">
                  {filteredHospitals.length === 0 ? (
                    <div className="col-12 text-center text-muted py-5">
                      No hospitals found.
                    </div>
                  ) : (
                    filteredHospitals.map((hospital) => (
                      <div
                        className="col-md-6 col-xl-4"
                        key={hospital.id}
                      >
                        <div
                          style={{
                            border: '1px solid #e8ebf1',
                            borderRadius: 8,
                            padding: 16,
                            height: '100%',
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 8,
                                background: '#edf3ff',
                                color: '#4777dd',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Icon name="hospital" size={19} />
                            </div>

                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: 20,
                                background:
                                  hospital.status ===
                                  'APPROVED'
                                    ? '#eaf8f1'
                                    : hospital.status ===
                                      'PENDING'
                                    ? '#fff4e5'
                                    : '#ffeded',
                                color:
                                  hospital.status ===
                                  'APPROVED'
                                    ? '#299466'
                                    : hospital.status ===
                                      'PENDING'
                                    ? '#d88a26'
                                    : '#d04e5d',
                              }}
                            >
                              {hospital.status}
                            </span>
                          </div>

                          <h6
                            style={{
                              marginTop: 13,
                              marginBottom: 4,
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {hospital.name}
                          </h6>

                          <div
                            style={{
                              fontSize: 11,
                              color: '#929baa',
                            }}
                          >
                            {hospital.city ||
                              hospital.address ||
                              'Location not set'}
                          </div>

                          <div
                            className="d-flex gap-4"
                            style={{
                              marginTop: 16,
                              paddingTop: 12,
                              borderTop: '1px solid #edf0f4',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: '#9aa3b2',
                                }}
                              >
                                Doctors
                              </div>

                              <strong style={{ fontSize: 13 }}>
                                {hospital._count?.doctors ?? 0}
                              </strong>
                            </div>

                            <div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: '#9aa3b2',
                                }}
                              >
                                License
                              </div>

                              <strong style={{ fontSize: 11 }}>
                                {hospital.licenseNumber ||
                                  'N/A'}
                              </strong>
                            </div>
                          </div>

                          {hospital.status === 'PENDING' && (
                            <button
                              className="btn btn-success btn-sm w-100 mt-3"
                              onClick={() =>
                                handleApproveHospital(
                                  hospital.id,
                                  'APPROVE'
                                )
                              }
                              disabled={actionLoading}
                            >
                              <Icon name="check" size={14} />
                              <span className="ms-1">
                                Approve Hospital
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}