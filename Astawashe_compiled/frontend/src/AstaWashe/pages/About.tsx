import { assetUrl } from '../lib/assets';

export default function About() {
  return (
    <>
      <div className="container-fluid py-5">
        <div className="container">
          <div className="row gx-5">
            <div className="col-lg-5 mb-5 mb-lg-0" style={{ minHeight: 500 }}>
              <div className="position-relative h-100">
                <img className="position-absolute w-100 h-100 rounded" src={assetUrl('img/about.jpg')} style={{ objectFit: 'cover' }} alt="About AstaWashe" />
              </div>
            </div>
            <div className="col-lg-7">
              <div className="mb-4">
                <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">About Us</h5>
                <h1 className="display-4">Smart medication reminders for you and your family</h1>
              </div>
              <p>AstaWashe is a modern medication reminder system built to reduce missed doses, improve adherence, and simplify care routines for patients and families.</p>
              <div className="row g-3 pt-3">
                <div className="col-sm-3 col-6">
                  <div className="bg-light text-center rounded-circle py-4">
                    <i className="fa fa-3x fa-user-md text-primary mb-3"></i>
                    <h6 className="mb-0">Qualified<small className="d-block text-primary">Doctors</small></h6>
                  </div>
                </div>
                <div className="col-sm-3 col-6">
                  <div className="bg-light text-center rounded-circle py-4">
                    <i className="fa fa-3x fa-procedures text-primary mb-3"></i>
                    <h6 className="mb-0">Emergency<small className="d-block text-primary">Services</small></h6>
                  </div>
                </div>
                <div className="col-sm-3 col-6">
                  <div className="bg-light text-center rounded-circle py-4">
                    <i className="fa fa-3x fa-microscope text-primary mb-3"></i>
                    <h6 className="mb-0">Accurate<small className="d-block text-primary">Testing</small></h6>
                  </div>
                </div>
                <div className="col-sm-3 col-6">
                  <div className="bg-light text-center rounded-circle py-4">
                    <i className="fa fa-3x fa-ambulance text-primary mb-3"></i>
                    <h6 className="mb-0">Free<small className="d-block text-primary">Ambulance</small></h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid bg-primary my-5 py-5">
        <div className="container py-5">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: 500 }}>
            <h5 className="d-inline-block text-white text-uppercase border-bottom border-5">Find Your Medication Plan</h5>
            <h1 className="display-4 mb-4">Discover Smart Medication Support</h1>
            <h5 className="text-white fw-normal">
              AstaWashe helps you manage your medications with ease. Search for your hospital, explore your treatment plan, and receive smart reminders so you never miss a dose again.
            </h5>
          </div>
          <div className="mx-auto" style={{ width: '100%', maxWidth: 600 }}>
            <div className="input-group">
              <select className="form-select border-primary w-25" style={{ height: 60 }}>
                <option>Hospital</option>
                <option>Black Lion Hospital</option>
                <option>St. Paul Hospital</option>
                <option>Yekatit 12 Hospital</option>
              </select>
              <input type="text" className="form-control border-primary w-50" placeholder="Search medication or condition" />
              <button className="btn btn-dark border-0 w-25">Search</button>
            </div>
          </div>
        </div>
      </div>

           {/* Team Start */}
<div className="container-fluid team py-5">
  <div className="container py-5">
    <div
      className="mx-auto text-center wow fadeIn"
      data-wow-delay="0.1s"
      style={{ maxWidth: 700 }}
    >
      <h4 className="text-primary mb-4 border-bottom border-primary border-2 d-inline-block p-2 title-border-radius">
        Support Team
      </h4>

      <h1 className="mb-3 display-4">Meet Our Support Team</h1>

      <p className="text-muted mb-5">
        The people behind AstaWashe, working together to make medication
        management smarter, more accessible, and easier for everyone.
      </p>
    </div>

    <div className="row g-5 justify-content-center">

      {/* Sophonyas */}
      <div
        className="col-md-6 col-lg-4 col-xl-3 wow fadeIn"
        data-wow-delay="0.1s"
      >
        <div className="team-item border border-primary img-border-radius overflow-hidden">
          <img
            src={assetUrl('img/team-1.jpg')}
            className="img-fluid w-100"
            alt="Sophonyas Bewuketu"
          />

          <div className="team-icon d-flex align-items-center justify-content-center">
            <a
              className="share btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Share"
            >
              <i className="fas fa-share-alt"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Twitter"
            >
              <i className="fab fa-twitter"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle"
              href="#"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>

          <div className="team-content text-center py-3">
            <h4 className="text-primary">Sophonyas Bewuketu</h4>
            <p className="text-muted mb-2">Dev INSA 5th Batch</p>
          </div>
        </div>
      </div>

      {/* Kibir */}
      <div
        className="col-md-6 col-lg-4 col-xl-3 wow fadeIn"
        data-wow-delay="0.3s"
      >
        <div className="team-item border border-primary img-border-radius overflow-hidden">
          <img
            src={assetUrl('img/team-1.jpg')}
            className="img-fluid w-100"
            alt="Kibir Mesganaw"
          />

          <div className="team-icon d-flex align-items-center justify-content-center">
            <a
              className="share btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Share"
            >
              <i className="fas fa-share-alt"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Twitter"
            >
              <i className="fab fa-twitter"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle"
              href="#"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>

          <div className="team-content text-center py-3">
            <h4 className="text-primary">Kibir Mesganaw</h4>
            <p className="text-muted mb-2">Dev INSA 5th Batch</p>
          </div>
        </div>
      </div>
       {/* Kibir */}
      <div
        className="col-md-6 col-lg-4 col-xl-3 wow fadeIn"
        data-wow-delay="0.3s"
      >
        <div className="team-item border border-primary img-border-radius overflow-hidden">
          <img
            src={assetUrl('img/team-1.jpg')}
            className="img-fluid w-100"
            alt="Kibir Mesganaw"
          />

          <div className="team-icon d-flex align-items-center justify-content-center">
            <a
              className="share btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Share"
            >
              <i className="fas fa-share-alt"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Twitter"
            >
              <i className="fab fa-twitter"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle"
              href="#"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>

          <div className="team-content text-center py-3">
            <h4 className="text-primary">Tsegazeab Kitaw</h4>
            <p className="text-muted mb-2">Dev INSA 5th Batch</p>
          </div>
        </div>
      </div>

           {/* Lual */}
      <div
        className="col-md-6 col-lg-4 col-xl-3 wow fadeIn"
        data-wow-delay="0.5s"
      >
        <div className="team-item border border-primary img-border-radius overflow-hidden">
          <img
            src={assetUrl('img/team-3.jpg')}
            className="img-fluid w-100"
            alt="Simon Zadig"
          />

          <div className="team-icon d-flex align-items-center justify-content-center">
            <a
              className="share btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Share"
            >
              <i className="fas fa-share-alt"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Twitter"
            >
              <i className="fab fa-twitter"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle"
              href="#"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>

          <div className="team-content text-center py-3">
            <h4 className="text-primary">Simon Zadig</h4>
            <p className="text-muted mb-2">Dev INSA 5th Batch</p>
          </div>
        </div>
      </div>
       {/* Kibir */}
      <div
        className="col-md-6 col-lg-4 col-xl-3 wow fadeIn"
        data-wow-delay="0.3s"
      >
        <div className="team-item border border-primary img-border-radius overflow-hidden">
          <img
            src={assetUrl('img/team-4.jpg')}
            className="img-fluid w-100"
            alt="Simret Yitbarek"
          />

          <div className="team-icon d-flex align-items-center justify-content-center">
            <a
              className="share btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Share"
            >
              <i className="fas fa-share-alt"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Twitter"
            >
              <i className="fab fa-twitter"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle"
              href="#"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>

          <div className="team-content text-center py-3">
            <h4 className="text-primary">Simret Yitbarek</h4>
            <p className="text-muted mb-2">Dev INSA 5th Batch</p>
          </div>
        </div>
      </div>

       {/* Kibir */}
      <div
        className="col-md-6 col-lg-4 col-xl-3 wow fadeIn"
        data-wow-delay="0.3s"
      >
        <div className="team-item border border-primary img-border-radius overflow-hidden">
          <img
            src={assetUrl('img/team-4.jpg')}
            className="img-fluid w-100"
            alt="Tsion"
          />

          <div className="team-icon d-flex align-items-center justify-content-center">
            <a
              className="share btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Share"
            >
              <i className="fas fa-share-alt"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle me-3"
              href="#"
              aria-label="Twitter"
            >
              <i className="fab fa-twitter"></i>
            </a>

            <a
              className="share-link btn btn-primary btn-md-square text-white rounded-circle"
              href="#"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>

          <div className="team-content text-center py-3">
            <h4 className="text-primary">Tsion Tewelgn</h4>
            <p className="text-muted mb-2">Dev INSA 5th Batch</p>
          </div>
        </div>
      </div>

 

    </div>
  </div>
</div>
{/* Team End */}

    </>
  );
}
