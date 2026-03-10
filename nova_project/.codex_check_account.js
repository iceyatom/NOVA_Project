const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@nilesbio.com";
  const account = await prisma.account.findUnique({
    where: { email },
    select: {
      email: true,
      status: true,
      deletedAt: true,
      lastLoginAt: true,
      passwordHash: true,
    },
  });

  if (!account) {
    console.log(JSON.stringify({ missing: true }));
    return;
  }

  console.log(
    JSON.stringify({
      email: account.email,
      status: account.status,
      deletedAt: account.deletedAt,
      lastLoginAt: account.lastLoginAt,
      passwordHashPreview: String(account.passwordHash).slice(0, 12),
      passwordHashLength: String(account.passwordHash).length,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
