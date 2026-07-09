import { Injectable } from '@nestjs/common';
import type { CaregiverRelationship } from '../caregivers/caregiver.interface';
import type { Reminder } from '../reminders/reminder.interface';
import type { MedicationResponseDto } from '../medications/dto/medication-response.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import { formatEpoch } from './notification-formatting';

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailTemplateService {
  renderCaregiverInvite(
    relationship: CaregiverRelationship,
    patient?: UserResponseDto | null,
  ): RenderedEmail {
    const patientName = patient?.name ?? 'A MedTrack patient';
    const patientEmail = patient?.email ?? 'Not available';
    const relationshipType = relationship.relationshipType.toLowerCase();
    const text = [
      'You have been invited to be a MedTrack caregiver.',
      '',
      `Patient: ${patientName}`,
      `Patient email: ${patientEmail}`,
      `Relationship type: ${relationshipType}`,
      '',
      `Log in or register using ${relationship.caregiverEmail} to accept the invitation.`,
      '',
      'No tokens or passwords are included in this email.',
    ].join('\n');

    return {
      subject: 'MedTrack caregiver invitation',
      text,
      html: this.wrapHtml(`
        <p>You have been invited to be a MedTrack caregiver.</p>
        <ul>
          <li><strong>Patient:</strong> ${this.escape(patientName)}</li>
          <li><strong>Patient email:</strong> ${this.escape(patientEmail)}</li>
          <li><strong>Relationship type:</strong> ${this.escape(relationshipType)}</li>
        </ul>
        <p>Log in or register using <strong>${this.escape(
          relationship.caregiverEmail,
        )}</strong> to accept the invitation.</p>
        <p>No tokens or passwords are included in this email.</p>
      `),
    };
  }

  renderReminder(
    reminder: Reminder,
    medication?: MedicationResponseDto | null,
  ): RenderedEmail {
    const medicationName = medication?.name ?? 'your medication';
    const scheduledTime = formatEpoch(reminder.scheduledAt);
    const note = reminder.notes?.trim()
      ? `Reminder note: ${reminder.notes.trim()}`
      : 'Please check MedTrack for the full reminder details.';
    const text = [
      'This is a MedTrack medication reminder.',
      '',
      `Medication: ${medicationName}`,
      `Scheduled time: ${scheduledTime}`,
      note,
      '',
      'No passwords, tokens, or account secrets are included in this email.',
    ].join('\n');

    return {
      subject: 'MedTrack medication reminder',
      text,
      html: this.wrapHtml(`
        <p>This is a MedTrack medication reminder.</p>
        <ul>
          <li><strong>Medication:</strong> ${this.escape(medicationName)}</li>
          <li><strong>Scheduled time:</strong> ${this.escape(scheduledTime)}</li>
        </ul>
        <p>${this.escape(note)}</p>
        <p>No passwords, tokens, or account secrets are included in this email.</p>
      `),
    };
  }

  private wrapHtml(content: string): string {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #17222b;">
        <h1 style="font-size: 20px; color: #0f766e;">MedTrack</h1>
        ${content}
      </div>
    `;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
