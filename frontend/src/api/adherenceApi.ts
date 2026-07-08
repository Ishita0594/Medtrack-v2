import axiosClient from './axiosClient';
import type {
  AdherencePayload,
  AdherenceRecord,
  AdherenceStats,
} from '../types/adherence';

export const adherenceApi = {
  async list() {
    const response = await axiosClient.get<AdherenceRecord[]>('/adherence');
    return response.data;
  },

  async stats() {
    const response = await axiosClient.get<AdherenceStats>('/adherence/stats');
    return response.data;
  },

  async create(payload: AdherencePayload) {
    const response = await axiosClient.post<AdherenceRecord>('/adherence', payload);
    return response.data;
  },

  async update(recordId: string, payload: Partial<AdherencePayload>) {
    const response = await axiosClient.patch<AdherenceRecord>(
      `/adherence/${recordId}`,
      payload,
    );
    return response.data;
  },

  async remove(recordId: string) {
    const response = await axiosClient.delete<{ message: string }>(
      `/adherence/${recordId}`,
    );
    return response.data;
  },
};
