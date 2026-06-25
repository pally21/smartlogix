#!/usr/bin/env bash
# Safer helper to remove sensitive files from git history using git-filter-repo.
# This script guides the user, creates a local mirror backup and optionally
# runs the destructive rewrite locally. It DOES NOT automatically push.

set -euo pipefail

if [ -z "$(git rev-parse --show-toplevel 2>/dev/null || true)" ]; then
  echo "Not inside a git repository. Abort."; exit 1
fi

TARGETS=("nginx/certs")

echo "This helper will remove the following paths from history: ${TARGETS[*]}"

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree has uncommitted changes. Please commit or stash them first." >&2
  git status --porcelain
  exit 1
fi

if ! command -v git-filter-repo >/dev/null 2>&1; then
  cat <<'MSG'
git-filter-repo is not installed. It's the recommended tool for history rewriting.
Install it (one of these):

  pip install --user git-filter-repo
  # or on Debian/Ubuntu
  sudo apt install git-filter-repo

After installing, re-run this script.
MSG
  exit 2
fi

BACKUP_DIR="$(pwd)-git-backup-$(date +%Y%m%d%H%M%S)"
echo "Creating a mirror backup at: ${BACKUP_DIR}"
git clone --mirror "$(pwd)" "${BACKUP_DIR}"
echo "Mirror backup created. Verify it before proceeding."

echo "If you want me to run the rewrite now, type 'RUN' (this will rewrite local history but will NOT push)."
read -r CONFIRM
if [ "$CONFIRM" != "RUN" ]; then
  echo "No rewrite performed. To manually remove paths, run:" 
  echo "  git filter-repo --invert-paths --paths ${TARGETS[*]}"
  echo "After verifying locally, force-push with:" 
  echo "  git push origin --all --force"
  echo "  git push origin --tags --force"
  exit 0
fi

echo "Running git-filter-repo to remove: ${TARGETS[*]}"
git filter-repo --invert-paths --paths ${TARGETS[*]}

echo "Rewrite complete locally. IMPORTANT: review your repo; to publish changes run:" 
echo "  git push origin --all --force" 
echo "  git push origin --tags --force" 

echo "Notify collaborators: they must reclone or reset their local clones after a force-push."

exit 0
