# Module Stock - Gestion des Mouvements d'Inventaire

Ce module gère les mouvements de stock (entrées et sorties) selon la méthode du **Coût Moyen Pondéré (CMP)**.

## ✨ Fonctionnalités

- ✅ Saisie avec virgule décimale (ex: 0,893)
- ✅ Calcul automatique du CMP pour les sorties
- ✅ Affichage du prix CMP avec 4 décimales
- ✅ Suppression du champ prix de vente (non utilisé)
- ✅ Validation automatique du stock disponible

## 📋 Structure du Module

```
stocks/
├── page.tsx                    # Page principale avec liste des mouvements
├── actions.ts                  # Actions serveur (CRUD + CMP)
├── columns.tsx                 # Définition des colonnes du tableau
├── data-table.tsx              # Composant tableau de données
├── delete.tsx                  # Composant de suppression
├── create/
│   ├── page.tsx                # Page de création
│   └── stock-create-form.tsx   # Formulaire de création
├── [id]/
│   └── page.tsx                # Page de modification
└── views/
    └── [id]/
        └── page.tsx            # Page de visualisation
```

## 🧮 Méthode du Coût Moyen Pondéré (CMP)

Le module utilise la méthode du **Coût Moyen Pondéré** pour calculer automatiquement le prix unitaire moyen du stock à chaque mouvement.

### Règles de Calcul

#### 1️⃣ Première Entrée (premier mouvement du dépôt X pour un produit)

**Entrée**
- `quantité` = saisie manuelle (ex: 900,000 L)
- `prix_unitaire` = saisie manuelle (ex: 0.854)
- `valeur` = quantité × prix_unitaire

**Sortie**
- Aucune, car c'est la première entrée

**Stock Final**
- `quantité` = quantité entrée
- `prix_unitaire` = prix_unitaire entrée
- `valeur` = quantité × prix_unitaire

**Exemple:**
```
Entrée: 900,000 L à 0.854
Stock Final: 900,000 L à 0.854 = 768,600
```

---

#### 2️⃣ Nouvelle Entrée (le dépôt contient déjà du stock)

**Entrée**
- `quantité` = saisie manuelle
- `prix_unitaire` = saisie manuelle
- `valeur` = quantité × prix_unitaire

**Stock Final**
- `quantité` = ancienne_quantité_stock + nouvelle_quantité
- `valeur` = ancienne_valeur_stock + nouvelle_valeur
- `prix_unitaire` = valeur / quantité

**Exemple:**
```
Stock précédent: 900,000 L à 0.854 = 768,600
Nouvelle entrée: 600,000 L à 0.850 = 510,000
Stock Final: 1,500,000 L, valeur = 768,600 + 510,000 = 1,278,600
Prix unitaire = 1,278,600 / 1,500,000 = 0.8524
```

---

#### 3️⃣ Nouvelle Sortie (le dépôt contient déjà du stock)

**Sortie**
- `quantité` = saisie manuelle
- `prix_unitaire` = prix_unitaire actuel du stock (CMP)
- `valeur` = quantité × prix_unitaire

**Stock Final**
- `quantité` = ancienne_quantité_stock - quantité_sortie
- `valeur` = ancienne_valeur_stock - valeur_sortie
- `prix_unitaire` = valeur / quantité (si quantité > 0)

**Exemple:**
```
Stock précédent: 1,500,000 L à 0.8524 = 1,278,600
Sortie: 1,000,000 L à 0.8524 = 852,400
Stock Final: 500,000 L, valeur = 1,278,600 - 852,400 = 426,200
Prix unitaire = 426,200 / 500,000 = 0.8524 (CMP inchangé)
```

---

## 🔧 Implémentation Technique

### Fonction Utilitaire: `calculateCMP`

Une fonction utilitaire `calculateCMP` dans `actions.ts` calcule automatiquement toutes les valeurs selon les règles CMP :

```typescript
async function calculateCMP(
  depotId: string | null | undefined,
  produitId: string,
  typeOperation: 'ENTREE' | 'SORTIE',
  quantite: number,
  prixUnitaire: number | null | undefined
)
```

**Cette fonction:**
1. Récupère tous les mouvements précédents pour le dépôt et le produit
2. Calcule le stock actuel et sa valeur en parcourant l'historique
3. Applique la nouvelle opération selon le type (ENTREE ou SORTIE)
4. Retourne toutes les valeurs calculées pour l'affichage

**Valeurs retournées:**
```typescript
{
  operationQuantite: number,           // Quantité de l'opération
  operationPrixUnitaire: number,       // Prix unitaire utilisé
  operationValeur: number,              // Valeur de l'opération
  stockQuantiteFinal: number,          // Stock final après l'opération
  stockValeurFinal: number,            // Valeur totale du stock final
  stockPrixUnitaireFinal: number       // CMP final
}
```

### Actions Principales

#### `createAction`
Crée un nouveau mouvement de stock et applique automatiquement le calcul CMP.

**Validation automatique:**
- ✅ Vérifie que le stock est suffisant pour les sorties
- ✅ Calcule le prix unitaire pour les sorties (CMP actuel)
- ✅ Utilise le prix saisi pour les entrées

#### `updateAction`
⚠️ **ATTENTION:** La modification d'un mouvement existant peut affecter tous les mouvements suivants.

**Recommandation:** Préférer supprimer et recréer plutôt que de modifier.

#### `removeByIdAction`
Supprime un mouvement de stock.

---

## 📊 Exemple Complet (tableau de bord)

| Date | Réf | Fournisseur | Entrée Qty | Entrée PU | Entrée Valeur | Sortie Qty | Sortie PU | Sortie Valeur | Stock Qty | Stock PU | Stock Valeur |
|------|-----|-------------|-----------|-----------|---------------|------------|-----------|---------------|-----------|----------|--------------|
| 05/09/2025 | REF001 | KEMEXON | 900,000 | 0.854 | 768,600 | - | - | - | 900,000 | 0.85 | 768,600 |
| 05/09/2025 | REF002 | ADDAX | 600,000 | 0.850 | 510,000 | - | - | - | 1,500,000 | 0.85 | 1,278,600 |
| 25/08/2025 | REF003 | TFM | - | - | - | 1,000,000 | 0.85 | 852,400 | 500,000 | 0.85 | 426,200 |

---

## ⚠️ Points Importants

1. **Dépôt requis:** Tous les calculs CMP nécessitent un dépôt associé
2. **Ordre chronologique:** Les calculs sont basés sur l'ordre de création (`createdAt`)
3. **Précision:** Les prix unitaires peuvent être arrondis à l'affichage mais les calculs utilisent la précision maximale
4. **Sorties:** Le prix unitaire des sorties est automatiquement le CMP du stock actuel
5. **Validation:** Les sorties sont bloquées si le stock est insuffisant

---

## 🚀 Prochaines Étapes Possibles

- [ ] Ajouter des colonnes d'affichage pour le CMP dans le tableau
- [ ] Créer une vue détaillée montrant l'historique complet du calcul
- [ ] Implémenter le recalcul automatique lors de modifications
- [ ] Ajouter des exports (Excel, PDF) avec les détails du CMP
- [ ] Créer un dashboard de suivi des stocks par dépôt

---

## 📝 Notes de Développement

- Les calculs CMP sont effectués côté serveur dans `actions.ts`
- La fonction `calculateCMP` est pure et peut être testée unitairement
- Tous les mouvements sont historisés et non modifiables pour conserver l'intégrité des calculs
- Le module suit le pattern des autres modules du projet (clients, fournisseurs, etc.)

