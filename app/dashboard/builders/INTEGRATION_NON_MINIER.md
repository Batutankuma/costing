# Intégration Structures Non-Minier dans les Builders

## 🎯 **Objectif**

Permettre la sélection des structures de prix non-minier lors de la création d'un builder (constructeur de coûts), en plus des structures minier existantes.

## ✅ **Modifications Apportées**

### 1. **Schéma Prisma**

#### **Modèle CostBuildUp**
```prisma
model CostBuildUp {
  // ... champs existants ...
  priceReferenceId String?
  priceReference   PriceReference? @relation(fields: [priceReferenceId], references: [id])

  // NOUVEAU : Relation avec les structures non-minier
  nonMiningPriceStructureId String?
  nonMiningPriceStructure   NonMiningPriceStructure? @relation(fields: [nonMiningPriceStructureId], references: [id])
  
  // ... autres champs ...
}
```

#### **Modèle NonMiningPriceStructure**
```prisma
model NonMiningPriceStructure {
  // ... champs existants ...
  
  // NOUVEAU : Relation avec les builders
  costBuildUps CostBuildUp[]
  
  // ... autres champs ...
}
```

#### **Modèle ExchangeRate**
```prisma
model ExchangeRate {
  // ... champs existants ...
  priceReferences PriceReference[]
  
  // NOUVEAU : Relation avec les structures non-minier
  nonMiningPriceStructures NonMiningPriceStructure[]
}
```

### 2. **Schéma MVC**

#### **CreateCostBuildUpSchema**
```typescript
export const CreateCostBuildUpSchema = z.object({
  title: z.string().min(1),
  unit: z.enum(["USD_M3", "USD_LITRE"]).default("USD_M3"),
  userId: z.string().min(1),
  priceReferenceId: z.string().optional().nullable(),
  nonMiningPriceStructureId: z.string().optional().nullable(), // NOUVEAU
  // ... autres champs ...
});
```

### 3. **Interface Utilisateur**

#### **Sélection des Structures**
```typescript
// Deux sélecteurs distincts
<div className="grid md:grid-cols-2 gap-4">
  <div>
    <Label>Structure officielle (PriceReference) - Minier</Label>
    <select value={selectedRefId} onChange={handleMiningSelection}>
      <option value="">— Sélectionner structure minier —</option>
      {refs.map((r) => (
        <option key={r.id} value={r.id}>
          {r.nomStructure} — {new Date(r.date).toLocaleDateString()}
        </option>
      ))}
    </select>
  </div>
  <div>
    <Label>Structure officielle (Non-Minier)</Label>
    <select value={selectedNonMiningId} onChange={handleNonMiningSelection}>
      <option value="">— Sélectionner structure non-minier —</option>
      {nonMiningPrices.map((r) => (
        <option key={r.id} value={r.id}>
          {r.nomStructure} — {r.cardinale} — {new Date(r.createdAt).toLocaleDateString()}
        </option>
      ))}
    </select>
  </div>
</div>
```

#### **Logique de Sélection Mutuellement Exclusive**
```typescript
// Sélection minier
onChange={(e) => {
  const id = e.target.value;
  setSelectedRefId(id);
  setSelectedNonMiningId(""); // Réinitialiser l'autre sélection
  setValue("priceReferenceId", id);
  setValue("nonMiningPriceStructureId", null);
  const found = refs.find((r) => r.id === id);
  applyFromPriceRef(found);
}}

// Sélection non-minier
onChange={(e) => {
  const id = e.target.value;
  setSelectedNonMiningId(id);
  setSelectedRefId(""); // Réinitialiser l'autre sélection
  setValue("nonMiningPriceStructureId", id);
  setValue("priceReferenceId", null);
  const found = nonMiningPrices.find((r) => r.id === id);
  applyFromNonMiningPrice(found);
}}
```

### 4. **Application des Données**

#### **Fonction pour Structures Minier (existante)**
```typescript
const applyFromPriceRef = React.useCallback((refItem: any) => {
  // Applique les données des structures minier
  // Customs, Levies, etc.
}, [round1, setValue]);
```

#### **Fonction pour Structures Non-Minier (nouvelle)**
```typescript
const applyFromNonMiningPrice = React.useCallback((nonMiningItem: any) => {
  const rate = nonMiningItem?.exchangeRate?.rate ?? 2500;
  const toUSD = (v?: number | null) => (typeof v === "number" && rate > 0 ? v / rate : undefined);
  
  // Customs from fiscality
  const cd = round1(toUSD(nonMiningItem?.fiscality?.customsDuty ?? undefined));
  const iv = round1(toUSD(nonMiningItem?.fiscality?.importVAT ?? undefined));
  setValue("customs.customsDutyUSD", cd as any);
  setValue("customs.importVATUSD", iv as any);
  
  // Levies from parafiscality
  setValue("levies.fonerUSD", round1(toUSD(nonMiningItem?.parafiscality?.foner)) as any);
  
  // Stock de sécurité (EST + SUD)
  const estStock = nonMiningItem?.securityStock?.estStock ?? 0;
  const sudStock = nonMiningItem?.securityStock?.sudStock ?? 0;
  const totalStock = round1(toUSD(estStock + sudStock) ?? 0);
  setValue("levies.molecularMarkingOrStockUSD", totalStock as any);
  
  // PMF Fiscal (peut être négatif)
  const pmfFiscal = nonMiningItem?.parafiscality?.pmfFiscal ?? 0;
  setValue("levies.reconstructionStrategicUSD", round1(toUSD(pmfFiscal)) as any);
  
  // Pas d'intervention économique pour non-minier
  setValue("levies.economicInterventionUSD", 0 as any);
}, [round1, setValue]);
```

### 5. **Actions Backend**

#### **Création de Builder**
```typescript
export const createBuilder = actionClient
  .schema(CreateCostBuildUpSchema)
  .action(async ({ parsedInput }) => {
    const data = parsedInput;
    const created = await prisma.costBuildUp.create({
      data: {
        // ... autres champs ...
        priceReferenceId: data.priceReferenceId ?? null,
        nonMiningPriceStructureId: data.nonMiningPriceStructureId ?? null, // NOUVEAU
        // ... autres champs ...
      },
    });
    return { success: created };
  });
```

#### **Liste des Builders**
```typescript
export const listBuilders = actionClient
  .schema(z.void())
  .action(async () => {
    const items = await prisma.costBuildUp.findMany({
      include: { 
        // ... autres relations ...
        priceReference: true, 
        nonMiningPriceStructure: true // NOUVEAU
      },
      orderBy: { date: "desc" },
    });
    return { success: true, result: items };
  });
```

## 🚀 **Fonctionnalités**

### **Sélection Mutuellement Exclusive**
- ✅ **Un seul type** : Minier OU Non-minier, pas les deux
- ✅ **Réinitialisation** : Sélectionner l'un désélectionne l'autre
- ✅ **Interface claire** : Labels distincts pour chaque type

### **Application Automatique des Données**
- ✅ **Structures minier** : Applique les données existantes
- ✅ **Structures non-minier** : Applique les nouvelles données
- ✅ **Conversion USD** : Taux de change approprié pour chaque type
- ✅ **Mapping intelligent** : Adaptation des champs selon le type

### **Mapping des Champs Non-Minier**
- ✅ **Customs** : `customsDuty`, `importVAT` depuis `fiscality`
- ✅ **FONER** : Depuis `parafiscality.foner`
- ✅ **Stock Sécurité** : `estStock + sudStock` → `molecularMarkingOrStockUSD`
- ✅ **PMF Fiscal** : `parafiscality.pmfFiscal` → `reconstructionStrategicUSD`
- ✅ **Intervention** : Toujours 0 pour non-minier

## 📊 **Workflow Utilisateur**

### 1. **Création d'un Builder**
```
1. Remplir le titre et l'unité
2. Choisir le type de structure :
   - Structure minier (PriceReference)
   - Structure non-minier (NonMiningPriceStructure)
3. Les données sont appliquées automatiquement
4. Compléter les autres champs
5. Enregistrer
```

### 2. **Sélection de Structure**
```
Structure Minier:
- Nom de la structure + Date
- Ex: "Structure AGS 2024" — 08/01/2024

Structure Non-Minier:
- Nom + Cardinale + Date
- Ex: "Structure SUD" — SUD — 08/01/2024
```

## 🔧 **Avantages**

### **Flexibilité**
- **Deux types de structures** : Minier et non-minier
- **Sélection intuitive** : Interface claire et distincte
- **Données cohérentes** : Application automatique appropriée

### **Réutilisabilité**
- **Structures existantes** : Réutilisation des structures créées
- **Calculs automatiques** : Pas de ressaisie manuelle
- **Cohérence** : Même logique de calcul

### **Maintenabilité**
- **Code modulaire** : Fonctions séparées pour chaque type
- **Schéma cohérent** : Relations Prisma bien définies
- **Validation** : Schémas Zod mis à jour

## 🎯 **Résultat**

Les utilisateurs peuvent maintenant :

1. **Créer un builder** avec une structure minier (comme avant)
2. **Créer un builder** avec une structure non-minier (nouveau)
3. **Voir les données appliquées** automatiquement selon le type choisi
4. **Bénéficier des calculs** appropriés pour chaque type de structure

L'intégration est **transparente** et **rétrocompatible** avec l'existant ! 🎉
