#!/bin/bash
set -e

BRANCH=main
BACKUP_PREFIX=backup
REMOTE=origin

# 1. Commit de todo
if [[ -n $(git status --porcelain) ]]; then
  git add .
  git commit -m "chore(sync): auto-backup before sync [ci skip]" || true
fi

git fetch $REMOTE

git checkout $BRANCH

git pull --rebase $REMOTE $BRANCH

# 2. Crear rama de backup
TS=$(date +"%Y%m%d-%H%M%S")
BACKUP_BRANCH="$BACKUP_PREFIX/$TS"
git branch $BACKUP_BRANCH

git push $REMOTE $BACKUP_BRANCH

# 3. Push normal (no force)
git push $REMOTE $BRANCH

# 4. Limpiar backups antiguos (dejar solo 2 más recientes)
BACKUPS=$(git ls-remote --heads $REMOTE "$BACKUP_PREFIX/*" | awk '{print $2}' | sed 's/refs\/heads\///' | sort -r)
COUNT=0
for b in $BACKUPS; do
  COUNT=$((COUNT+1))
  if [[ $COUNT -gt 2 ]]; then
    git push $REMOTE --delete $b || true
  fi
done

echo "[OK] Backup creado ($BACKUP_BRANCH), main sincronizado, backups antiguos limpiados."

echo "\nSi necesitas forzar el push (destructivo), ejecuta: git push $REMOTE $BRANCH --force" 