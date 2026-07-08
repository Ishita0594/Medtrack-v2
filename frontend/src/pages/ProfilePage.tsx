import { useAuth } from '../auth/AuthContext';
import { formatDateTime } from '../utils/date';

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-heading">
        <h1>Profile</h1>
        <p>Your current MedTrack identity and account metadata.</p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="text-secondary small">Name</div>
              <div className="fw-semibold">{user?.name}</div>
            </div>
            <div className="col-md-6">
              <div className="text-secondary small">Email</div>
              <div className="fw-semibold">{user?.email}</div>
            </div>
            <div className="col-md-6">
              <div className="text-secondary small">Phone</div>
              <div className="fw-semibold">{user?.phone}</div>
            </div>
            <div className="col-md-6">
              <div className="text-secondary small">Role</div>
              <span className="badge text-bg-primary">{user?.role}</span>
            </div>
            <div className="col-md-6">
              <div className="text-secondary small">Created</div>
              <div className="fw-semibold">{formatDateTime(user?.createdAt)}</div>
            </div>
            <div className="col-md-6">
              <div className="text-secondary small">Updated</div>
              <div className="fw-semibold">{formatDateTime(user?.updatedAt)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
