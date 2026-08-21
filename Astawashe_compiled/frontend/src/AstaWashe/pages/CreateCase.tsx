import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { postJson, getJson } from '../lib/api';
import { isAuthenticated } from '../lib/auth';

export default function CreateCasePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    // Check if doctor was pre-selected
    const state = location.state as any;
    if (state?.doctorId) {
      setDoctorId(state.doctorId);
    }

    fetchDoctors();
  }, [navigate, location]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await getJson<any>('/doctors');
      const doctors = Array.isArray(data) ? data : (data as any).data || [];
      setDoctors(doctors);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!doctorId || !title || !description) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const payload = {
        title,
        description,
        doctorId
      };

      const result = await postJson<any>('/cases', payload);
      
      if (result.id || (result as any).data?.id) {
        navigate('/patient-dashboard', { state: { activeTab: 'cases' } });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="bg-white rounded shadow p-4">
              <h2 className="mb-4">Create New Case</h2>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="doctor" className="form-label">Select Doctor</label>
                  <select
                    id="doctor"
                    className="form-select"
                    value={doctorId}
                    onChange={(e) => {
                      setDoctorId(e.target.value);
                    }}
                    required
                  >
                    <option value="">-- Choose a doctor --</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} ({doctor.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Case Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    placeholder="e.g., Headache & Fever"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Detailed Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    rows={5}
                    placeholder="Describe your symptoms, medical history, or concerns..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary flex-grow-1"
                    disabled={submitting || loading}
                  >
                    {submitting ? 'Creating...' : 'Create Case'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
