import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const prices = await prisma.nonMiningPriceStructure.findMany({
      include: {
        exchangeRate: true,
        fiscality: true,
        parafiscality: true,
        distributionCosts: true,
        securityStock: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return new Response(JSON.stringify(prices), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify([]), { status: 200 });
  }
}


