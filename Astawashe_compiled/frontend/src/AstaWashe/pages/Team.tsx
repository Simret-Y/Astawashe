import { assetUrl } from '../lib/assets';

export default function Team() {
  return (
    <div className="container-fluid py-5">
      <div className="container">
        <div className="text-center mx-auto mb-5" style={{ maxWidth: 500 }}>
          <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Our Doctors</h5>
          <h1 className="display-4">Qualified Healthcare Professionals</h1>
        </div>
        <div className="owl-carousel team-carousel position-relative">
          {['team-1.jpg', 'team-1.jpg', 'team-3.jpg'].map((img) => (
            <div className="team-item" key={img}>
              <div className="row g-0 bg-light rounded overflow-hidden">
                <div className="col-12 col-sm-5 h-100">
                  <img className="img-fluid h-100" src={assetUrl(`img/${img}`)} style={{ objectFit: 'cover' }} alt="Doctor" />
                </div>
                <div className="col-12 col-sm-7 h-100 d-flex flex-column">
                  <div className="mt-auto p-4">
                    <h3>Dr. </h3>
                    <h6 className="fw-normal fst-italic text-primary mb-4">Cardiology Specialist</h6>
                    <p className="m-0">Dolor lorem eos dolor duo eirmod sea. Dolor sit magna rebum clita rebum dolor</p>
                  </div>
                  <div className="d-flex mt-auto border-top p-4">
                    <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-3" href="#!"><i className="fab fa-twitter"></i></a>
                    <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-3" href="#!"><i className="fab fa-facebook-f"></i></a>
                    <a className="btn btn-lg btn-primary btn-lg-square rounded-circle" href="#!"><i className="fab fa-linkedin-in"></i></a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
