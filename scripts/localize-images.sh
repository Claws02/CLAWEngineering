#!/usr/bin/env bash
# Pull every off-site image referenced in the project catalog into assets/img/
# and rewrite the catalog to point at the local copies.
#
# Run once, from the repo root:   bash scripts/localize-images.sh
# Then commit assets/img/ and assets/js/projects.js.
set -euo pipefail

mkdir -p assets/img/projects

# -h: with two input files grep would otherwise prefix every match with
# "filename:", and curl would be handed "assets/js/projects.js:https://...".
urls=$(grep -hoE 'https://i\.imgur\.com/[A-Za-z0-9]+\.(png|jpe?g)' assets/js/projects.js index.html | sort -u || true)

if [ -z "$urls" ]; then
  echo "No Imgur references left. Nothing to do."
  exit 0
fi

failed=0
for url in $urls; do
  file=$(basename "$url")
  if [ ! -f "assets/img/projects/$file" ]; then
    echo "fetching $file"
    if ! curl -fsSL --retry 3 --retry-delay 2 "$url" -o "assets/img/projects/$file"; then
      echo "  FAILED: $url did not download. Reference left unchanged." >&2
      rm -f "assets/img/projects/$file"
      failed=$((failed + 1))
      continue
    fi
  fi
  # rewrite references to the local path
  sed -i.bak "s#https://i.imgur.com/$file#assets/img/projects/$file#g" assets/js/projects.js index.html
done

rm -f assets/js/projects.js.bak index.html.bak

# The standalone project pages embed the image paths, so rebuild them.
# WSL and Git Bash on Windows often can't see a Windows Node install; the
# downloads above are the part that needs this machine, so don't fail here.
if command -v node >/dev/null 2>&1; then
  node scripts/build-project-pages.js
else
  echo "node not found from bash: project pages NOT rebuilt."
  echo "Run 'npm run build' from a normal terminal, or push and let Claude rebuild them."
fi

echo "Done. $failed failed. Review the diff, then commit assets/img/projects/, assets/js/projects.js, index.html, projects/ and sitemap.xml."
