## Steps to Run the Next.js Project Locally

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

## Scripts

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

## Docker

For the app development phase, please use Docker to develop the app.

Installation instructions
1. Install Docker Desktop:
  - https://www.docker.com/products/docker-desktop/ 

2. Get the Docker extension by Microsoft in Visual Studio Code.

Usage
1. Open the Docker Desktop app and complete the initial setup.

2. Enter the following command into the terminal to instantiate a Docker container for nilesbio:
  - docker run -d --name nilesbio --env-file .env.development -p 3307:3306 mysql:8.0

3. Enter the following command into the terminal to access the MySQL terminal:
  - docker exec -it nilesbio mysql -u <username> -p
  - Username and password can be found in internal documentation.

4. Special privileges must be granted to the nilesbio database user so that Prisma can perform operations properly. Enter this series of commands into the MySQL terminal to grant these privileges:
  - CREATE DATABASE nilesbio_shadow;
  - GRANT CREATE, ALTER, DROP, INDEX, REFERENCES ON `nilesbio`.* TO 'app'@'%';
  - GRANT CREATE, ALTER, DROP, INDEX, REFERENCES ON `nilesbio_shadow`.* TO 'app'@'%';

5. To remove, stop, or make other changes to the Docker container, click on the Container icon in the left pane of Visual Studio Code.

## Prisma

This project uses Prisma for database management. Prisma must be properly installed and configured on your machine to contribute database-bound tasks. 

Installation instructions
[MUSTAFA SCRUM-77 HERE]

Usage
Before using Prisma, please set up Docker and the nilesbio database properly or some functionalities of Prisma will not work properly.

1. Whenever schema.prisma file is modified, if the client was never generated, if development shifts to prod, or if dependencies are installed (such as npm install), enter the following command into the terminal to generate or update the Prisma client:
  - npx prisma generate

2. During the development phase, when changing the schema.prisma file, you must track the schema changes by running the following command into the terminal:
  - npx prisma migrate dev 
  or 
  - npx prisma migrate dev -n <schema change purpose>

## SCRUM-59-Navigation-&-Routing-Links

This change implements navigation links in the header and simple route stubs so users can move between pages without full page reloads.

Created links for the following pages:

- `/catalog` — Catalog stub
- `/login` - Login stub
- `/about` — About stub

- Utilized Next.js App Router to create directories to seperate and categorize individual pages
  - `app/catalog/page.tsx`
  - `app/login/page.tsx`
  - `app/about/page.tsx`
- Client side routing using `next/link`
- Active link state can be identified with `aria-current="page"`
- No 404 page errors

- Manual verification checklist
- Visit the below pages to verify rendering routes:
  - `/catalog`
  - `/login`
  - `/about`

- Client-side navigation:
  - Open DevTools to Network to filter type:document.
  - Click Catalog, About, Login/Account in the header.
  - No new document requests should display 'fetch'
- Active link state:
  - The current link is visibly different (underline/bold).
  - In DevTools → Elements, the active <a> has aria-current="page".
- Keyboard accessibility:
  - Press Tab to move and highlight each button link.

## SCRUM-60-CTA-to-Catalog-Browse-Products-

The call-to-action (CTA) button navigates to the '/catalog' web page utilizing Next.js Links to not require full-page loads.

- Visibility
   - The CTA is properly colored to contrast with the white background, though the background will likely change in the future. 
   - The "Browse Products" text contrasts the button color for readability.
   - The focus outline contrasts with the white background.

- Navigation behavior
   - The button properly navigates to the '/catalog' page.

- Keyboard access
   - The button is accessible with Tab selection.
      - On selectiom, the button generates a focused outline.

- Mobile view
   - The page was tested on a smartphone and the button does not appear to clip through any headers, footers, or other content.

## SCRUM-62-Performance-&-Health-Checks

This change

- Adds app/api/health/route.ts returning {status, version, uptimeSeconds, timestamp}
  - Check via http://localhost:3000/api/health
- Set Cache-Control: no-store on /api/health
- Injects APP_VERSION from env or Git SHA at build (package.json script)
- Adds npm lighthouse scripts: lh:local, lh:preview
- Documents how to run Lighthouse and where artifacts live
- Recorded Core Web Vitals (LCP, CLS, INP) in README

- /api/health
  - get `/api/health` -> `200` JSON with:
  - `status: "ok"`, `version` (from `APP_VERSION` env), `uptimeSeconds`, `timestamp`.
- Cache Control is `Cache-Control: no-store`.
- Dev version is set to `.env.local` → `APP_VERSION=dev`.
- Running the following command in terminal `npm run build` injects current Git SHA.

- Lighthouse (required to to lighthouse audit), creates readable html file with statistics
- For local keep `npm run dev` running, then `npm run lh:local` -> `docs/lighthouse/local-desktop.html`
- For Preview, make sure `npm run lh:preview` script has correct URL -> `docs/lighthouse/preview-desktop.html`
  - NOTE: Preview will work only after commited to main and deployed
- Can open rendered html for readable results

- Vitals recieved from lighthouse audit
- Local - Perf: 98% | LCP: 1.10s | CLS: 0.0 | INP: 65ms | 10/18/25
- Local - Perf: 99% | Accessibility: 96% | Best Practices: 100% | SEO: 100% | 10/19/25

Additional Notes:

- Do not commit large Lighthouse reports; attach to PR or store as CI artifacts.
  - 'local-desktop.html' or 'preview-desktop.html'

## SCRUM-65-Done-Definition-&-Documentation

Documents relating to Definition of Done and logging were created in a Google Drive folder and shared with team members. 

The DoD Documents folder has the following structure: 

 - Documentation (Folder): Contains the following: 
    - Accessibility Notes (File): A chart template for logging notes about accessibility features 
    - Alternative Dispute Resolutions (File): A chart template for logging any major tech decisions 
    - API Samples (File): A chart template for logging API samples 
    - Lighthouse Results (File): A chart template for logging Lighthouse results 

 - Definition of Done (File): Contains steps and checklists for: 
    - What to do for every JIRA task 
    - A checklist for build, test, deploy, and review completion 
    - A Pull Request template 

 - README (File): Contains steps for: 
    - Local setup (Done) 
    - Environment variables (TBD) 
    - Database connection (TBD) 
    - Vercel deploy steps (TBD) 

## SCRUM-78-Docker-Desktop-for-Local-MySQL-and-Prisma-Integration

Creating configured Prisma files so everyone works with the same files. Providing instructions on how to setup Docker and Prisma as well as how to use them during the current development phase.

1. Added files to configure Prisma and to initialize migration

2. Provided documentation in the README:
  - Docker installation and usage
  - Prisma installation and usage


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## SCRUM-75-Implement-Catalog-Grid-Layout

 Catelog Grid provides a layout for how indivdiual item cards are presented on the Catalog Page.

 - All cards are identical and consistent
 - The page automatically adjusts for different screen sizes for desktop and mobile screen.
    - The screen resizes from 4 -> 3 -> 2 -> 1
 - Images are resized and not clipped when resizing
 - No 404 and performance errors


Columns
 - Mobile: 1 column 
 - Tablet: 2 columns
 - Desktop: 3 – 4 columns 
 - Uses CSS Grid with grid-template-columns and repeat() to scale automatically.

Spacing
 - Consistent gutters between cards 
 - Outer padding for page edges 
 - Equal spacing between rows 

Card Sizing
 - Cards have equal width within a row Height grows with content
 - Prevents overlap or clipping
 
Overflow 
 - Handling Text wraps normally
 - Images scale so it fits within cards

Accessibility & Focus
 - Outline remains visible and accessible 
 - Maintains readable color contrast 

Performance 
 - Renders only fields required for the grid view

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
