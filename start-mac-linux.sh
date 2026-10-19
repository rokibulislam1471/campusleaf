#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
printf 'Open http://localhost:8000 in a browser, then press Ctrl+C to stop.\n'
python3 -m http.server 8000
