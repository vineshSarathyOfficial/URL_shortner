import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ClayIllustration from '../components/ClayIllustration';

export default function Landing() {
  return (
    <div className="page-landing">
      <Navbar />

      <section className="hero-band">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="caption-uppercase">URL Shortener</span>
            <h1 className="display-xl">
              Shorten links.<br />Track every click.
            </h1>
            <p className="lead">
              Create short links, monitor analytics, and manage your URLs — all in one warm, simple place.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn-primary">Get started free</Link>
              <Link to="/login" className="btn-secondary">Sign in</Link>
            </div>
          </div>
          <div className="hero-illustration-card">
            <ClayIllustration />
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="caption-uppercase">Features</span>
            <h2 className="display-sm">Everything you need to share smarter</h2>
            <p className="body-md">Powerful link management without the complexity.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card feature-card-pink">
              <h3>Instant shortening</h3>
              <p>Paste any URL and get a 6-character short link in seconds. Validated, secure, and ready to share.</p>
            </div>
            <div className="feature-card feature-card-teal">
              <h3>Click analytics</h3>
              <p>See total clicks, daily trends, and recent access history for every link you create.</p>
            </div>
            <div className="feature-card feature-card-lavender">
              <h3>Smart lifecycle</h3>
              <p>Links auto-deactivate after 30 days of inactivity. Reactivate anytime with one click.</p>
            </div>
            <div className="feature-card feature-card-peach">
              <h3>Health monitoring</h3>
              <p>Daily checks ensure your destination URLs are still live. Dead links get flagged automatically.</p>
            </div>
            <div className="feature-card feature-card-ochre">
              <h3>Secure by default</h3>
              <p>SSRF protection, rate limiting, and Argon2id password hashing keep your account safe.</p>
            </div>
            <div className="feature-card feature-card-cream">
              <h3>Your links, your data</h3>
              <p>Every link belongs to you. Full ownership, soft-delete, and cascade account management.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="cta-band">
        <h2 className="display-md">Ready to shorten your first link?</h2>
        <p className="body-md">Join Snip and start tracking clicks in under a minute.</p>
        <Link to="/signup" className="btn-primary">Create free account</Link>
      </div>

      <Footer />
    </div>
  );
}
