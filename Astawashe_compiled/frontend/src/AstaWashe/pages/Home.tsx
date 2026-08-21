import { useEffect } from 'react';
import { assetUrl } from '../lib/assets';

export default function Home() {
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

    $('.testimonial-carousel').owlCarousel({
      autoplay: true,
      smartSpeed: 1000,
      items: 1,
      dots: true,
      loop: true
    });
  }, []);

  return (
    <>
      <div className="container-fluid bg-primary py-5 mb-5 hero-header">
        <div className="container py-5">
          <div className="row justify-content-start">
            <div className="col-lg-8 text-center text-lg-start">
              <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5" style={{ borderColor: 'rgba(256, 256, 256, .3)' }}>
                AstaWashe Smart Reminder
              </h5>
              <h1 className="display-1 text-white mb-md-3">Audio First Medical Reminder System</h1>
              <p className="text-white mb-4 fs-5">Stay on time with medicine, appointments, and wellness </p>
               <p className="text-white mb-4 fs-5">Alerts While your family receives the support they need.</p>
              <div className="pt-2">
                <a href="/auth" className="btn btn-outline-light rounded-pill py-md-3 px-md-5 mx-2">Start Reminders</a>
              
              </div>
            </div>
          </div>
        </div>
      </div>


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

      {/* <div className="container-fluid py-5">
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
      </div> */}


 <div className="container-fluid py-5">
  <div className="container">
    <div className="text-center mx-auto mb-5" style={{ maxWidth: 500 }}>
      <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">
        AstaWashe Plans
      </h5>
      <h1 className="display-4">Choose Your Care Plan</h1>
    </div>

    <div
      className="owl-carousel price-carousel position-relative"
      style={{ padding: '0 45px 45px 45px' }}
    >
      {[
        {
          img: 'price-1.jpg',
          title: 'Personal Care',
          price: 'Free',
        },
        {
          img: 'price-2.jpg',
          title: 'Family Care',
          price: '199',
        },
        {
          img: 'price-3.jpg',
          title: 'Clinic Care',
          price: '499',
        },
        {
          img: 'price-4.jpg',
          title: 'Hospital Care',
          price: '999',
        }
      ].map((item) => (
        <div className="bg-light rounded text-center" key={item.title}>
          <div className="position-relative">
            <img
              className="img-fluid rounded-top"
              src={assetUrl(`img/${item.img}`)}
              alt={item.title}
            />

            <div
              className="position-absolute w-100 h-100 top-50 start-50 translate-middle rounded-top d-flex flex-column align-items-center justify-content-center"
              style={{ background: 'rgba(29, 42, 77, .8)' }}
            >
              <h3 className="text-white">{item.title}</h3>

              <h1 className="display-4 text-white mb-0">
                {item.price !== 'Free' && (
                  <small
                    className="align-top fw-normal"
                    style={{ fontSize: 22, lineHeight: '45px' }}
                  >
                    ETB
                  </small>
                )}

                {item.price === 'Free' ? 'Free' : item.price}

                {item.price !== 'Free' && (
                  <small
                    className="align-bottom fw-normal"
                    style={{ fontSize: 16, lineHeight: '40px' }}
                  >
                    / Month
                  </small>
                )}
              </h1>
            </div>
          </div>

          <div className="text-center py-5">
            <p>Medication Reminder Management</p>
            <p>Doctor & Patient Monitoring</p>
            <p>Adherence Tracking</p>
            <p>Voice & USSD Reminder Support</p>

            <a
              href="#!"
              className="btn btn-primary rounded-pill py-3 px-5 my-2"
            >
              Get Started
            </a>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

      
      {/* <div className="container-fluid py-5">
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
                      <h3>Dr. 
                      </h3>
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
      </div> */}

      {/* <div className="container-fluid bg-primary my-5 py-5">
        <div className="container py-5">
          <div className="row gx-5">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <div className="mb-4">
                <h5 className="d-inline-block text-white text-uppercase border-bottom border-5">Reminder Setup</h5>
                <h1 className="display-4">Make An Reminder Setup For Your Family</h1>
              </div>
              <p className="text-white mb-5">Eirmod sed tempor lorem ut dolores. Aliquyam sit sadipscing kasd ipsum. Dolor ea et dolore et at sea ea at dolor, justo ipsum duo rebum sea invidunt voluptua.</p>
              <a className="btn btn-dark rounded-pill py-3 px-5 me-3" href="#!">Find Doctor</a>
              <a className="btn btn-outline-dark rounded-pill py-3 px-5" href="#!">Read More</a>
            </div>
            <div className="col-lg-6">
              <div className="bg-white text-center rounded p-5">
                <h1 className="mb-4">Book An Reminder Setup</h1>
                <form>
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <select className="form-select bg-light border-0" style={{ height: 55 }}>
                        <option>Choose Hospital</option>
                      <option>የካቲት ፲፪ ሆስፒታል</option>
                      <option>ምኒልክ ሆስፒታል</option>
                      <option>አለርት ሆስፒታል</option>
                      </select>
                    </div>
                    <div className="col-12 col-sm-6">
                      <select className="form-select bg-light border-0" style={{ height: 55 }}>
                        <option>Select Doctor</option>
                        <option>Doctor 1</option>
                        <option>Doctor 2</option>
                        <option>Doctor 3</option>
                      </select>
                    </div>
                    <div className="col-12 col-sm-6">
                      <input type="text" className="form-control bg-light border-0" placeholder="Your Name" style={{ height: 55 }} />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input type="email" className="form-control bg-light border-0" placeholder="Your Email" style={{ height: 55 }} />
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="date" id="date" data-target-input="nearest">
                        <input type="text" className="form-control bg-light border-0 datetimepicker-input" placeholder="Date" data-target="#date" data-toggle="datetimepicker" style={{ height: 55 }} />
                      </div>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="time" id="time" data-target-input="nearest">
                        <input type="text" className="form-control bg-light border-0 datetimepicker-input" placeholder="Time" data-target="#time" data-toggle="datetimepicker" style={{ height: 55 }} />
                      </div>
                    </div>
                    <div className="col-12">
                      <button className="btn btn-primary w-100 py-3" type="submit">Make An Reminder Setup</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div> */}

 


      {/* <div className="container-fluid bg-primary my-5 py-5">
        <div className="container py-5">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: 500 }}>
            <h5 className="d-inline-block text-white text-uppercase border-bottom border-5">Find your medication plan</h5>
            <h1 className="display-4 mb-4">Discover smart medication support</h1>
            <h5 className="text-white fw-normal">Duo ipsum erat stet dolor sea ut nonumy tempor. Tempor duo lorem eos sit sed ipsum takimata ipsum sit est. Ipsum ea voluptua ipsum sit justo</h5>
          </div>
          <div className="mx-auto" style={{ width: '100%', maxWidth: 600 }}>
            <div className="input-group">
              <select className="form-select border-primary w-25" style={{ height: 60 }}>
                <option>Choose Hospital</option>
                      <option>የካቲት ፲፪ ሆስፒታል</option>
                      <option>ምኒልክ ሆስፒታል</option>
                      <option>አለርት ሆስፒታል</option>``
              </select>
              <input type="text" className="form-control border-primary w-50" placeholder="Keyword" />
              <button className="btn btn-dark border-0 w-25">Search</button>
            </div>
          </div>
        </div>
      </div> */}
{/* 
      <div className="container-fluid py-5">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: 500 }}>
            <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Testimonial</h5>
            <h1 className="display-5">Patients Say About Our Reminder Services</h1>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="owl-carousel testimonial-carousel">
                {['testimonial-1.jpg', 'testimonial-2.jpg', 'testimonial-3.jpg'].map((img, index) => (
                  <div className="testimonial-item text-center" key={img}>
                    <div className="position-relative mb-5">
                      <img className="img-fluid rounded-circle mx-auto" src={assetUrl(`img/${img}`)} alt="Testimonial" />
                      <div className="position-absolute top-100 start-50 translate-middle d-flex align-items-center justify-content-center bg-white rounded-circle" style={{ width: 60, height: 60 }}>
                        <i className="fa fa-quote-left fa-2x text-primary"></i>
                      </div>
                    </div>
                    <p className="fs-4 fw-normal">የልብና የደም ሥሮች ችግሮችን (እንደ ደም ግፊት፣ የልብ መደበኛ ያልሆነ መመታት፣ የልብ ድካም እና የልብ ደም ሥር መዘጋት) የሚመረምሩና የሚያክሙ ሐኪሞች ሲሆኑ፣ በተለይ የመድሀኒት መታሰቢያ (medication reminder) ሲስተም መጠቀም ታካሚዎች መድሀኒታቸውን በጊዜው እንዲወስዱ በመርዳት የሕክምና ውጤታማነትን እንደሚያሻሽል::</p>
                    <hr className="w-25 mx-auto" />
                    <h3>Patient Name {index + 1}</h3>
                    <h6 className="fw-normal text-primary mb-3">Profession</h6>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div> */}

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
            src={assetUrl('img/team-2.jpg')}
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
