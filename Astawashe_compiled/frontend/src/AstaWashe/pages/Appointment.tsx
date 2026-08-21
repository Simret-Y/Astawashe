export default function Appointment() {
  return (
    <div className="container-fluid py-5">
      <div className="container">
        <div className="row gx-5">
          <div className="col-lg-6 mb-5 mb-lg-0">
            <div className="mb-4">
              <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">Reminder Setup</h5>
              <h1 className="display-4">Make An Reminder Setup For Your Family</h1>
            </div>
            <p className="mb-5">Eirmod sed tempor lorem ut dolores. Aliquyam sit sadipscing kasd ipsum. Dolor ea et dolore et at sea ea at dolor, justo ipsum duo rebum sea invidunt voluptua.</p>
            <a className="btn btn-primary rounded-pill py-3 px-5 me-3" href="#!">Find Doctor</a>
            <a className="btn btn-outline-primary rounded-pill py-3 px-5" href="#!">Read More</a>
          </div>
          <div className="col-lg-6">
            <div className="bg-light text-center rounded p-5">
              <h1 className="mb-4">Book An Reminder Setup</h1>
              <form>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <select className="form-select bg-white border-0" style={{ height: 55 }}>
                      <option>Choose Hospital</option>
                      <option>የካቲት ፲፪ ሆስፒታል</option>
                      <option>ምኒልክ ሆስፒታል</option>
                      <option>አለርት ሆስፒታል</option>
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <select className="form-select bg-white border-0" style={{ height: 55 }}>
                      <option>Select Doctor</option>
                      <option>Doctor 1</option>
                      <option>Doctor 2</option>
                      <option>Doctor 3</option>
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <input type="text" className="form-control bg-white border-0" placeholder="Your Name" style={{ height: 55 }} />
                  </div>
                  <div className="col-12 col-sm-6">
                    <input type="email" className="form-control bg-white border-0" placeholder="Your Email" style={{ height: 55 }} />
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="date" id="date" data-target-input="nearest">
                      <input type="text" className="form-control bg-white border-0 datetimepicker-input" placeholder="Date" data-target="#date" data-toggle="datetimepicker" style={{ height: 55 }} />
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="time" id="time" data-target-input="nearest">
                      <input type="text" className="form-control bg-white border-0 datetimepicker-input" placeholder="Time" data-target="#time" data-toggle="datetimepicker" style={{ height: 55 }} />
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
    </div>
  );
}
