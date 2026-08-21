import { useEffect } from 'react';
import { assetUrl } from '../lib/assets';

export default function Price() {
  useEffect(() => {
    const $ = (window as any).$;
    if (!$ || !$.fn || !$.fn.owlCarousel) {
      return;
    }

    $('.price-carousel').owlCarousel({
      autoplay: true,
      smartSpeed: 1000,
      margin: 45,
      dots: false,
      loop: true,
      nav: true,
      navText: ['<i class="bi bi-arrow-left"></i>', '<i class="bi bi-arrow-right"></i>'],
      responsive: {
        0: { items: 1 },
        992: { items: 2 },
        1200: { items: 3 }
      }
    });

    $('.team-carousel, .related-carousel').owlCarousel({
      autoplay: true,
      smartSpeed: 1000,
      margin: 45,
      dots: false,
      loop: true,
      nav: true,
      navText: ['<i class="bi bi-arrow-left"></i>', '<i class="bi bi-arrow-right"></i>'],
      responsive: {
        0: { items: 1 },
        992: { items: 2 }
      }
    });
  }, []);

  return (
    <>
      <div className="container-fluid py-5">
      <div className="container">
        <div className="text-center mx-auto mb-5" style={{ maxWidth: 500 }}>
          <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Medical Packages</h5>
          <h1 className="display-4">Awesome Medical Programs</h1>
        </div>
        <div className="owl-carousel price-carousel position-relative" style={{ padding: '0 45px 45px 45px' }}>
          {[
            { img: 'price-1.jpg', title: 'Pregnancy Care', price: '49' },
            { img: 'price-2.jpg', title: 'Health Checkup', price: '99' },
            { img: 'price-3.jpg', title: 'Dental Care', price: '149' },
            { img: 'price-4.jpg', title: 'Doctor Visit Reminders', price: '199' }
          ].map((item) => (
            <div className="bg-light rounded text-center" key={item.title}>
              <div className="position-relative">
                <img className="img-fluid rounded-top" src={assetUrl(`img/${item.img}`)} alt="" />
                <div className="position-absolute w-100 h-100 top-50 start-50 translate-middle rounded-top d-flex flex-column align-items-center justify-content-center" style={{ background: 'rgba(29, 42, 77, .8)' }}>
                  <h3 className="text-primary">{item.title}</h3>
                  <h1 className="display-4 text-white mb-0">
                    <small className="align-top fw-normal" style={{ fontSize: 22, lineHeight: '45px' }}>$</small>
                    {item.price}
                    <small className="align-bottom fw-normal" style={{ fontSize: 16, lineHeight: '40px' }}>/ Year</small>
                  </h1>
                </div>
              </div>
              <div className="text-center py-5">
                <p>Emergency Medical Treatment</p>
                <p>Highly Experienced Doctors</p>
                <p>Highest Success Rate</p>
                <p>Telephone Service</p>
                <a href="#!" className="btn btn-primary rounded-pill py-3 px-5 my-2">Apply Now</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

      <div className="container-fluid py-5">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: 500 }}>
            <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Our Doctors</h5>
            <h1 className="display-4">Qualified Healthcare Professionals</h1>
          </div>
          <div className="owl-carousel team-carousel position-relative">
            {['test1.png', 'test2.png', 'test3.png'].map((img) => (
              <div className="team-item" key={img}>
                <div className="row g-0 bg-light rounded overflow-hidden">
                  <div className="col-12 col-sm-5 h-100">
                    <img className="img-fluid h-100" src={assetUrl(`img/${img}`)} style={{ objectFit: 'cover' }} alt="Doctor" />
                  </div>
                  <div className="col-12 col-sm-7 h-100 d-flex flex-column">
                    <div className="mt-auto p-4">
                      <h3>Dr. </h3>
                      <h6 className="fw-normal fst-italic text-primary mb-4">Cardiology Specialist</h6>
                      <p className="m-0">Medical doctor who diagnose and treat disorders of the heart and blood vessels, ranging from hypertension and arrhythmias to heart failure and coronary artery disease.</p>
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
    </>
  );
}
