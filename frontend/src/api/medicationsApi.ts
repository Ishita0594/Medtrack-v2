import axiosClient from './axiosClient';
import type { Medication, MedicationPayload } from '../types/medication';

export const medicationsApi = {
  async list() {
    const response = await axiosClient.get<Medication[]>('/medications');
    return response.data;
  },

  async create(payload: MedicationPayload) {
    const response = await axiosClient.post<Medication>('/medications', payload);
    return response.data;
  },

  async update(medicationId: string, payload: Partial<MedicationPayload>) {
    const response = await axiosClient.patch<Medication>(
      `/medications/${medicationId}`,
      payload,
    );
    return response.data;
  },

  async remove(medicationId: string) {
    const response = await axiosClient.delete<{ message: string }>(
      `/medications/${medicationId}`,
    );
    return response.data;
  },
};
