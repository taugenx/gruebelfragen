#!/bin/bash
# Gruebelfragen PWA - automated setup
# Doppelklick auf diese Datei oder im Terminal ausfuehren.
set -e

# In den Ordner wechseln, in dem dieses Skript liegt
cd "$(dirname "$0")"

echo ""
echo "=========================================="
echo "  Gruebelfragen PWA - Setup"
echo "=========================================="
echo "Arbeitsverzeichnis: $(pwd)"
echo ""

# --- 1) Homebrew sicherstellen ----------------------------------------------
if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew ist nicht installiert."
  echo "Bitte zuerst Homebrew installieren mit:"
  echo ""
  echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  echo ""
  echo "Anschliessend dieses Skript erneut starten."
  exit 1
fi

# brew shellenv aktivieren (Apple Silicon / Intel)
if [ -x /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -x /usr/local/bin/brew ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# --- 2) Fehlende CLIs automatisch installieren ------------------------------
ensure_brew_pkg() {
  local cmd="$1"; local pkg="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Installiere $pkg via Homebrew..."
    brew install "$pkg"
  fi
}
ensure_brew_pkg node node
ensure_brew_pkg git  git
ensure_brew_pkg gh   gh

if ! command -v vercel >/dev/null 2>&1; then
  echo "Installiere vercel global via npm..."
  npm install -g vercel
fi

# Sanity-Check
for c in node npm git gh vercel; do
  command -v "$c" >/dev/null 2>&1 || { echo "FEHLER: '$c' weiterhin nicht gefunden."; exit 1; }
done

# --- 2) GitHub-Auth pruefen -------------------------------------------------
if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI ist nicht eingeloggt. Starte 'gh auth login'..."
  gh auth login
fi

# --- 3) Vercel-Auth pruefen -------------------------------------------------
if ! vercel whoami >/dev/null 2>&1; then
  echo "Vercel CLI ist nicht eingeloggt. Starte 'vercel login'..."
  vercel login
fi

# --- Schritt 2: npm install -------------------------------------------------
echo ""
echo ">>> Schritt 2/5: npm install"
npm install

# --- Schritt 3: git init + erster Commit ------------------------------------
echo ""
echo ">>> Schritt 3/5: git init + erster Commit"
if [ ! -d .git ]; then
  git init
  git branch -M main
fi
git add -A
if git diff --cached --quiet; then
  echo "(Keine Aenderungen zum Committen.)"
else
  git commit -m "feat: gruebelfragen PWA initial"
fi

# --- Schritt 4: GitHub-Repo erstellen + push --------------------------------
echo ""
echo ">>> Schritt 4/5: GitHub-Repo erstellen und pushen"
GH_USER=$(gh api user --jq .login)
REPO_FULL="$GH_USER/gruebelfragen"

if gh repo view "$REPO_FULL" >/dev/null 2>&1; then
  echo "Repo $REPO_FULL existiert bereits - ueberspringe Erstellung."
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "https://github.com/$REPO_FULL.git"
  fi
  git push -u origin main
else
  gh repo create gruebelfragen --public --source=. --remote=origin --push
fi

# --- Schritt 5: Vercel deploy -----------------------------------------------
echo ""
echo ">>> Schritt 5/5: Deploy auf Vercel"
# --yes ueberspringt interaktive Prompts beim ersten Link
DEPLOY_OUT=$(vercel --prod --yes 2>&1 | tee /dev/tty)
DEPLOY_URL=$(printf "%s\n" "$DEPLOY_OUT" | grep -Eo 'https://[a-zA-Z0-9./_-]+\.vercel\.app' | tail -1)

echo ""
echo "=========================================="
echo "  FERTIG!"
echo "=========================================="
echo "GitHub:  https://github.com/$REPO_FULL"
if [ -n "$DEPLOY_URL" ]; then
  echo "Vercel:  $DEPLOY_URL"
else
  echo "Vercel:  (URL bitte aus dem Vercel-Output oben entnehmen)"
fi
echo ""
echo "Druecke eine beliebige Taste, um das Fenster zu schliessen..."
read -n 1 -s
