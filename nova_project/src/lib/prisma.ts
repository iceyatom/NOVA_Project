import { PrismaClient } from "@prisma/client";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

declare global {
  var __prisma__: PrismaClient | undefined;
  var __prismaPromise__: Promise<PrismaClient> | undefined;
  var __productionPrisma__: PrismaClient | undefined;
  var __productionPrismaPromise__: Promise<PrismaClient> | undefined;
  var __productionPrismaExpiresAt__: number | undefined;
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

const PRODUCTION_CLIENT_TTL_MS = 10 * 60 * 1000;

function getDatabaseHost(): string {
  const rawHost = process.env.DB_HOST?.trim() ?? "";
  if (!rawHost) {
    throw new Error("DB_HOST is required.");
  }

  if (/^https?:\/\//i.test(rawHost) || /^mysql:\/\//i.test(rawHost)) {
    return new URL(rawHost).hostname;
  }

  return rawHost.split("/")[0].split(":")[0];
}

function getDatabasePort(): number {
  const rawPort = process.env.DB_PORT?.trim() || "3306";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("DB_PORT must be a valid TCP port.");
  }

  return port;
}

export function hasRdsProxyOidcConfig(): boolean {
  return Boolean(
    process.env.AWS_REGION &&
      process.env.DB_HOST &&
      process.env.DB_USER &&
      process.env.DB_NAME &&
      process.env.AWS_ROLE_ARN,
  );
}

export function hasPrismaConfig(): boolean {
  if (isProductionRuntime()) {
    return hasRdsProxyOidcConfig();
  }

  return Boolean((process.env.DATABASE_URL ?? "").trim());
}

async function createRdsProxyPrismaClient(): Promise<PrismaClient> {
  const hostname = getDatabaseHost();
  const port = getDatabasePort();
  const dbName = encodeURIComponent(process.env.DB_NAME!);
  const signer = new Signer({
    region: process.env.AWS_REGION!,
    hostname,
    port,
    username: process.env.DB_USER!,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
    }),
  });

  const token = await signer.getAuthToken();
  const databaseUrl = `mysql://${encodeURIComponent(
    process.env.DB_USER!,
  )}:${encodeURIComponent(
    token,
  )}@${hostname}:${port}/${dbName}?sslaccept=accept_invalid_certs&connection_limit=1`;

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
    log: ["warn", "error"],
  });
}

export async function getPrisma(): Promise<PrismaClient> {
  // For Vercel production with IAM auth + RDS Proxy, create lazily at request time.
  // This avoids OIDC initialization during `next build`.
  if (isProductionRuntime()) {
    if (!hasRdsProxyOidcConfig()) {
      throw new Error(
        "Production database configuration is missing. Set DB_HOST, DB_USER, DB_NAME, DB_PORT, AWS_REGION, and AWS_ROLE_ARN.",
      );
    }

    const now = Date.now();
    if (
      global.__productionPrisma__ &&
      global.__productionPrismaExpiresAt__ &&
      global.__productionPrismaExpiresAt__ > now
    ) {
      return global.__productionPrisma__;
    }

    if (
      global.__productionPrisma__ &&
      global.__productionPrismaExpiresAt__ &&
      global.__productionPrismaExpiresAt__ <= now
    ) {
      void global.__productionPrisma__.$disconnect();
      global.__productionPrisma__ = undefined;
      global.__productionPrismaPromise__ = undefined;
      global.__productionPrismaExpiresAt__ = undefined;
    }

    if (!global.__productionPrismaPromise__) {
      global.__productionPrismaPromise__ = createRdsProxyPrismaClient().catch(
        (error) => {
          global.__productionPrismaPromise__ = undefined;
          throw error;
        },
      );
    }

    const client = await global.__productionPrismaPromise__;
    global.__productionPrisma__ = client;
    global.__productionPrismaExpiresAt__ = now + PRODUCTION_CLIENT_TTL_MS;
    return client;
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

type LazyPrismaOperation<T = unknown> = PromiseLike<T> & {
  __runWithPrisma(client: PrismaClient): unknown;
};

function isLazyPrismaOperation(value: unknown): value is LazyPrismaOperation {
  return (
    typeof value === "object" &&
    value !== null &&
    "__runWithPrisma" in value &&
    typeof (value as { __runWithPrisma?: unknown }).__runWithPrisma ===
      "function"
  );
}

function createLazyPrismaOperation<T>(
  run: (client: PrismaClient) => PromiseLike<T>,
): LazyPrismaOperation<T> {
  return {
    __runWithPrisma: run,
    then(onFulfilled, onRejected) {
      return getPrisma()
        .then((client) => run(client))
        .then(onFulfilled, onRejected);
    },
  };
}

function createModelProxy(modelName: string) {
  return new Proxy(
    {},
    {
      get(_target, methodName) {
        if (typeof methodName !== "string") {
          return undefined;
        }

        return (...args: unknown[]) =>
          createLazyPrismaOperation((client) => {
            const model = (client as unknown as Record<string, unknown>)[
              modelName
            ] as Record<string, unknown>;
            const method = model[methodName] as (...args: unknown[]) => never;
            return method.apply(model, args);
          });
      },
    },
  );
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    if (property === "$transaction") {
      return async (input: unknown, ...args: unknown[]) => {
        const client = await getPrisma();
        const transaction = client.$transaction.bind(client) as (
          input: unknown,
          ...args: unknown[]
        ) => unknown;

        if (Array.isArray(input)) {
          return transaction(
            input.map((operation) =>
              isLazyPrismaOperation(operation)
                ? operation.__runWithPrisma(client)
                : operation,
            ),
            ...args,
          );
        }

        return transaction(input, ...args);
      };
    }

    if (typeof property !== "string") {
      return undefined;
    }

    if (property.startsWith("$")) {
      return (...args: unknown[]) =>
        createLazyPrismaOperation((client) => {
          const method = (client as unknown as Record<string, unknown>)[
            property
          ] as (...args: unknown[]) => never;
          return method.apply(client, args);
        });
    }

    return createModelProxy(property);
  },
});
