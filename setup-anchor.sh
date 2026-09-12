#!/usr/bin/env bash
# MicroShield — Anchor toolchain installer
# Run from Ubuntu terminal:
#   bash /mnt/c/Users/ABHINAV\ TRIPATHI/OneDrive/Desktop/abhinav\ project/microshield/setup-anchor.sh

set -e  # stop on any error

echo "=== [1/5] Updating apt and installing system deps ==="
sudo apt update -y
sudo apt install -y curl build-essential pkg-config libssl-dev

echo "=== [2/5] Installing Rust ==="
if command -v rustc &>/dev/null; then
  echo "Rust already installed: $(rustc --version)"
else
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path
fi
source "$HOME/.cargo/env"
grep -qxF 'source "$HOME/.cargo/env"' ~/.bashrc || echo 'source "$HOME/.cargo/env"' >> ~/.bashrc
echo "Rust: $(rustc --version)"

echo "=== [3/5] Installing Solana CLI v1.18.26 ==="
if command -v solana &>/dev/null; then
  echo "Solana already installed: $(solana --version)"
else
  sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"
fi
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
grep -qxF 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' ~/.bashrc || \
  echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
echo "Solana: $(solana --version)"

echo "=== [4/5] Installing Anchor AVM + v0.30.1 (this takes ~15 minutes) ==="
if command -v anchor &>/dev/null; then
  echo "Anchor already installed: $(anchor --version)"
else
  cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
  avm install 0.30.1
  avm use 0.30.1
fi
echo "Anchor: $(anchor --version)"

echo "=== [5/5] Generating Solana keypair (if not exists) ==="
if [ ! -f "$HOME/.config/solana/id.json" ]; then
  solana-keygen new --no-bip39-passphrase --outfile "$HOME/.config/solana/id.json"
fi
solana config set --url devnet
echo "Wallet: $(solana address)"

echo ""
echo "==========================================="
echo "  All tools installed! Now run:"
echo ""
echo "  cd \"/mnt/c/Users/ABHINAV TRIPATHI/OneDrive/Desktop/abhinav project/microshield/contract\""
echo "  anchor build"
echo "==========================================="
