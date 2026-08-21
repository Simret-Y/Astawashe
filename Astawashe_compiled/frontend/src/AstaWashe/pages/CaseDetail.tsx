import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../lib/auth';
import {
  getMockCaseById,
  getMockMessages,
  sendMockMessage,
  updateMockCaseStatus
} from '../lib/mockChat';

interface Message {
  id: string;
  content: string;
  senderRole: 'PATIENT' | 'DOCTOR';
  senderName: string;
  createdAt: string;
}

interface Case {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  doctor?: { id: string; name: string; specialty: string };
  patient?: { id: string; fullName?: string };
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    if (caseId) {
      fetchCaseData();
    }
  }, [caseId, navigate]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      setError('');
      const caseInfo = getMockCaseById(caseId || '');
      setCaseData(caseInfo);
      setMessages(getMockMessages(caseId || ''));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !caseId) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const senderRole = currentUser?.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
      const senderName = senderRole === 'DOCTOR'
        ? (caseData?.doctor?.name || 'Doctor')
        : (caseData?.patient?.fullName || 'Patient');

      sendMockMessage(caseId, senderRole, senderName, newMessage);
      setNewMessage('');
      await fetchCaseData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!caseId) return;

    try {
      setStatusUpdating(true);
      setError('');

      updateMockCaseStatus(caseId, newStatus as 'OPEN' | 'IN_PROGRESS' | 'CLOSED');
      await fetchCaseData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setStatusUpdating(false);
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

  if (!caseData) {
    return (
      <div className="container-fluid py-5">
        <div className="text-center">
          <p className="text-muted">Case not found</p>
          <button className="btn btn-primary mt-3" onClick={() => navigate('/patient-dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        <div className="row">
          {/* Case Info */}
          <div className="col-lg-3 mb-4">
            <div className="bg-white rounded shadow-sm p-4">
              <button
                className="btn btn-link text-decoration-none mb-3 p-0"
                onClick={() => navigate(currentUser?.role === 'DOCTOR' ? '/doctor-dashboard' : '/patient-dashboard')}
              >
                ← Back
              </button>

              <h5 className="mb-3">Case Information</h5>

              <div className="mb-3">
                <small className="text-muted d-block mb-1">Status</small>
                <div className="d-flex gap-2 flex-wrap">
                  {['OPEN', 'IN_PROGRESS', 'CLOSED'].map((status) => (
                    <button
                      key={status}
                      className={`btn btn-sm ${
                        caseData.status === status ? 'btn-primary' : 'btn-outline-secondary'
                      }`}
                      onClick={() => handleStatusChange(status)}
                      disabled={statusUpdating}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {caseData.doctor && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">Assigned Doctor</small>
                  <p className="mb-0">
                    <strong>Dr. {caseData.doctor.name}</strong>
                    <br />
                    <small>{caseData.doctor.specialty}</small>
                  </p>
                </div>
              )}

              <div className="mb-3">
                <small className="text-muted d-block mb-1">Created</small>
                <p className="mb-0">{new Date(caseData.createdAt).toLocaleDateString()}</p>
              </div>

              <div>
                <small className="text-muted d-block mb-1">Last Updated</small>
                <p className="mb-0">{new Date(caseData.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Case Details & Messages */}
          <div className="col-lg-9">
            {error && (
              <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}

            {/* Case Description */}
            <div className="bg-white rounded shadow-sm p-4 mb-4">
              <h3 className="mb-2">{caseData.title}</h3>
              <p className="text-muted mb-0">{caseData.description}</p>
            </div>

            {/* Messages */}
            <div className="bg-white rounded shadow-sm p-4" style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
              <h5 className="mb-3">Case Discussion</h5>

              {/* Messages Container */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  marginBottom: '1rem',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa',
                  padding: '1rem'
                }}
              >
                {messages.length === 0 ? (
                  <p className="text-muted text-center mt-5">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((message) => {
                    const isCurrentSender = message.senderRole === (currentUser?.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT');
                    return (
                      <div
                        key={message.id}
                        className={`d-flex mb-3 ${isCurrentSender ? 'justify-content-end' : 'justify-content-start'}`}
                      >
                        <div
                          className={`p-3 rounded ${isCurrentSender ? 'bg-primary text-white' : 'bg-white'}`}
                          style={{ maxWidth: '70%' }}
                        >
                          <div className={`small ${isCurrentSender ? 'text-white-50' : 'text-muted'}`}>
                            {isCurrentSender ? 'You' : message.senderName}
                          </div>
                          <p className="mb-0">{message.content}</p>
                          <div className={`small mt-1 ${isCurrentSender ? 'text-white-50' : 'text-muted'}`}>
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={submitting}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !newMessage.trim()}
                >
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
