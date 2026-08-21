export default function Service() {
  return (
    <div className="container-fluid py-5">
      <div className="container">
        <div className="text-center mx-auto mb-5" style={{ maxWidth: 500 }}>
          <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Services</h5>
          <h1 className="display-4">AstaWashe Smart Reminder Features</h1>
        </div>
        <div className="row g-5">
          {[
            { icon: 'fa-user-md', title: 'Medication Alerts' },
            { icon: 'fa-procedures', title: 'Doctor Visit Reminders' },
            { icon: 'fa-stethoscope', title: 'Treatment Follow-Up' },
            { icon: 'fa-ambulance', title: 'Care Team Notifications' },
            { icon: 'fa-pills', title: 'Medication Management' },
            { icon: 'fa-microscope', title: 'Health Monitoring' }
          ].map((item) => (
            <div className="col-lg-4 col-md-6" key={item.title}>
              <div className="service-item bg-light rounded d-flex flex-column align-items-center justify-content-center text-center">
                <div className="service-icon mb-4">
                  <i className={`fa fa-2x ${item.icon} text-white`}></i>
                </div>
                <h4 className="mb-3">{item.title}</h4>
                <p className="m-0">Reliable medication reminders and smart healthcare support to help patients stay healthy and never miss their treatment schedule.</p>
                <a className="btn btn-lg btn-primary rounded-pill" href="#!">
                  <i className="bi bi-arrow-right"></i>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
