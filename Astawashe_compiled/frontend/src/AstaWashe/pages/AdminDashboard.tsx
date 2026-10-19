import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { getJson, postJson } from '../lib/api';
import {
  isAuthenticated,
  logout,
  getCurrentUser,
} from '../lib/auth';

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
  revenue?: {
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

  // Privacy-safe field preferred
  nickname?: string;

  // Kept only as fallback because older API responses may not
  // yet return nickname.
  fullName?: string;

  status: string;

  user?: {
    email?: string;
    phone?: string;
  };

  hospital?: {
    name: string;
  };

  assignedDoctor?: {
    name?: string;
  };

  createdAt: string;
}

interface Hospital {
  id: string;
  name: string;
  organizationType?: string;
  licenseNumber?: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  region?: string;
  phone?: string;
  email?: string;
  status: string;
  createdAt?: string;

  _count?: {
    doctors?: number;
    patientProfiles?: number;
    patients?: number;
    users?: number;
  };

  doctorCount?: number;
  patientCount?: number;
  userCount?: number;
}

type Tab =
  | 'overview'
  | 'approvals'
  | 'hospitals';

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
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {icons[name] || icons.grid}
    </span>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] =
    useState<Tab>('overview');

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [stats, setStats] =
    useState<SystemOverview | null>(null);

  const [pendingHospitals, setPendingHospitals] =
    useState<PendingHospital[]>([]);

  const [pendingDoctors, setPendingDoctors] =
    useState<PendingDoctor[]>([]);

  const [pendingPatients, setPendingPatients] =
    useState<PendingPatient[]>([]);

  const [allHospitals, setAllHospitals] =
    useState<Hospital[]>([]);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [actionSuccess, setActionSuccess] =
    useState('');

  const [actionLoading, setActionLoading] =
    useState(false);

  const [showAddHospital, setShowAddHospital] =
    useState(false);

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
        getJson<any>('/dashboards/admin').catch(
          () => null
        ),

        getJson<any>(
          '/approvals/admin/hospitals/pending'
        ).catch(() => null),

        getJson<any>(
          '/approvals/admin/doctors/pending'
        ).catch(() => null),

        getJson<any>(
          '/approvals/admin/patients/pending'
        ).catch(() => null),

        getJson<any>('/hospitals').catch(
          () => null
        ),
      ]);

      if (statsRes?.data) {
        setStats(statsRes.data);
      }

      if (pendHospRes?.data) {
        setPendingHospitals(
          Array.isArray(pendHospRes.data)
            ? pendHospRes.data
            : []
        );
      }

      if (pendDocRes?.data) {
        setPendingDoctors(
          Array.isArray(pendDocRes.data)
            ? pendDocRes.data
            : []
        );
      }

      if (pendPatRes?.data) {
        setPendingPatients(
          Array.isArray(pendPatRes.data)
            ? pendPatRes.data
            : []
        );
      }

      const rawHospitals =
        hospitalsRes?.data ||
        hospitalsRes ||
        [];

      const list: Hospital[] =
        Array.isArray(rawHospitals)
          ? rawHospitals
          : [];

      setAllHospitals(list);

      if (
        (!pendHospRes?.data ||
          pendHospRes.data.length === 0) &&
        list.length > 0
      ) {
        const pendingFromList =
          list.filter(
            (h) => h.status === 'PENDING'
          );

        if (pendingFromList.length > 0) {
          setPendingHospitals(
            pendingFromList as PendingHospital[]
          );
        }
      }
    } catch (err) {
      setError(
        (err as Error).message ||
          'Failed to load administrator data.'
      );
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

      await postJson(
        `/approvals/admin/hospitals/${hospitalId}/approve`,
        {
          action,
          reason: `System Admin ${action.toLowerCase()}d`,
        }
      );

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

      await postJson(
        `/approvals/admin/doctors/${doctorId}/approve`,
        {
          action,
          reason: `System Admin ${action.toLowerCase()}d`,
        }
      );

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

      await postJson(
        `/approvals/admin/patients/${patientId}/approve`,
        {
          action,
          reason: `System Admin ${action.toLowerCase()}d`,
        }
      );

      setActionSuccess(
        `Patient registration ${action.toLowerCase()}d successfully.`
      );

      await loadAdminData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateHospital = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!newHospital.name.trim()) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      await postJson(
        '/hospitals',
        newHospital
      );

      setActionSuccess(
        'New hospital created successfully.'
      );

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

  /*
   * ============================================================
   * PRIVACY
   * ============================================================
   */

  const getPatientDisplayName = (
    patient: PendingPatient
  ) => {
    if (patient.nickname?.trim()) {
      return patient.nickname.trim();
    }

    return 'Private Patient';
  };

  /*
   * ============================================================
   * HOSPITAL USER COUNTS
   * ============================================================
   *
   * Preferred backend response:
   *
   * _count: {
   *   doctors: number,
   *   patientProfiles: number
   * }
   *
   * We also support alternative field names so the UI
   * remains compatible with slightly different API responses.
   */

  const getDoctorCount = (
    hospital: Hospital
  ) => {
    return (
      hospital._count?.doctors ??
      hospital.doctorCount ??
      0
    );
  };

  const getPatientCount = (
    hospital: Hospital
  ) => {
    return (
      hospital._count?.patientProfiles ??
      hospital._count?.patients ??
      hospital.patientCount ??
      0
    );
  };

  const getUserCount = (
    hospital: Hospital
  ) => {
    if (
      typeof hospital.userCount ===
      'number'
    ) {
      return hospital.userCount;
    }

    if (
      typeof hospital._count?.users ===
      'number'
    ) {
      return hospital._count.users;
    }

    return (
      getDoctorCount(hospital) +
      getPatientCount(hospital)
    );
  };

  const filteredHospitals =
    useMemo(() => {
      const search =
        searchQuery
          .trim()
          .toLowerCase();

      return allHospitals.filter(
        (hospital) => {
          const matchesSearch =
            !search ||
            hospital.name
              ?.toLowerCase()
              .includes(search) ||
            hospital.city
              ?.toLowerCase()
              .includes(search) ||
            hospital.region
              ?.toLowerCase()
              .includes(search);

          const matchesStatus =
            statusFilter === 'ALL' ||
            hospital.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      allHospitals,
      searchQuery,
      statusFilter,
    ]);

  const totalPending =
    pendingHospitals.length +
    pendingDoctors.length +
    pendingPatients.length;

  const totalActive =
    (stats?.overview
      ?.activeHospitals || 0) +
    (stats?.overview
      ?.activeDoctors || 0) +
    (stats?.overview
      ?.activePatients || 0);

  const totalHospitalUsers =
    allHospitals.reduce(
      (total, hospital) =>
        total + getUserCount(hospital),
      0
    );

  const statCards = [
    {
      label: 'Registered Users',
      value:
        stats?.overview
          ?.totalUsers || 0,
      description:
        'Total accounts on AstaWashe',
      icon: 'users',
      bg: '#edf3ff',
      color: '#4777dd',
    },

    {
      label: 'Approved Hospitals',
      value:
        stats?.overview
          ?.activeHospitals || 0,
      description:
        'Verified healthcare facilities',
      icon: 'hospital',
      bg: '#eaf8f1',
      color: '#2caa72',
    },

    {
      label: 'Active Doctors',
      value:
        stats?.overview
          ?.activeDoctors || 0,
      description:
        'Healthcare professionals',
      icon: 'doctor',
      bg: '#f2efff',
      color: '#8067d8',
    },

    {
      label: 'Active Patients',
      value:
        stats?.overview
          ?.activePatients || 0,
      description:
        'Patients connected to care',
      icon: 'patient',
      bg: '#fff3e9',
      color: '#ed8a45',
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
            style={{
              width: 42,
              height: 42,
            }}
          />

          <p
            className="mt-3 text-muted mb-0"
            style={{
              fontSize: 13,
            }}
          >
            Loading AstaWashe
            administration...
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
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: sidebarOpen
            ? 245
            : 72,
          background: '#182235',
          color: '#fff',
          zIndex: 1050,
          transition:
            'width .25s ease',
          overflow: 'hidden',
          boxShadow:
            '3px 0 15px rgba(20,30,50,.08)',
        }}
      >
        <div
          style={{
            height: 68,
            display: 'flex',
            alignItems: 'center',
            padding:
              '0 20px',
            borderBottom:
              '1px solid rgba(255,255,255,.07)',
            gap: 11,
          }}
        >
          <div
            style={{
              width: 35,
              height: 35,
              borderRadius: 9,
              background:
                '#356fe5',
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              flexShrink: 0,
            }}
          >
            <Icon
              name="shield"
              size={19}
            />
          </div>

          {sidebarOpen && (
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 17,
                }}
              >
                AstaWashe
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: '#8f9bb0',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '.7px',
                }}
              >
                Administration
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding:
              '22px 12px',
          }}
        >
          {sidebarOpen && (
            <div
              style={{
                color: '#68768e',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing:
                  '1px',
                textTransform:
                  'uppercase',
                padding:
                  '0 12px 9px',
              }}
            >
              Main Menu
            </div>
          )}

          <button
            onClick={() =>
              setActiveTab(
                'overview'
              )
            }
            className="border-0 w-100 text-start"
            style={{
              height: 43,
              borderRadius: 7,
              display: 'flex',
              alignItems:
                'center',
              gap: 13,
              padding:
                '0 13px',
              color:
                activeTab ===
                'overview'
                  ? '#fff'
                  : '#9da9bc',
              background:
                activeTab ===
                'overview'
                  ? 'rgba(61,111,229,.28)'
                  : 'transparent',
              fontWeight:
                activeTab ===
                'overview'
                  ? 600
                  : 400,
              marginBottom: 4,
            }}
          >
            <Icon
              name="grid"
              size={18}
            />

            {sidebarOpen && (
              <span>
                Dashboard
              </span>
            )}
          </button>

          <button
            onClick={() =>
              setActiveTab(
                'approvals'
              )
            }
            className="border-0 w-100 text-start"
            style={{
              height: 43,
              borderRadius: 7,
              display: 'flex',
              alignItems:
                'center',
              gap: 13,
              padding:
                '0 13px',
              color:
                activeTab ===
                'approvals'
                  ? '#fff'
                  : '#9da9bc',
              background:
                activeTab ===
                'approvals'
                  ? 'rgba(61,111,229,.28)'
                  : 'transparent',
              marginBottom: 4,
            }}
          >
            <Icon
              name="clock"
              size={18}
            />

            {sidebarOpen && (
              <>
                <span>
                  Approvals
                </span>

                {totalPending >
                  0 && (
                  <span
                    style={{
                      marginLeft:
                        'auto',
                      background:
                        '#e64f61',
                      color:
                        '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      minWidth: 20,
                      height: 20,
                      borderRadius:
                        10,
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                    }}
                  >
                    {totalPending}
                  </span>
                )}
              </>
            )}
          </button>

          <button
            onClick={() =>
              setActiveTab(
                'hospitals'
              )
            }
            className="border-0 w-100 text-start"
            style={{
              height: 43,
              borderRadius: 7,
              display: 'flex',
              alignItems:
                'center',
              gap: 13,
              padding:
                '0 13px',
              color:
                activeTab ===
                'hospitals'
                  ? '#fff'
                  : '#9da9bc',
              background:
                activeTab ===
                'hospitals'
                  ? 'rgba(61,111,229,.28)'
                  : 'transparent',
              marginBottom: 4,
            }}
          >
            <Icon
              name="hospital"
              size={18}
            />

            {sidebarOpen && (
              <>
                <span>
                  Hospitals
                </span>

                <span
                  style={{
                    marginLeft:
                      'auto',
                    fontSize: 11,
                    color:
                      '#758299',
                  }}
                >
                  {
                    allHospitals.length
                  }
                </span>
              </>
            )}
          </button>

          <div
            style={{
              borderTop:
                '1px solid rgba(255,255,255,.06)',
              margin:
                '18px 7px',
            }}
          />

          {sidebarOpen && (
            <div
              style={{
                color: '#68768e',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing:
                  '1px',
                textTransform:
                  'uppercase',
                padding:
                  '0 12px 9px',
              }}
            >
              System
            </div>
          )}

          <div
            style={{
              height: 43,
              borderRadius: 7,
              display: 'flex',
              alignItems:
                'center',
              gap: 13,
              padding:
                '0 13px',
              color:
                '#9da9bc',
            }}
          >
            <Icon
              name="activity"
              size={18}
            />

            {sidebarOpen && (
              <span>
                System Activity
              </span>
            )}
          </div>

          <div
            style={{
              height: 43,
              borderRadius: 7,
              display: 'flex',
              alignItems:
                'center',
              gap: 13,
              padding:
                '0 13px',
              color:
                '#9da9bc',
            }}
          >
            <Icon
              name="settings"
              size={18}
            />

            {sidebarOpen && (
              <span>
                System Settings
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            position:
              'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop:
              '1px solid rgba(255,255,255,.07)',
            padding: 14,
          }}
        >
          <button
            onClick={
              handleLogout
            }
            className="border-0 w-100"
            style={{
              height: 40,
              background:
                'transparent',
              color:
                '#9da9bc',
              display: 'flex',
              alignItems:
                'center',
              gap: 13,
              padding:
                '0 10px',
              borderRadius: 7,
            }}
          >
            <Icon
              name="logout"
              size={17}
            />

            {sidebarOpen && (
              <span>
                Sign out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main
        style={{
          marginLeft:
            sidebarOpen
              ? 245
              : 72,
          transition:
            'margin-left .25s ease',
          minHeight:
            '100vh',
        }}
      >
        {/* TOP BAR */}

        <header
          style={{
            height: 68,
            background: '#fff',
            borderBottom:
              '1px solid #e8ebf1',
            display: 'flex',
            alignItems:
              'center',
            padding:
              '0 28px',
            gap: 22,
          }}
        >
          <button
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
            className="btn border-0 p-0 text-secondary"
          >
            <Icon
              name="menu"
              size={21}
            />
          </button>

          <div
            style={{
              width: 330,
              height: 37,
              border:
                '1px solid #e3e7ee',
              borderRadius: 7,
              display: 'flex',
              alignItems:
                'center',
              padding:
                '0 12px',
              color:
                '#9aa4b5',
            }}
          >
            <Icon
              name="search"
              size={17}
            />

            <input
              value={
                searchQuery
              }
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              placeholder="Search hospitals..."
              style={{
                border: 0,
                outline: 0,
                width:
                  '100%',
                marginLeft: 9,
                fontSize: 13,
              }}
            />
          </div>

          <div
            style={{
              marginLeft:
                'auto',
              display: 'flex',
              alignItems:
                'center',
              gap: 18,
            }}
          >
            <button
              className="btn border-0 p-0 text-secondary position-relative"
              onClick={() =>
                setActiveTab(
                  'approvals'
                )
              }
            >
              <Icon
                name="bell"
                size={19}
              />

              {totalPending >
                0 && (
                <span
                  style={{
                    position:
                      'absolute',
                    top: -3,
                    right: -4,
                    width: 7,
                    height: 7,
                    borderRadius:
                      '50%',
                    background:
                      '#e54f61',
                  }}
                />
              )}
            </button>

            <div
              style={{
                width: 1,
                height: 25,
                background:
                  '#e7eaf0',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 35,
                  height: 35,
                  borderRadius:
                    '50%',
                  background:
                    '#e8eefc',
                  color:
                    '#356fe5',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
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
                  }}
                >
                  System
                  Administrator
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color:
                      '#8a95a7',
                  }}
                >
                  {currentUser?.email ||
                    'Administrator'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div
          style={{
            padding:
              '28px 30px',
          }}
        >
          {/* ALERTS */}

          {error && (
            <div className="alert alert-danger d-flex align-items-center rounded-3 mb-4">
              <Icon
                name="x"
                size={18}
              />

              <span className="ms-2">
                {error}
              </span>

              <button
                className="btn-close ms-auto"
                onClick={() =>
                  setError('')
                }
              />
            </div>
          )}

          {actionSuccess && (
            <div className="alert alert-success d-flex align-items-center rounded-3 mb-4">
              <Icon
                name="check"
                size={18}
              />

              <span className="ms-2">
                {actionSuccess}
              </span>

              <button
                className="btn-close ms-auto"
                onClick={() =>
                  setActionSuccess(
                    ''
                  )
                }
              />
            </div>
          )}

          {/* PAGE HEADER */}

          <div
            className="d-flex flex-wrap align-items-center justify-content-between gap-3"
            style={{
              marginBottom: 25,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 25,
                  fontWeight: 700,
                  marginBottom: 5,
                  letterSpacing:
                    '-.5px',
                }}
              >
                System Overview
              </h2>

              <p
                style={{
                  margin: 0,
                  color:
                    '#8b95a7',
                  fontSize: 13,
                }}
              >
                Monitor the
                AstaWashe
                healthcare
                network,
                users and
                registration
                activity.
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-light border"
                onClick={
                  loadAdminData
                }
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Icon
                  name="refresh"
                  size={15}
                />

                <span className="ms-2">
                  Refresh
                </span>
              </button>

              <button
                className="btn btn-primary"
                onClick={() => {
                  setActiveTab(
                    'hospitals'
                  );
                  setShowAddHospital(
                    true
                  );
                }}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Icon
                  name="plus"
                  size={15}
                />

                <span className="ms-2">
                  Add Hospital
                </span>
              </button>
            </div>
          </div>

          {/* =====================================================
              OVERVIEW
          ===================================================== */}

          {activeTab ===
            'overview' && (
            <>
              <div className="row g-3 mb-4">
                {statCards.map(
                  (card) => (
                    <div
                      className="col-12 col-sm-6 col-xl-3"
                      key={
                        card.label
                      }
                    >
                      <div
                        style={{
                          background:
                            '#fff',
                          border:
                            '1px solid #e8ebf1',
                          borderRadius: 9,
                          padding: 20,
                          minHeight: 145,
                          boxShadow:
                            '0 2px 5px rgba(25,40,70,.025)',
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div
                              style={{
                                color:
                                  '#8a94a6',
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform:
                                  'uppercase',
                                letterSpacing:
                                  '.45px',
                              }}
                            >
                              {
                                card.label
                              }
                            </div>

                            <div
                              style={{
                                fontSize: 30,
                                fontWeight: 700,
                                marginTop: 10,
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
                              display:
                                'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'center',
                              background:
                                card.bg,
                              color:
                                card.color,
                            }}
                          >
                            <Icon
                              name={
                                card.icon
                              }
                              size={
                                21
                              }
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: 14,
                            fontSize: 11,
                            color:
                              '#9aa3b2',
                          }}
                        >
                          {
                            card.description
                          }
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* NETWORK SUMMARY */}

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div
                    className="bg-white border rounded-3 p-4 h-100"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        style={{
                          width: 45,
                          height: 45,
                          borderRadius: 10,
                          background:
                            '#edf3ff',
                          color:
                            '#4777dd',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                        }}
                      >
                        <Icon
                          name="hospital"
                          size={22}
                        />
                      </div>

                      <div>
                        <div className="small text-muted">
                          Healthcare
                          Network
                        </div>

                        <h3 className="fw-bold mb-0">
                          {
                            allHospitals.length
                          }
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div
                    className="bg-white border rounded-3 p-4 h-100"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        style={{
                          width: 45,
                          height: 45,
                          borderRadius: 10,
                          background:
                            '#eaf8f1',
                          color:
                            '#299466',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                        }}
                      >
                        <Icon
                          name="users"
                          size={22}
                        />
                      </div>

                      <div>
                        <div className="small text-muted">
                          Hospital Users
                        </div>

                        <h3 className="fw-bold mb-0">
                          {totalHospitalUsers.toLocaleString()}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div
                    className="bg-white border rounded-3 p-4 h-100"
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        style={{
                          width: 45,
                          height: 45,
                          borderRadius: 10,
                          background:
                            '#fff4e5',
                          color:
                            '#d88a26',
                          display:
                            'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                        }}
                      >
                        <Icon
                          name="clock"
                          size={22}
                        />
                      </div>

                      <div>
                        <div className="small text-muted">
                          Pending Reviews
                        </div>

                        <h3 className="fw-bold mb-0">
                          {
                            totalPending
                          }
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HOSPITAL NETWORK TABLE */}

              <div className="bg-white border rounded-3">
                <div
                  className="d-flex justify-content-between align-items-center"
                  style={{
                    padding:
                      '18px 20px',
                    borderBottom:
                      '1px solid #edf0f4',
                  }}
                >
                  <div>
                    <h5 className="fw-bold mb-1">
                      Healthcare
                      Network
                    </h5>

                    <div
                      style={{
                        fontSize: 11,
                        color:
                          '#9aa3b2',
                      }}
                    >
                      Hospital
                      users and
                      operational
                      status
                    </div>
                  </div>

                  <button
                    className="btn btn-sm btn-light border"
                    onClick={() =>
                      setActiveTab(
                        'hospitals'
                      )
                    }
                  >
                    Manage
                    <span className="ms-1">
                      <Icon
                        name="arrow"
                        size={13}
                      />
                    </span>
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr
                        style={{
                          background:
                            '#fafbfc',
                          color:
                            '#929baa',
                          fontSize: 10,
                          textTransform:
                            'uppercase',
                        }}
                      >
                        <th className="px-4">
                          Healthcare
                          Facility
                        </th>

                        <th>
                          Location
                        </th>

                        <th>
                          Doctors
                        </th>

                        <th>
                          Patients
                        </th>

                        <th>
                          Total Users
                        </th>

                        <th>
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {allHospitals
                        .slice(
                          0,
                          8
                        )
                        .map(
                          (
                            hospital
                          ) => {
                            const doctors =
                              getDoctorCount(
                                hospital
                              );

                            const patients =
                              getPatientCount(
                                hospital
                              );

                            const users =
                              getUserCount(
                                hospital
                              );

                            return (
                              <tr
                                key={
                                  hospital.id
                                }
                              >
                                <td className="px-4">
                                  <div className="d-flex align-items-center gap-2">
                                    <div
                                      style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 8,
                                        background:
                                          '#edf3ff',
                                        color:
                                          '#4777dd',
                                        display:
                                          'flex',
                                        alignItems:
                                          'center',
                                        justifyContent:
                                          'center',
                                      }}
                                    >
                                      <Icon
                                        name="building"
                                        size={
                                          17
                                        }
                                      />
                                    </div>

                                    <strong
                                      style={{
                                        fontSize: 12,
                                      }}
                                    >
                                      {
                                        hospital.name
                                      }
                                    </strong>
                                  </div>
                                </td>

                                <td className="text-muted small">
                                  {hospital.city ||
                                    hospital.region ||
                                    hospital.address ||
                                    'Not specified'}
                                </td>

                                <td>
                                  {doctors}
                                </td>

                                <td>
                                  {patients}
                                </td>

                                <td>
                                  <strong>
                                    {users}
                                  </strong>
                                </td>

                                <td>
                                  <span
                                    className={`badge ${
                                      hospital.status ===
                                      'APPROVED'
                                        ? 'bg-success'
                                        : hospital.status ===
                                          'PENDING'
                                        ? 'bg-warning text-dark'
                                        : 'bg-danger'
                                    }`}
                                  >
                                    {
                                      hospital.status
                                    }
                                  </span>
                                </td>
                              </tr>
                            );
                          }
                        )}

                      {allHospitals.length ===
                        0 && (
                        <tr>
                          <td
                            colSpan={
                              6
                            }
                            className="text-center text-muted py-5"
                          >
                            No healthcare
                            facilities
                            registered
                            yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =====================================================
              APPROVALS
          ===================================================== */}

          {activeTab ===
            'approvals' && (
            <div className="row g-3">

              {/* HOSPITAL APPROVALS */}

              <div className="col-12">
                <div className="bg-white border rounded-3">
                  <div className="p-4 border-bottom">
                    <h5 className="fw-bold mb-1">
                      Hospital Registration
                      Requests
                    </h5>

                    <small className="text-muted">
                      Verify healthcare
                      facilities before
                      activation.
                    </small>
                  </div>

                  {pendingHospitals.length ===
                  0 ? (
                    <div className="text-center py-5 text-muted">
                      <Icon
                        name="check"
                        size={30}
                      />

                      <div className="mt-2">
                        No pending hospital
                        registrations.
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr
                            style={{
                              background:
                                '#fafbfc',
                              fontSize: 10,
                              color:
                                '#929baa',
                              textTransform:
                                'uppercase',
                            }}
                          >
                            <th className="px-4">
                              Hospital
                            </th>

                            <th>
                              Location
                            </th>

                            <th>
                              Email
                            </th>

                            <th>
                              License
                            </th>

                            <th>
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {pendingHospitals.map(
                            (
                              hospital
                            ) => (
                              <tr
                                key={
                                  hospital.id
                                }
                              >
                                <td className="px-4">
                                  <strong>
                                    {
                                      hospital.name
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    hospital.city ||
                                    hospital.address ||
                                    'N/A'
                                  }
                                </td>

                                <td>
                                  {
                                    hospital.email ||
                                    'N/A'
                                  }
                                </td>

                                <td>
                                  {
                                    hospital.licenseNumber ||
                                    'N/A'
                                  }
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
                                      disabled={
                                        actionLoading
                                      }
                                    >
                                      <Icon
                                        name="check"
                                        size={
                                          14
                                        }
                                      />

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
                                      disabled={
                                        actionLoading
                                      }
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* DOCTOR APPROVALS */}

              <div className="col-12">
                <div className="bg-white border rounded-3">
                  <div className="p-4 border-bottom">
                    <h5 className="fw-bold mb-1">
                      Doctor Registration
                      Requests
                    </h5>

                    <small className="text-muted">
                      Verify healthcare
                      professionals and
                      hospital association.
                    </small>
                  </div>

                  {pendingDoctors.length ===
                  0 ? (
                    <div className="text-center py-5 text-muted">
                      No pending doctor
                      registrations.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr
                            style={{
                              background:
                                '#fafbfc',
                              fontSize: 10,
                              color:
                                '#929baa',
                              textTransform:
                                'uppercase',
                            }}
                          >
                            <th className="px-4">
                              Doctor
                            </th>

                            <th>
                              Specialization
                            </th>

                            <th>
                              Hospital
                            </th>

                            <th>
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {pendingDoctors.map(
                            (
                              doctor
                            ) => (
                              <tr
                                key={
                                  doctor.id
                                }
                              >
                                <td className="px-4">
                                  <strong>
                                    {
                                      doctor.name
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    doctor.specialization ||
                                    'General Medicine'
                                  }
                                </td>

                                <td>
                                  {
                                    doctor
                                      .hospital
                                      ?.name ||
                                    'N/A'
                                  }
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
                                      disabled={
                                        actionLoading
                                      }
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
                                      disabled={
                                        actionLoading
                                      }
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* PATIENT APPROVALS */}

              <div className="col-12">
                <div className="bg-white border rounded-3">
                  <div className="p-4 border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="fw-bold mb-1">
                          Patient Registration
                          Requests
                        </h5>

                        <small className="text-muted">
                          Privacy-protected
                          patient onboarding
                          and care assignment.
                        </small>
                      </div>

                      <span className="badge bg-light text-dark border">
                        Privacy Mode
                      </span>
                    </div>
                  </div>

                  {pendingPatients.length ===
                  0 ? (
                    <div className="text-center py-5 text-muted">
                      No pending patient
                      registrations.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr
                            style={{
                              background:
                                '#fafbfc',
                              fontSize: 10,
                              color:
                                '#929baa',
                              textTransform:
                                'uppercase',
                            }}
                          >
                            <th className="px-4">
                              Patient
                            </th>

                            <th>
                              Hospital
                            </th>

                            <th>
                              Care Assignment
                            </th>

                            <th>
                              Status
                            </th>

                            <th>
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {pendingPatients.map(
                            (
                              patient
                            ) => (
                              <tr
                                key={
                                  patient.id
                                }
                              >
                                {/* IMPORTANT:
                                    REAL PATIENT NAME IS NOT DISPLAYED */}
                                <td className="px-4">
                                  <div className="d-flex align-items-center gap-2">
                                    <div
                                      style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius:
                                          '50%',
                                        background:
                                          '#f2efff',
                                        color:
                                          '#8067d8',
                                        display:
                                          'flex',
                                        alignItems:
                                          'center',
                                        justifyContent:
                                          'center',
                                        fontWeight:
                                          700,
                                      }}
                                    >
                                      P
                                    </div>

                                    <div>
                                      <strong
                                        style={{
                                          fontSize: 12,
                                        }}
                                      >
                                        {
                                          getPatientDisplayName(
                                            patient
                                          )
                                        }
                                      </strong>

                                      <div
                                        style={{
                                          fontSize: 10,
                                          color:
                                            '#9aa3b2',
                                        }}
                                      >
                                        Patient
                                        identity
                                        protected
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  {
                                    patient
                                      .hospital
                                      ?.name ||
                                    'N/A'
                                  }
                                </td>

                                {/* DOCTOR'S REAL NAME HIDDEN */}

                                <td>
                                  <span
                                    style={{
                                      display:
                                        'inline-flex',
                                      alignItems:
                                        'center',
                                      gap: 7,
                                      padding:
                                        '6px 10px',
                                      borderRadius:
                                        20,
                                      background:
                                        '#f0f4fb',
                                      color:
                                        '#526b94',
                                      fontSize: 11,
                                      fontWeight:
                                        600,
                                    }}
                                  >
                                    <Icon
                                      name="doctor"
                                      size={
                                        14
                                      }
                                    />

                                    {patient.assignedDoctor
                                      ? 'Assigned clinician'
                                      : 'Not assigned'}
                                  </span>
                                </td>

                                <td>
                                  <span className="badge bg-warning text-dark">
                                    {
                                      patient.status
                                    }
                                  </span>
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
                                      disabled={
                                        actionLoading
                                      }
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
                                      disabled={
                                        actionLoading
                                      }
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              HOSPITAL MANAGEMENT
          ===================================================== */}

          {activeTab ===
            'hospitals' && (
            <div className="bg-white border rounded-3">
              <div
                className="d-flex flex-wrap justify-content-between align-items-center gap-3"
                style={{
                  padding:
                    '18px 20px',
                  borderBottom:
                    '1px solid #edf0f4',
                }}
              >
                <div>
                  <h5 className="fw-bold mb-1">
                    Hospital Directory
                  </h5>

                  <small className="text-muted">
                    Manage healthcare
                    facilities and
                    monitor their
                    user population.
                  </small>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() =>
                    setShowAddHospital(
                      !showAddHospital
                    )
                  }
                >
                  <Icon
                    name="plus"
                    size={14}
                  />

                  <span className="ms-1">
                    {showAddHospital
                      ? 'Cancel'
                      : 'Add Hospital'}
                  </span>
                </button>
              </div>

              {/* ADD HOSPITAL */}

              {showAddHospital && (
                <form
                  onSubmit={
                    handleCreateHospital
                  }
                  style={{
                    padding: 20,
                    background:
                      '#fafbfc',
                    borderBottom:
                      '1px solid #edf0f4',
                  }}
                >
                  <h6 className="fw-bold">
                    Register Healthcare
                    Facility
                  </h6>

                  <div className="row g-3 mt-1">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        Hospital Name *
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        value={
                          newHospital.name
                        }
                        onChange={(e) =>
                          setNewHospital({
                            ...newHospital,
                            name: e.target
                              .value,
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
                        value={
                          newHospital.organizationType
                        }
                        onChange={(e) =>
                          setNewHospital({
                            ...newHospital,
                            organizationType:
                              e.target
                                .value,
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
                        value={
                          newHospital.licenseNumber
                        }
                        onChange={(e) =>
                          setNewHospital({
                            ...newHospital,
                            licenseNumber:
                              e.target
                                .value,
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
                        value={
                          newHospital.city
                        }
                        onChange={(e) =>
                          setNewHospital({
                            ...newHospital,
                            city: e.target
                              .value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success mt-3"
                    disabled={
                      actionLoading
                    }
                  >
                    {actionLoading
                      ? 'Saving...'
                      : 'Save Hospital'}
                  </button>
                </form>
              )}

              {/* SEARCH */}

              <div
                style={{
                  padding: 20,
                  borderBottom:
                    '1px solid #edf0f4',
                }}
              >
                <div className="row g-3">
                  <div className="col-md-8">
                    <div
                      style={{
                        border:
                          '1px solid #e3e7ee',
                        borderRadius: 7,
                        height: 39,
                        display:
                          'flex',
                        alignItems:
                          'center',
                        padding:
                          '0 12px',
                      }}
                    >
                      <Icon
                        name="search"
                        size={16}
                      />

                      <input
                        type="text"
                        placeholder="Search hospital by name or city..."
                        value={
                          searchQuery
                        }
                        onChange={(e) =>
                          setSearchQuery(
                            e.target
                              .value
                          )
                        }
                        style={{
                          border: 0,
                          outline: 0,
                          width:
                            '100%',
                          marginLeft: 8,
                          fontSize: 12,
                        }}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={
                        statusFilter
                      }
                      onChange={(e) =>
                        setStatusFilter(
                          e.target
                            .value
                        )
                      }
                      style={{
                        fontSize: 12,
                      }}
                    >
                      <option value="ALL">
                        All Statuses
                      </option>

                      <option value="APPROVED">
                        Approved
                      </option>

                      <option value="PENDING">
                        Pending
                      </option>

                      <option value="REJECTED">
                        Rejected
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* HOSPITAL CARDS */}

              <div
                className="row g-3"
                style={{
                  padding: 20,
                }}
              >
                {filteredHospitals.length ===
                0 ? (
                  <div className="col-12 text-center text-muted py-5">
                    No hospitals found.
                  </div>
                ) : (
                  filteredHospitals.map(
                    (hospital) => {
                      const doctors =
                        getDoctorCount(
                          hospital
                        );

                      const patients =
                        getPatientCount(
                          hospital
                        );

                      const users =
                        getUserCount(
                          hospital
                        );

                      return (
                        <div
                          className="col-md-6 col-xl-4"
                          key={
                            hospital.id
                          }
                        >
                          <div
                            className="h-100"
                            style={{
                              border:
                                '1px solid #e8ebf1',
                              borderRadius: 10,
                              padding: 17,
                              transition:
                                'all .2s ease',
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div
                                style={{
                                  width: 42,
                                  height: 42,
                                  borderRadius: 10,
                                  background:
                                    '#edf3ff',
                                  color:
                                    '#4777dd',
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  justifyContent:
                                    'center',
                                }}
                              >
                                <Icon
                                  name="hospital"
                                  size={
                                    21
                                  }
                                />
                              </div>

                              <span
                                className={`badge ${
                                  hospital.status ===
                                  'APPROVED'
                                    ? 'bg-success'
                                    : hospital.status ===
                                      'PENDING'
                                    ? 'bg-warning text-dark'
                                    : 'bg-danger'
                                }`}
                              >
                                {
                                  hospital.status
                                }
                              </span>
                            </div>

                            <h6
                              className="fw-bold mt-3 mb-1"
                              style={{
                                fontSize: 14,
                              }}
                            >
                              {
                                hospital.name
                              }
                            </h6>

                            <div
                              style={{
                                fontSize: 11,
                                color:
                                  '#929baa',
                              }}
                            >
                              {hospital.city ||
                                hospital.region ||
                                hospital.address ||
                                'Location not set'}
                            </div>

                            {/* USER STATISTICS */}

                            <div
                              className="row g-2 mt-3"
                            >
                              <div className="col-4">
                                <div
                                  style={{
                                    background:
                                      '#f7f9fc',
                                    borderRadius: 8,
                                    padding:
                                      '10px 7px',
                                    textAlign:
                                      'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      color:
                                        '#8067d8',
                                      fontSize: 18,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {
                                      doctors
                                    }
                                  </div>

                                  <div
                                    style={{
                                      fontSize: 9,
                                      color:
                                        '#929baa',
                                      textTransform:
                                        'uppercase',
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    Doctors
                                  </div>
                                </div>
                              </div>

                              <div className="col-4">
                                <div
                                  style={{
                                    background:
                                      '#f7f9fc',
                                    borderRadius: 8,
                                    padding:
                                      '10px 7px',
                                    textAlign:
                                      'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      color:
                                        '#ed8a45',
                                      fontSize: 18,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {
                                      patients
                                    }
                                  </div>

                                  <div
                                    style={{
                                      fontSize: 9,
                                      color:
                                        '#929baa',
                                      textTransform:
                                        'uppercase',
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    Patients
                                  </div>
                                </div>
                              </div>

                              <div className="col-4">
                                <div
                                  style={{
                                    background:
                                      '#edf3ff',
                                    borderRadius: 8,
                                    padding:
                                      '10px 7px',
                                    textAlign:
                                      'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      color:
                                        '#356fe5',
                                      fontSize: 18,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {
                                      users
                                    }
                                  </div>

                                  <div
                                    style={{
                                      fontSize: 9,
                                      color:
                                        '#4777dd',
                                      textTransform:
                                        'uppercase',
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    Users
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div
                              className="d-flex justify-content-between mt-3 pt-3"
                              style={{
                                borderTop:
                                  '1px solid #edf0f4',
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: 9,
                                    color:
                                      '#9aa3b2',
                                    textTransform:
                                      'uppercase',
                                  }}
                                >
                                  License
                                </div>

                                <strong
                                  style={{
                                    fontSize: 11,
                                  }}
                                >
                                  {
                                    hospital.licenseNumber ||
                                    'N/A'
                                  }
                                </strong>
                              </div>

                              <div
                                className="text-end"
                              >
                                <div
                                  style={{
                                    fontSize: 9,
                                    color:
                                      '#9aa3b2',
                                    textTransform:
                                      'uppercase',
                                  }}
                                >
                                  Total Users
                                </div>

                                <strong
                                  style={{
                                    fontSize: 14,
                                    color:
                                      '#356fe5',
                                  }}
                                >
                                  {
                                    users
                                  }
                                </strong>
                              </div>
                            </div>

                            {hospital.status ===
                              'PENDING' && (
                              <button
                                className="btn btn-success btn-sm w-100 mt-3"
                                onClick={() =>
                                  handleApproveHospital(
                                    hospital.id,
                                    'APPROVE'
                                  )
                                }
                                disabled={
                                  actionLoading
                                }
                              >
                                <Icon
                                  name="check"
                                  size={
                                    14
                                  }
                                />

                                <span className="ms-1">
                                  Approve
                                  Hospital
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}