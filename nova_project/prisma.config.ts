import { defineConfig } from "prisma/config";
import "dotenv/config";

// Vercel runs `prisma generate` during install before the app can build the
// production IAM-auth datasource URL. Generate only needs a syntactically valid
// MySQL URL; local migrate/seed still use DATABASE_URL and SHADOW_DATABASE_URL
// from .env when they are present.
const generateOnlyDatabaseUrl =
  "mysql://prisma:prisma@127.0.0.1:3306/prisma_generate_placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL ?? generateOnlyDatabaseUrl,
    shadowDatabaseUrl:
      process.env.SHADOW_DATABASE_URL ?? generateOnlyDatabaseUrl,
  },
});
