/** Sign-in screen. */
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Alert from '../components/Alert';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [details, setDetails] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Where to send the visitor after a successful sign-in: back to the page
  // that bounced them, or to the home page.
  const destination = location.state?.from?.pathname || '/';

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setDetails([]);

    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
      setDetails(err.details || []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="panel">
        <h1 style={{ marginBottom: 4 }}>Sign in</h1>
        <p className="muted small">Access your orders, addresses and cart.</p>

        <Alert message={error} details={details} onDismiss={() => setError(null)} />

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" className="input" value={form.email}
              onChange={update('email')} autoComplete="email" required autoFocus />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={form.password}
              onChange={update('password')} autoComplete="current-password" required />
          </div>

          <button type="submit" className="btn btn-block" disabled={submitting}>
            {submitting ? (<><span className="spinner" /> Signing in…</>) : 'Sign in'}
          </button>
        </form>

        <p className="small center muted" style={{ marginTop: 18, marginBottom: 0 }}>
          New to ShopSphere? <Link to="/register">Create an account</Link>
        </p>
      </div>

      <div className="alert alert-info small" style={{ marginTop: 16 }}>
        <div>
          <strong>Demonstration accounts</strong>
          <div style={{ marginTop: 5 }}>Customer: <code>ananya@example.com</code> / <code>Customer@123</code></div>
          <div>Administrator: <code>admin@shopsphere.test</code> / <code>Admin@12345</code></div>
        </div>
      </div>
    </div>
  );
}
