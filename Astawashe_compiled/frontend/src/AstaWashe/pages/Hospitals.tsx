import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJson } from '../lib/api';
import { isAuthenticated } from '../lib/auth';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
  userId: string;
}

interface Hospital {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  doctors?: Doctor[];
}

interface Service {
  specialty: string;
  doctorCount: number;
  doctors: Doctor[];
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }
    fetchHospitals();
  }, [navigate]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getJson<Hospital[]>('/hospitals');
      const hospitals = Array.isArray(data) ? data : (data as any).data || [];
      setHospitals(hospitals);
      if (hospitals && hospitals.length > 0) {
        selectHospital(hospitals[0]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const selectHospital = async (hospital: Hospital) => {
    try {
      setSelectedHospital(hospital);
      setError('');
      // Fetch doctors for this hospital
      const data = await getJson<Doctor[]>(`/hospitals/${hospital.id}/doctors`);
      const doctors = Array.isArray(data) ? data : (data as any).data || [];
      
      // Group doctors by specialty to show services
      const serviceMap = new Map<string, Doctor[]>();
      doctors.forEach((doctor: Doctor) => {
        const specialty = doctor.specialty || 'General';
        if (!serviceMap.has(specialty)) {
          serviceMap.set(specialty, []);
        }
        serviceMap.get(specialty)!.push(doctor);
      });

      const servicesList = Array.from(serviceMap.entries()).map(([specialty, docs]) => ({
        specialty,
        doctorCount: docs.length,
        doctors: docs
      }));
      
      setServices(servicesList);
      setSelectedHospital({ ...hospital, doctors });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    navigate('/create-case', { state: { doctorId: doctor.id, doctorName: doctor.name } });
  };

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div className="text-center mx-auto mb-5" style={{ maxWidth: 600 }}>
          <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Healthcare</h5>
          <h1 className="display-4">Find Hospitals & Doctors</h1>
          <p className="fw-normal">Browse hospitals, view available services, and connect with doctors</p>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        <div className="row g-4">
          {/* Hospitals List */}
          <div className="col-lg-4">
            <div className="bg-white rounded shadow-sm p-4" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <h5 className="mb-3">Hospitals</h5>
              <div className="list-group">
                {hospitals.map((hospital) => (
                  <button
                    key={hospital.id}
                    className={`list-group-item list-group-item-action text-start ${
                      selectedHospital?.id === hospital.id ? 'active' : ''
                    }`}
                    onClick={() => selectHospital(hospital)}
                    style={{
                      cursor: 'pointer',
                      borderLeft: selectedHospital?.id === hospital.id ? '4px solid #0d6efd' : '4px solid transparent'
                    }}
                  >
                    <div className="fw-bold">{hospital.name}</div>
                    <small className="text-muted">{hospital.address}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hospital Details & Services */}
          <div className="col-lg-8">
            {selectedHospital ? (
              <div className="bg-white rounded shadow-sm p-4">
                <div className="mb-4">
                  <h3 className="mb-2">{selectedHospital.name}</h3>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <small className="text-muted d-block">Address</small>
                      <p className="mb-0">{selectedHospital.address || 'N/A'}</p>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted d-block">Phone</small>
                      <p className="mb-0">{selectedHospital.phone || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedHospital.description && (
                    <div className="mb-3">
                      <small className="text-muted d-block">Description</small>
                      <p className="mb-0">{selectedHospital.description}</p>
                    </div>
                  )}
                </div>

                <hr />

                <h5 className="mb-4">Services & Doctors</h5>
                {services.length === 0 ? (
                  <p className="text-muted">No doctors available</p>
                ) : (
                  services.map((service, idx) => (
                    <div key={idx} className="mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <div className="flex-grow-1">
                          <h6 className="mb-0">{service.specialty}</h6>
                          <small className="text-muted">{service.doctorCount} doctor(s)</small>
                        </div>
                      </div>
                      <div className="row g-3">
                        {service.doctors.map((doctor) => (
                          <div key={doctor.id} className="col-md-6">
                            <div className="card h-100 border-0 shadow-sm hover-shadow" style={{ cursor: 'pointer' }}>
                              <div className="card-body">
                                <h6 className="card-title mb-1">Dr. {doctor.name}</h6>
                                <small className="text-muted d-block mb-2">{doctor.specialty}</small>
                                {doctor.bio && <p className="card-text small mb-3">{doctor.bio}</p>}
                                <button
                                  className="btn btn-primary btn-sm w-100"
                                  onClick={() => handleSelectDoctor(doctor)}
                                >
                                  Create Case
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white rounded shadow-sm p-4 text-center">
                <p className="text-muted">Select a hospital to view services and doctors</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
