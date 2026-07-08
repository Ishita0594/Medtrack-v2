import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adherenceApi } from '../api/adherenceApi';
import { caregiversApi } from '../api/caregiversApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { medicationsApi } from '../api/medicationsApi';
import { prescriptionsApi } from '../api/prescriptionsApi';
import { remindersApi } from '../api/remindersApi';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { StatCard } from '../components/StatCard';
import type { AdherenceStats } from '../types/adherence';

interface DashboardCounts {
  medications: number;
  pendingReminders: number;
  processedPrescriptions: number;
  connectedPatients: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts>({
    medications: 0,
    pendingReminders: 0,
    processedPrescriptions: 0,
    connectedPatients: 0,
  });
  const [stats, setStats] = useState<AdherenceStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        if (user?.role === 'CAREGIVER') {
          const patients = await caregiversApi.patients();
          setCounts((previous) => ({
            ...previous,
            connectedPatients: patients.length,
          }));
          return;
        }

        const [medications, adherenceStats, reminders, prescriptions] =
          await Promise.all([
            medicationsApi.list(),
            adherenceApi.stats(),
            remindersApi.list(),
            prescriptionsApi.list(),
          ]);

        setCounts({
          medications: medications.length,
          pendingReminders: reminders.filter(
            (reminder) => reminder.status === 'PENDING',
          ).length,
          processedPrescriptions: prescriptions.filter(
            (prescription) => prescription.status === 'PROCESSED',
          ).length,
          connectedPatients: 0,
        });
        setStats(adherenceStats);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [user?.role]);

  return (
    <div>
      <div className="page-heading">
        <h1>Dashboard</h1>
        <p>
          {user?.role === 'CAREGIVER'
            ? 'Caregiver workspace for connected patient monitoring.'
            : 'Patient workspace for medication adherence and prescription flow.'}
        </p>
      </div>

      <ErrorMessage message={error} />
      {loading ? (
        <Loading label="Loading dashboard" />
      ) : (
        <>
          {user?.role === 'CAREGIVER' ? (
            <div className="row g-3 mb-4">
              <div className="col-sm-6 col-xl-3">
                <StatCard
                  label="Connected patients"
                  value={counts.connectedPatients}
                  tone="success"
                />
              </div>
            </div>
          ) : (
            <div className="row g-3 mb-4">
              <div className="col-sm-6 col-xl-3">
                <StatCard label="Total medications" value={counts.medications} />
              </div>
              <div className="col-sm-6 col-xl-3">
                <StatCard
                  label="Adherence rate"
                  value={`${stats?.adherenceRate ?? 0}%`}
                  tone="success"
                />
              </div>
              <div className="col-sm-6 col-xl-3">
                <StatCard
                  label="Pending reminders"
                  value={counts.pendingReminders}
                  tone="warning"
                />
              </div>
              <div className="col-sm-6 col-xl-3">
                <StatCard
                  label="Prescriptions processed"
                  value={counts.processedPrescriptions}
                  tone="info"
                />
              </div>
            </div>
          )}

          <div className="row g-3">
            {(user?.role === 'CAREGIVER'
              ? [
                  {
                    title: 'Connected patients',
                    body: 'Review accepted patient relationships and care access.',
                    to: '/caregivers',
                  },
                  {
                    title: 'Profile',
                    body: 'Check your caregiver identity and contact details.',
                    to: '/profile',
                  },
                ]
              : [
                  {
                    title: 'Add medication',
                    body: 'Create medication schedules with dose timing.',
                    to: '/medications',
                  },
                  {
                    title: 'Record adherence',
                    body: 'Log taken, missed, skipped, or pending dose records.',
                    to: '/adherence',
                  },
                  {
                    title: 'Upload prescription',
                    body: 'Process an image or PDF into medication entries.',
                    to: '/prescriptions',
                  },
                ]
            ).map((action) => (
              <div className="col-md-4" key={action.title}>
                <Link className="card action-card h-100 text-decoration-none" to={action.to}>
                  <div className="card-body">
                    <h2 className="h5">{action.title}</h2>
                    <p className="text-secondary mb-0">{action.body}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
