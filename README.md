# MedTrack

MedTrack is a full-stack medication management platform for patients and caregivers. It combines medication schedules, adherence tracking, reminders, caregiver access, and prescription upload processing in one dashboard.


## Problem Statement

Many patients manage medications across handwritten prescriptions, alarms, family reminders, and manual notes. This creates missed doses, poor visibility for caregivers, and extra work when prescriptions change. MedTrack centralizes those workflows so patients can track medication routines and caregivers can monitor care with controlled access.

## Key Features

- JWT authentication with refresh token storage
- User registration and role-based access for Patients and Caregivers
- Medication CRUD with schedules and dose times
- Adherence records and adherence statistics
- Reminder events with scheduler-ready status transitions
- Caregiver invitation, acceptance, cancellation, and patient access flows
- Prescription upload with mock OCR and configurable AI parsing
- Automatic medication creation from processed prescriptions
- DynamoDB separate-table persistence
- Swagger API documentation
- React dashboard with protected routes and Bootstrap UI

## Tech Stack

Frontend: React, TypeScript, Vite, Bootstrap, Axios
Backend: NestJS, TypeScript
Database: AWS DynamoDB
Authentication: JWT, bcrypt
AI: OpenAI provider integration with mock fallback
Notifications: Mock/SMTP provider architecture
Testing: Jest

## Architecture Overview

The project is split into two applications:

- `backend`: NestJS API, business logic, repositories, DynamoDB integration, Swagger, and tests.
- `frontend`: React SPA with typed API clients, authentication context, protected routing, and dashboard pages.

The backend uses a repository pattern so services depend on interfaces rather than DynamoDB directly. This keeps controllers and services stable while persistence can evolve.
React Frontend
      ↓
NestJS REST API
      ↓
Services / Repository Layer
      ↓
AWS DynamoDB

For prescription processing:
Prescription Upload
      ↓
OCR Provider
      ↓
AI Parser
      ↓
Validated Medication Data
      ↓
Medication Creation

## Backend Modules

- Auth: register, login, JWT access token creation, refresh token hashing
- Users: user profiles and clean response DTOs
- Medications: medication schedules and active medication records
- Adherence: dose tracking, statuses, and stats
- Reminders: reminder event lifecycle and scheduler support
- Caregivers: invitation workflow and patient access control
- Notifications: mock notification provider layer
- Prescriptions: upload, mock OCR, configurable AI parsing, and medication creation
- Database: DynamoDB DocumentClient provider

## Frontend Pages

- Login
- Register
- Dashboard
- Medications
- Adherence
- Reminders
- Caregivers
- Prescriptions
- Profile

## DynamoDB Tables

MedTrack uses separate DynamoDB tables:

- `Users`
- `RefreshTokens`
- `Medications`
- `AdherenceRecords`
- `ReminderEvents`
- `CaregiverRelationships`
- `PrescriptionUploads`

See [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for keys, GSIs, attributes, and access patterns.

## AI Prescription Processing

Prescription processing is provider-based:

1. A patient uploads a prescription image or PDF.
2. The file is stored using the configured storage provider.
3. OCR extracts text from the file.
4. An AI parser converts extracted text into medication-like records.
5. The backend creates medication entries from parsed results.

Current OCR and storage providers are intentionally mocked:

- `OCR_PROVIDER=MOCK`
- `PRESCRIPTION_STORAGE_PROVIDER=LOCAL`

AI parsing supports:

- `AI_PARSER_PROVIDER=MOCK`: default deterministic parser for local development and tests.
- `AI_PARSER_PROVIDER=OPENAI`: real LLM parser using the official OpenAI SDK and structured JSON output.

When using OpenAI, set:

```env
AI_PARSER_PROVIDER=OPENAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

The OpenAI parser validates model JSON before creating medications. It drops invalid medication entries, fails the prescription safely if no valid entries remain, and never sends raw model output directly to `MedicationsService`.

## Environment Setup

Copy examples before running locally:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update `backend/.env` with your AWS credentials and a strong JWT secret. Do not commit real `.env` files.

## Run Locally

Install backend dependencies:

```bash
cd backend
npm install
```

Create DynamoDB tables:

```bash
npm run db:init
```

Start backend:

```bash
npm run start:dev
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Start frontend:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- Health check: `http://localhost:3000/health`

## Useful Scripts

Backend:

```bash
npm run start:dev
npm run build
npm test
npm run db:init
```

Frontend:

```bash
npm run dev
npm run build
npm run lint
```

## API Documentation

Swagger is available at:

```text
http://localhost:3000/api/docs
```

A concise endpoint summary is available in [docs/API_SUMMARY.md](docs/API_SUMMARY.md).

## Screenshots

Add screenshots here before publishing:

- Login and Register
- Patient Dashboard
- Medication Management
- Adherence Stats
- Prescription Processing
- Caregiver Access

## Security Notes

- `.env` files are ignored.
- Secrets are represented only as placeholders in `.env.example`.
- Passwords are hashed with bcrypt.
- Refresh tokens are hashed before storage.
- JWT access tokens use configurable expiry.
- Internal database fields are not exposed in API responses.
- Request logging avoids passwords, JWTs, refresh tokens, AWS credentials, and prescription text.

## Future Improvements

- Real OCR provider such as AWS Textract
- S3 storage for prescription files
- Refresh token rotation endpoint
- Deployment with CI/CD
- Infrastructure-as-code for AWS resources
- End-to-end frontend tests

## Resume-Ready Highlights

- Full-stack healthcare dashboard built with NestJS, React, TypeScript, and DynamoDB
- Production-style modular backend with repository pattern and custom exceptions
- Secure authentication with bcrypt, JWTs, refresh token hashing, and clean DTO responses
- DynamoDB design with separate tables, GSIs, and script-based table initialization
- Provider-based architecture for OCR, AI parsing, notification delivery, and file storage
- Role-aware frontend with protected routes, typed Axios clients, and responsive Bootstrap UI

## Email Notifications

MedTrack supports configurable notification delivery:

- `EMAIL_PROVIDER=MOCK`: default for development. The app logs safe delivery intent only.
- `EMAIL_PROVIDER=SMTP`: sends real email through Nodemailer.

SMTP variables:

```env
EMAIL_PROVIDER=SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM="MedTrack <your-email@gmail.com>"
```

For Gmail, use an app password, not your normal Gmail password. Never commit SMTP credentials.

Caregiver invitation emails are sent after `POST /caregivers/invite` creates the invitation. If email sending fails, the invite is still saved and the failure is logged safely.

Reminder emails are sent by the reminder scheduler for due reminders with `notificationType=EMAIL`. If delivery fails, the scheduler logs safely, avoids crashing, and leaves the reminder pending for a later run.
