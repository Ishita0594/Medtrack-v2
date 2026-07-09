import { useEffect, useState, type FormEvent } from 'react';
import { caregiversApi } from '../api/caregiversApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import type { AdherenceRecord } from '../types/adherence';
import type {
  CaregiverRelationship,
  CaregiverRelationshipType,
} from '../types/caregiver';
import type { Medication } from '../types/medication';
import { formatDateTime } from '../utils/date';

export function CaregiversPage() {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<CaregiverRelationship[]>([]);
  const [patientMedications, setPatientMedications] = useState<Medication[]>([]);
  const [patientAdherence, setPatientAdherence] = useState<AdherenceRecord[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [form, setForm] = useState({
    caregiverEmail: '',
    caregiverName: '',
    relationshipType: 'OTHER' as CaregiverRelationshipType,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isCaregiver = user?.role === 'CAREGIVER';

  async function loadRelationships() {
    setLoading(true);
    setError(null);

    try {
      const nextRelationships = isCaregiver
        ? await caregiversApi.patients()
        : await caregiversApi.list();
      setRelationships(nextRelationships);

      if (isCaregiver && !selectedPatientId && nextRelationships[0]) {
        setSelectedPatientId(nextRelationships[0].patientId);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRelationships();
  }, [isCaregiver]);

  useEffect(() => {
    async function loadPatientAccess() {
      if (!isCaregiver || !selectedPatientId) {
        return;
      }

      setError(null);

      try {
        const [medications, adherence] = await Promise.all([
          caregiversApi.patientMedications(selectedPatientId),
          caregiversApi.patientAdherence(selectedPatientId),
        ]);
        setPatientMedications(medications);
        setPatientAdherence(adherence);
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    }

    void loadPatientAccess();
  }, [isCaregiver, selectedPatientId]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await caregiversApi.invite({
        caregiverEmail: form.caregiverEmail,
        caregiverName: form.caregiverName.trim() || undefined,
        relationshipType: form.relationshipType,
      });
      setSuccess('Caregiver invitation created');
      setForm({
        caregiverEmail: '',
        caregiverName: '',
        relationshipType: 'OTHER',
      });
      await loadRelationships();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function runRelationshipAction(action: () => Promise<unknown>, message: string) {
    setError(null);
    setSuccess(null);

    try {
      await action();
      setSuccess(message);
      await loadRelationships();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  function deleteRelationship(relationship: CaregiverRelationship) {
    if (!window.confirm('Delete this caregiver relationship?')) {
      return;
    }

    void runRelationshipAction(
      () => caregiversApi.remove(relationship.relationshipId),
      'Caregiver relationship deleted',
    );
  }

  if (isCaregiver) {
    return (
      <div>
        <div className="page-heading">
          <h1>Caregiver Access</h1>
          <p>Review connected patients, medications, and adherence records.</p>
        </div>

        <ErrorMessage message={error} />
        {success ? <div className="alert alert-success">{success}</div> : null}

        {loading ? (
          <Loading label="Loading patients" />
        ) : relationships.length === 0 ? (
          <EmptyState
            title="No connected patients"
            message="Accepted invitations will appear in this workspace."
          />
        ) : (
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card">
                <div className="card-body">
                  <h2 className="h5 mb-3">Patients</h2>
                  <div className="list-group">
                    {relationships.map((relationship) => (
                      <button
                        className={`list-group-item list-group-item-action ${
                          selectedPatientId === relationship.patientId ? 'active' : ''
                        }`}
                        key={relationship.relationshipId}
                        onClick={() => setSelectedPatientId(relationship.patientId)}
                      >
                        <div className="fw-semibold">{relationship.patientId}</div>
                        <div className="small">
                          {relationship.relationshipType} · {relationship.status}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="card mb-4">
                <div className="card-body">
                  <h2 className="h5 mb-3">Patient medications</h2>
                  {patientMedications.length === 0 ? (
                    <p className="text-secondary mb-0">No medications available.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Times</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patientMedications.map((medication) => (
                            <tr key={medication.medicationId}>
                              <td className="fw-semibold">{medication.name}</td>
                              <td>{medication.dosage}</td>
                              <td>{medication.frequency}</td>
                              <td>{medication.times.join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <h2 className="h5 mb-3">Patient adherence</h2>
                  {patientAdherence.length === 0 ? (
                    <p className="text-secondary mb-0">No adherence records available.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Medication ID</th>
                            <th>Scheduled</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patientAdherence.map((record) => (
                            <tr key={record.recordId}>
                              <td>{record.medicationId}</td>
                              <td>{formatDateTime(record.scheduledAt)}</td>
                              <td>
                                <span className="badge text-bg-light">
                                  {record.status}
                                </span>
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
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-heading">
        <h1>Caregivers</h1>
        <p>Invite caregivers and manage patient-owned relationships.</p>
      </div>

      <ErrorMessage message={error} />
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 mb-3">Invite caregiver</h2>
              <div className="alert alert-info small">
                Invitation email will be sent if email notifications are
                configured.
              </div>
              <form onSubmit={handleInvite}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="caregiverEmail">
                    Email
                  </label>
                  <input
                    className="form-control"
                    id="caregiverEmail"
                    type="email"
                    value={form.caregiverEmail}
                    onChange={(event) =>
                      setForm({ ...form, caregiverEmail: event.target.value })
                    }
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="caregiverName">
                    Name
                  </label>
                  <input
                    className="form-control"
                    id="caregiverName"
                    value={form.caregiverName}
                    onChange={(event) =>
                      setForm({ ...form, caregiverName: event.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="relationshipType">
                    Relationship
                  </label>
                  <select
                    className="form-select"
                    id="relationshipType"
                    value={form.relationshipType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        relationshipType: event.target.value as CaregiverRelationshipType,
                      })
                    }
                  >
                    <option value="PARENT">Parent</option>
                    <option value="CHILD">Child</option>
                    <option value="SPOUSE">Spouse</option>
                    <option value="SIBLING">Sibling</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="FRIEND">Friend</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <button className="btn btn-primary w-100" disabled={saving}>
                  {saving ? 'Sending...' : 'Send invitation'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              {loading ? (
                <Loading label="Loading caregivers" />
              ) : relationships.length === 0 ? (
                <EmptyState
                  title="No caregiver relationships"
                  message="Invitations and accepted caregivers will appear here."
                />
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Caregiver</th>
                        <th>Relationship</th>
                        <th>Status</th>
                        <th>Invited</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relationships.map((relationship) => (
                        <tr key={relationship.relationshipId}>
                          <td>
                            <div className="fw-semibold">
                              {relationship.caregiverName ?? 'Caregiver'}
                            </div>
                            <div className="text-secondary small">
                              {relationship.caregiverEmail}
                            </div>
                          </td>
                          <td>{relationship.relationshipType}</td>
                          <td>
                            <span className="badge text-bg-light">
                              {relationship.status}
                            </span>
                          </td>
                          <td>{formatDateTime(relationship.invitedAt)}</td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              {relationship.status === 'PENDING' ? (
                                <button
                                  className="btn btn-outline-warning"
                                  onClick={() =>
                                    void runRelationshipAction(
                                      () =>
                                        caregiversApi.cancel(
                                          relationship.relationshipId,
                                        ),
                                      'Invitation cancelled',
                                    )
                                  }
                                >
                                  Cancel
                                </button>
                              ) : null}
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => deleteRelationship(relationship)}
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
