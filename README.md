# ApplyFlow

A polished, real-time job application tracker built to demonstrate practical Firebase application development.

ApplyFlow is designed as a portfolio project rather than a basic CRUD tutorial. It combines authentication, real-time cloud data, file storage, security rules, responsive UI, and deployment configuration in one end-to-end application.

## What the app does

- Sign up or sign in with email/password.
- Sign in with Google through Firebase Authentication.
- Track job opportunities across a Kanban pipeline.
- Drag applications between Wishlist, Applied, Interview, Offer, and Rejected.
- Search applications and filter them by priority.
- View live pipeline statistics.
- Store application data in Cloud Firestore with real-time listeners.
- Upload resumes, cover letters, or supporting documents to Firebase Storage.
- Keep every user's records isolated with Firestore and Storage security rules.
- Load sample data for a fast portfolio demonstration.
- Run against the Firebase Emulator Suite during local development.
- Deploy the production build through Firebase Hosting.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 + TypeScript |
| Build tooling | Vite 8 |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| File storage | Firebase Storage |
| Security | Firestore Rules + Storage Rules |
| Local development | Firebase Emulator Suite |
| Hosting | Firebase Hosting |
| CI | GitHub Actions |

## Architecture

```text
React + TypeScript
       |
       +-- Firebase Authentication
       |
       +-- Cloud Firestore
       |      `-- applications/{applicationId}
       |
       +-- Firebase Storage
              `-- users/{uid}/applications/{applicationId}/{file}
```

Each Firestore application document contains a `userId`. The included rules only allow authenticated users to read, update, or delete documents they own. Storage follows the same user-scoped path model.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

In the Firebase console:

1. Create a project and register a Web app.
2. Enable **Authentication**.
3. Enable **Email/Password** and **Google** sign-in providers.
4. Create a **Cloud Firestore** database.
5. Create a **Firebase Storage** bucket.

### 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Then paste the Firebase Web App configuration values into `.env`.

### 4. Start development

```bash
npm run dev
```

## Firebase Emulator Suite

Install the Firebase CLI if needed:

```bash
npm install -g firebase-tools
```

Set this in your local `.env`:

```text
VITE_USE_FIREBASE_EMULATORS=true
```

Then run:

```bash
firebase emulators:start
npm run dev
```

## Deploy security rules and hosting

Copy `.firebaserc.example` to `.firebaserc`, replace the project ID, then:

```bash
firebase login
firebase use your-firebase-project-id
firebase deploy --only firestore:rules,storage,hosting
```

## Data model

```ts
applications/{applicationId} {
  userId: string
  company: string
  role: string
  location: string
  salary: string
  jobUrl: string
  notes: string
  status: "wishlist" | "applied" | "interview" | "offer" | "rejected"
  priority: "low" | "medium" | "high"
  nextStepDate: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentPath?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## Portfolio talking points

This repository demonstrates more than interface work:

- **Real-time architecture:** the UI subscribes to Firestore snapshots instead of manually refreshing data.
- **Authentication-aware state:** the app reacts to Firebase Auth sessions and scopes data to the signed-in user.
- **Cloud file handling:** Storage uploads are linked back to Firestore records.
- **Authorization:** Firebase rules prevent one user from reading or mutating another user's applications.
- **Typed frontend:** the application model and form payloads are defined in TypeScript.
- **Developer experience:** emulator configuration, environment templates, Firebase Hosting, and CI are included.

## Suggested next upgrades

- Add Cloud Functions for interview reminder emails.
- Add recruiter/contact subcollections.
- Add analytics charts for conversion rates.
- Add App Check before public production deployment.
- Add Playwright end-to-end tests against the emulator suite.

## Author

Built by [Arondith](https://github.com/Arondith) as a Firebase application development portfolio project.
