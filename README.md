# Niles Biological Website Application

<!--
README banner image:
1. Add a new image to this repo, preferably at nova_project/public/readme-logo.png.
2. Replace the src below with that relative path:
   <img src="nova_project/public/readme-logo.png" alt="Niles Biological website preview" width="900">
3. Commit the image and README together so the image renders on GitHub.

Alternative GitHub upload method:
Open any GitHub issue or pull request comment, drag the image into the comment box,
wait for GitHub to create a user-attachments URL, copy that URL, and use it as src.
You do not need to submit the issue/comment.
-->

<img src="nova_project/public/readme-logo.png" alt="Niles Biological website preview" width="900">

## Overview

The Niles Biological Website Application is Team NOVA's completed modernization of the Niles Biological web presence and internal catalog operations. The application replaces the older static site with a Next.js application backed by MySQL, Prisma, AWS-hosted services, and staff-facing inventory tools.

The application gives Niles Biological a modern public website where customers can browse educational biology supply content, search the product catalog, learn about the company, and contact the business. It also gives staff members internal tools for managing catalog items, categories, inventory tickets, tasks, accounts, and informational articles.

This project was created for the CSC senior project sequence to replace Niles Biological's outdated 2006-era website and to support the company's transition toward a maintainable, database-backed web platform. The finished application focuses on improving public catalog access while reducing manual internal record-keeping.

The finished project supports:

- Public home, about, contact, privacy, catalog, and informational article pages.
- Searchable, paginated catalog browsing with product detail pages.
- Hierarchical catalog categories and item classifications.
- Account registration, login, email verification, session handling, and role-aware staff access.
- Staff dashboard workflows for catalog item creation, item editing, category management, account management, ticket creation, ticket review, article management, and task tracking.
- Image upload support through presigned AWS S3 uploads.
- Health check endpoints for application, database, and infrastructure verification.
- Local development, seeding, linting, formatting, production build, Vitest, and Lighthouse scripts.

## Product Screenshots

Screenshots below were captured from the live deployment at `https://nilesbio.store`.

### Home Page

The home page presents Niles Biological branding, featured educational content, and a direct entry point into the catalog.

<img src="nova_project/public/screenshot-home.png" alt="Niles Biological home page screenshot" width="900">

### Catalog Page

The catalog page lets customers search and filter biological supplies, then browse product cards backed by the deployed catalog database.

<img src="nova_project/public/screenshot-catalog.png" alt="Niles Biological catalog page screenshot" width="900">

### About Page

The about page summarizes company background, mission content, and supporting business details for public visitors.

<img src="nova_project/public/screenshot-about.png" alt="Niles Biological about page screenshot" width="900">

### Contact Page

The contact page gives customers business contact information and a focused way to reach Niles Biological.

<img src="nova_project/public/screenshot-contact.png" alt="Niles Biological contact page screenshot" width="900">

### Staff Login

The staff login screen protects the internal dashboard tools for catalog, account, ticket, article, and task management.

<img src="nova_project/public/screenshot-staff.png" alt="Niles Biological staff login screenshot" width="900">

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 15 App Router |
| Language | TypeScript, React 19 |
| Styling | CSS modules/global CSS, Tailwind/PostCSS tooling |
| Database | MySQL |
| ORM | Prisma |
| Auth | Custom account/session flow with bcrypt password hashing |
| Email | Resend in production, console verification codes in development |
| Image storage | AWS S3 presigned uploads |
| Hosting target | Vercel |
| Testing | Vitest, Testing Library, jsdom |
| Quality | ESLint, Prettier, Lighthouse |

## Project Structure

```text
NOVA_Project/
  README.md
  infra/
  nova_project/
    package.json
    prisma/
      schema.prisma
      seed.ts
    public/
    src/
      app/
        api/
        catalog/
        staff/
      content/
      lib/
```

The application source lives in `nova_project/`. Run npm, Prisma, and Next.js commands from that directory unless a command says otherwise.

## Main Features

### Public Site

- Home page with Niles Biological marketing content and featured catalog entry points.
- Catalog page with search, filters, pagination, item cards, and product detail routing.
- About, contact, privacy, and informational article pages.
- API-backed catalog data with fallback/source selection support through environment variables.

### Staff Tools

- Staff shell and dashboard navigation.
- Catalog item search, creation, editing, image association, and inventory fields.
- Category management for three-level product taxonomy.
- Ticket creation and dashboard review for inventory changes.
- Account management for staff/admin users.
- Task assignment and completion tracking.
- Article management for informational content.

### Backend and Data

- Prisma schema for catalog items, images, category hierarchy, accounts, sessions, alerts, tickets, tasks, and articles.
- MySQL database support for local Docker development and deployed environments.
- Seed script for development catalog data, staff/test records, category hierarchy, and article content.
- Health endpoints at `/api/health` and `/api/health/db`.

## Prerequisites

- Node.js LTS.
- npm.
- Docker Desktop if running MySQL locally.
- MySQL database credentials for local or deployed database access.
- Optional AWS credentials for local S3 upload testing.
- Optional Resend API key for production email delivery.

## Download and Local Setup

Clone the repository:

```powershell
git clone https://github.com/iceyatom/NOVA_Project.git
cd NOVA_Project
```

From the repository root:

```powershell
cd nova_project
npm install
```

Create `nova_project/.env` and `nova_project/.env.local` as needed. A basic local database setup looks like:

```env
DATABASE_URL="mysql://app:app@localhost:3307/nilesbio"
SHADOW_DATABASE_URL="mysql://app:app@localhost:3307/nilesbio_shadow"
APP_VERSION="dev"
```

Optional service variables:

```env
AWS_REGION="us-east-2"
S3_BUCKET_NAME="your-s3-bucket-name"
MAX_UPLOAD_SIZE="10485760"
RESEND_API_KEY="your-resend-key"
RESEND_FROM="verified-sender@example.com"
CATALOG_DATA_SOURCE="auto"
```

Production database deployments may use separate database parts instead of `DATABASE_URL`:

```env
DB_HOST="your-rds-host"
DB_PORT="3306"
DB_USER="your-user"
DB_PASSWORD="your-password"
DB_NAME="your-database"
```

## Local Database

Start a local MySQL container:

```powershell
docker run -d --name nilesbio -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=nilesbio -e MYSQL_USER=app -e MYSQL_PASSWORD=app -p 3307:3306 mysql:8.0
```

For later sessions:

```powershell
docker start nilesbio
```

Create the shadow database and grant Prisma migration privileges:

```powershell
docker exec -it nilesbio mysql -u root -p
```

Then run in the MySQL prompt:

```sql
CREATE DATABASE IF NOT EXISTS nilesbio_shadow;
GRANT CREATE, ALTER, DROP, INDEX, REFERENCES ON nilesbio.* TO 'app'@'%';
GRANT CREATE, ALTER, DROP, INDEX, REFERENCES ON nilesbio_shadow.* TO 'app'@'%';
FLUSH PRIVILEGES;
```

Apply the Prisma schema and seed local data:

```powershell
npx prisma generate
npx prisma migrate dev -n init
npx prisma db seed
```

Use `npx prisma studio` to inspect local records.

## Running the App

```powershell
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/catalog`
- `http://localhost:3000/staff`
- `http://localhost:3000/api/health`

Stop the dev server with `Ctrl+C`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server with Turbopack. |
| `npm run build` | Build the production application. |
| `npm run start` | Run the production build locally. |
| `npm run lint` | Run ESLint checks. |
| `npm run format` | Format the project with Prettier. |
| `npm run check` | Check formatting without writing changes. |
| `npm run test` | Run Vitest once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:ui` | Run the Vitest UI. |
| `npm run health` | Request the local `/api/health` endpoint. |
| `npm run lh:local` | Generate a local Lighthouse report. |
| `npm run lh:preview` | Generate a Lighthouse report for the configured preview URL. |

## Testing

Automated tests and quality checks are run from `nova_project/`:

```powershell
npm run lint
npm run check
npm run test
npm run build
```

### Vitest

The project uses Vitest with Testing Library and jsdom for component and behavior tests. The configured test scripts are:

| Command | Purpose |
| --- | --- |
| `npm run test` | Runs the full Vitest suite once. |
| `npm run test:watch` | Runs Vitest in watch mode while developing. |
| `npm run test:ui` | Opens the Vitest browser UI for inspecting test results. |

For more detailed terminal output, run Vitest with the verbose reporter:

```powershell
npm run test -- --reporter=verbose
```

To run one test file with verbose output:

```powershell
npx vitest run path/to/test-file.test.tsx --reporter=verbose
```

Health checks:

- `npm run health` verifies the local `/api/health` endpoint while the dev server is running.
- Open `http://localhost:3000/api/health/db` to verify database connectivity.

Manual test paths:

- `http://localhost:3000` for the public home page.
- `http://localhost:3000/catalog` for catalog search, filtering, pagination, and detail navigation.
- `http://localhost:3000/login` for account login.
- `http://localhost:3000/create_account` for account creation and email verification.
- `http://localhost:3000/staff` for staff dashboard access after login.
- Staff catalog create/edit, category management, ticket creation, ticket dashboard, article management, account management, and task views should be checked with a seeded local database.

## Verification Checklist

Before submitting changes:

```powershell
npm run lint
npm run check
npm run test
npm run build
```

For database-bound changes:

```powershell
npx prisma generate
npx prisma migrate dev -n descriptive_change_name
npx prisma db seed
```

Manual checks:

- Public pages load without console errors.
- Catalog search, filters, pagination, and detail pages work.
- Staff-only pages redirect or block unauthenticated users.
- Account registration and verification flow works.
- Staff catalog item create/edit flows persist database changes.
- Image upload flows work when S3 variables and credentials are configured.
- `/api/health` and `/api/health/db` report expected status.

## Deployment Notes

The intended deployment target is Vercel with AWS-backed services.

Production environment variables should include:

- Database connection values, either `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.
- `AWS_REGION`.
- `S3_BUCKET_NAME` for catalog image uploads.
- `AWS_ROLE_ARN` when using Vercel OIDC for AWS credentials.
- `RESEND_API_KEY` and `RESEND_FROM` for real email verification delivery.
- `APP_VERSION` for health response metadata.

After deployment:

- Confirm Vercel build completes successfully.
- Confirm deployed app can reach the database.
- Confirm `/api/health` and `/api/health/db` return healthy responses.
- Confirm S3 upload paths work from staff item creation/editing pages.
- Confirm production email verification sends through Resend.

## Team Members and Contact

Project contributors identified from repository history:

| Name | Contact |
| --- | --- |
| Jonathan | GitHub: `@iceyatom` |
| Adam Fedorowicz | GitHub: `@TheMightyOctopus` |
| Alan Kushnir | GitHub: `@aa-alan` |
| Brandon Casey | GitHub: `@Zon-Vorelle` |
| Mohamed Ismail | GitHub: `@Mismail-max` |
| Mustafa El Attar | GitHub: `@mustafa2155` |
| Ronit Narayan | GitHub: `@ronitnarayan` |
| Thomas Nguyen | GitHub: `@sam0htngy` |

## Team Workflow

- Use feature branches named like `SCRUM-123-short-feature-name`.
- Use commit messages like `SCRUM-123: Add staff ticket dashboard filter`.
- Include migrations when changing `prisma/schema.prisma`.
- Do not commit `.env`, `.env.local`, credentials, database dumps, or generated Lighthouse reports unless intentionally requested.
- Include screenshots for visual changes.
- Keep README screenshots and diagrams in `nova_project/public/` or `docs/images/` when they are part of the project documentation.

## Entity Relationship Diagram

The current ERD image is stored in the application public assets:

<img src="nova_project/public/erd.png" alt="Database ERD" width="700">
