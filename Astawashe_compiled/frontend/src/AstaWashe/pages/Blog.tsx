import { assetUrl } from '../lib/assets';

export default function Blog() {
  return (
    <div className="container-fluid py-5">
      <div className="container">
        <div className="text-center mx-auto mb-5" style={{ maxWidth: 500 }}>
          <h5 className="d-inline-block text-primary text-uppercase border-bottom border-5">AstaWashe Updates</h5>
          <h1 className="display-4">AstaWashe Reminder Insights</h1>
        </div>
        <div className="row g-5">
          {['blog-1.jpg', 'blog-2.jpg', 'blog-3.jpg', 'blog-2.jpg', 'blog-1.jpg', 'blog-3.jpg'].map((img, index) => (
            <div className="col-xl-4 col-lg-6" key={`${img}-${index}`}>
              <div className="bg-light rounded overflow-hidden">
                <img className="img-fluid w-100" src={assetUrl(`img/${img}`)} alt="" />
                <div className="p-4">
                  <a className="h3 d-block mb-3" href="/blog-detail">Stay Consistent with Your Medication</a>
                  <p className="m-0">Taking your medication on time improves treatment results and reduces health risks.</p>
                </div>
                <div className="d-flex justify-content-between border-top p-4">
                  <div className="d-flex align-items-center">
                    <img className="rounded-circle me-2" src={assetUrl('img/user.jpg')} width="25" height="25" alt="" />
                    <small>Yohhana Mulugeta</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <small className="ms-3"><i className="far fa-eye text-primary me-1"></i>12345</small>
                    <small className="ms-3"><i className="far fa-comment text-primary me-1"></i>123</small>
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
