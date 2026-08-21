import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJson, postJson, patchJson, deleteJson } from '../lib/api';
import { isAuthenticated } from '../lib/auth';

interface Reminder {
  id: string;
  type: 'MEDICATION' | 'HABIT';
  title: string;
  note?: string;
  timesPerDay?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ type: Reminder['type']; title: string; note: string; timesPerDay: number; startDate: string; endDate: string }>({
    type: 'MEDICATION',
    title: '',
    note: '',
    timesPerDay: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }
    fetchReminders();
  }, [navigate]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const data = await getJson<any>('/reminders');
      const reminders = Array.isArray(data) ? data : (data as any).data || [];
      setReminders(reminders);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      setError('Please enter a reminder title');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        ...formData,
        timesPerDay: parseInt(formData.timesPerDay.toString())
      };

      if (editingId) {
        await patchJson(`/reminders/${editingId}`, payload);
      } else {
        await postJson('/reminders', payload);
      }

      setFormData({
        type: 'MEDICATION',
        title: '',
        note: '',
        timesPerDay: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });
      setEditingId(null);
      setShowForm(false);
      await fetchReminders();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await deleteJson(`/reminders/${id}`);
      await fetchReminders();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleToggleActive = async (reminder: Reminder) => {
    try {
      await patchJson(`/reminders/${reminder.id}`, { isActive: !reminder.isActive });
      await fetchReminders();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setFormData({
      type: reminder.type,
      title: reminder.title,
      note: reminder.note || '',
      timesPerDay: reminder.timesPerDay || 1,
      startDate: reminder.startDate?.split('T')[0] || '',
      endDate: reminder.endDate?.split('T')[0] || ''
    });
    setEditingId(reminder.id);
    setShowForm(true);
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
    <div className="container-fluid py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        <div className="row">
          <div className="col-12 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h2>My Reminders</h2>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingId(null);
                  setFormData({
                    type: 'MEDICATION',
                    title: '',
                    note: '',
                    timesPerDay: 1,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: ''
                  });
                }}
              >
                {showForm ? 'Cancel' : '+ Add Reminder'}
              </button>
            </div>
          </div>

          {error && (
            <div className="col-12 mb-4">
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            </div>
          )}

          {showForm && (
            <div className="col-lg-6 mb-4">
              <div className="bg-white rounded shadow-sm p-4">
                <h4 className="mb-4">{editingId ? 'Edit Reminder' : 'Add New Reminder'}</h4>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as 'MEDICATION' | 'HABIT' })
                      }
                    >
                      <option value="MEDICATION">Medication</option>
                      <option value="HABIT">Habit</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Take Medicine"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Note</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Additional notes..."
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Times Per Day</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.timesPerDay}
                      onChange={(e) => setFormData({ ...formData, timesPerDay: parseInt(e.target.value) })}
                      min="1"
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary flex-grow-1" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Reminder'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="col-12">
            {reminders.length === 0 ? (
              <div className="bg-white rounded shadow-sm p-5 text-center">
                <p className="text-muted mb-3">No reminders set yet</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  Create Your First Reminder
                </button>
              </div>
            ) : (
              <div className="row g-3">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h5 className="card-title mb-2">{reminder.title}</h5>
                            <p className="card-text text-muted mb-2">{reminder.note}</p>
                            <div className="small">
                              <span className="badge bg-light text-dark me-2">
                                {reminder.type === 'MEDICATION' ? '💊 Medication' : '🏃 Habit'}
                              </span>
                              {reminder.timesPerDay && (
                                <span className="badge bg-light text-dark">
                                  {reminder.timesPerDay}x daily
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleToggleActive(reminder)}
                            >
                              {reminder.isActive ? '🔔' : '🔕'}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(reminder)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(reminder.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
