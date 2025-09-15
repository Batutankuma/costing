# Module Prix Non-Minier

Ce module gère les structures de prix officielles pour le secteur non-minier, basé sur le tableau de structure de prix PMF commercial.

## Structure du Module

```
non-mining-prices/
├── page.tsx                    # Page principale avec liste des structures
├── actions.ts                  # Actions serveur (CRUD)
├── columns.tsx                 # Définition des colonnes du tableau
├── data-table.tsx             # Composant tableau de données
├── delete.tsx                 # Composant de suppression
├── create/
│   ├── page.tsx               # Page de création
│   └── non-mining-price-create-form.tsx
├── [id]/
│   ├── page.tsx               # Page de modification
│   └── non-mining-price-edit-form.tsx
└── views/
    ├── [id]/
    │   ├── page.tsx           # Page de visualisation
    │   └── non-mining-price-view.tsx
    └── export-buttons.tsx     # Boutons d'export
```

## Fonctionnalités

### 1. Gestion des Structures de Prix
- **Création** : Formulaire complet avec tous les champs du tableau PMF commercial
- **Modification** : Édition des structures existantes
- **Visualisation** : Affichage détaillé avec calculs automatiques
- **Suppression** : Suppression avec confirmation

### 2. Structure des Données

#### Informations Générales
- Nom de la structure
- Description
- Zone géographique (SUD, NORD, EST, OUEST)
- PMF Commercial (CDF et USD)

#### Frais de Distribution
- Ogefrem
- Frais & services Socir
- Charges d'exploitation SEP, St.Sécurité et Stratégie
- Charges capacités additionnelles SPSA
- Lerexcom Petroleum
- Charges d'exploitation Soc Com
- Marges Soc, Com

#### Stock de Sécurité
- Stock Sécurité EST
- Stock Sécurité SUD

#### Parafiscalité
- FONER
- PMF Fiscal

#### Fiscalité
- TVA à la vente
- Droit de Douane
- Droits de consommation
- TVA à l'importation
- TVA nette à l'intérieur

### 3. Calculs Automatiques

Le système calcule automatiquement :
- Total frais de Distribution
- Total Stock Sécurité
- Total Fiscalité 1
- Total Fiscalité 2
- Prix de référence (CDF/M3 et USD/M3)
- Prix à appliquer (unités plus petites)

### 4. Interface Utilisateur

- **Tableau principal** : Liste avec tri, filtrage et pagination
- **Formulaires** : Validation en temps réel avec Zod
- **Visualisation** : Affichage structuré par sections
- **Actions** : Boutons d'action contextuels (voir, modifier, supprimer)

## Utilisation

1. **Accéder au module** : `/dashboard/non-mining-prices`
2. **Créer une structure** : Cliquer sur "Nouvelle Structure"
3. **Modifier** : Cliquer sur l'icône d'édition dans le tableau
4. **Visualiser** : Cliquer sur l'icône d'œil dans le tableau
5. **Supprimer** : Utiliser le bouton de suppression avec confirmation

## Base de Données

Le module utilise les modèles Prisma suivants :
- `NonMiningPriceStructure` : Structure principale
- `NonMiningDistributionCosts` : Frais de distribution
- `NonMiningSecurityStock` : Stock de sécurité
- `NonMiningParafiscality` : Parafiscalité
- `NonMiningFiscality` : Fiscalité
- `NonMiningFinalPricing` : Prix finaux

## Validation

Tous les formulaires utilisent la validation Zod avec les schémas définis dans `models/mvc.pruned.ts` :
- `CreateNonMiningPriceStructureSchema`
- `UpdateNonMiningPriceStructureSchema`
- Schémas pour chaque section (distribution, sécurité, parafiscalité, fiscalité)
