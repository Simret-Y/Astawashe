import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJson, postJson } from '../lib/api';
import { isAuthenticated, logout, getCurrentUser } from '../lib/auth';

interface PendingDoctor {
  id: string;
  name: string;
  specialization?: string;
  status: string;
  user?: {
    email?: string;
    phone?: string;
  };
  createdAt?: string;
}

interface Hospital {
  id: string;
  name: string;
  organizationType?: string;
  licenseNumber?: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  status?: string;
  description?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  status?: string;
  user?: {
    email?: string;
    phone?: string;
  };
}

interface Service {
  id: string;
  name: string;
  department?: string;
  description?: string;
  status?: string;
}

interface HospitalStats {
  doctors?: number;
  patients?: number;
  activeDoctors?: number;
  activePatients?: number;
  pendingDoctors?: number;
  pendingPatients?: number;
}

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'doctors' | 'pending' | 'services' | 'profile'
  >('overview');

  const [hospitalData, setHospitalData] = useState<{
    hospital?: Hospital;
    stats?: HospitalStats;
  } | null>(null);

  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorStatus, setDoctorStatus] = useState('ALL');

  const [showServiceForm, setShowServiceForm] = useState(false);

  const [newService, setNewService] = useState({
    name: '',
    department: '',
    description: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    if (currentUser?.role !== 'HOSPITAL_ADMIN') {
      navigate('/auth');
      return;
    }

    loadHospitalDashboard();
  }, [navigate]);

  const loadHospitalDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const [dashRes, pendingDoctorsRes, servicesRes] = await Promise.all([
        getJson<any>('/dashboards/hospital').catch(() => null),
        getJson<any>('/approvals/hospital/doctors/pending').catch(() => null),
        getJson<any>('/services').catch(() => null),
      ]);

      if (dashRes?.data) {
        setHospitalData(dashRes.data);
      }

      if (pendingDoctorsRes?.data) {
        setPendingDoctors(pendingDoctorsRes.data);
      }

      if (servicesRes?.data || Array.isArray(servicesRes)) {
        setServices(servicesRes?.data || servicesRes || []);
      }

      const hospitalId = dashRes?.data?.hospital?.id;

      if (hospitalId) {
        const doctorsRes = await getJson<any>(
          `/hospitals/${hospitalId}/doctors`
        ).catch(() => null);

        if (doctorsRes?.data) {
          setDoctorsList(doctorsRes.data);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
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
        `/approvals/hospital/doctors/${doctorId}/approve`,
        {
          action,
          reason: `Hospital Admin ${action.toLowerCase()}d`,
        }
      );

      setActionSuccess(
        `Doctor ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`
      );

      await loadHospitalDashboard();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newService.name.trim()) {
      setError('Service name is required.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setActionSuccess('');

      await postJson('/services', {
        ...newService,
        hospitalId: hospitalData?.hospital?.id,
      });

      setActionSuccess('Hospital service added successfully.');

      setShowServiceForm(false);

      setNewService({
        name: '',
        department: '',
        description: '',
      });

      await loadHospitalDashboard();
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

  const hospital = hospitalData?.hospital;
  const stats = hospitalData?.stats;

  const filteredDoctors = useMemo(() => {
    return doctorsList.filter((doctor) => {
      const search = doctorSearch.toLowerCase();

      const matchesSearch =
        doctor.name?.toLowerCase().includes(search) ||
        doctor.specialization?.toLowerCase().includes(search) ||
        doctor.user?.email?.toLowerCase().includes(search);

      const matchesStatus =
        doctorStatus === 'ALL' ||
        doctor.status === doctorStatus;

      return matchesSearch && matchesStatus;
    });
  }, [doctorsList, doctorSearch, doctorStatus]);

  const totalDoctors =
    stats?.activeDoctors ??
    stats?.doctors ??
    doctorsList.length;

  const totalPatients =
    stats?.activePatients ??
    stats?.patients ??
    0;

  const pendingDoctorCount =
    stats?.pendingDoctors ??
    pendingDoctors.length;

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ background: '#f5f7fb' }}
      >
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            style={{ width: 42, height: 42 }}
          />

          <h6 className="mt-3 fw-semibold">
            Loading Hospital Dashboard
          </h6>

          <p className="text-muted small mb-0">
            Preparing your hospital workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-vh-100"
      style={{
        background: '#f5f7fb',
        color: '#27364b',
      }}
    >
      {/* =====================================================
          TOP NAVIGATION
      ====================================================== */}

      <nav
        className="navbar navbar-expand-lg bg-white border-bottom"
        style={{
          minHeight: 68,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center gap-3">

            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{
                width: 42,
                height: 42,
                background: '#eaf2ff',
                color: '#3d73d9',
              }}
            >
              <i className="fa fa-hospital fs-5" />
            </div>

            <div>
              <div className="fw-bold text-dark">
                {hospital?.name || 'Hospital Administration'}
              </div>

              <div
                className="small text-muted"
                style={{ fontSize: 12 }}
              >
                Hospital Management Portal
              </div>
            </div>
          </div>

          <div className="ms-auto d-flex align-items-center gap-3">

            <div className="text-end d-none d-md-block">
              <div className="small fw-semibold text-dark">
                {currentUser?.email || 'Hospital Administrator'}
              </div>

              <div
                className="text-muted"
                style={{ fontSize: 11 }}
              >
                Hospital Administrator
              </div>
            </div>

            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: 38,
                height: 38,
                background: '#edf1f7',
              }}
            >
              <i className="fa fa-user text-secondary" />
            </div>

            <button
              className="btn btn-light border btn-sm"
              onClick={handleLogout}
            >
              <i className="fa fa-sign-out-alt me-2" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="container-fluid px-4 py-4">

        {/* HEADER */}

        <div className="d-flex flex-wrap justify-content-between align-items-start mb-4 gap-3">

          <div>
            <div className="text-muted small mb-1">
              Hospital Administration
            </div>

            <h2 className="fw-bold mb-1 text-dark">
              Hospital overview
            </h2>

            <p className="text-muted mb-0">
              Monitor your hospital, doctors and patient operations.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">

            <span
              className={`badge rounded-pill px-3 py-2 ${
                hospital?.status === 'APPROVED'
                  ? 'bg-success-subtle text-success'
                  : 'bg-warning-subtle text-warning'
              }`}
            >
              <i className="fa fa-circle me-2 small" />
              {hospital?.status || 'ACTIVE'}
            </span>

            <button
              className="btn btn-white border shadow-sm"
              onClick={loadHospitalDashboard}
            >
              <i className="fa fa-sync-alt me-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-3">
            <i className="fa fa-exclamation-circle me-2" />
            {error}

            <button
              className="btn-close float-end"
              onClick={() => setError('')}
            />
          </div>
        )}

        {actionSuccess && (
          <div className="alert alert-success border-0 shadow-sm rounded-3">
            <i className="fa fa-check-circle me-2" />
            {actionSuccess}

            <button
              className="btn-close float-end"
              onClick={() => setActionSuccess('')}
            />
          </div>
        )}

        {/* =====================================================
            NAVIGATION
        ====================================================== */}

        <div className="bg-white border rounded-3 shadow-sm mb-4">
          <div className="d-flex flex-wrap">

            {[
              {
                id: 'overview',
                label: 'Overview',
                icon: 'fa-chart-pie',
              },
              {
                id: 'doctors',
                label: 'Doctors',
                icon: 'fa-user-md',
              },
              {
                id: 'pending',
                label: 'Pending Requests',
                icon: 'fa-user-clock',
              },
              {
                id: 'services',
                label: 'Services',
                icon: 'fa-clinic-medical',
              },
              {
                id: 'profile',
                label: 'Hospital Profile',
                icon: 'fa-hospital',
              },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`btn rounded-0 border-0 px-4 py-3 ${
                  activeTab === tab.id
                    ? 'text-primary fw-semibold'
                    : 'text-muted'
                }`}
                style={{
                  borderBottom:
                    activeTab === tab.id
                      ? '2px solid #3d73d9'
                      : '2px solid transparent',
                }}
                onClick={() =>
                  setActiveTab(tab.id as typeof activeTab)
                }
              >
                <i className={`fa ${tab.icon} me-2`} />
                {tab.label}

                {tab.id === 'pending' &&
                  pendingDoctorCount > 0 && (
                    <span className="badge bg-danger rounded-pill ms-2">
                      {pendingDoctorCount}
                    </span>
                  )}
              </button>
            ))}
          </div>
        </div>

        {/* =====================================================
            OVERVIEW
        ====================================================== */}

        {activeTab === 'overview' && (
          <div>

            {/* KPI CARDS */}

            <div className="row g-3 mb-4">

              <div className="col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">

                    <div className="d-flex justify-content-between">

                      <div>
                        <div className="text-muted small mb-2">
                          ACTIVE DOCTORS
                        </div>

                        <h2 className="fw-bold mb-1">
                          {totalDoctors}
                        </h2>

                        <span className="text-success small">
                          <i className="fa fa-arrow-up me-1" />
                          Hospital medical staff
                        </span>
                      </div>

                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center"
                        style={{
                          width: 48,
                          height: 48,
                          background: '#eaf2ff',
                          color: '#3d73d9',
                        }}
                      >
                        <i className="fa fa-user-md fs-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">

                    <div className="d-flex justify-content-between">

                      <div>
                        <div className="text-muted small mb-2">
                          REGISTERED PATIENTS
                        </div>

                        <h2 className="fw-bold mb-1">
                          {totalPatients}
                        </h2>

                        <span className="text-muted small">
                          Currently linked to hospital
                        </span>
                      </div>

                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center"
                        style={{
                          width: 48,
                          height: 48,
                          background: '#eaf8f1',
                          color: '#20a56a',
                        }}
                      >
                        <i className="fa fa-users fs-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">

                    <div className="d-flex justify-content-between">

                      <div>
                        <div className="text-muted small mb-2">
                          PENDING DOCTORS
                        </div>

                        <h2 className="fw-bold mb-1">
                          {pendingDoctorCount}
                        </h2>

                        <span className="text-warning small">
                          <i className="fa fa-clock me-1" />
                          Requires review
                        </span>
                      </div>

                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center"
                        style={{
                          width: 48,
                          height: 48,
                          background: '#fff6df',
                          color: '#e59c18',
                        }}
                      >
                        <i className="fa fa-user-clock fs-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">

                    <div className="d-flex justify-content-between">

                      <div>
                        <div className="text-muted small mb-2">
                          SERVICES
                        </div>

                        <h2 className="fw-bold mb-1">
                          {services.length}
                        </h2>

                        <span className="text-muted small">
                          Available hospital services
                        </span>
                      </div>

                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center"
                        style={{
                          width: 48,
                          height: 48,
                          background: '#f2ecff',
                          color: '#7654c9',
                        }}
                      >
                        <i className="fa fa-clinic-medical fs-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* MAIN OVERVIEW GRID */}

            <div className="row g-4">

              <div className="col-xl-8">

                <div className="card border-0 shadow-sm h-100">

                  <div className="card-header bg-white border-0 p-4 pb-2">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="fw-bold mb-1">
                          Hospital activity
                        </h5>

                        <p className="text-muted small mb-0">
                          Current operational summary
                        </p>
                      </div>

                      <button
                        className="btn btn-sm btn-light border"
                        onClick={() => setActiveTab('doctors')}
                      >
                        View doctors
                      </button>
                    </div>
                  </div>

                  <div className="card-body p-4">

                    <div className="row g-3">

                      <div className="col-md-6">
                        <div className="border rounded-3 p-3">
                          <div className="d-flex align-items-center gap-3">

                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: 44,
                                height: 44,
                                background: '#eaf2ff',
                                color: '#3d73d9',
                              }}
                            >
                              <i className="fa fa-user-md" />
                            </div>

                            <div>
                              <div className="fw-semibold">
                                Medical staff
                              </div>

                              <div className="small text-muted">
                                {totalDoctors} active doctors
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="border rounded-3 p-3">
                          <div className="d-flex align-items-center gap-3">

                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: 44,
                                height: 44,
                                background: '#eaf8f1',
                                color: '#20a56a',
                              }}
                            >
                              <i className="fa fa-user-injured" />
                            </div>

                            <div>
                              <div className="fw-semibold">
                                Patient network
                              </div>

                              <div className="small text-muted">
                                {totalPatients} registered patients
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="border rounded-3 p-3">
                          <div className="d-flex align-items-center gap-3">

                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: 44,
                                height: 44,
                                background: '#fff6df',
                                color: '#e59c18',
                              }}
                            >
                              <i className="fa fa-clock" />
                            </div>

                            <div>
                              <div className="fw-semibold">
                                Approval queue
                              </div>

                              <div className="small text-muted">
                                {pendingDoctorCount} doctor requests
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="border rounded-3 p-3">
                          <div className="d-flex align-items-center gap-3">

                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{
                                width: 44,
                                height: 44,
                                background: '#f2ecff',
                                color: '#7654c9',
                              }}
                            >
                              <i className="fa fa-medkit" />
                            </div>

                            <div>
                              <div className="fw-semibold">
                                Healthcare services
                              </div>

                              <div className="small text-muted">
                                {services.length} services configured
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>

              {/* PENDING PANEL */}

              <div className="col-xl-4">

                <div className="card border-0 shadow-sm h-100">

                  <div className="card-header bg-white border-0 p-4 pb-2">

                    <h5 className="fw-bold mb-1">
                      Approval queue
                    </h5>

                    <p className="text-muted small mb-0">
                      Requests requiring your attention
                    </p>

                  </div>

                  <div className="card-body p-4">

                    {pendingDoctors.length === 0 ? (
                      <div className="text-center py-5">

                        <div
                          className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                          style={{
                            width: 56,
                            height: 56,
                            background: '#eaf8f1',
                            color: '#20a56a',
                          }}
                        >
                          <i className="fa fa-check fs-5" />
                        </div>

                        <h6 className="fw-semibold">
                          All caught up
                        </h6>

                        <p className="text-muted small mb-0">
                          There are no pending doctor requests.
                        </p>

                      </div>
                    ) : (
                      <>
                        {pendingDoctors.slice(0, 4).map((doctor) => (
                          <div
                            key={doctor.id}
                            className="border-bottom py-3"
                          >
                            <div className="d-flex align-items-center">

                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{
                                  width: 40,
                                  height: 40,
                                  background: '#edf1f7',
                                }}
                              >
                                <i className="fa fa-user-md text-secondary" />
                              </div>

                              <div className="flex-grow-1">

                                <div className="fw-semibold small">
                                  {doctor.name}
                                </div>

                                <div className="text-muted small">
                                  {doctor.specialization ||
                                    'General Medicine'}
                                </div>

                              </div>

                              <span className="badge bg-warning-subtle text-warning">
                                Pending
                              </span>
                            </div>
                          </div>
                        ))}

                        <button
                          className="btn btn-primary w-100 mt-3"
                          onClick={() => setActiveTab('pending')}
                        >
                          Review all requests
                        </button>
                      </>
                    )}

                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* =====================================================
            DOCTORS
        ====================================================== */}

        {activeTab === 'doctors' && (
          <div className="card border-0 shadow-sm">

            <div className="card-header bg-white border-0 p-4">

              <div className="d-flex flex-wrap justify-content-between gap-3">

                <div>
                  <h5 className="fw-bold mb-1">
                    Medical staff
                  </h5>

                  <p className="text-muted small mb-0">
                    Manage doctors affiliated with your hospital.
                  </p>
                </div>

                <div className="d-flex gap-2">

                  <input
                    className="form-control"
                    style={{ minWidth: 240 }}
                    placeholder="Search doctors..."
                    value={doctorSearch}
                    onChange={(e) =>
                      setDoctorSearch(e.target.value)
                    }
                  />

                  <select
                    className="form-select"
                    value={doctorStatus}
                    onChange={(e) =>
                      setDoctorStatus(e.target.value)
                    }
                  >
                    <option value="ALL">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                  </select>

                </div>
              </div>
            </div>

            <div className="table-responsive">

              <table className="table table-hover align-middle mb-0">

                <thead
                  style={{
                    background: '#f8f9fc',
                  }}
                >
                  <tr>
                    <th className="px-4">Doctor</th>
                    <th>Specialization</th>
                    <th>Contact</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-5 text-muted"
                      >
                        No doctors found.
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <tr key={doctor.id}>

                        <td className="px-4">

                          <div className="d-flex align-items-center">

                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{
                                width: 40,
                                height: 40,
                                background: '#eaf2ff',
                                color: '#3d73d9',
                              }}
                            >
                              <i className="fa fa-user-md" />
                            </div>

                            <div>
                              <div className="fw-semibold">
                                Dr. {doctor.name}
                              </div>

                              <small className="text-muted">
                                Medical Staff
                              </small>
                            </div>

                          </div>

                        </td>

                        <td>
                          {doctor.specialization ||
                            'General Medicine'}
                        </td>

                        <td>
                          <div className="small">
                            {doctor.user?.email || 'No email'}
                          </div>

                          <div className="small text-muted">
                            {doctor.user?.phone || 'No phone'}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`badge rounded-pill ${
                              doctor.status === 'ACTIVE' ||
                              doctor.status === 'APPROVED'
                                ? 'bg-success-subtle text-success'
                                : 'bg-warning-subtle text-warning'
                            }`}
                          >
                            {doctor.status || 'ACTIVE'}
                          </span>
                        </td>

                      </tr>
                    ))
                  )}

                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================
            PENDING DOCTORS
        ====================================================== */}

        {activeTab === 'pending' && (
          <div className="card border-0 shadow-sm">

            <div className="card-header bg-white border-0 p-4">

              <div className="d-flex justify-content-between">

                <div>
                  <h5 className="fw-bold mb-1">
                    Doctor registration requests
                  </h5>

                  <p className="text-muted small mb-0">
                    Review and approve doctors requesting to join
                    your hospital.
                  </p>
                </div>

                <button
                  className="btn btn-light border"
                  onClick={loadHospitalDashboard}
                >
                  <i className="fa fa-sync-alt me-2" />
                  Refresh
                </button>

              </div>

            </div>

            <div className="table-responsive">

              <table className="table table-hover align-middle mb-0">

                <thead style={{ background: '#f8f9fc' }}>
                  <tr>
                    <th className="px-4">Doctor</th>
                    <th>Specialization</th>
                    <th>Email</th>
                    <th>Submitted</th>
                    <th className="text-end px-4">Action</th>
                  </tr>
                </thead>

                <tbody>

                  {pendingDoctors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-5"
                      >
                        <div
                          className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                          style={{
                            width: 55,
                            height: 55,
                            background: '#eaf8f1',
                            color: '#20a56a',
                          }}
                        >
                          <i className="fa fa-check" />
                        </div>

                        <div className="fw-semibold">
                          No pending requests
                        </div>

                        <div className="text-muted small">
                          All doctor registrations have been reviewed.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingDoctors.map((doctor) => (
                      <tr key={doctor.id}>

                        <td className="px-4">
                          <div className="fw-semibold">
                            Dr. {doctor.name}
                          </div>
                        </td>

                        <td>
                          {doctor.specialization ||
                            'General Medicine'}
                        </td>

                        <td>
                          {doctor.user?.email || 'N/A'}
                        </td>

                        <td>
                          {doctor.createdAt
                            ? new Date(
                                doctor.createdAt
                              ).toLocaleDateString()
                            : 'N/A'}
                        </td>

                        <td className="text-end px-4">

                          <div className="d-flex justify-content-end gap-2">

                            <button
                              className="btn btn-sm btn-success"
                              disabled={actionLoading}
                              onClick={() =>
                                handleApproveDoctor(
                                  doctor.id,
                                  'APPROVE'
                                )
                              }
                            >
                              <i className="fa fa-check me-1" />
                              Approve
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              disabled={actionLoading}
                              onClick={() =>
                                handleApproveDoctor(
                                  doctor.id,
                                  'REJECT'
                                )
                              }
                            >
                              <i className="fa fa-times me-1" />
                              Reject
                            </button>

                          </div>

                        </td>

                      </tr>
                    ))
                  )}

                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================
            SERVICES
        ====================================================== */}

        {activeTab === 'services' && (
          <div>

            <div className="d-flex justify-content-between align-items-center mb-4">

              <div>
                <h5 className="fw-bold mb-1">
                  Hospital services
                </h5>

                <p className="text-muted small mb-0">
                  Manage healthcare services provided by your hospital.
                </p>
              </div>

              <button
                className="btn btn-primary"
                onClick={() =>
                  setShowServiceForm(!showServiceForm)
                }
              >
                <i className="fa fa-plus me-2" />
                Add service
              </button>

            </div>

            {showServiceForm && (
              <div className="card border-0 shadow-sm mb-4">

                <div className="card-body p-4">

                  <h6 className="fw-bold mb-3">
                    Add healthcare service
                  </h6>

                  <form onSubmit={handleAddService}>

                    <div className="row g-3">

                      <div className="col-md-6">

                        <label className="form-label small fw-semibold">
                          Service name
                        </label>

                        <input
                          className="form-control"
                          placeholder="e.g. Cardiology"
                          value={newService.name}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              name: e.target.value,
                            })
                          }
                          required
                        />

                      </div>

                      <div className="col-md-6">

                        <label className="form-label small fw-semibold">
                          Department
                        </label>

                        <input
                          className="form-control"
                          placeholder="e.g. Internal Medicine"
                          value={newService.department}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              department: e.target.value,
                            })
                          }
                        />

                      </div>

                      <div className="col-12">

                        <label className="form-label small fw-semibold">
                          Description
                        </label>

                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Describe this service..."
                          value={newService.description}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              description: e.target.value,
                            })
                          }
                        />

                      </div>

                    </div>

                    <div className="mt-3">

                      <button
                        type="submit"
                        className="btn btn-primary me-2"
                        disabled={actionLoading}
                      >
                        {actionLoading
                          ? 'Saving...'
                          : 'Save service'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-light border"
                        onClick={() =>
                          setShowServiceForm(false)
                        }
                      >
                        Cancel
                      </button>

                    </div>

                  </form>
                </div>
              </div>
            )}

            <div className="row g-3">

              {services.length === 0 ? (
                <div className="col-12">

                  <div className="card border-0 shadow-sm">

                    <div className="card-body text-center py-5">

                      <i className="fa fa-clinic-medical fa-2x text-muted mb-3" />

                      <h6 className="fw-semibold">
                        No services configured
                      </h6>

                      <p className="text-muted small">
                        Add your hospital's healthcare services to
                        make them available in the system.
                      </p>

                    </div>

                  </div>

                </div>
              ) : (
                services.map((service) => (
                  <div
                    className="col-md-6 col-xl-4"
                    key={service.id}
                  >

                    <div className="card border-0 shadow-sm h-100">

                      <div className="card-body p-4">

                        <div className="d-flex align-items-start gap-3">

                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center"
                            style={{
                              width: 46,
                              height: 46,
                              background: '#eaf2ff',
                              color: '#3d73d9',
                            }}
                          >
                            <i className="fa fa-medkit" />
                          </div>

                          <div>
                            <h6 className="fw-bold mb-1">
                              {service.name}
                            </h6>

                            <div className="small text-primary">
                              {service.department ||
                                'Hospital Department'}
                            </div>
                          </div>

                        </div>

                        {service.description && (
                          <p className="text-muted small mt-3 mb-0">
                            {service.description}
                          </p>
                        )}

                      </div>
                    </div>

                  </div>
                ))
              )}

            </div>
          </div>
        )}

        {/* =====================================================
            PROFILE
        ====================================================== */}

        {activeTab === 'profile' && (
          <div className="row g-4">

            <div className="col-xl-8">

              <div className="card border-0 shadow-sm">

                <div className="card-header bg-white border-0 p-4">

                  <h5 className="fw-bold mb-1">
                    Hospital profile
                  </h5>

                  <p className="text-muted small mb-0">
                    Registered information for your healthcare
                    organization.
                  </p>

                </div>

                <div className="card-body p-4">

                  <div className="row g-4">

                    <div className="col-md-6">
                      <label className="text-muted small">
                        Hospital name
                      </label>

                      <div className="fw-semibold mt-1">
                        {hospital?.name || 'Not provided'}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="text-muted small">
                        Organization type
                      </label>

                      <div className="fw-semibold mt-1">
                        {hospital?.organizationType ||
                          'Healthcare Organization'}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="text-muted small">
                        License number
                      </label>

                      <div className="fw-semibold mt-1">
                        {hospital?.licenseNumber || 'Not provided'}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="text-muted small">
                        Registration number
                      </label>

                      <div className="fw-semibold mt-1">
                        {hospital?.registrationNumber ||
                          'Not provided'}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="text-muted small">
                        City
                      </label>

                      <div className="fw-semibold mt-1">
                        {hospital?.city || 'Not provided'}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="text-muted small">
                        Phone
                      </label>

                      <div className="fw-semibold mt-1">
                        {hospital?.phone || 'Not provided'}
                      </div>
                    </div>

                    <div className="col-md-12">
                      <label className="text-muted small">
                        Address
                      </label>

                      <div className="fw-semibold mt-1">
                        {hospital?.address || 'Not provided'}
                      </div>
                    </div>

                    <div className="col-md-12">
                      <label className="text-muted small">
                        Description
                      </label>

                      <div className="text-secondary mt-1">
                        {hospital?.description ||
                          'No hospital description available.'}
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            <div className="col-xl-4">

              <div className="card border-0 shadow-sm">

                <div className="card-body p-4 text-center">

                  <div
                    className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: 80,
                      height: 80,
                      background: '#eaf2ff',
                      color: '#3d73d9',
                    }}
                  >
                    <i className="fa fa-hospital fs-2" />
                  </div>

                  <h5 className="fw-bold">
                    {hospital?.name}
                  </h5>

                  <p className="text-muted small">
                    {hospital?.organizationType ||
                      'Healthcare Organization'}
                  </p>

                  <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">
                    <i className="fa fa-check-circle me-1" />
                    {hospital?.status || 'ACTIVE'}
                  </span>

                </div>

              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}