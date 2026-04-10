import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
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

    return NextResponse.json({
      success: true,
      result: user.userModules.map(um => ({ 
        moduleId: um.moduleId,
        module: um.module,
      })),
      userName: user.name,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des modules:", error);
    return NextResponse.json(
      { success: false, failure: "Erreur serveur" },
      { status: 500 }
    );
  }
}
