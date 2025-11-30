# Module Cost Build Up Non-Minier

Ce module permet de gérer les structures de coûts (Cost Build Up) pour les produits non-miniers, basé sur le tableau de structure des coûts fourni.

## Fonctionnalités

### 1. Création de Cost Build Up
- **Formulaire complet** basé sur la structure du tableau fourni
- **Calculs automatiques** en temps réel
- **Sélection de structure non-minier** (optionnel)
- **Validation des données** avec Zod

### 2. Structure des Coûts

#### 1. Coûts de Base du Produit & Transport Initial
- Platt's or FOB (USD)
- Transport (camion) (USD)
- Brut C&F (calculé automatiquement)
- Agency/Trade Sce/Customs (USD)
- **Prix de revient** (calculé automatiquement)

#### 2. Coûts et Marge du Fournisseur pour l'Offre DDU
- Frais stockage/hospitality (USD)
- ANR-Déchargement-OCC-Hydrocarbures (USD)
- Marge du Fournisseur (USD)
- **Prix de vente DDU** (calculé automatiquement)

#### 3. Coûts Collectés par la Douane
- CUSTOMS DUTIES / Droit de douane (USD)
- VAT import (USD)
- VAT interne (USD)
- Droit de consommation (USD)
- **Total Droits Douaniers & TVA** (calculé automatiquement)

#### 4. Redevances (Levies)
- ROAD FUND (FONER) (USD)
- Stock de sécur SUD / Marquage moléculaire (USD)
- Effort de reconstruction & Stock Stratégique (USD)
- Intervention Économique & Autres (USD)
- **Total Redevances** (calculé automatiquement)

#### 5. Coûts de Transport Additionnels
- Freight to Mine from L'shi (USD)
- Pertes (300 litres/camion) (USD)
- **Total Frais de transport finaux** (calculé automatiquement)

#### 6. Prix Final
- **Prix de vente DDP (Delivered Duty Paid)** (calculé automatiquement)

### 3. Gestion des Données
- **Liste** avec tableau de données
- **Visualisation** détaillée
- **Modification** des informations de base
- **Suppression** avec confirmation

### 4. Intégration
- **Liaison avec les structures non-minier** existantes
- **Calculs automatiques** basés sur les taux de change
- **Interface cohérente** avec le reste de l'application

## Fichiers du Module

```
app/dashboard/non-mining-builders/
├── actions.ts                           # Actions serveur (CRUD)
├── data-table.tsx                       # Tableau de données
├── delete.tsx                          # Composant de suppression
├── page.tsx                            # Page principale
├── create/
│   ├── page.tsx                        # Page de création
│   └── non-mining-builder-create-form.tsx  # Formulaire de création
├── views/
│   └── [id]/
│       ├── page.tsx                    # Page de visualisation
│       └── non-mining-builder-view.tsx # Composant de visualisation
└── [id]/
    ├── page.tsx                        # Page d'édition
    └── non-mining-builder-edit-form.tsx # Formulaire d'édition
```

## Utilisation

1. **Accéder au module** : `/dashboard/non-mining-builders`
2. **Créer un nouveau cost build up** : Cliquer sur "Nouveau Cost Build Up"
3. **Remplir le formulaire** : Saisir les coûts dans chaque section
4. **Vérifier les calculs** : Les totaux sont calculés automatiquement
5. **Sauvegarder** : Le cost build up est créé avec tous les calculs

## Calculs Automatiques

Le module effectue automatiquement les calculs suivants :

1. **Brut C&F** = Platt's FOB + Transport camion
2. **Prix de revient** = Brut C&F + Agency/Customs
3. **Prix DDU** = Prix de revient + Frais fournisseur + Marge fournisseur
4. **Total Douanes** = Somme de tous les droits et taxes
5. **Total Redevances** = Somme de toutes les redevances
6. **Total Transport** = Freight + Pertes
7. **Prix DDP Final** = Prix DDU + Douanes + Redevances + Transport

## Navigation

Le module est accessible via le sidebar sous "Builder Non-Minier" et s'intègre parfaitement avec le système de navigation existant.
