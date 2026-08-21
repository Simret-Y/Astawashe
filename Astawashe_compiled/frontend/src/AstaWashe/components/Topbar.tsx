export default function Topbar() {
  return (
    <div className="container-fluid py-2 border-bottom d-none d-lg-block">
      <div className="container">
        <div className="row">
          <div className="col-md-6 text-center text-lg-start mb-2 mb-lg-0">
            <div className="d-inline-flex align-items-center">
              <a className="text-decoration-none text-body pe-3" href="#!">
                <i className="bi bi-telephone me-2"></i>+251906088808
              </a>
              <span className="text-body">|</span>
              <a className="text-decoration-none text-body px-3" href="#!">
                <i className="bi bi-envelope me-2"></i>AstaWashe@insa.edu.et
              </a>
            </div>
          </div>
          <div className="col-md-6 text-center text-lg-end">
            <div className="d-inline-flex align-items-center">
              <a className="text-body px-2" href="#!">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a className="text-body px-2" href="#!">
                <i className="fab fa-twitter"></i>
              </a>
              <a className="text-body px-2" href="#!">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a className="text-body px-2" href="#!">
                <i className="fab fa-instagram"></i>
              </a>
              <a className="text-body ps-2" href="#!">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
