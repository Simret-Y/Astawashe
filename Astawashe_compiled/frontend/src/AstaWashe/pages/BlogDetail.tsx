import { assetUrl } from '../lib/assets';

export default function BlogDetail() {
  return (
    <div className="container py-5">
      <div className="row g-5">
        <div className="col-lg-8">
          <div className="mb-5">
            <img className="img-fluid w-100 rounded mb-5" src={assetUrl('img/blog-2.jpg')} alt="" />
            <h1 className="mb-4">Diam dolor est labore duo ipsum clita sed et lorem tempor sanctus lorem kasd duo</h1>
            <p>Sadipscing labore amet rebum est et justo gubergren. Et eirmod ipsum sit diam ut magna lorem. Nonumy vero labore lorem sanctus rebum.</p>
            <p>Voluptua est takimata stet invidunt sed rebum nonumy stet, clita aliquyam dolores vero stet consetetur elitr.</p>
            <p>Diam dolor est labore duo invidunt ipsum clita et, sed et lorem voluptua tempor invidunt at est sanctus sanctus.</p>
            <div className="d-flex justify-content-between bg-light rounded p-4 mt-4 mb-4">
              <div className="d-flex align-items-center">
                <img className="rounded-circle me-2" src={assetUrl('img/user.jpg')} width="40" height="40" alt="" />
                <span>John Doe</span>
              </div>
              <div className="d-flex align-items-center">
                <span className="ms-3"><i className="far fa-eye text-primary me-1"></i>12345</span>
                <span className="ms-3"><i className="far fa-comment text-primary me-1"></i>123</span>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <h4 className="d-inline-block text-primary text-uppercase border-bottom border-5 mb-4">3 Comments</h4>
            {[0, 1].map((index) => (
              <div className="d-flex mb-4" key={index}>
                <img src={assetUrl('img/user.jpg')} className="img-fluid rounded-circle" style={{ width: 45, height: 45 }} />
                <div className="ps-3">
                  <h6><a href="#!">John Doe</a> <small><i>01 Jan 2045</i></small></h6>
                  <p>Diam amet duo labore stet elitr invidunt ea clita ipsum voluptua, tempor labore accusam ipsum et no at.</p>
                  <button className="btn btn-sm btn-light" type="button">Reply</button>
                </div>
              </div>
            ))}
            <div className="d-flex ms-5 mb-4">
              <img src={assetUrl('img/user.jpg')} className="img-fluid rounded-circle" style={{ width: 45, height: 45 }} />
              <div className="ps-3">
                <h6><a href="#!">John Doe</a> <small><i>01 Jan 2045</i></small></h6>
                <p>Diam amet duo labore stet elitr invidunt ea clita ipsum voluptua, tempor labore accusam ipsum et no at.</p>
                <button className="btn btn-sm btn-light" type="button">Reply</button>
              </div>
            </div>
          </div>

          <div className="bg-light rounded p-5">
            <h4 className="d-inline-block text-primary text-uppercase border-bottom border-5 border-white mb-4">Leave a comment</h4>
            <form>
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <input type="text" className="form-control bg-white border-0" placeholder="Your Name" style={{ height: 55 }} />
                </div>
                <div className="col-12 col-sm-6">
                  <input type="email" className="form-control bg-white border-0" placeholder="Your Email" style={{ height: 55 }} />
                </div>
                <div className="col-12">
                  <input type="text" className="form-control bg-white border-0" placeholder="Website" style={{ height: 55 }} />
                </div>
                <div className="col-12">
                  <textarea className="form-control bg-white border-0" rows={5} placeholder="Comment"></textarea>
                </div>
                <div className="col-12">
                  <button className="btn btn-primary w-100 py-3" type="submit">Leave Your Comment</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
