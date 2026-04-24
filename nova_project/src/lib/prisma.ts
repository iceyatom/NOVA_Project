import { PrismaClient } from "@prisma/client";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

declare global {
  var __prisma__: PrismaClient | undefined;
  var __prismaPromise__: Promise<PrismaClient> | undefined;
}

function hasRdsProxyOidcConfig(): boolean {
  return Boolean(
    process.env.AWS_REGION &&
      process.env.DB_HOST &&
      process.env.DB_USER &&
      process.env.DB_NAME &&
      process.env.AWS_ROLE_ARN,
  );
}

async function createRdsProxyPrismaClient(): Promise<PrismaClient> {
  const port = Number(process.env.DB_PORT ?? 3306);
  const signer = new Signer({
    region: process.env.AWS_REGION!,
    hostname: process.env.DB_HOST!,
    port,
    username: process.env.DB_USER!,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
    }),
  });

  const token = await signer.getAuthToken();
  const databaseUrl = `mysql://${process.env.DB_USER}:${encodeURIComponent(
    token,
  )}@${process.env.DB_HOST}:${port}/${process.env.DB_NAME}?sslaccept=accept_invalid_certs`;

  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: ["warn", "error"],
  });
}

function createStandardPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: process.env.DATABASE_URL
      ? { db: { url: process.env.DATABASE_URL } }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });
}

export async function getPrisma(): Promise<PrismaClient> {
  // For Vercel production with IAM auth + RDS Proxy, create lazily at request time.
  // This avoids OIDC initialization during `next build`.
  if (process.env.NODE_ENV === "production" && hasRdsProxyOidcConfig()) {
    return createRdsProxyPrismaClient();
  }

  if (global.__prisma__) {
    return global.__prisma__;
  }

  if (!global.__prismaPromise__) {
    global.__prismaPromise__ = Promise.resolve(createStandardPrismaClient());
  }

  const client = await global.__prismaPromise__;
  if (process.env.NODE_ENV !== "production") {
    global.__prisma__ = client;
  }
  return client;
}
