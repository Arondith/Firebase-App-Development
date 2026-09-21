# ApplyFlow

ApplyFlow is a real-time job search workspace for people managing multiple applications, recruiter conversations, interviews and follow-ups.

The problem is simple: once a job search grows beyond a handful of roles, important context gets scattered across spreadsheets, email, browser bookmarks and notes. ApplyFlow keeps the opportunity and the next action together.

## The problem it solves

A typical spreadsheet can tell you where you applied. It is much worse at answering:

- Which recruiter should I follow up with today?
- Which applications are overdue for a response?
- Where did I find this role?
- What did I discuss in the last interview?
- Which resume or document did I use?
- What percentage of submitted applications reach an interview?

ApplyFlow is designed around those operational questions.

## Product features

- Email/password and Google authentication.
- Real-time per-user application data with Cloud Firestore.
- Board and compact list views.
- Drag-and-drop pipeline stages.
- Follow-up queue for overdue, due-today and upcoming actions.
- Recruiter/contact information.
- Application source tracking.
- Applied date and work setup tracking.
- Next action plus next-action date.
- Interview conversion and pipeline metrics.
- Search by company, role, source, location or contact.
- Priority and attention filters.
- Resume / supporting-document uploads to Firebase Storage.
- CSV export for portability and backups.
- User-isolated Firestore and Storage security rules.
- Firebase Emulator Suite support.
- Firebase Hosting configuration.
- GitHub Actions build verification.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 + TypeScript |
| Build tooling | Vite 8 |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| File storage | Firebase Storage |
| Authorization | Firestore Rules + Storage Rules |
| Local development | Firebase Emulator Suite |
| Hosting | Firebase Hosting |
| CI | GitHub Actions |

## Architecture

```text
React + TypeScript
       |
       +-- Firebase Authentication
       |
       +-- Application service layer
       |       |
       |       +-- Cloud Firestore
       |       |      `-- applications/{applicationId}
       |       |
       |       +-- Firebase Storage
       |              `-- users/{uid}/applications/{applicationId}/{file}
       |
       +-- Domain utilities
               +-- follow-up scheduling
               +-- pipeline metrics
               +-- CSV export
```

The UI is intentionally separated from Firebase access and domain calculations. Firestore operations live in the service layer, while metrics, due-date logic and export behavior live in utility modules.

## Data model

```ts
applications/{applicationId} {
  userId: string

  company: string
  role: string
  location: string
  salary: string
  jobUrl: string
  workMode: "remote" | "hybrid" | "onsite" | "unspecified"

  source: string
  contactName: string
  contactEmail: string
  notes: string

  status: "wishlist" | "applied" | "interview" | "offer" | "rejected"
  highestStageReached: "wishlist" | "applied" | "interview" | "offer" | "rejected"
  priority: "low" | "medium" | "high"

  appliedDate: string
  nextStep: string
  nextStepDate: string

  attachmentUrl?: string
  attachmentName?: string
  attachmentPath?: string

  createdAt: Timestamp
  updatedAt: Timestamp
  statusChangedAt: Timestamp
}
```

`highestStageReached` is stored separately from the current status so an application that later closes can still contribute correctly to interview-conversion metrics.

## Security model

Firestore rules require authentication, verify document ownership, prevent `userId` from being reassigned on update, and validate core application fields. Firebase Storage uses a user-scoped path and only permits the authenticated owner to access files.

Client-side filtering is for usability; authorization is enforced by Firebase rules.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

In Firebase:

1. Register a Web app.
2. Enable Authentication.
3. Enable Email/Password and Google providers.
4. Create Cloud Firestore.
5. Create a Firebase Storage bucket.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Paste the Firebase Web App configuration values into `.env`.

### 4. Run locally

```bash
npm run dev
```

## Emulator Suite

Set:

```text
VITE_USE_FIREBASE_EMULATORS=true
```

Then run:

```bash
firebase emulators:start
npm run dev
```

## Build

```bash
npm run build
```

The repository includes a GitHub Actions workflow that installs dependencies and verifies the production build on pushes and pull requests.

## Deploy

Copy `.firebaserc.example` to `.firebaserc`, set the Firebase project ID, then:

```bash
firebase login
firebase use your-firebase-project-id
firebase deploy --only firestore:rules,storage,hosting
```

## Engineering decisions worth discussing in an interview

- **Real-time synchronization:** Firestore snapshot listeners keep the workspace current without manual refreshes.
- **Stage history without a full event log:** `highestStageReached` preserves conversion analytics even after an application moves to a closed status.
- **Separation of concerns:** Firebase I/O, domain calculations and UI components are kept separate.
- **Backward-compatible model evolution:** newer fields are optional when reading older records.
- **Portable data:** CSV export reduces platform lock-in for users.
- **Authorization at the backend boundary:** user ownership is enforced in Firebase rules, not only hidden in the UI.
- **Operational UX:** the dashboard prioritizes overdue and upcoming actions instead of only visualizing status.

## Possible production extensions

- Cloud Functions or scheduled tasks for email reminders.
- Application activity subcollections for a full audit timeline.
- Calendar integration for interview events.
- Saved resume versions and per-application resume tracking.
- App Check, error monitoring and analytics.
- End-to-end tests against the Firebase Emulator Suite.

## Author

Built by [Arondith](https://github.com/Arondith) as a full-stack Firebase portfolio project focused on a real job-search workflow.
