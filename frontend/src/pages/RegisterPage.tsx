import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/axiosClient';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage } from '../components/ErrorMessage';
import type { UserRole } from '../types/auth';

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Extract<UserRole, 'PATIENT' | 'CAREGIVER'>>(
    'PATIENT',
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register({ name, email, phone, password, role });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel card shadow-sm">
        <div className="card-body p-4 p-md-5">
          <div className="mb-4">
            <span className="brand-mark">M</span>
            <h1 className="h3 mt-3 mb-1">Create your MedTrack account</h1>
            <p className="text-secondary mb-0">
              Choose Patient for self-care or Caregiver for connected care.
            </p>
          </div>

          <ErrorMessage message={error} />

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="name">
                  Name
                </label>
                <input
                  className="form-control"
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="phone">
                  Phone
                </label>
                <input
                  className="form-control"
                  id="phone"
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="registerEmail">
                  Email
                </label>
                <input
                  className="form-control"
                  id="registerEmail"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="role">
                  Role
                </label>
                <select
                  className="form-select"
                  id="role"
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as 'PATIENT' | 'CAREGIVER')
                  }
                >
                  <option value="PATIENT">Patient</option>
                  <option value="CAREGIVER">Caregiver</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="registerPassword">
                  Password
                </label>
                <input
                  className="form-control"
                  id="registerPassword"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                />
                <div className="form-text">
                  Use at least 8 characters with uppercase, lowercase, number, and
                  symbol.
                </div>
              </div>
            </div>
            <button className="btn btn-primary w-100 mt-4" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-secondary mt-4 mb-0">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
