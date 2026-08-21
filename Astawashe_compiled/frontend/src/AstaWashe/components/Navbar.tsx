import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { isAuthenticated, logout, getCurrentUser } from '../lib/auth';
import { getMockNotificationsForRole, markMockNotificationRead } from '../lib/mockChat';
import { useState, useEffect } from 'react';

const navClass = (isActive: boolean) => `nav-item nav-link${isActive ? ' active' : ''}`;

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [isAuth, setIsAuth] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const navbarSpacing = location.pathname === '/' ? '' : ' mb-5';

  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, [location]);

  useEffect(() => {
    if (!isAuthenticated()) return;

    let active = true;
    const fetchNotifications = async () => {
      try {
        setLoadingNotifications(true);
        const list = getMockNotificationsForRole(currentUser?.role, 6);
        if (!active) return;
        setNotifications(list);
      } finally {
        if (active) setLoadingNotifications(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [location.pathname, currentUser?.role]);

  const handleLogout = () => {
    logout();
    setIsAuth(false);
    navigate('/');
  };

  const handleMarkRead = async (id: string) => {
    markMockNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const getDashboardLink = () => {
    if (!isAuth || !currentUser) return '/auth';
    
    switch (currentUser.role) {
      case 'SYSTEM_ADMIN':
      case 'ADMIN' as any:
        return '/admin-dashboard';
      case 'HOSPITAL_ADMIN':
        return '/hospital-dashboard';
      case 'PATIENT':
        return '/patient-dashboard';
      case 'DOCTOR':
        return '/doctor-dashboard';
      default:
        return '/auth';
    }
  };

  const getDisplayName = () => {
    if (!currentUser) return 'My Dashboard';
    return currentUser.fullName || currentUser.email || currentUser.phone || 'My Dashboard';
  };

  return (
    <div className={`container-fluid sticky-top bg-white shadow-sm${navbarSpacing}`}>
      <div className="container">
        <nav className="navbar navbar-expand-lg bg-white navbar-light py-3 py-lg-0">
          <NavLink to="/" className="navbar-brand">
            <h1 className="m-0 text-uppercase text-primary">
              <i className="fa fa-clinic-medical me-2"></i>AstaWashe
            </h1>
          </NavLink>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarCollapse">
            <div className="navbar-nav ms-auto py-0">
              <NavLink to="/" className={({ isActive }) => navClass(isActive)}>Home</NavLink>
              <NavLink to="/about" className={({ isActive }) => navClass(isActive)}>About</NavLink>
              {/* <NavLink to="/service" className={({ isActive }) => navClass(isActive)}>Service</NavLink> */}
              {/* <NavLink to="/price" className={({ isActive }) => navClass(isActive)}>Plans</NavLink> */}
              {/* <NavLink to="/community" className={({ isActive }) => navClass(isActive)}>Community</NavLink> */}
              {/* <NavLink to="/dashboards" className={({ isActive }) => navClass(isActive)}>Dashboards</NavLink> */}
              <div className="nav-item dropdown">
                {/* <a href="#" className={`nav-link dropdown-toggle${dropdownActive ? ' active' : ''}`} data-bs-toggle="dropdown">Pages</a> */}
                
              </div>
              <NavLink to="/contact" className={({ isActive }) => navClass(isActive)}>Contact</NavLink>
              {isAuth && (
                <div className="nav-item dropdown">
                  <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                    <i className="fa fa-bell"></i>
                    {unreadCount > 0 && (
                      <span className="badge bg-danger ms-1">{unreadCount}</span>
                    )}
                  </a>
                  <div className="dropdown-menu dropdown-menu-end p-2" style={{ minWidth: '320px' }}>
                    <div className="d-flex align-items-center justify-content-between px-2 pb-2">
                      <strong>Notifications</strong>
                      {loadingNotifications && (
                        <small className="text-muted">Loading...</small>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-2 py-3 text-muted">No notifications yet</div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          className="dropdown-item d-flex flex-column gap-1"
                          style={{ whiteSpace: 'normal' }}
                          onClick={() => {
                            handleMarkRead(item.id);
                            if (item.type === 'MESSAGE' && item.caseId) {
                              navigate(`/case/${item.caseId}`);
                            } else {
                              navigate('/notifications');
                            }
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <strong>{item.title}</strong>
                            {!item.readAt && (
                              <button
                                className="btn btn-sm btn-link p-0"
                                onClick={() => handleMarkRead(item.id)}
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <span className="text-muted small">{item.message}</span>
                        </button>
                      ))
                    )}
                    <div className="px-2 pt-2">
                      <button className="btn btn-sm btn-outline-primary w-100" onClick={() => navigate('/notifications')}>
                        View all notifications
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {isAuth ? (
                <div className="nav-item dropdown">
                  <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                    👤 {getDisplayName()}
                  </a>
                  <div className="dropdown-menu dropdown-menu-end m-0">
                    <NavLink to={getDashboardLink()} className={({ isActive }) => `dropdown-item${isActive ? ' active' : ''}`}>
                      Access Dashboard
                    </NavLink>
                    <hr className="dropdown-divider" />
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', padding: '0.5rem 1rem' }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <NavLink to="/auth" className={({ isActive }) => navClass(isActive)}>Sign In</NavLink>
              )}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
