import { assetUrl } from '../lib/assets';

export default function Search() {
  return (
    <>
      <div className="container-fluid pt-5">
        <div className="container">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: 500 }}>
            <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Find your medication plan</h5>
            <h1 className="display-4 mb-4">Discover smart medication support</h1>
            <h5 className="fw-normal">Duo ipsum erat stet dolor sea ut nonumy tempor. Tempor duo lorem eos sit sed ipsum takimata ipsum sit est.</h5>
          </div>
          <div className="mx-auto" style={{ width: '100%', maxWidth: 600 }}>
            <div className="input-group">
              <select className="form-select border-primary w-25" style={{ height: 60 }}>
        <option>Choose Hospital</option>
                      <option>የካቲት ፲፪ ሆስፒታል</option>
                      <option>ምኒልክ ሆስፒታል</option>
                      <option>አለርት ሆስፒታል</option>
              </select>
              <input type="text" className="form-control border-primary w-50" placeholder="Keyword" />
              <button className="btn btn-dark border-0 w-25">Search</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-5">
        <div className="container">
          <div className="row g-5">
            {['team-1.jpg', 'team-1.jpg', 'team-3.jpg'].map((img) => (
              <div className="col-lg-6 team-item" key={img}>
                <div className="row g-0 bg-light rounded overflow-hidden">
                  <div className="col-12 col-sm-5 h-100">
                    <img className="img-fluid h-100" src={assetUrl(`img/${img}`)} style={{ objectFit: 'cover' }} alt="Doctor" />
                  </div>
                  <div className="col-12 col-sm-7 h-100 d-flex flex-column">
                    <div className="mt-auto p-4">
                      <h3>Dr.</h3>
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
    </>
  );
}
