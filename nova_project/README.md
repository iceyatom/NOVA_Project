This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
   - In Powershell:
     - npm install next react react-dom
   - Start the Development Server
   - Run the development server:
     - npm run dev
   - Once it starts, open http://localhost:3000 in your web browser.

6. Stop the Server
   - To stop the local server, press Ctrl + C in the terminal.

## Scripts

1. ESLint
   - npm run lint: runs ESLint to error check project
2. Prettier
   - npm run check: check only formatting to tell you where changes are wanted to be made
   - npm run format: write formatting changes to make all styling consistent
3. Npm dev, build, start
   - npm run dev: build project in dev mode; fast responsiveness when file saves
   - npm run build: builds project with compiling/compressing; must be done before npm run start
   - npm run start: build production form of project optimized for efficiency

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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