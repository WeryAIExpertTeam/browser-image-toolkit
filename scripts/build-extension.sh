#!/usr/bin/env bash
# Copies the shared compressor files into extension/ and builds a ZIP for the Chrome Web Store.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p extension/assets
cp assets/compress-core.js assets/compress-worker.js assets/compressor.js assets/compressor.css \
   assets/jszip.min.js assets/JSZIP-LICENSE.txt extension/assets/
mkdir -p dist
rm -f dist/weryai-image-compressor-*.zip
version=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' extension/manifest.json)
(cd extension && zip -qr "../dist/weryai-image-compressor-$version.zip" . -x '.*')
echo "dist/weryai-image-compressor-$version.zip"
