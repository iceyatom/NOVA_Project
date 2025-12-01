# Niles Biological Website Application 
<img width="800" height="800" alt="image" src="https://github.com/user-attachments/assets/56bf6453-be0e-48f1-bb8e-13d662d16ae6" />

## Project Synopsis
The Niles Biological Website Application is a full-scale modernization project developed by Team NOVA to replace Niles Biological’s outdated 2006-era website.

The goal of this project is to:

1. Overhaul the public-facing product catalog with a clean, maintainable, and scalable web application.
2. Introduce a digitized record-keeping system to streamline internal operations and improve long-term data integrity.

Built with Next.js, the application delivers a dynamic catalog interface backed by a MySQL database hosted on AWS RDS for high availability and production reliability. Prisma ORM handles schema management, migrations, and database interaction across all environments.

To ensure consistency across contributors and environments, the project includes:

- End-to-end health checks,
- Lighthouse performance reporting,
- Fully documented workflows for seeding, database migrations, and environment setup,
- Repeatable development spin-up instructions for seamless onboarding.

This application represents the foundation of Niles Bio’s transition toward modern web infrastructure and digital operations.

## CSC 190 Milestone Timeline
This section outlines our milestones of development for CSC 190.

| Sprint | Dates | Milestone / Feature | JIRA |
| --- | --- | --- | --- |
| 2 | 10/6/25 - 10/20/25 | Landing Page & Deployment Setup | SCRUM-51 |
| 3 | 10/11/25 - 11/3/25 | AWS RDS Integration Setup | SCRUM-66 |
| 3 | 10/20/25 - 11/3/25 | Catalog Page Development | SCRUM-75 |
| 4 | 11/3/25 - 11/17/25 | Search Bar, Filter Checklist, and Dynamic Catalog Grid - Catalog Page | SCRUM-81 |
| 4 | 11/3/25 - 11/17/25 | Landing, Contact, and About Page Content Population | SCRUM-87 |
| 4 | 11/3/25 - 11/17/25 | API Integration and AWS Database Connection Test | SCRUM-91 |

## CSC 191 Timeline Goals
This section outlines our planned milestones and development goals for CSC 191.

| Sprint | Dates | Milestone / Feature |
| --- | --- | --- |
| 5 | 1/26/26 - 2/8/26 | Develop Account Logins/2FA by Email |
| 6 | 2/9/26 - 2/22/26 | Create Database Management Tools |
| 7 | 2/23/26 - 3/8/26 | Implement Staff Dashboard Summary Statistics |
| 8 | 3/9/26 - 3/22/26 | Create Audit Logging & Activity Tracking |
| 9 | 3/23/26 - 4/5/26 | Performance Testing |

## Deployment Instructions
- Ensure Vercel published main branch successfully builds and is reachable
- Verify Vercel deployment can reach the database.
- Confirm that AWS RDS instance is correctly seeded and online with dynamic scaling turned off. 

## Testing Instructions

0) Prerequisites

   - Docker Desktop running.
   - Local MySQL container started (first time):
      - docker run -d --name nilesbio --env-file .env.development -p 3307:3306 mysql:8.0

      Subsequent runs:
      - docker start nilesbio

      Ensure local env files exist with DB URLs:
      - DATABASE_URL="mysql://app:app@localhost:3307/nilesbio"
      - SHADOW_DATABASE_URL="mysql://app:app@localhost:3307/nilesbio_shadow"

      Generate Prisma Client (after fresh clone, dependency changes, or schema changes):
      - npx prisma generate

1) Smoke test (app boots)
   - npm run dev
      - Open http://localhost:3000 and http://localhost:3000/catalog

2) Catalog Search (placeholder)

   - Type → Enter / Search → “Last search” updates.
   - Button disabled when empty; no items/network change.
  
3) Routing

   - Use header links (Catalog/About/Login). Client-side nav only (no new “document” requests). Active link has aria-   current="page".

4) Grid responsiveness

   - Resize: 4 → 3 → 2 → 1 columns; no clipping/overflow.

5) Health

   - Visit /api/health or:
   - npm run health


6) DB connectivity

   - On /catalog, “Database Status” shows Connected.
   - If not: confirm container is running, then:
      - npx prisma migrate dev -n "sync"
      - npx prisma generate

## Developer Instructions

### Steps to Run the Next.js Project Locally

1. Install Node.js
   - Download and install the latest LTS version of Node.js from https://nodejs.org

2. Configure PowerShell Permissions (One-Time Setup)

- Open Windows PowerShell as Administrator.
- Run the following command to allow local scripts:
  - In Powershell:
    - Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
    - Type y and press Enter when prompted.
- Close PowerShell after completing this step.

3. Open the Project in Visual Studio Code (VSC)
   - Launch VS Code and open the project folder.

4. Install Dependencies
   - In the VS Code powershell terminal, navigate to the project directory:
     - cd path\to\project-folder

5. Install the required packages
   - In Powershell (Will automatically install all dependecines from package.json):
     - npm install
   - Run the development server:
     - npm run dev
   - Once it starts, open http://localhost:3000 in your web browser.

6. Stop the Server
   - To stop the local server, press Ctrl + C in the terminal.

### Contribution Styles

1) Branching & commits
   
   - Branch name: SCRUM-###-concise-feature-name
      - Example: SCRUM-81-Search-Hero-and-Grid
   - Commit messages: SCRUM-81: short action summary
      - Example: SCRUM-81: Add hero search placeholder with aria-live

2) PR checklist

   - Builds cleanly (npm run build)
   - Lint/format pass (npm run lint, npm run format)
   - Local tests pass (see Testing Instructions)
   - No console errors in runtime
   - Accessibility: form labels, focus, aria-live working
   - Screenshots for visual changes
   - If schema changed: migration included + notes

3) Code style
   - TypeScript strict where feasible.
   - Prettier formatting; ESLint for quality.
   - Accessible components: label inputs, manage focus, avoid color-only cues

4) Database workflow (local)
   - '#' after reboot (cheat sheet)
     docker start nilesbio
     npm install
     npx prisma generate
     npm run dev
     
   - Schema changed?
        npx prisma migrate dev -n "change"

   - Seeding (local only):
        npx prisma db seed

   - Env files (local)
     Create both .env and .env.local in nova_project/:
        DATABASE_URL="mysql://app:app@localhost:3307/nilesbio"
        SHADOW_DATABASE_URL="mysql://app:app@localhost:3307/nilesbio_shadow"
        APP_VERSION=dev

5) Project Scripts
   | Script                                   | What it does                                                                      |
   | ---------------------------------------- | --------------------------------------------------------------------------------- |
   | **npm run dev**                          | Dev server (Turbopack)                                                            |
   | **npm run build**                        | Production build                                                                  |
   | **npm run start**                        | Run production build                                                              |
   | **npm run lint**                         | ESLint check                                                                      |
   | **npm run check**                        | Prettier check (no write)                                                         |
   | **npm run format**                       | Prettier write                                                                    |
   | **npm run lh:local**                     | Runs Lighthouse Report for local build                                            |
   | **npm run lh:preview**                   | Runs Lighthouse Report for deployed build                                         |


### Scripts

1. ESLint

- npm run lint: runs ESLint to error check the project

2. Prettier

- npm run check: checks only formatting to show where changes are needed
- npm run format: writes formatting changes to make all styling consistent

3. NPM Development, Build, Start

- npm run dev: runs the project in development mode using Turbopack for fast responsiveness when files are saved
- npm run build: builds the project with compiling and compression; must be done before npm run start
- npm run start: runs the production build optimized for efficiency

4. Health Check

- npm run health: verifies that the local server is running by pinging /api/health

5. Lighthouse Audits

- npm run lh:local: generates a Lighthouse performance and accessibility report for the local server and saves it to docs/lighthouse/local-desktop.html
- npm run lh:preview: runs a Lighthouse audit on the deployed Vercel preview site and saves the report to docs/lighthouse/preview-desktop.html

6. Prisma and Database Management (not implemented yet)

- npm run prisma:generate: generates the Prisma client based on the schema
- npm run prisma:migrate: applies local development migrations
- npm run prisma:deploy: deploys schema migrations to the production database
- npm run db:seed: seeds the database with initial data from prisma/seed.ts

### Docker

For the app development phase, please use Docker to develop the app.

Installation instructions

1. Install Docker Desktop:

- https://www.docker.com/products/docker-desktop/

2. Get the Docker extension by Microsoft in Visual Studio Code.

#### Usage

1. Open the Docker Desktop app and complete the initial setup.

2. Enter the following command into the terminal to instantiate a Docker container for nilesbio:

- docker run -d --name nilesbio --env-file .env.development -p 3307:3306 mysql:8.0

3. Enter the following command into the terminal to access the MySQL terminal:

- docker exec -it nilesbio mysql -u <username> -p
- Username and password can be found in internal documentation.

4. Special privileges must be granted to the nilesbio database user so that Prisma can perform operations properly. Enter this series of commands into the MySQL terminal to grant these privileges:

- CREATE DATABASE nilesbio_shadow;
- GRANT CREATE, ALTER, DROP, INDEX, REFERENCES ON `nilesbio`.\* TO 'app'@'%';
- GRANT CREATE, ALTER, DROP, INDEX, REFERENCES ON `nilesbio_shadow`.\* TO 'app'@'%';

5. To remove, stop, or make other changes to the Docker container, click on the Container icon in the left pane of Visual Studio Code.

### Seeding the Database

The Prisma seed file (prisma/seed.ts) populates the nilesbio database with test catalog data for development and UI testing. This includes 600+ sample entries containing the fields itemName, category, description, and price.

<img src="https://github.com/iceyatom/NOVA_Project/blob/Readme-Update/nova_project/public/ERD.webp" alt="Database ERD" style="width:50%; height:auto;">

Here is the Entity Relationship Diagram for the database. 

Ensure your Prisma Client is up to date:

- npx prisma generate
- Run the seed script to populate the database:
- npx prisma db seed

This command executes the prisma/seed.ts file and inserts the test catalog items into the database.

#### Reset and Reseed
To completely reset the database and reapply all migrations (including reseeding):

- npx prisma migrate reset

This will drop, recreate, and reseed the database with the latest schema and test data.

#### Important Notes
- Running npx prisma db seed multiple times without resetting will create duplicate entries in the database.

- Use migrate reset if you need a clean database state before reseeding.

- The seed data is designed for local development only, do not run it in production environments.

You can view and verify the seeded records using:
- npx prisma studio

#### Prisma

This project uses Prisma for database management. Prisma must be properly installed and configured on your machine to contribute database-bound tasks.

1. Install dependencies in console:

- npm install
- npm install prisma
- npm install @prisma/client

2. Move seed.ts out of existing primsa folder and then delete that folder

3. Run 'npm prisma init' on console then move the seed.ts file back into the newly created prisma folder

4. Make the following changes to the schema.primsa file

- datasource db provider= "postgresql" --> "mysql"
- generator client provider=prisma-client-js instead of prisma-client
- generator client output="../node_modules/.prisma/client" instead of “..src/generated/prisma”

5. Create a .env and a .env.development file under the nova_project directory and delete any content inside them

#### Usage

Before using Prisma, please set up Docker and the nilesbio database properly or some functionalities of Prisma will not work properly.

1. Whenever schema.prisma file is modified, if the client was never generated, if development shifts to prod, or if dependencies are installed (such as npm install), enter the following command into the terminal to generate or update the Prisma client:

- npx prisma generate

2. During the development phase, when changing the schema.prisma file, you must track the schema changes by running the following command into the terminal:

- npx prisma migrate dev
  or
- npx prisma migrate dev -n <schema change purpose>

### Local Database Setup & Verification

The project uses a Prisma-based connection layer to communicate with a local MySQL database running in Docker Desktop. This ensures a consistent and reproducible development environment across all team members.

Using database connection method:
Example – lib/db.ts defines a shared Prisma client (singleton) that reads configuration from .env.development. All database operations import this client, maintaining consistent connection handling across the app.

Developer notes:

- Docker Desktop and the local MySQL container must be running.
- .env.development should contain a valid DATABASE_URL.
- Run Prisma commands (generate, migrate, seed) before launching the app.
- Use the Catalog page to visually verify a successful connection.

### Configure Security & Networking (Docker Local + AWS RDS)

### Docker Local

- AWS RDS MySQL instance created and running.
- Docker Desktop + Docker Compose installed locally.
- Your public IP allowlisted in the RDS Security Group (TCP 3306).
- `.env` and `.env.development` files in the project root with correct credentials.

### AWS RDS

### AWS IAM Accounts for RDS Access

This setup ensures every developer connects to the AWS RDS database using **their own IAM account**, not shared admin or root credentials.  
This provides:

- **Traceability** — Each connection is tied to an individual user.
- **Security** — Access follows the **principle of least privilege**.
- **Compliance** — Prevents accidental exposure of shared keys or over-permissive roles.

#### Key Concepts

| Term                                     | Description                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| **IAM (Identity and Access Management)** | AWS service for managing users, roles, and permissions.                           |
| **IAM Policy**                           | JSON document that defines what actions a user can perform.                       |
| **Access Key ID / Secret Access Key**    | Credentials used for programmatic or CLI access to AWS.                           |
| **RDS Access Policy**                    | A restrictive policy allowing connection and basic management of an RDS instance. |
| **Least Privilege Principle**            | Users receive only the minimal permissions needed to do their job.                |

#### Add IP address to the Inbound Rules in the VPC security group
1. Go to the AWS Management Console → RDS → Databases → select your database.
2. Scroll to the Connectivity & security tab.
3. Under VPC security groups, click the linked security group ID (e.g., sg-Babc123def456).

- This opens the EC2 > Security Groups page.

4. Select the group, then click the Inbound rules tab.
5. Click Edit inbound rules

- Add rule.

6. Fill it out like this:

- Type: MySQL/Aurora (or the DB engine's port)
- Protocol: TCP
- Port Range: 3306
- Source: My IP
  AWS automatically fills your current public IP with /32 (e.g. 123.45.67.89/32 ).
