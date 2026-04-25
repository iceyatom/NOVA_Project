import LoginSignIn from "../components/LoginSignIn";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (token) {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        account: {
          select: {
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    if (
      session &&
      session.expiresAt > new Date() &&
      session.account &&
      !session.account.deletedAt &&
      session.account.status.toLowerCase() === "active"
    ) {
      redirect("/account");
    }
  }

  return (
    <div className="loginPage">
      <LoginSignIn />
    </div>
  );
}
