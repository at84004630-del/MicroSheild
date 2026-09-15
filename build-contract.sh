#!/bin/bash
set -e

echo "==> Setting up PATH..."
export PATH="$HOME/.avm/bin:$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/contract"

echo "==> Cleaning stale 2024 crates from cache if any..."
rm -rf $HOME/.cargo/registry/src/index.crates.io-*/indexmap-2.14* 2>/dev/null || true
rm -rf $HOME/.cargo/registry/cache/index.crates.io-*/indexmap-2.14* 2>/dev/null || true
rm -rf $HOME/.cargo/registry/src/index.crates.io-*/hashbrown-0.17* 2>/dev/null || true
rm -rf $HOME/.cargo/registry/cache/index.crates.io-*/hashbrown-0.17* 2>/dev/null || true

echo "==> Pinning incompatible dependencies for rustc 1.75..."
cargo update -p unicode-segmentation --precise 1.12.0 2>/dev/null || true
cargo update -p indexmap --precise 2.7.0 2>/dev/null || true
cargo update -p hashbrown --precise 0.14.5 2>/dev/null || true
cargo update -p jobserver --precise 0.1.32 2>/dev/null || true

if [ -f Cargo.lock ]; then
    echo "==> Ensuring Cargo.lock version is compatible (v3)..."
    sed -i 's/version = 4/version = 3/' Cargo.lock
fi

echo "==> Running anchor build --no-idl..."
anchor build --no-idl

echo "==> Checking build artifact..."
ls -lh target/deploy/microshield.so
echo "==> Anchor build completed successfully!"
