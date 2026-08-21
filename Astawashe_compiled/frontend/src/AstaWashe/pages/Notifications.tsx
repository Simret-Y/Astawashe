import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../lib/auth';
import { getMockNotificationsForRole, markMockNotificationRead } from '../lib/mockChat';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'MESSAGE' | 'MEDICATION' | 'HABIT' | 'TIP';
  caseId?: string;
  readAt?: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/auth');
      return;
    }

    const list = getMockNotificationsForRole(currentUser?.role, 50) as NotificationItem[];
    setNotifications(list);
  }, [navigate, currentUser?.role]);

  const handleClick = (item: NotificationItem) => {
    markMockNotificationRead(item.id);
    setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)));

    if (item.type === 'MESSAGE' && item.caseId) {
      navigate(`/case/${item.caseId}`);
    }
  };

  const getBadgeClass = (type: NotificationItem['type']) => {
    switch (type) {
      case 'MESSAGE':
        return 'bg-primary';
      case 'MEDICATION':
        return 'bg-warning text-dark';
      case 'HABIT':
        return 'bg-success';
      case 'TIP':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Notifications</h3>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded shadow-sm p-5 text-center text-muted">
            No notifications yet.
          </div>
        ) : (
          <div className="row g-4">
            {notifications.map((item) => (
              <div key={item.id} className="col-md-6 col-xl-4">
                <div
                  className={`card h-100 border-0 shadow-sm ${item.readAt ? 'opacity-75' : ''}`}
                  style={{ cursor: item.type === 'MESSAGE' ? 'pointer' : 'default' }}
                  onClick={() => handleClick(item)}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">{item.title}</h5>
                      <span className={`badge ${getBadgeClass(item.type)}`}>{item.type}</span>
                    </div>
                    <p className="text-muted mb-2">{item.message}</p>
                    <small className="text-muted">{new Date(item.createdAt).toLocaleString()}</small>
                    {item.type === 'MESSAGE' && item.caseId && (
                      <div className="mt-2 text-primary small">Open chat room</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
