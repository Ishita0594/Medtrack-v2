import { useEffect, useState, type ChangeEvent } from 'react';
import { getApiErrorMessage } from '../api/axiosClient';
import { prescriptionsApi } from '../api/prescriptionsApi';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import type {
  ParsedMedication,
  Prescription,
  ProcessPrescriptionResponse,
} from '../types/prescription';
import { formatDateTime, readableBytes } from '../utils/date';

export function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [parsedMedications, setParsedMedications] = useState<ParsedMedication[]>([]);
  const [processResult, setProcessResult] =
    useState<ProcessPrescriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadPrescriptions() {
    setLoading(true);
    setError(null);

    try {
      setPrescriptions(await prescriptionsApi.list());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPrescriptions();
  }, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError('Choose a prescription image or PDF first');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await prescriptionsApi.upload(selectedFile);
      setSelectedFile(null);
      setSuccess('Prescription uploaded successfully');
      await loadPrescriptions();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function runPrescriptionAction(
    prescriptionId: string,
    action: () => Promise<unknown>,
    message: string,
  ) {
    setWorkingId(prescriptionId);
    setError(null);
    setSuccess(null);

    try {
      const result = await action();
      if (typeof result === 'object' && result && 'createdMedicationIds' in result) {
        setProcessResult(result as ProcessPrescriptionResponse);
      }
      setSuccess(message);
      await loadPrescriptions();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setWorkingId(null);
    }
  }

  async function viewText(prescription: Prescription) {
    await runPrescriptionAction(
      prescription.prescriptionId,
      async () => {
        const response = await prescriptionsApi.text(prescription.prescriptionId);
        setOcrText(response.ocrText);
        return response;
      },
      'OCR text loaded',
    );
  }

  async function viewMedications(prescription: Prescription) {
    await runPrescriptionAction(
      prescription.prescriptionId,
      async () => {
        const response = await prescriptionsApi.medications(
          prescription.prescriptionId,
        );
        setParsedMedications(response.medications);
        return response;
      },
      'Parsed medications loaded',
    );
  }

  function deletePrescription(prescription: Prescription) {
    if (!window.confirm(`Delete ${prescription.originalFileName}?`)) {
      return;
    }

    void runPrescriptionAction(
      prescription.prescriptionId,
      () => prescriptionsApi.remove(prescription.prescriptionId),
      'Prescription deleted successfully',
    );
  }

  return (
    <div>
      <div className="page-heading">
        <h1>Prescriptions</h1>
        <p>Upload prescriptions, run OCR and AI parsing, then review created medications.</p>
      </div>

      <ErrorMessage message={error} />
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-lg-8">
              <label className="form-label" htmlFor="prescriptionFile">
                Prescription file
              </label>
              <input
                className="form-control"
                id="prescriptionFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
              />
            </div>
            <div className="col-lg-4">
              <button
                className="btn btn-primary w-100"
                onClick={() => void handleUpload()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload prescription'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          {loading ? (
            <Loading label="Loading prescriptions" />
          ) : prescriptions.length === 0 ? (
            <EmptyState
              title="No prescriptions"
              message="Upload a prescription image or PDF to begin processing."
            />
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Status</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Created medications</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((prescription) => (
                    <tr key={prescription.prescriptionId}>
                      <td>
                        <div className="fw-semibold">
                          {prescription.originalFileName}
                        </div>
                        <div className="small text-secondary">
                          {prescription.mimeType}
                        </div>
                      </td>
                      <td>
                        <span className="badge text-bg-light">
                          {prescription.status}
                        </span>
                      </td>
                      <td>{readableBytes(prescription.fileSize)}</td>
                      <td>{formatDateTime(prescription.createdAt)}</td>
                      <td>{prescription.createdMedicationIds?.length ?? 0}</td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm flex-wrap">
                          <button
                            className="btn btn-outline-primary"
                            disabled={workingId === prescription.prescriptionId}
                            onClick={() =>
                              void runPrescriptionAction(
                                prescription.prescriptionId,
                                () =>
                                  prescriptionsApi.process(
                                    prescription.prescriptionId,
                                  ),
                                'Prescription processed successfully',
                              )
                            }
                          >
                            Process
                          </button>
                          <button
                            className="btn btn-outline-secondary"
                            disabled={workingId === prescription.prescriptionId}
                            onClick={() =>
                              void runPrescriptionAction(
                                prescription.prescriptionId,
                                () =>
                                  prescriptionsApi.reprocess(
                                    prescription.prescriptionId,
                                  ),
                                'Prescription reprocessed successfully',
                              )
                            }
                          >
                            Reprocess
                          </button>
                          <button
                            className="btn btn-outline-info"
                            onClick={() => void viewText(prescription)}
                          >
                            OCR
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => void viewMedications(prescription)}
                          >
                            AI meds
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deletePrescription(prescription)}
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

      {processResult ? (
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="h5">Processing result</h2>
            <p className="text-secondary">
              Prescription {processResult.prescriptionId} is {processResult.status}.
            </p>
            <div className="mb-3">
              <div className="small text-secondary">Created medication IDs</div>
              <code>{processResult.createdMedicationIds.join(', ') || 'None'}</code>
            </div>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Times</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {processResult.medications.map((medication) => (
                    <tr key={`${medication.name}-${medication.dosage}`}>
                      <td>{medication.name}</td>
                      <td>{medication.dosage}</td>
                      <td>{medication.frequency}</td>
                      <td>{medication.times.join(', ')}</td>
                      <td>{medication.durationDays} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {ocrText ? (
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="h5">OCR text</h2>
            <pre className="ocr-text mb-0">{ocrText}</pre>
          </div>
        </div>
      ) : null}

      {parsedMedications.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <h2 className="h5">AI parsed medications</h2>
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Times</th>
                    <th>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedMedications.map((medication) => (
                    <tr key={`${medication.name}-${medication.durationDays}`}>
                      <td>{medication.name}</td>
                      <td>{medication.dosage}</td>
                      <td>{medication.frequency}</td>
                      <td>{medication.times.join(', ')}</td>
                      <td>{medication.instructions ?? 'Not set'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
