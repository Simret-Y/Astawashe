import { useNavigate } from 'react-router-dom';

export default function Dashboards() {
  const navigate = useNavigate();

  return (
    <div className="container-fluid py-5">
      <div className="container">
        <div className="text-center mx-auto mb-5" style={{ maxWidth: 600 }}>
          <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Dashboard Portals</h5>
          <h1 className="display-4">Choose Your View</h1>
          <p className="fw-normal">Access patient and hospital features for managing healthcare services.</p>
        </div>
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="bg-light rounded p-4 h-100">
              <h3 className="mb-3">Patient Dashboard</h3>
              <p className="mb-4">Profile, reminders, habits, and active cases in one place.</p>
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="bg-white rounded p-3 text-center">
                    <i className="fa fa-user text-primary mb-2"></i>
                    <h6 className="mb-0">Profile</h6>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-white rounded p-3 text-center">
                    <i className="fa fa-pills text-primary mb-2"></i>
                    <h6 className="mb-0">Reminders</h6>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-white rounded p-3 text-center">
                    <i className="fa fa-heartbeat text-primary mb-2"></i>
                    <h6 className="mb-0">Habits</h6>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-white rounded p-3 text-center">
                    <i className="fa fa-comments text-primary mb-2"></i>
                    <h6 className="mb-0">Case Chat</h6>
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-primary rounded-pill py-2 px-4 w-100"
                onClick={() => navigate('/patient-dashboard')}
              >
                Open Patient View
              </button>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="bg-light rounded p-4 h-100">
              <h3 className="mb-3">Hospital & Services</h3>
              <p className="mb-4">Browse hospitals, doctors, and create cases.</p>
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="bg-white rounded p-3 text-center">
                    <i className="fa fa-hospital text-primary mb-2"></i>
                    <h6 className="mb-0">Hospitals</h6>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-white rounded p-3 text-center">
                    <i className="fa fa-user-md text-primary mb-2"></i>
                    <h6 className="mb-0">Doctors</h6>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-white rounded p-3 text-center">
                    <i className="fa fa-folder-open text-primary mb-2"></i>
                    <h6 className="mb-0">Services</h6>
                  </div>
                </div>
                <div className="col-6">
                  <div className="bg-white rounded p-3 text-center">
                    <i className="fa fa-plus-circle text-primary mb-2"></i>
                    <h6 className="mb-0">New Case</h6>
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-primary rounded-pill py-2 px-4 w-100"
                onClick={() => navigate('/hospitals')}
              >
                Browse Hospitals
              </button>
            </div>
          </div>
        </div>

        <div className="row g-4 mt-4">
          <div className="col-lg-4">
            <div className="bg-light rounded p-4 text-center">
              <i className="fa fa-pills fa-2x text-primary mb-3"></i>
              <h5 className="mb-3">Health Reminders</h5>
              <p className="text-muted mb-4">Manage medication and health reminders</p>
              <button 
                className="btn btn-outline-primary rounded-pill py-2 px-4 w-100"
                onClick={() => navigate('/reminders')}
              >
                Manage Reminders
              </button>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="bg-light rounded p-4 text-center">
              <i className="fa fa-heart fa-2x text-primary mb-3"></i>
              <h5 className="mb-3">Track Habits</h5>
              <p className="text-muted mb-4">Monitor your daily health habits</p>
              <button 
                className="btn btn-outline-primary rounded-pill py-2 px-4 w-100"
                onClick={() => navigate('/habits')}
              >
                Track Habits
              </button>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="bg-light rounded p-4 text-center">
              <i className="fa fa-file-medical fa-2x text-primary mb-3"></i>
              <h5 className="mb-3">Active Cases</h5>
              <p className="text-muted mb-4">View and manage your health cases</p>
              <button 
                className="btn btn-outline-primary rounded-pill py-2 px-4 w-100"
                onClick={() => navigate('/patient-dashboard', { state: { activeTab: 'cases' } })}
              >
                View Cases
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
