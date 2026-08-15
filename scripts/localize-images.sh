#!/usr/bin/env bash
# Pull every off-site image referenced in the project catalog into assets/img/
# and rewrite the catalog to point at the local copies.
#
# Run once, from the repo root:   bash scripts/localize-images.sh
# Then commit assets/img/ and assets/js/projects.js.
set -euo pipefail

mkdir -p assets/img/projects

urls=$(grep -oE 'https://i\.imgur\.com/[A-Za-z0-9]+\.(png|jpe?g)' assets/js/projects.js index.html | sort -u)

for url in $urls; do
  file=$(basename "$url")
  if [ ! -f "assets/img/projects/$file" ]; then
    echo "fetching $file"
    curl -fsSL --retry 2 "$url" -o "assets/img/projects/$file" || {
      echo "  FAILED — $url is dead. Replace this image manually." >&2
      continue
    }
  fi
  # rewrite references to the local path
  sed -i.bak "s#https://i.imgur.com/$file#assets/img/projects/$file#g" assets/js/projects.js index.html
done

rm -f assets/js/projects.js.bak index.html.bak
echo "Done. Review the diff, then commit assets/img/projects/."
