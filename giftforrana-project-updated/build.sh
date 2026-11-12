#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$ROOT_DIR/dist"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/assets/images" "$OUTPUT_DIR/assets/audio"
cp "$ROOT_DIR/index.html" "$ROOT_DIR/styles.css" "$ROOT_DIR/script.js" "$ROOT_DIR/config.js" "$ROOT_DIR/manus-routes.json" "$OUTPUT_DIR/"
cp "$ROOT_DIR/ssstik.io_1794482117464.mp4" "$OUTPUT_DIR/"
if [ -d "$ROOT_DIR/assets" ]; then
  cp -R "$ROOT_DIR/assets/." "$OUTPUT_DIR/assets/"
fi
printf 'Static site built in %s\n' "$OUTPUT_DIR"
