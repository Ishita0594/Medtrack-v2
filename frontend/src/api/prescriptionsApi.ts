import axiosClient from './axiosClient';
import type {
  ParsedMedication,
  Prescription,
  PrescriptionStatus,
  ProcessPrescriptionResponse,
} from '../types/prescription';

export const prescriptionsApi = {
  async upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post<Prescription>(
      '/prescriptions/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  async list(status?: PrescriptionStatus) {
    const response = await axiosClient.get<Prescription[]>('/prescriptions', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  async process(prescriptionId: string) {
    const response = await axiosClient.post<ProcessPrescriptionResponse>(
      `/prescriptions/${prescriptionId}/process`,
    );
    return response.data;
  },

  async reprocess(prescriptionId: string) {
    const response = await axiosClient.post<ProcessPrescriptionResponse>(
      `/prescriptions/${prescriptionId}/reprocess`,
    );
    return response.data;
  },

  async text(prescriptionId: string) {
    const response = await axiosClient.get<{
      prescriptionId: string;
      ocrText: string;
    }>(`/prescriptions/${prescriptionId}/text`);
    return response.data;
  },

  async medications(prescriptionId: string) {
    const response = await axiosClient.get<{
      prescriptionId: string;
      medications: ParsedMedication[];
    }>(`/prescriptions/${prescriptionId}/medications`);
    return response.data;
  },

  async remove(prescriptionId: string) {
    const response = await axiosClient.delete<{ message: string }>(
      `/prescriptions/${prescriptionId}`,
    );
    return response.data;
  },
};
