import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJson, postJson, patchJson } from '../lib/api';
import { isAuthenticated } from '../lib/auth';

interface HabitLog {
  id: string;
  date: string;
  status: string;
}

interface Habit {
  id: string;
  title: string;
  frequencyPerWeek?: number;
  reminderEnabled: boolean;
  logs?: HabitLog[];
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    frequencyPerWeek: 3,
    reminderEnabled: true
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }
    fetchHabits();
  }, [navigate]);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const data = await getJson<any>('/habits');
      const habits = Array.isArray(data) ? data : (data as any).data || [];
      setHabits(habits);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      setError('Please enter a habit title');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        ...formData,
        frequencyPerWeek: parseInt(formData.frequencyPerWeek.toString())
      };

      if (editingId) {
        await patchJson(`/habits/${editingId}`, payload);
      } else {
        await postJson('/habits', payload);
      }

      setFormData({
        title: '',
        frequencyPerWeek: 3,
        reminderEnabled: true
      });
      setEditingId(null);
      setShowForm(false);
      await fetchHabits();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (habit: Habit) => {
    setFormData({
      title: habit.title,
      frequencyPerWeek: habit.frequencyPerWeek || 3,
      reminderEnabled: habit.reminderEnabled
    });
    setEditingId(habit.id);
    setShowForm(true);
  };

  const logHabitCompletion = async (habitId: string) => {
    try {
      await postJson(`/habits/${habitId}/log`, { date: new Date().toISOString() });
      await fetchHabits();
    } catch (err) {
      setError((err as Error).message);
    }
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
              <h2>My Health Habits</h2>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowForm(!showForm);
                  setEditingId(null);
                  setFormData({
                    title: '',
                    frequencyPerWeek: 3,
                    reminderEnabled: true
                  });
                }}
              >
                {showForm ? 'Cancel' : '+ Add Habit'}
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
                <h4 className="mb-4">{editingId ? 'Edit Habit' : 'Add New Habit'}</h4>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Habit Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Morning Exercise"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Frequency Per Week</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.frequencyPerWeek}
                      onChange={(e) => setFormData({ ...formData, frequencyPerWeek: parseInt(e.target.value) })}
                      min="1"
                      max="7"
                    />
                  </div>

                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="reminderEnabled"
                      checked={formData.reminderEnabled}
                      onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="reminderEnabled">
                      Enable Reminders
                    </label>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary flex-grow-1" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Habit'}
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
            {habits.length === 0 ? (
              <div className="bg-white rounded shadow-sm p-5 text-center">
                <p className="text-muted mb-3">No habits tracked yet</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  Start Your First Habit
                </button>
              </div>
            ) : (
              <div className="row g-3">
                {habits.map((habit) => (
                  <div key={habit.id} className="col-lg-6">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h5 className="card-title mb-0">{habit.title}</h5>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(habit)}
                            >
                              Edit
                            </button>
                          </div>
                        </div>

                        <div className="row g-3 mb-3">
                          <div className="col-6">
                            <small className="text-muted d-block mb-1">Frequency</small>
                            <p className="mb-0 fw-bold">{habit.frequencyPerWeek || 0}x per week</p>
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block mb-1">Reminders</small>
                            <p className="mb-0">
                              {habit.reminderEnabled ? (
                                <span className="badge bg-success">🔔 Enabled</span>
                              ) : (
                                <span className="badge bg-secondary">🔕 Disabled</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {habit.logs && habit.logs.length > 0 && (
                          <div className="mb-3">
                            <small className="text-muted d-block mb-2">Recent Logs</small>
                            <div className="d-flex gap-1 flex-wrap">
                              {habit.logs.slice(0, 7).map((log) => (
                                <div
                                  key={log.id}
                                  className="badge bg-success"
                                  title={new Date(log.date).toLocaleDateString()}
                                >
                                  ✓
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          className="btn btn-success btn-sm w-100"
                          onClick={() => logHabitCompletion(habit.id)}
                        >
                          ✓ Complete Today
                        </button>
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
