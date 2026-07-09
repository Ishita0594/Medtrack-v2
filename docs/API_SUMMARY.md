# API Summary

Base URL for local development: `http://localhost:3000`

Swagger UI: `http://localhost:3000/api/docs`

## Health

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | No | Check API status and timestamp. |

## Auth

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | No | Create a user account and return tokens plus clean user data. |
| POST | `/auth/login` | No | Authenticate by email and password and return tokens plus clean user data. |

## Users

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/users` | No | Create a user directly. |
| GET | `/users` | Yes | List active users. |
| GET | `/users/:userId` | Yes | Get a user by ID. |
| PATCH | `/users/:userId` | Yes | Update user profile fields. |
| DELETE | `/users/:userId` | Yes | Permanently delete a user. |

## Medications

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/medications` | Yes | Create a medication for the authenticated user. |
| GET | `/medications` | Yes | List authenticated user's medications. |
| GET | `/medications/:id` | Yes | Get one owned medication. |
| PATCH | `/medications/:id` | Yes | Update one owned medication. |
| DELETE | `/medications/:id` | Yes | Permanently delete one owned medication. |

## Adherence

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/adherence` | Yes | Create a dose adherence record. |
| GET | `/adherence` | Yes | List authenticated user's adherence records. |
| GET | `/adherence/stats` | Yes | Return adherence totals and adherence rate. |
| PATCH | `/adherence/:id` | Yes | Update a dose record status, taken time, or notes. |
| DELETE | `/adherence/:id` | Yes | Delete one adherence record. |

## Reminders

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/reminders` | Yes | Create a medication reminder. |
| GET | `/reminders` | Yes | List reminders with optional filters. |
| PATCH | `/reminders/:id` | Yes | Update reminder schedule, status, type, or notes. |
| POST | `/reminders/:id/snooze` | Yes | Snooze a reminder until a future timestamp. |
| POST | `/reminders/:id/acknowledge` | Yes | Mark a reminder acknowledged. |
| POST | `/reminders/:id/mark-missed` | Yes | Mark a reminder missed. |
| DELETE | `/reminders/:id` | Yes | Delete one reminder. |

## Caregivers

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/caregivers/invite` | Yes | Patient invites a caregiver by email. |
| GET | `/caregivers` | Yes | Patient lists caregiver relationships. |
| PATCH | `/caregivers/:id` | Yes | Patient updates relationship label or type. |
| POST | `/caregivers/:id/accept` | Yes | Caregiver accepts an invitation. |
| POST | `/caregivers/:id/reject` | Yes | Caregiver rejects an invitation. |
| POST | `/caregivers/:id/cancel` | Yes | Patient cancels a pending invitation. |
| DELETE | `/caregivers/:id` | Yes | Patient deletes a relationship. |
| GET | `/caregivers/patients` | Yes | Caregiver lists accepted patient relationships. |
| GET | `/caregivers/patients/:patientId/medications` | Yes | Caregiver lists a connected patient's medications. |
| GET | `/caregivers/patients/:patientId/adherence` | Yes | Caregiver lists a connected patient's adherence records. |

## Prescriptions

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/prescriptions/upload` | Yes | Upload a prescription image or PDF using multipart field `file`. |
| GET | `/prescriptions` | Yes | List uploaded prescriptions with optional status filter. |
| GET | `/prescriptions/:id` | Yes | Get prescription metadata and status. |
| POST | `/prescriptions/:id/process` | Yes | Run OCR, AI parsing, and medication creation. |
| POST | `/prescriptions/:id/reprocess` | Yes | Re-run processing without duplicating existing created medications. |
| GET | `/prescriptions/:id/text` | Yes | Return extracted OCR text for a prescription. |
| GET | `/prescriptions/:id/medications` | Yes | Return AI-parsed medications for a prescription. |
| DELETE | `/prescriptions/:id` | Yes | Delete prescription metadata and stored file. |
