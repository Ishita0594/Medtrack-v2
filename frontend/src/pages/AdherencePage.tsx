import { useEffect, useState, type FormEvent } from 'react';
import { adherenceApi } from '../api/adherenceApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { medicationsApi } from '../api/medicationsApi';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import { StatCard } from '../components/StatCard';
import type {
  AdherencePayload,
  AdherenceRecord,
  AdherenceStats,
  AdherenceStatus,
} from '../types/adherence';
import type { Medication } from '../types/medication';
import { formatDateTime, fromDateTimeInput, toDateTimeInput } from '../utils/date';

export function AdherencePage() {
  const [records, setRecords] = useState<AdherenceRecord[]>([]);
  const [stats, setStats] = useState<AdherenceStats | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [form, setForm] = useState({
    medicationId: '',
    scheduledAt: toDateTimeInput(Date.now()),
    status: 'PENDING' as AdherenceStatus,
    takenAt: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadPage() {
    setLoading(true);
    setError(null);

    try {
      const [nextRecords, nextStats, nextMedications] = await Promise.all([
        adherenceApi.list(),
        adherenceApi.stats(),
        medicationsApi.list(),
      ]);
      setRecords(nextRecords);
      setStats(nextStats);
      setMedications(nextMedications);

      if (!form.medicationId && nextMedications[0]) {
        setForm((previous) => ({
          ...previous,
          medicationId: nextMedications[0].medicationId,
        }));
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, []);

  function getMedicationName(medicationId: string) {
    return (
      medications.find((medication) => medication.medicationId === medicationId)
        ?.name ?? medicationId
    );
  }

  function toPayload(): AdherencePayload {
    const payload: AdherencePayload = {
      medicationId: form.medicationId,
      scheduledAt: fromDateTimeInput(form.scheduledAt),
      status: form.status,
    };

    if (form.takenAt) {
      payload.takenAt = fromDateTimeInput(form.takenAt);
    }

    if (form.notes.trim()) {
      payload.notes = form.notes.trim();
    }

    return payload;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adherenceApi.create(toPayload());
      setSuccess('Adherence record created successfully');
      setForm((previous) => ({
        ...previous,
        scheduledAt: toDateTimeInput(Date.now()),
        status: 'PENDING',
        takenAt: '',
        notes: '',
      }));
      await loadPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(record: AdherenceRecord, status: AdherenceStatus) {
    setError(null);
    setSuccess(null);

    try {
      await adherenceApi.update(record.recordId, {
        status,
        takenAt: status === 'TAKEN' ? Date.now() : undefined,
      });
      setSuccess('Adherence status updated');
      await loadPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleDelete(record: AdherenceRecord) {
    if (!window.confirm('Delete this adherence record?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await adherenceApi.remove(record.recordId);
      setSuccess('Adherence record deleted successfully');
      await loadPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="page-heading">
        <h1>Adherence</h1>
        <p>Track scheduled doses, status, and adherence performance.</p>
      </div>

      <ErrorMessage message={error} />
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-2">
          <StatCard label="Rate" value={`${stats?.adherenceRate ?? 0}%`} tone="success" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard label="Taken" value={stats?.takenCount ?? 0} />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard label="Missed" value={stats?.missedCount ?? 0} tone="danger" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard label="Skipped" value={stats?.skippedCount ?? 0} tone="warning" />
        </div>
        <div className="col-sm-6 col-xl-2">
          <StatCard label="Pending" value={stats?.pendingCount ?? 0} tone="info" />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 mb-3">Create record</h2>
              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="adherenceMedication">
                    Medication
                  </label>
                  <select
                    className="form-select"
                    id="adherenceMedication"
                    value={form.medicationId}
                    onChange={(event) =>
                      setForm({ ...form, medicationId: event.target.value })
                    }
                    required
                  >
                    <option value="">Select medication</option>
                    {medications.map((medication) => (
                      <option key={medication.medicationId} value={medication.medicationId}>
                        {medication.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="scheduledAt">
                    Scheduled at
                  </label>
                  <input
                    className="form-control"
                    id="scheduledAt"
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(event) =>
                      setForm({ ...form, scheduledAt: event.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="status">
                    Status
                  </label>
                  <select
                    className="form-select"
                    id="status"
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as AdherenceStatus,
                      })
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="TAKEN">Taken</option>
                    <option value="MISSED">Missed</option>
                    <option value="SKIPPED">Skipped</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="takenAt">
                    Taken at
                  </label>
                  <input
                    className="form-control"
                    id="takenAt"
                    type="datetime-local"
                    value={form.takenAt}
                    onChange={(event) =>
                      setForm({ ...form, takenAt: event.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="notes">
                    Notes
                  </label>
                  <textarea
                    className="form-control"
                    id="notes"
                    rows={3}
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  />
                </div>
                <button className="btn btn-primary w-100" disabled={saving}>
                  {saving ? 'Saving...' : 'Create record'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              {loading ? (
                <Loading label="Loading adherence" />
              ) : records.length === 0 ? (
                <EmptyState
                  title="No adherence records"
                  message="Create dose records after medications are available."
                />
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Medication</th>
                        <th>Scheduled</th>
                        <th>Status</th>
                        <th>Taken</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.recordId}>
                          <td className="fw-semibold">
                            {getMedicationName(record.medicationId)}
                          </td>
                          <td>{formatDateTime(record.scheduledAt)}</td>
                          <td>
                            <span className="badge text-bg-light">{record.status}</span>
                          </td>
                          <td>{formatDateTime(record.takenAt)}</td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-success"
                                onClick={() => void updateStatus(record, 'TAKEN')}
                              >
                                Taken
                              </button>
                              <button
                                className="btn btn-outline-warning"
                                onClick={() => void updateStatus(record, 'SKIPPED')}
                              >
                                Skip
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => void handleDelete(record)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
