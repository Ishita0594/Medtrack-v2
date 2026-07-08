import { useEffect, useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '../api/axiosClient';
import { medicationsApi } from '../api/medicationsApi';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import type {
  Medication,
  MedicationFrequency,
  MedicationPayload,
} from '../types/medication';
import { formatDate, fromDateTimeInput, toDateTimeInput } from '../utils/date';

const emptyForm = {
  name: '',
  dosage: '',
  frequency: 'DAILY' as MedicationFrequency,
  times: '08:00',
  startDate: '',
  endDate: '',
  instructions: '',
};

export function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadMedications() {
    setLoading(true);
    setError(null);

    try {
      setMedications(await medicationsApi.list());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMedications();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, startDate: toDateTimeInput(Date.now()) });
    setShowModal(true);
  }

  function openEdit(medication: Medication) {
    setEditing(medication);
    setForm({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      times: medication.times.join(', '),
      startDate: toDateTimeInput(medication.startDate),
      endDate: toDateTimeInput(medication.endDate),
      instructions: medication.instructions ?? '',
    });
    setShowModal(true);
  }

  function toPayload(): MedicationPayload {
    const payload: MedicationPayload = {
      name: form.name,
      dosage: form.dosage,
      frequency: form.frequency,
      times: form.times
        .split(',')
        .map((time) => time.trim())
        .filter(Boolean),
      startDate: fromDateTimeInput(form.startDate),
    };

    if (form.endDate) {
      payload.endDate = fromDateTimeInput(form.endDate);
    }

    if (form.instructions.trim()) {
      payload.instructions = form.instructions.trim();
    }

    return payload;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editing) {
        await medicationsApi.update(editing.medicationId, toPayload());
        setSuccess('Medication updated successfully');
      } else {
        await medicationsApi.create(toPayload());
        setSuccess('Medication created successfully');
      }

      setShowModal(false);
      await loadMedications();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(medication: Medication) {
    if (!window.confirm(`Delete ${medication.name}?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await medicationsApi.remove(medication.medicationId);
      setSuccess('Medication deleted successfully');
      await loadMedications();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="page-heading page-heading-row">
        <div>
          <h1>Medications</h1>
          <p>Manage active medication schedules and dosage instructions.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          Add medication
        </button>
      </div>

      <ErrorMessage message={error} />
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <Loading label="Loading medications" />
          ) : medications.length === 0 ? (
            <EmptyState
              title="No medications yet"
              message="Create the first medication schedule for this account."
            />
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Times</th>
                    <th>Start</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((medication) => (
                    <tr key={medication.medicationId}>
                      <td className="fw-semibold">{medication.name}</td>
                      <td>{medication.dosage}</td>
                      <td>
                        <span className="badge text-bg-light">
                          {medication.frequency}
                        </span>
                      </td>
                      <td>{medication.times.join(', ')}</td>
                      <td>{formatDate(medication.startDate)}</td>
                      <td>
                        <span
                          className={`badge ${
                            medication.isActive ? 'text-bg-success' : 'text-bg-secondary'
                          }`}
                        >
                          {medication.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => openEdit(medication)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => void handleDelete(medication)}
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

      {showModal ? (
        <div className="modal-backdrop-custom">
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h2 className="modal-title h5">
                      {editing ? 'Edit medication' : 'Create medication'}
                    </h2>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                      aria-label="Close"
                    />
                  </div>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="medName">
                          Name
                        </label>
                        <input
                          className="form-control"
                          id="medName"
                          value={form.name}
                          onChange={(event) =>
                            setForm({ ...form, name: event.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="dosage">
                          Dosage
                        </label>
                        <input
                          className="form-control"
                          id="dosage"
                          value={form.dosage}
                          onChange={(event) =>
                            setForm({ ...form, dosage: event.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="frequency">
                          Frequency
                        </label>
                        <select
                          className="form-select"
                          id="frequency"
                          value={form.frequency}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              frequency: event.target.value as MedicationFrequency,
                            })
                          }
                        >
                          <option value="DAILY">Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="times">
                          Times
                        </label>
                        <input
                          className="form-control"
                          id="times"
                          placeholder="08:00, 20:00"
                          value={form.times}
                          onChange={(event) =>
                            setForm({ ...form, times: event.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="startDate">
                          Start date
                        </label>
                        <input
                          className="form-control"
                          id="startDate"
                          type="datetime-local"
                          value={form.startDate}
                          onChange={(event) =>
                            setForm({ ...form, startDate: event.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="endDate">
                          End date
                        </label>
                        <input
                          className="form-control"
                          id="endDate"
                          type="datetime-local"
                          value={form.endDate}
                          onChange={(event) =>
                            setForm({ ...form, endDate: event.target.value })
                          }
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label" htmlFor="instructions">
                          Instructions
                        </label>
                        <textarea
                          className="form-control"
                          id="instructions"
                          rows={3}
                          value={form.instructions}
                          onChange={(event) =>
                            setForm({ ...form, instructions: event.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save medication'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
