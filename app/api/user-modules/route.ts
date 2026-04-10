import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    
    if (!email) {
      return NextResponse.json(
        { success: false, failure: "Email requis" },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        userModules: {
          include: {
            module: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, failure: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Si admin, retourner tous les types de modules
    if (user.role === "ADMIN") {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        moduleTypes: ["FINANCE", "CRM", "DEPOT_AUTRES", "DEPOT_KALEMIE", "DEPOT_LUBUMBASHI", "DEPOT_KINSHASA", "OPERATION"],
      });
    }

    // Sinon, retourner les types de modules attribués
    const moduleTypes = user.userModules
      .map(um => um.module?.type)
      .filter((type): type is NonNullable<typeof type> => type != null);

    return NextResponse.json({
      success: true,
      isAdmin: false,
      moduleTypes,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des modules:", error);
    return NextResponse.json(
      { success: false, failure: "Erreur serveur" },
      { status: 500 }
    );
  }
}
