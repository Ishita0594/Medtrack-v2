# Architecture

MedTrack is organized as a full-stack project with a clear frontend/backend boundary.

## Frontend and Backend Separation

The frontend is a React single-page application in `frontend`. It is responsible for:

- Routing and protected pages
- Auth session storage in localStorage
- Axios API clients
- Bootstrap UI
- Role-aware navigation
- Forms, loading states, errors, empty states, and delete confirmations

The backend is a NestJS API in `backend`. It is responsible for:

- Authentication and authorization
- Validation and DTOs
- Business rules
- DynamoDB persistence
- Swagger documentation
- Scheduler and provider integrations

The frontend talks to the backend through `VITE_API_BASE_URL`.

## Repository Pattern

Services depend on repository interfaces instead of DynamoDB directly. For example, `UsersService` depends on `UserRepository`, and the module binds that interface token to a DynamoDB implementation.

Benefits:

- Controllers stay unaware of persistence details
- Services keep business logic focused
- DynamoDB logic is isolated
- In-memory implementations can be replaced or tested independently

## DynamoDB Repository Implementations

Each DynamoDB repository owns command construction and item mapping for its table. The app uses AWS SDK v3 with `DynamoDBClient` and `DynamoDBDocumentClient`.

Repositories use:

- `PutCommand` for create
- `GetCommand` for exact key lookup
- `QueryCommand` for keyed list and GSI access patterns
- `UpdateCommand` for controlled updates
- `DeleteCommand` for hard deletes

Controllers and services do not know DynamoDB exists.

## JWT Auth Flow

1. User registers or logs in.
2. Password is validated with bcrypt.
3. The API signs a JWT access token with `sub: userId`.
4. A refresh token is generated and only its hash is stored.
5. The response returns tokens plus a clean user object.
6. The frontend stores the access token and sends `Authorization: Bearer <token>`.
7. Protected routes use `JwtAuthGuard`.

Internal fields such as password hashes and database keys are not returned.

## Prescription Processing Flow

1. Patient uploads a prescription using multipart field `file`.
2. Backend validates file type and size.
3. Storage provider saves the file.
4. Prescription metadata is stored with status `UPLOADED`.
5. Processing sets status to `PROCESSING`.
6. OCR provider extracts text.
7. AI parser provider converts text into parsed medications.
8. Medication service creates medication records.
9. Prescription status becomes `PROCESSED` with created medication IDs.

The current OCR and AI providers are mock providers. This keeps the project deterministic and reviewable without requiring paid services.

## Reminder Scheduler Flow

Reminder events are stored with status and scheduled time. The scheduler periodically queries due pending reminders through the scheduled-time GSI, claims them safely, and sends notifications through the notification provider.

Notification delivery is provider-based:

- `EMAIL_PROVIDER=MOCK` logs safe delivery intent for local development.
- `EMAIL_PROVIDER=SMTP` sends real email through Nodemailer.

For due reminders with `notificationType=EMAIL`, the notification service builds a medication reminder email, looks up the user's email address, and sends through the configured provider. Email failures are caught and logged safely so the scheduler does not crash.

## Caregiver Access Control

Caregiver access is relationship-based:

- Patients create caregiver invitations.
- Caregivers accept invitations linked to their email.
- Only accepted relationships grant access to patient medications and adherence.
- Patient-only operations require `PATIENT`.
- Caregiver access operations require `CAREGIVER`.

This avoids exposing patient data by user ID alone.

## Mock Provider Strategy

Mock providers are used for:

- OCR
- AI prescription parsing
- Notification delivery when `EMAIL_PROVIDER=MOCK`
- Local prescription storage

They make local development reliable and inexpensive while preserving clear extension points:

- Replace mock OCR with AWS Textract or another OCR API.
- Replace mock AI parser with a production LLM parser.
- Use `EMAIL_PROVIDER=SMTP` for real email, or add SMS/push providers later.
- Replace local storage with S3.

## SMTP Email Flow

Caregiver invitations:

1. A patient calls `POST /caregivers/invite`.
2. The relationship is saved first.
3. The notification service renders a caregiver invitation email.
4. The configured provider sends or mocks the email.
5. Delivery errors are logged without failing the API response.

Reminder emails:

1. A reminder is created with `notificationType=EMAIL`.
2. The scheduler finds due pending reminders.
3. The notification service renders a medication reminder email.
4. SMTP sends the email when configured.
5. If delivery fails, the scheduler logs safely and leaves the reminder pending.

When using Gmail SMTP, create a Gmail app password and store it as `SMTP_PASS`. Do not use or commit a personal Gmail password.

## Plug-in Points for Real Providers

- `src/prescriptions/ocr`
- `src/prescriptions/ai`
- `src/prescriptions/storage`
- `src/notifications`
- `src/database/dynamodb`

New providers should implement existing interfaces and be selected through configuration.
