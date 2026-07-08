import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="text-center py-5">
      <h1 className="display-5">Page not found</h1>
      <p className="text-secondary">
        The page you requested is not part of the MedTrack workspace.
      </p>
      <Link className="btn btn-primary" to="/dashboard">
        Go to dashboard
      </Link>
    </div>
  );
}
