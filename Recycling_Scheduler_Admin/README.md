# Recycling Scheduler Admin

Administrative dashboard for the Montevideo recycling scheduler. It manages clients, staff roles, recycling evidence, materials, and statistical reports using Firebase as its data platform.

This README describes the current `review` branch. The branch is the reviewed development version built on top of `main` and is not yet the production baseline unless it is intentionally merged.

## Features

- Create and edit recycling clients and their locations
- Create, edit, and delete staff users and roles
- Upload dated photographic evidence to Firebase Storage
- Browse and filter evidence by client and month
- Generate client classification reports and CSV exports
- View statistical reports and export them as PDF
- Responsive desktop and mobile navigation
- Persistent Spanish/English interface switching across every active page
- Manage bilingual materials and optional sub-materials with active, paused, and archived states
- Require and upload a material photo when a material is created or edited; the resulting Firebase Storage URL is shared with the mobile app
- Restore the common Montevideo material taxonomy while preserving status and history
- Show a landfill diversion-rate KPI and responsive charts in statistical reports

## Technology

- React 18
- Vite 5
- React Router 6
- Tailwind CSS 4
- Firebase Firestore and Storage
- Recharts
- jsPDF and html2canvas

## Requirements

- Node.js 18 or newer
- npm 9 or newer
- Network access to the configured Firebase project

The project currently initializes Firebase from [`firebase.js`](./firebase.js). Firebase web configuration is not a server secret, but Firestore and Storage access must still be protected by appropriate security rules.

## Local setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open <http://localhost:5173>. Vite may select another port if 5173 is already occupied.

To expose the server to other devices on the local network:

```bash
npm run dev -- --host
```

### Node.js is not found

Verify that Node.js and npm are available:

```bash
node --version
npm --version
```

If either command is not found, install Node.js 18 or newer using the installer or version manager appropriate for your operating system, then reopen the terminal. If Node.js is already installed in a custom or portable location, add that installation directory to your user `PATH` environment variable.

For a temporary PowerShell session on Windows, replace the example path below with the directory that contains `node.exe`:

```powershell
$env:Path = "C:\path\to\nodejs;$env:Path"
node --version
npm --version
```

After both commands succeed, continue with `npm install` and `npm run dev` from the project root.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check JavaScript and JSX with ESLint |
| `npm run deploy` | Build and deploy Firebase Hosting |
| `npm run push` | Submit the Docker image to Google Cloud Build |

Before committing changes, run:

```bash
npm run lint
npm run build
```

## Application routes

| Route | Page |
| --- | --- |
| `/` | Landing page |
| `/clients` | Client and location management |
| `/users` | Staff user management |
| `/evidence` | Evidence upload, filtering, and gallery |
| `/materials` | Material and sub-material management |
| `/statistic-reports` | Statistical reporting and PDF export |

## Project structure

```text
.
|-- public/                    Static assets served as-is
|-- src/
|   |-- api/                   Firestore data access
|   |-- components/            Shared React components
|   |-- helpers/               Report and data utilities
|   |-- images/                Imported image assets
|   |-- pages/                 Route-level React pages
|   |-- services/              Evidence and legacy API services
|   |-- stylesheets/           Global and report styles
|   `-- main.jsx               Router and React entry point
|-- firebase.js                Firebase app initialization
|-- firebase.json              Hosting and rules configuration
|-- firestore.rules            Firestore security rules
|-- storage.rules              Storage security rules
|-- Dockerfile                 Production container image
|-- vite.config.js             Vite plugins and build settings
`-- package.json               Dependencies and project scripts
```

## Firebase deployment

Install and authenticate the Firebase CLI:

```bash
npm install --global firebase-tools
firebase login
```

Deploy the production site:

```bash
npm run deploy
```

The hosting configuration serves `dist/` and rewrites client-side routes to `index.html`. Review [`firestore.rules`](./firestore.rules) and [`storage.rules`](./storage.rules) before deploying rule changes to a shared environment.

## Docker

Build and run the included image:

```bash
docker build -t recycling-scheduler-admin .
docker run --rm -p 4200:4200 recycling-scheduler-admin
```

Open <http://localhost:4200>.

## Data utility scripts

The repository contains root-level scripts such as `add_sample_collections.js`, `add_2025_collections.js`, `upload_logos.js`, and `inspect_firebase_data.js`. Some of these scripts write directly to the configured Firebase project.

Inspect a script and verify the Firebase project before running it:

```bash
node inspect_firebase_data.js
```

Do not run population or upload scripts against production data unless that change is intentional and backed up.

## Changes from `main`

The `review` branch contains the following major changes compared with the original `main` branch:

- Added a shared Spanish/English language context and localized the active administration pages, navigation, charts, labels, and material-management messages.
- Reworked material management around Firestore-backed bilingual names, optional sub-materials, workflow metadata, stable preset IDs, search, and active/paused/archived filtering.
- Added preset synchronization so the admin dashboard and Padre Cacho mobile app use the same default material taxonomy.
- Added required material-photo upload and replacement through Firebase Storage. Material documents expose the URL as both `photoUrl` and `imageUrl` for cross-client compatibility.
- Improved evidence browsing and uploads, including client/month filtering and more consistent Firebase data handling.
- Expanded statistical reports with localized month labels, safer trend calculations, a diversion-rate KPI, responsive mobile layouts, and PDF/report refinements.
- Added ESLint/Vite configuration and focused tests for localization, presets, and material services/workflows.

For the exact file-level comparison, run:

```bash
git diff --stat main...review
git log --oneline main..review
```

## Troubleshooting

### `vite` is not recognized

Run `npm install` in the project root, then retry `npm run dev`.

### Firebase requests fail

Confirm network connectivity, the Firebase project configuration, and the deployed Firestore/Storage rules. Browser developer tools usually show the rejected request and Firebase error code.

### The page is blank after deployment

Run `npm run build` locally and check the browser console. Firebase Hosting is already configured with an SPA rewrite, so all routes should resolve to `index.html`.

## Git workflow

This document tracks the `review` branch. Keep `main` unchanged until the reviewed update has been validated and intentionally merged.
