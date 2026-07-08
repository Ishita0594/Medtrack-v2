import axiosClient from './axiosClient';
import type {
  Reminder,
  ReminderPayload,
  UpdateReminderPayload,
} from '../types/reminder';

export const remindersApi = {
  async list() {
    const response = await axiosClient.get<Reminder[]>('/reminders');
    return response.data;
  },

  async create(payload: ReminderPayload) {
    const response = await axiosClient.post<Reminder>('/reminders', payload);
    return response.data;
  },

  async update(reminderId: string, payload: UpdateReminderPayload) {
    const response = await axiosClient.patch<Reminder>(
      `/reminders/${reminderId}`,
      payload,
    );
    return response.data;
  },

  async snooze(reminderId: string, snoozedUntil: number) {
    const response = await axiosClient.post<Reminder>(
      `/reminders/${reminderId}/snooze`,
      { snoozedUntil },
    );
    return response.data;
  },

  async acknowledge(reminderId: string) {
    const response = await axiosClient.post<Reminder>(
      `/reminders/${reminderId}/acknowledge`,
    );
    return response.data;
  },

  async markMissed(reminderId: string) {
    const response = await axiosClient.post<Reminder>(
      `/reminders/${reminderId}/mark-missed`,
    );
    return response.data;
  },

  async remove(reminderId: string) {
    const response = await axiosClient.delete<{ message: string }>(
      `/reminders/${reminderId}`,
    );
    return response.data;
  },
};
