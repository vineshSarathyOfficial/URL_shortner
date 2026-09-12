import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="nav-logo-mark">◆</span>
          <span className="footer-logo-text">Snip</span>
          <p className="footer-tagline">Short links. Real analytics. Zero fuss.</p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <span className="caption-uppercase">Product</span>
            <Link to="/signup">Get started</Link>
            <Link to="/login">Sign in</Link>
          </div>
          <div className="footer-col">
            <span className="caption-uppercase">Features</span>
            <span>Link shortening</span>
            <span>Click analytics</span>
            <span>Health checks</span>
          </div>
        </div>
      </div>
      <div className="footer-mountains" aria-hidden="true">
        <div className="mountain mountain-1" />
        <div className="mountain mountain-2" />
        <div className="mountain mountain-3" />
      </div>
    </footer>
  );
}
