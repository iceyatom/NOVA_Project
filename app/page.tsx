import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient"; // relative import; alias also fine
export const runtime = "nodejs";

export default async function Page() {
  const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
  return <HomeClient users={users} />;
}
