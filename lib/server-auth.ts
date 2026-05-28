import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/authx";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "COMMERCIAL";
};

export async function getCurrentUserServer(): Promise<CurrentUser | null> {
  try {
    const requestHeaders = await headers();
    const session = await (auth.api as any).getSession({
      headers: requestHeaders,
    });

    const email = session?.user?.email as string | undefined;
    if (!email) return null;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function requireAdminServer(): Promise<CurrentUser | null> {
  const user = await getCurrentUserServer();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
