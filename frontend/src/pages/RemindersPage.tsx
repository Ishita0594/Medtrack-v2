import { useEffect, useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '../api/axiosClient';
import { medicationsApi } from '../api/medicationsApi';
import { remindersApi } from '../api/remindersApi';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import type { Medication } from '../types/medication';
import type {
  NotificationType,
  Reminder,
  ReminderPayload,
  ReminderStatus,
} from '../types/reminder';
import { formatDateTime, fromDateTimeInput, toDateTimeInput } from '../utils/date';

const blankReminderForm = {
  medicationId: '',
  scheduledAt: toDateTimeInput(Date.now()),
  notificationType: 'IN_APP' as NotificationType,
  status: 'PENDING' as ReminderStatus,
  notes: '',
};

export function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [form, setForm] = useState(blankReminderForm);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadPage() {
    setLoading(true);
    setError(null);

    try {
      const [nextReminders, nextMedications] = await Promise.all([
        remindersApi.list(),
        medicationsApi.list(),
      ]);
      setReminders(nextReminders);
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

  function openCreate() {
    setEditing(null);
    setForm({
      ...blankReminderForm,
      medicationId: medications[0]?.medicationId ?? '',
      scheduledAt: toDateTimeInput(Date.now()),
    });
    setShowModal(true);
  }

  function openEdit(reminder: Reminder) {
    setEditing(reminder);
    setForm({
      medicationId: reminder.medicationId,
      scheduledAt: toDateTimeInput(reminder.scheduledAt),
      notificationType: reminder.notificationType,
      status: reminder.status,
      notes: reminder.notes ?? '',
    });
    setShowModal(true);
  }

  function toPayload(): ReminderPayload {
    const payload: ReminderPayload = {
      medicationId: form.medicationId,
      scheduledAt: fromDateTimeInput(form.scheduledAt),
      notificationType: form.notificationType,
    };

    if (form.notes.trim()) {
      payload.notes = form.notes.trim();
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
        await remindersApi.update(editing.reminderId, {
          scheduledAt: fromDateTimeInput(form.scheduledAt),
          notificationType: form.notificationType,
          status: form.status,
          notes: form.notes.trim() || undefined,
        });
        setSuccess('Reminder updated successfully');
      } else {
        await remindersApi.create(toPayload());
        setSuccess('Reminder created successfully');
      }

      setShowModal(false);
      await loadPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: () => Promise<unknown>, message: string) {
    setError(null);
    setSuccess(null);

    try {
      await action();
      setSuccess(message);
      await loadPage();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  function snoozeReminder(reminder: Reminder) {
    const value = window.prompt(
      'Snooze until local time',
      toDateTimeInput(Date.now() + 15 * 60 * 1000),
    );

    if (!value) {
      return;
    }

    void runAction(
      () => remindersApi.snooze(reminder.reminderId, fromDateTimeInput(value)),
      'Reminder snoozed successfully',
    );
  }

  function deleteReminder(reminder: Reminder) {
    if (!window.confirm('Delete this reminder?')) {
      return;
    }

    void runAction(
      () => remindersApi.remove(reminder.reminderId),
      'Reminder deleted successfully',
    );
  }

  return (
    <div>
      <div className="page-heading page-heading-row">
        <div>
          <h1>Reminders</h1>
          <p>Schedule, snooze, acknowledge, and retire reminder events.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          Add reminder
        </button>
      </div>

      <ErrorMessage message={error} />
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <Loading label="Loading reminders" />
          ) : reminders.length === 0 ? (
            <EmptyState
              title="No reminders"
              message="Create reminders for scheduled medications."
            />
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Snoozed</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.map((reminder) => (
                    <tr key={reminder.reminderId}>
                      <td className="fw-semibold">
                        {getMedicationName(reminder.medicationId)}
                      </td>
                      <td>{formatDateTime(reminder.scheduledAt)}</td>
                      <td>
                        <span className="badge text-bg-light">{reminder.status}</span>
                      </td>
                      <td>{reminder.notificationType}</td>
                      <td>{formatDateTime(reminder.snoozedUntil)}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm flex-wrap">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => openEdit(reminder)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline-info"
                            onClick={() => snoozeReminder(reminder)}
                          >
                            Snooze
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={() =>
                              void runAction(
                                () => remindersApi.acknowledge(reminder.reminderId),
                                'Reminder acknowledged',
                              )
                            }
                          >
                            Acknowledge
                          </button>
                          <button
                            className="btn btn-outline-warning"
                            onClick={() =>
                              void runAction(
                                () => remindersApi.markMissed(reminder.reminderId),
                                'Reminder marked missed',
                              )
                            }
                          >
                            Missed
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deleteReminder(reminder)}
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
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h2 className="modal-title h5">
                      {editing ? 'Edit reminder' : 'Create reminder'}
                    </h2>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                      aria-label="Close"
                    />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label" htmlFor="reminderMedication">
                        Medication
                      </label>
                      <select
                        className="form-select"
                        id="reminderMedication"
                        value={form.medicationId}
                        onChange={(event) =>
                          setForm({ ...form, medicationId: event.target.value })
                        }
                        disabled={Boolean(editing)}
                        required
                      >
                        <option value="">Select medication</option>
                        {medications.map((medication) => (
                          <option
                            key={medication.medicationId}
                            value={medication.medicationId}
                          >
                            {medication.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="reminderScheduledAt">
                        Scheduled at
                      </label>
                      <input
                        className="form-control"
                        id="reminderScheduledAt"
                        type="datetime-local"
                        value={form.scheduledAt}
                        onChange={(event) =>
                          setForm({ ...form, scheduledAt: event.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="notificationType">
                        Notification type
                      </label>
                      <select
                        className="form-select"
                        id="notificationType"
                        value={form.notificationType}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            notificationType: event.target.value as NotificationType,
                          })
                        }
                      >
                        <option value="IN_APP">In app</option>
                        <option value="EMAIL">Email</option>
                      </select>
                    </div>
                    {editing ? (
                      <div className="mb-3">
                        <label className="form-label" htmlFor="reminderStatus">
                          Status
                        </label>
                        <select
                          className="form-select"
                          id="reminderStatus"
                          value={form.status}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              status: event.target.value as ReminderStatus,
                            })
                          }
                        >
                          <option value="PENDING">Pending</option>
                          <option value="SENT">Sent</option>
                          <option value="ACKNOWLEDGED">Acknowledged</option>
                          <option value="MISSED">Missed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    ) : null}
                    <div className="mb-3">
                      <label className="form-label" htmlFor="reminderNotes">
                        Notes
                      </label>
                      <textarea
                        className="form-control"
                        id="reminderNotes"
                        rows={3}
                        value={form.notes}
                        onChange={(event) =>
                          setForm({ ...form, notes: event.target.value })
                        }
                      />
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
                      {saving ? 'Saving...' : 'Save reminder'}
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
