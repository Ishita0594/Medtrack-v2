# Database Schema

MedTrack uses separate DynamoDB tables. This keeps each module easy to reason about while still using efficient keys and GSIs for lookup patterns.

## Users

Purpose: Store one profile and authentication record per user.

- Partition key: `userId`
- Sort key: none
- GSI: `UsersByEmail`
  - Partition key: `email`
  - Used for registration conflict checks and login lookup

Main attributes:
- `userId`
- `name`
- `email`
- `phone`
- `role`
- `passwordHash`
- `isActive`
- `emailVerified`
- `createdAt`
- `updatedAt`

Access patterns:
- Create user by `userId`
- Get user by `userId`
- Find user by `email` using `UsersByEmail`
- List users
- Update or delete user

## RefreshTokens

Purpose: Store hashed refresh tokens independently from users.

- Partition key: `tokenId`
- Sort key: none
- GSIs: none

Main attributes:
- `tokenId`
- `userId`
- `refreshTokenHash`
- `expiresAt`
- `createdAt`
- `updatedAt`

Access patterns:
- Create token record
- Get token by `tokenId`
- Delete token by `tokenId`

## Medications

Purpose: Store medication schedules owned by a user.

- Partition key: `userId`
- Sort key: `medicationId`
- GSIs: none

Main attributes:
- `userId`
- `medicationId`
- `name`
- `dosage`
- `frequency`
- `times`
- `startDate`
- `endDate`
- `instructions`
- `isActive`
- `createdAt`
- `updatedAt`

Access patterns:
- Create medication for a user
- List medications by `userId`
- Get, update, or delete medication by `userId` and `medicationId`

## AdherenceRecords

Purpose: Store dose status records for medication adherence tracking.

- Partition key: `userId`
- Sort key: `recordId`
- GSIs: none

Main attributes:
- `userId`
- `recordId`
- `medicationId`
- `scheduledAt`
- `takenAt`
- `status`
- `notes`
- `dateKey`
- `createdAt`
- `updatedAt`

Access patterns:
- Create adherence record for a user
- List records by `userId`
- Filter in service by medication, status, or date range
- Update or delete by `userId` and `recordId`

## ReminderEvents

Purpose: Store reminders and support scheduler lookup for due reminders.

- Partition key: `userId`
- Sort key: `reminderId`
- GSI: `ReminderEventsByScheduledTime`
  - Partition key: `status`
  - Sort key: `scheduledAt`
  - Used by scheduler to query due pending reminders

Main attributes:
- `userId`
- `reminderId`
- `medicationId`
- `scheduledAt`
- `status`
- `notificationType`
- `sentAt`
- `acknowledgedAt`
- `missedAt`
- `snoozedUntil`
- `notes`
- `dateKey`
- `createdAt`
- `updatedAt`

Access patterns:
- Create reminder for a user
- List reminders by `userId`
- Get, update, snooze, acknowledge, mark missed, or delete by `userId` and `reminderId`
- Query due reminders through `ReminderEventsByScheduledTime`

## CaregiverRelationships

Purpose: Store patient-caregiver relationships and invitation state.

- Partition key: `patientId`
- Sort key: `relationshipId`
- GSI: `CaregiverRelationshipsByCaregiver`
  - Partition key: `caregiverId`
  - Sort key: `createdAt`
  - Used to list accepted patients for a caregiver
- GSI: `CaregiverInvitesByEmail`
  - Partition key: `caregiverEmail`
  - Sort key: `invitedAt`
  - Used to accept or reject pending invites without scanning

Main attributes:
- `relationshipId`
- `patientId`
- `caregiverId`
- `caregiverEmail`
- `caregiverName`
- `relationshipType`
- `status`
- `invitedAt`
- `acceptedAt`
- `rejectedAt`
- `cancelledAt`
- `createdAt`
- `updatedAt`

Access patterns:
- Patient creates invitation
- Patient lists relationships by `patientId`
- Caregiver accepts or rejects by invitation email lookup
- Caregiver lists accepted patients by `caregiverId`
- Patient deletes relationship

## PrescriptionUploads

Purpose: Store prescription upload metadata, extracted OCR text, parsed medication data, and processing state.

- Partition key: `userId`
- Sort key: `prescriptionId`
- GSIs: none

Main attributes:
- `userId`
- `prescriptionId`
- `originalFileName`
- `fileType`
- `mimeType`
- `fileSize`
- `storageProvider`
- `storageKey`
- `fileUrl`
- `status`
- `ocrText`
- `parsedMedications`
- `createdMedicationIds`
- `errorMessage`
- `processedAt`
- `createdAt`
- `updatedAt`

Access patterns:
- Upload prescription for a user
- List prescriptions by `userId`
- Get prescription metadata by `userId` and `prescriptionId`
- Update processing status and parsed results
- Delete prescription by `userId` and `prescriptionId`
