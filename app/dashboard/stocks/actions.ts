// actions for stocks (Prisma)
'use server';

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateStockSchema } from "@/models/mvc";
import { z } from "zod";

/**
 * @description Fonction utilitaire pour calculer le stock selon la méthode du Coût Moyen Pondéré (CMP)
 * @param depotId - L'ID du dépôt
 * @param produitId - L'ID du produit
 * @param typeOperation - Le type d'opération (ENTREE ou SORTIE)
 * @param quantite - La quantité de l'opération
 * @param prixUnitaire - Le prix unitaire de l'opération
 * @returns Un objet contenant les informations de calcul
 */
async function calculateCMP(
  depotId: string | null | undefined,
  produitId: string,
  typeOperation: 'ENTREE' | 'SORTIE',
  quantite: number,
  prixUnitaire: number | null | undefined
) {
  if (!depotId) {
    throw new Error("Un dépôt est requis pour le calcul du stock");
  }

  // Récupérer tous les mouvements de stock précédents pour ce dépôt et ce produit
  const stocksPrecedents = await prisma.stock.findMany({
    where: {
      depotId: depotId,
      produitId: produitId,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Initialiser les valeurs du stock actuel
  let stockQuantite = 0;
  let stockValeur = 0;
  let stockPrixUnitaire: number | null = null;

  // Calculer le stock actuel en parcourant tous les mouvements précédents
  for (const stock of stocksPrecedents) {
    if (stock.type === 'ENTREE') {
      stockQuantite += stock.quantite;
      if (stock.prixUnitaireAchat != null) {
        stockValeur += stock.quantite * stock.prixUnitaireAchat;
      }
    } else if (stock.type === 'SORTIE') {
      // Pour les sorties, on utilise le prix unitaire du stock actuel avant la sortie
      if (stockQuantite > 0) {
        const prixMoyenAvantSortie = stockValeur / stockQuantite;
        stockValeur -= stock.quantite * prixMoyenAvantSortie;
      }
      stockQuantite -= stock.quantite;
    }

    // Mettre à jour le prix moyen pondéré
    stockPrixUnitaire = stockQuantite > 0 ? stockValeur / stockQuantite : null;
  }

  // Calculer les valeurs pour la nouvelle opération
  if (typeOperation === 'ENTREE') {
    // Pour une entrée, utiliser le prix unitaire fourni
    const nouvelleQuantite = stockQuantite + quantite;
    const nouvelleValeur = stockValeur + (prixUnitaire != null ? quantite * prixUnitaire : 0);
    const nouveauPrixUnitaire = nouvelleQuantite > 0 ? nouvelleValeur / nouvelleQuantite : null;

    return {
      operationQuantite: quantite,
      operationPrixUnitaire: prixUnitaire,
      operationValeur: prixUnitaire != null ? quantite * prixUnitaire : 0,
      stockQuantiteFinal: nouvelleQuantite,
      stockValeurFinal: nouvelleValeur,
      stockPrixUnitaireFinal: nouveauPrixUnitaire,
    };
  } else if (typeOperation === 'SORTIE') {
    // Pour une sortie, utiliser le prix unitaire du stock actuel
    if (stockQuantite <= 0 || stockPrixUnitaire == null) {
      throw new Error("Stock insuffisant pour effectuer cette sortie");
    }
    
    const nouvelleQuantite = stockQuantite - quantite;
    if (nouvelleQuantite < 0) {
      throw new Error("Quantité en stock insuffisante");
    }

    const valeurSortie = quantite * stockPrixUnitaire;
    const nouvelleValeur = stockValeur - valeurSortie;
    const nouveauPrixUnitaire = nouvelleQuantite > 0 ? nouvelleValeur / nouvelleQuantite : null;

    return {
      operationQuantite: quantite,
      operationPrixUnitaire: stockPrixUnitaire,
      operationValeur: valeurSortie,
      stockQuantiteFinal: nouvelleQuantite,
      stockValeurFinal: nouvelleValeur,
      stockPrixUnitaireFinal: nouveauPrixUnitaire,
    };
  }

  throw new Error("Type d'opération invalide");
}

/**
 * @description Recalcule tous les champs CMP pour un dépôt/produit donné
 * Cette fonction est appelée après une suppression ou modification pour corriger tous les mouvements suivants
 * @param depotId - L'ID du dépôt
 * @param produitId - L'ID du produit
 */
async function recalculateAllCMP(depotId: string | null | undefined, produitId: string) {
  if (!depotId) {
    return; // Pas de recalcul si pas de dépôt
  }

  // Récupérer tous les mouvements pour ce dépôt et produit
  const allMovements = await prisma.stock.findMany({
    where: {
      depotId: depotId,
      produitId: produitId,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Variables pour suivre l'état du stock au fil des mouvements
  let stockQuantite = 0;
  let stockValeur = 0;
  let stockPrixUnitaire: number | null = null;

  // Parcourir chaque mouvement et mettre à jour ses champs CMP
  for (const movement of allMovements) {
    if (movement.type === 'ENTREE') {
      // Entrée : ajouter quantité et valeur
      const valeurEntree = movement.prixUnitaireAchat != null 
        ? movement.quantite * movement.prixUnitaireAchat 
        : 0;
      
      stockQuantite += movement.quantite;
      stockValeur += valeurEntree;
      stockPrixUnitaire = stockQuantite > 0 ? stockValeur / stockQuantite : null;

      // Mettre à jour les champs CMP du mouvement
      await prisma.stock.update({
        where: { id: movement.id },
        data: {
          valeurEntree: valeurEntree,
          valeurSortie: null,
          stockQuantiteFinal: stockQuantite,
          stockValeurFinal: stockValeur,
          stockPrixUnitaireFinal: stockPrixUnitaire,
        } as any,
      });
    } else if (movement.type === 'SORTIE') {
      // Sortie : utiliser le prix unitaire du stock actuel
      if (stockQuantite > 0 && stockPrixUnitaire != null) {
        const valeurSortie = movement.quantite * stockPrixUnitaire;
        stockQuantite -= movement.quantite;
        stockValeur -= valeurSortie;
        stockPrixUnitaire = stockQuantite > 0 ? stockValeur / stockQuantite : null;

        // Mettre à jour les champs CMP du mouvement
        await prisma.stock.update({
          where: { id: movement.id },
          data: {
            valeurEntree: null,
            valeurSortie: valeurSortie,
            prixUnitaireAchat: stockPrixUnitaire, // Pour les sorties, utiliser le CMP du stock
            stockQuantiteFinal: stockQuantite,
            stockValeurFinal: stockValeur,
            stockPrixUnitaireFinal: stockPrixUnitaire,
          } as any,
        });
      }
    }
  }
}

/**
 * @description Creates a new stock in the database.
 * @param parsedInput - The validated input data for the new stock.
 * @returns An object indicating success with the created stock, or failure with an error message.
 */
export const createAction = actionClient
  .schema(CreateStockSchema)
  .action(async ({ parsedInput }) => {
    
    
    try {
      // Calculer le CMP si un dépôt est fourni
      let cmpHint = null;
      if (parsedInput.depotId) {
        try {
          cmpHint = await calculateCMP(
            parsedInput.depotId,
            parsedInput.produitId,
            parsedInput.type,
            parsedInput.quantite,
            parsedInput.type === 'ENTREE' ? parsedInput.prixUnitaireAchat : null
          );
        
        } catch (error) {
          console.error('Erreur dans le calcul CMP:', error);
          const errorMessage = error instanceof Error ? error.message : 'Erreur dans le calcul du stock';
          return { failure: errorMessage };
        }
      }

      // Préparer les données avec gestion des valeurs optionnelles
      const stockData = {
        date: parsedInput.date,
        reference: parsedInput.reference,
        depotId: parsedInput.depotId || null,
        type: parsedInput.type as any,
        fournisseurId: parsedInput.fournisseurId || null,
        clientId: parsedInput.clientId || null,
        produitId: parsedInput.produitId,
        quantite: parsedInput.quantite,
        prixUnitaireVente: null, // Non utilisé dans le système de stock
        prixUnitaireAchat: parsedInput.type === 'ENTREE' ? parsedInput.prixUnitaireAchat : (cmpHint?.operationPrixUnitaire ?? null),
        unite: parsedInput.unite as any,
        devise: parsedInput.devise as any,
        seuilMinimum: parsedInput.seuilMinimum,
        accountId: (parsedInput as any).user ?? (await prisma.account.findFirst({ select: { id: true } }))?.id ?? undefined,
        // Champs calculés CMP
        valeurEntree: parsedInput.type === 'ENTREE' ? (cmpHint?.operationValeur ?? null) : null,
        valeurSortie: parsedInput.type === 'SORTIE' ? (cmpHint?.operationValeur ?? null) : null,
        stockQuantiteFinal: cmpHint?.stockQuantiteFinal ?? null,
        stockPrixUnitaireFinal: cmpHint?.stockPrixUnitaireFinal ?? null,
        stockValeurFinal: cmpHint?.stockValeurFinal ?? null,
      };
      
     
      const result = await prisma.stock.create({ data: stockData as any });
      
      revalidatePath("/dashboard/stocks");
      
      // Retourner aussi les informations CMP pour affichage
      return { success: { ...result, cmpHint } };
    } catch (error) {
      console.error('Erreur générale dans createAction:', error);
      if (error instanceof z.ZodError) {
        console.error('Erreur de validation Zod:', error);
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Finds a stock by their unique ID.
 * @param id - The ID of the stock to find.
 * @returns An object indicating success with the found stock, or failure if not found or an error occurs.
 */
export async function findByIdAction(id: string) {
  try {
    if (!id) {
      throw new Error("L'ID du stock est manquant.");
    }
    const result = await prisma.stock.findUnique({ 
      where: { id },
      include: {
        depot: { select: { id: true, name: true, type: true } },
        produit: { select: { id: true, name: true, unit: true } },
        fournisseur: { select: { id: true, nom: true } },
        client: { select: { id: true, name: true } },
      },
    });
    if (!result) {
      return { success: false, failure: "Stock non trouvé." };
    }
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Retrieves all stocks from the database.
 * @returns An object indicating success with the list of stocks, or failure if an error occurs.
 */
export const findAllAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.stock.findMany({ orderBy: { createdAt: 'desc' } });
      return { success: true, result };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

/**
 * @description Updates an existing stock in the database.
 * ⚠️ ATTENTION: La modification d'un mouvement de stock affecte tous les calculs CMP suivants.
 * Il est recommandé de supprimer et recréer plutôt que de modifier.
 * @param parsedInput - The validated input data for updating the stock, including its ID.
 * @returns An object indicating success with the updated stock, or failure with an error message.
 */
export const updateAction = actionClient
  .schema(CreateStockSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    try {
      // Récupérer le mouvement avant modification pour connaître le dépôt et produit
      const existingStock = await prisma.stock.findUnique({ where: { id: parsedInput.id } });
      if (!existingStock) {
        return { failure: "Mouvement de stock non trouvé" };
      }

      const { id, ...updateData } = parsedInput; // Destructurer pour exclure l'ID
      
      // Mettre à jour le mouvement
      const result = await prisma.stock.update({ where: { id }, data: updateData as any });
      
      // Recalculer tous les CMP pour ce dépôt/produit (y compris le mouvement modifié et tous les suivants)
      await recalculateAllCMP(existingStock.depotId, existingStock.produitId);
      
      revalidatePath("/dashboard/stocks");
      revalidatePath(`/dashboard/stocks/${id}`);
      revalidatePath(`/dashboard/stocks/views/${id}`);
      
      return { success: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Deletes a stock by their unique ID.
 * @param id - The ID of the stock to delete.
 * @returns An object indicating success with a message, or failure if an error occurs.
 */
export async function removeByIdAction(id: string) {
  try {
    if (!id) {
      throw new Error("L'ID du stock est manquant pour la suppression.");
    }
    
    // Récupérer le mouvement avant suppression pour connaître le dépôt et produit
    const existingStock = await prisma.stock.findUnique({ where: { id } });
    if (!existingStock) {
      return { success: false, failure: "Mouvement de stock non trouvé" };
    }

    const depotId = existingStock.depotId;
    const produitId = existingStock.produitId;
    
    // Supprimer le mouvement
    await prisma.stock.delete({ where: { id } });
    
    // Recalculer tous les CMP pour ce dépôt/produit (tous les mouvements suivants)
    await recalculateAllCMP(depotId, produitId);
    
    revalidatePath("/dashboard/stocks");
    
    return { success: true, message: "Stock supprimé avec succès." };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Supprime un stock par son ID via actionClient (pour compatibilité avec delete dialog).
 */
export const deleteStock = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Récupérer le mouvement avant suppression
      const existingStock = await prisma.stock.findUnique({ where: { id } });
      if (!existingStock) {
        return { failure: "Mouvement de stock non trouvé" };
      }

      const depotId = existingStock.depotId;
      const produitId = existingStock.produitId;
      
      // Supprimer le mouvement
      await prisma.stock.delete({ where: { id } });
      
      // Recalculer tous les CMP
      await recalculateAllCMP(depotId, produitId);
      
      revalidatePath("/dashboard/stocks");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du stock:", error);
      return { failure: "Impossible de supprimer le mouvement de stock." };
    }
  });
