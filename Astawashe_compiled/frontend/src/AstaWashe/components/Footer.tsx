export default function Footer() {
  return (
    <>
      <div className="container-fluid bg-dark text-light mt-5 py-5">
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-lg-3 col-md-6">
              <h4 className="d-inline-block text-primary text-uppercase border-bottom border-5 border-secondary mb-4">
                Get In Touch
              </h4>
              <p className="mb-4">No dolore ipsum accusam no lorem. Invidunt sed clita kasd clita et et dolor sed dolor</p>
              <p className="mb-2"><i className="fa fa-map-marker-alt text-primary me-3"></i>Addis Ababa, Ethiopia</p>
              <p className="mb-2"><i className="fa fa-envelope text-primary me-3"></i>AstaWashe@insa.edu.et</p>
              <p className="mb-0"><i className="fa fa-phone-alt text-primary me-3"></i>+25906088808</p>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="d-inline-block text-primary text-uppercase border-bottom border-5 border-secondary mb-4">
                Quick Links
              </h4>
              <div className="d-flex flex-column justify-content-start">
                <a className="text-light mb-2" href="/#"><i className="fa fa-angle-right me-2"></i>Home</a>
                <a className="text-light mb-2" href="/about"><i className="fa fa-angle-right me-2"></i>About Us</a>
                <a className="text-light mb-2" href="/service"><i className="fa fa-angle-right me-2"></i>Reminder Services</a>
                <a className="text-light mb-2" href="/team"><i className="fa fa-angle-right me-2"></i>Meet the AstaWashe Team</a>
                <a className="text-light mb-2" href="/blog"><i className="fa fa-angle-right me-2"></i>Reminder Insights</a>
                <a className="text-light" href="/contact"><i className="fa fa-angle-right me-2"></i>AstaWashe Support</a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="d-inline-block text-primary text-uppercase border-bottom border-5 border-secondary mb-4">
                Popular Links
              </h4>
              <div className="d-flex flex-column justify-content-start">
                <a className="text-light mb-2" href="/#"><i className="fa fa-angle-right me-2"></i>Home</a>
                <a className="text-light mb-2" href="/about"><i className="fa fa-angle-right me-2"></i>About Us</a>
                <a className="text-light mb-2" href="/service"><i className="fa fa-angle-right me-2"></i>Reminder Services</a>
                <a className="text-light mb-2" href="/team"><i className="fa fa-angle-right me-2"></i>Meet the AstaWashe Team</a>
                <a className="text-light mb-2" href="/blog"><i className="fa fa-angle-right me-2"></i>Reminder Insights</a>
                <a className="text-light" href="/contact"><i className="fa fa-angle-right me-2"></i>AstaWashe Support</a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="d-inline-block text-primary text-uppercase border-bottom border-5 border-secondary mb-4">
                Newsletter
              </h4>
              <form action="#">
                <div className="input-group">
                  <input type="text" className="form-control p-3 border-0" placeholder="Your Email Address" />
                  <button className="btn btn-primary" type="submit">Sign Up</button>
                </div>
              </form>
              <h6 className="text-primary text-uppercase mt-4 mb-3">Follow Us</h6>
              <div className="d-flex">
                <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-2" href="#!"><i className="fab fa-twitter"></i></a>
                <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-2" href="#!"><i className="fab fa-facebook-f"></i></a>
                <a className="btn btn-lg btn-primary btn-lg-square rounded-circle me-2" href="#!"><i className="fab fa-linkedin-in"></i></a>
                <a className="btn btn-lg btn-primary btn-lg-square rounded-circle" href="#!"><i className="fab fa-instagram"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container-fluid bg-dark text-light border-top border-secondary py-4">
        <div className="container">
          <div className="row g-5">
            <div className="col-md-6 text-center text-md-start">
              <p className="mb-md-0">&copy; <a className="text-primary" href="#!">AstaWashe</a>. All Rights Reserved.</p>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <p className="mb-0">Designed by <a className="text-primary" href="#!">AstaWashe Team</a></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
