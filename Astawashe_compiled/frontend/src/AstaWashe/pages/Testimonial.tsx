import { assetUrl } from '../lib/assets';

export default function Testimonial() {
  return (
    <div className="container-fluid py-5">
      <div className="container">
        <div className="text-center mx-auto mb-5" style={{ maxWidth: 500 }}>
          <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Testimonial</h5>
          <h1 className="display-4">Patients Say About Reminder Services</h1>
        </div>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="owl-carousel testimonial-carousel">
              {['testimonial-1.jpg', 'testimonial-2.jpg', 'testimonial-3.jpg'].map((img) => (
                <div className="testimonial-item text-center" key={img}>
                  <div className="position-relative mb-5">
                    <img className="img-fluid rounded-circle mx-auto" src={assetUrl(`img/${img}`)} alt="" />
                    <div className="position-absolute top-100 start-50 translate-middle d-flex align-items-center justify-content-center bg-white rounded-circle" style={{ width: 60, height: 60 }}>
                      <i className="fa fa-quote-left fa-2x text-primary"></i>
                    </div>
                  </div>
                  <p className="fs-4 fw-normal">Dolores sed duo clita tempor justo dolor et stet lorem kasd labore dolore lorem ipsum.</p>
                  <hr className="w-25 mx-auto" />
                  <h3>Patient Name</h3>
                  <h6 className="fw-normal text-primary mb-3">Profession</h6>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
