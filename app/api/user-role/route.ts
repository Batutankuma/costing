import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return new Response(JSON.stringify({ error: "email requis" }), { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return new Response(JSON.stringify({ error: "introuvable" }), { status: 404 });
    return new Response(JSON.stringify({ role: user.role }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (e) {
    const error = e instanceof Error ? e.message : "server error";
    return new Response(JSON.stringify({ error }), { status: 500 });
  }
}











