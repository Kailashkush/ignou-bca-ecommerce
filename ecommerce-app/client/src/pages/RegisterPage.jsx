/**
 * Registration screen.
 *
 * The password rules are shown as a live checklist rather than only as an
 * error after submission, so the visitor can see what is still missing while
 * they type. The same rules are enforced by the API.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Alert from '../components/Alert';

const RULES = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One lower-case letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One upper-case letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One digit', test: (v) => /\d/.test(v) },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [details, setDetails] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const allRulesMet = RULES.every((rule) => rule.test(form.password));
  const passwordsMatch = form.password.length > 0 && form.password === form.confirm;

  const submit = async (event) => {
    event.preventDefault();

    if (!passwordsMatch) {
      setError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setDetails([]);

    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success(`Welcome, ${user.name.split(' ')[0]}. Your account is ready.`);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setDetails(err.details || []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 440 }}>
      <div className="panel">
        <h1 style={{ marginBottom: 4 }}>Create your account</h1>
        <p className="muted small">It takes less than a minute.</p>

        <Alert message={error} details={details} onDismiss={() => setError(null)} />

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" className="input" value={form.name} onChange={update('name')}
              autoComplete="name" required autoFocus minLength={2} maxLength={80} />
          </div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" className="input" value={form.email}
              onChange={update('email')} autoComplete="email" required />
            <div className="hint">You will use this to sign in.</div>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={form.password}
              onChange={update('password')} autoComplete="new-password" required />

            <ul style={{ listStyle: 'none', padding: 0, margin: '9px 0 0', display: 'grid', gap: 3 }}>
              {RULES.map((rule) => {
                const met = rule.test(form.password);
                return (
                  <li key={rule.label} className="small"
                    style={{ color: met ? 'var(--success-600)' : 'var(--ink-500)' }}>
                    <span aria-hidden="true">{met ? '✓' : '○'}</span> {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password"
              className={`input ${form.confirm && !passwordsMatch ? 'invalid' : ''}`}
              value={form.confirm} onChange={update('confirm')}
              autoComplete="new-password" required />
            {form.confirm && !passwordsMatch && (
              <div className="error-text">The two passwords do not match.</div>
            )}
          </div>

          <button type="submit" className="btn btn-block"
            disabled={submitting || !allRulesMet || !passwordsMatch}>
            {submitting ? (<><span className="spinner" /> Creating account…</>) : 'Create account'}
          </button>
        </form>

        <p className="small center muted" style={{ marginTop: 18, marginBottom: 0 }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
