# Instructions pour résoudre l'erreur de build

## Problème
L'erreur `EPERM: operation not permitted` ou `Accès refusé` indique qu'un processus Node.js/Next.js verrouille les fichiers dans le dossier `.next`.

## Solution

### Option 1 : Fermer tous les processus Node.js
1. Ouvrez le Gestionnaire des tâches (Ctrl + Shift + Esc)
2. Recherchez tous les processus `node.exe`
3. Fermez-les tous
4. Relancez le build : `pnpm run build`

### Option 2 : Utiliser PowerShell pour fermer les processus
Exécutez cette commande dans PowerShell :
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Option 3 : Supprimer manuellement le dossier .next
1. Fermez tous les processus Node.js
2. Supprimez le dossier `.next` manuellement
3. Relancez le build : `pnpm run build`

### Option 4 : Redémarrer l'éditeur/IDE
Parfois, l'éditeur peut verrouiller des fichiers. Redémarrez votre IDE (VS Code, Cursor, etc.) puis relancez le build.

## Vérification du code
Le code a été vérifié et ne contient pas d'erreurs de compilation TypeScript ou de lint.
