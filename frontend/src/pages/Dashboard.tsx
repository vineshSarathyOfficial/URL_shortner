import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { linksApi } from '../api/client';
import type { Link as LinkType } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const { user } = useAuth();
  const [links, setLinks] = useState<LinkType[]>([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      const data = await linksApi.list();
      setLinks(data.links);
    } catch {
      setError('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setCreating(true);
    setError('');
    try {
      const link = await linksApi.create(url.trim());
      setLinks((prev) => [link, ...prev]);
      setUrl('');
    } catch (err: unknown) {
      const apiErr = err as { error?: { message?: string } };
      setError(apiErr.error?.message || 'Failed to create link');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    await linksApi.delete(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleReactivate = async (id: string) => {
    const link = await linksApi.reactivate(id);
    setLinks((prev) => prev.map((l) => (l.id === id ? link : l)));
  };

  const copyToClipboard = (shortUrl: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(shortUrl);
    setTimeout(() => setCopied(null), 2000);
  };

  const statusBadge = (status: string) => {
    const cls = status === 'ACTIVE' ? 'badge-active' : 'badge-inactive';
    return <span className={`badge-pill ${cls}`}>{status}</span>;
  };

  return (
    <div className="app-page">
      <Navbar variant="app" />

      <main className="app-main">
        <div className="container">
          <div className="page-header">
            <div>
              <span className="caption-uppercase">Dashboard</span>
              <h1 className="display-sm">Hey, {user?.username}</h1>
            </div>
          </div>

          <section className="create-band">
            <div>
              <h2 className="title-md">Shorten a new URL</h2>
              <p className="body-sm">Paste a long link and we'll validate it, then generate a short code.</p>
            </div>
            {error && <div className="alert-error">{error}</div>}
            <form onSubmit={handleCreate} className="create-form">
              <input
                className="text-input"
                type="url"
                placeholder="https://example.com/your-long-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Shorten URL'}
              </button>
            </form>
          </section>

          <section>
            <div className="page-header" style={{ marginBottom: 24 }}>
              <h2 className="title-lg">Your links</h2>
              <span className="badge-pill badge-active">{links.length} total</span>
            </div>

            {loading ? (
              <p className="loading-text">Loading your links...</p>
            ) : links.length === 0 ? (
              <div className="empty-state">
                <h3 className="title-md">No links yet</h3>
                <p className="body-sm">Create your first short link above to get started.</p>
              </div>
            ) : (
              <div className="links-grid">
                {links.map((link) => (
                  <article key={link.id} className="link-card">
                    <div className="link-card-main">
                      <div className="link-card-short">
                        <a href={link.short_url} target="_blank" rel="noopener noreferrer">
                          {link.short_url}
                        </a>
                      </div>
                      <div className="link-card-url" title={link.original_url}>
                        {link.original_url}
                      </div>
                      <div className="link-card-meta">
                        <span>{link.click_count} clicks</span>
                        <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                        <span>
                          Last access:{' '}
                          {link.last_activated_at
                            ? new Date(link.last_activated_at).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                    <div className="link-card-actions">
                      {statusBadge(link.effective_status)}
                      {link.effective_status === 'ACTIVE' && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => copyToClipboard(link.short_url)}
                        >
                          {copied === link.short_url ? 'Copied!' : 'Copy'}
                        </button>
                      )}
                      {link.effective_status === 'INACTIVE' && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => handleReactivate(link.id)}
                        >
                          Reactivate
                        </button>
                      )}
                      <Link to={`/dashboard/links/${link.id}`} className="btn-secondary btn-sm">
                        Analytics
                      </Link>
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => handleDelete(link.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
