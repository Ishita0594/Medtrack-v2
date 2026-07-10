import axiosClient from './axiosClient';
import type { AdherenceRecord } from '../types/adherence';
import type {
  CaregiverInvitePayload,
  CaregiverRelationship,
} from '../types/caregiver';
import type { Medication } from '../types/medication';

export const caregiversApi = {
  async list() {
    const response = await axiosClient.get<CaregiverRelationship[]>('/caregivers');
    return response.data;
  },

  async invite(payload: CaregiverInvitePayload) {
    const response = await axiosClient.post<CaregiverRelationship>(
      '/caregivers/invite',
      payload,
    );
    return response.data;
  },

  async update(
    relationshipId: string,
    payload: Partial<CaregiverInvitePayload>,
  ) {
    const response = await axiosClient.patch<CaregiverRelationship>(
      `/caregivers/${relationshipId}`,
      payload,
    );
    return response.data;
  },

  async accept(relationshipId: string) {
    const response = await axiosClient.post<CaregiverRelationship>(
      `/caregivers/${relationshipId}/accept`,
    );
    return response.data;
  },

  async reject(relationshipId: string) {
    const response = await axiosClient.post<CaregiverRelationship>(
      `/caregivers/${relationshipId}/reject`,
    );
    return response.data;
  },

  async cancel(relationshipId: string) {
    const response = await axiosClient.post<CaregiverRelationship>(
      `/caregivers/${relationshipId}/cancel`,
    );
    return response.data;
  },

  async remove(relationshipId: string) {
    const response = await axiosClient.delete<{ message: string }>(
      `/caregivers/${relationshipId}`,
    );
    return response.data;
  },

  async patients() {
    const response = await axiosClient.get<CaregiverRelationship[]>(
      '/caregivers/patients',
    );
    return response.data;
  },

  async getInvitations() {
    const response = await axiosClient.get<CaregiverRelationship[]>(
      '/caregivers/invitations',
    );
    return response.data;
  },

  async patientMedications(patientId: string) {
    const response = await axiosClient.get<Medication[]>(
      `/caregivers/patients/${patientId}/medications`,
    );
    return response.data;
  },

  async patientAdherence(patientId: string) {
    const response = await axiosClient.get<AdherenceRecord[]>(
      `/caregivers/patients/${patientId}/adherence`,
    );
    return response.data;
  },
};
