import { NextRequest, NextResponse } from "next/server";
import { getNonMiningPriceById } from "@/app/dashboard/non-mining-prices/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const structure = await getNonMiningPriceById(id);
    
    return NextResponse.json({ success: true, data: structure });
  } catch (error) {
    console.error("Erreur lors de la récupération de la structure:", error);
    return NextResponse.json(
      { success: false, error: "Structure non trouvée" },
      { status: 404 }
    );
  }
}
