#!/usr/bin/env bash
# Syncs shared files and builds a reproducible ZIP for unpacked installation or the store.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p extension/assets
cp assets/compress-core.js assets/compress-worker.js assets/compressor.js assets/compressor.css \
   assets/jszip.min.js assets/JSZIP-LICENSE.txt extension/assets/
cp LICENSE extension/LICENSE
mkdir -p dist
version=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' extension/manifest.json)
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(\.[0-9]+)?$ ]]; then
  echo 'Invalid extension version' >&2
  exit 1
fi
for command in zip unzip shasum; do
  command -v "$command" >/dev/null || { echo "Required command missing: $command" >&2; exit 1; }
done
stage=$(mktemp -d "${TMPDIR:-/tmp}/weryai-compressor.XXXXXX")
trap 'rm -rf "$stage"' EXIT
# Explicit allowlist excludes store drafts, test images, hidden files and accidental local data.
files=(
  manifest.json background.js app.html app.css app.js
  icons/16.png icons/32.png icons/48.png icons/128.png
  assets/compress-core.js assets/compress-worker.js assets/compressor.js assets/compressor.css
  assets/jszip.min.js assets/JSZIP-LICENSE.txt
  LICENSE THIRD_PARTY_NOTICES.md PRIVACY.md README.md
)
for file in "${files[@]}"; do
  test -f "extension/$file" || { echo "Required file missing: $file" >&2; exit 1; }
  mkdir -p "$stage/$(dirname "$file")"
  cp "extension/$file" "$stage/$file"
  chmod 644 "$stage/$file"
  TZ=UTC touch -t 198001010000 "$stage/$file"
done
archive="weryai-image-compressor-$version.zip"
(cd "$stage" && TZ=UTC zip -Xq "$archive" "${files[@]}" && unzip -tq "$archive")
mv "$stage/$archive" "dist/$archive"
(cd dist && shasum -a 256 "$archive" > "$archive.sha256")
echo "dist/$archive"
echo "dist/$archive.sha256"
