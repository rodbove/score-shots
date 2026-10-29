#!/usr/bin/env bash
set -euo pipefail

ZIG_VERSION="0.16.0"
ZIG="zig"

if ! command -v zig >/dev/null 2>&1; then
  dir="/tmp/zig-x86_64-linux-${ZIG_VERSION}"
  if [ ! -x "$dir/zig" ]; then
    curl -fsSL "https://ziglang.org/download/${ZIG_VERSION}/zig-x86_64-linux-${ZIG_VERSION}.tar.xz" | tar -xJ -C /tmp
  fi
  ZIG="$dir/zig"
fi

"$ZIG" test src/inspect.zig
"$ZIG" build-exe src/inspect.zig -target wasm32-freestanding -fno-entry -rdynamic -O ReleaseSmall -femit-bin=lib/inspect.wasm
rm -f lib/inspect.wasm.o
